const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getOne, getMany, update, insert } = require('../models');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get upcoming refills for store dashboard
router.get('/upcoming', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { days = 14 } = req.query;

    const refills = await getMany(
      `SELECT rr.id, rr.patient_id, rr.prescription_item_id, rr.medicine_name,
              rr.refill_due_date, rr.escalation_level, rr.estimated_order_value,
              p.name as patient_name, p.phone,
              sp.adherence_score, sp.risk_level,
              pi.frequency, pi.dosage
       FROM refill_reminders rr
       JOIN patients p ON rr.patient_id = p.id
       LEFT JOIN store_patients sp ON sp.store_id = $1 AND sp.patient_id = p.id
       LEFT JOIN prescription_items pi ON pi.id = rr.prescription_item_id
       WHERE rr.store_id = $1 AND rr.status = 'scheduled'
       AND rr.refill_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${parseInt(days)} days'
       ORDER BY rr.escalation_level DESC, rr.refill_due_date ASC`,
      [storeId],
    );

    res.json({
      refills,
      count: refills.length,
    });
  } catch (error) {
    console.error('Get upcoming refills error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming refills' });
  }
});

// Get patient's upcoming refills
router.get('/patient', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;

    const refills = await getMany(
      `SELECT rr.id, rr.medicine_name, rr.refill_due_date, rr.escalation_level,
              rr.status, rr.patient_response, rr.responded_at,
              pi.dosage, pi.frequency, pi.instructions
       FROM refill_reminders rr
       LEFT JOIN prescription_items pi ON pi.id = rr.prescription_item_id
       WHERE rr.patient_id = $1 AND rr.status IN ('scheduled', 'sent')
       ORDER BY rr.refill_due_date ASC`,
      [patientId],
    );

    res.json({ refills });
  } catch (error) {
    console.error('Get patient refills error:', error);
    res.status(500).json({ error: 'Failed to fetch refills' });
  }
});

// Patient responds to refill reminder
router.post('/:id/respond', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;
    const { id: reminderId } = req.params;
    const { response } = req.body; // ordered, snoozed, skipped, stopped

    const validResponses = ['ordered', 'snoozed', 'skipped', 'stopped_medication'];

    if (!validResponses.includes(response)) {
      return res.status(400).json({ error: 'Invalid response' });
    }

    // Verify reminder belongs to patient
    const reminder = await getOne(
      'SELECT id, prescription_item_id FROM refill_reminders WHERE id = $1 AND patient_id = $2',
      [reminderId, patientId],
    );

    if (!reminder) {
      return res.status(404).json({ error: 'Refill reminder not found' });
    }

    const updateData = {
      patient_response: response,
      responded_at: new Date(),
      status: response === 'ordered' ? 'responded' : 'responded',
    };

    // If stopped, mark prescription item as inactive
    if (response === 'stopped_medication') {
      await update('prescription_items', { is_active: false }, { id: reminder.prescription_item_id });
    }

    const updatedReminder = await update('refill_reminders', updateData, { id: reminderId });

    res.json({
      message: `Refill response recorded: ${response}`,
      reminder: updatedReminder,
    });
  } catch (error) {
    console.error('Refill respond error:', error);
    res.status(500).json({ error: 'Failed to process refill response' });
  }
});

// Store owner nudges patient
router.post('/:id/nudge', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { id: reminderId } = req.params;
    const { channel = 'push' } = req.body; // push, whatsapp, sms

    // Verify reminder belongs to store
    const reminder = await getOne(
      'SELECT id, patient_id, medicine_name FROM refill_reminders WHERE id = $1 AND store_id = $2',
      [reminderId, storeId],
    );

    if (!reminder) {
      return res.status(404).json({ error: 'Refill reminder not found' });
    }

    const updateData = {
      escalation_level: Math.min((reminder.escalation_level || 0) + 1, 5),
    };

    if (channel === 'push') {
      updateData.push_sent_at = new Date();
    } else if (channel === 'whatsapp') {
      updateData.whatsapp_sent_at = new Date();
    } else if (channel === 'sms') {
      updateData.sms_sent_at = new Date();
    }

    const updatedReminder = await update('refill_reminders', updateData, { id: reminderId });

    // Log notification
    await insert('notifications', {
      id: uuidv4(),
      recipient_type: 'patient',
      recipient_id: reminder.patient_id,
      title: 'Medication Refill Reminder',
      body: `Your medicine ${reminder.medicine_name} is running out. Order now to avoid missing doses.`,
      channel,
      reference_type: 'refill_reminder',
      reference_id: reminderId,
      status: 'sent',
      sent_at: new Date(),
    });

    res.json({
      message: `Nudge sent via ${channel}`,
      reminder: updatedReminder,
    });
  } catch (error) {
    console.error('Nudge error:', error);
    res.status(500).json({ error: 'Failed to send nudge' });
  }
});

module.exports = router;
