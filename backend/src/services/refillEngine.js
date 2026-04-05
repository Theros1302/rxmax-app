const { getOne, getMany, insert, update } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Parse frequency strings like "1-0-1", "twice daily", "once daily"
const parseFrequency = (frequencyStr) => {
  if (!frequencyStr) return 1; // Default to once daily

  frequencyStr = frequencyStr.toLowerCase().trim();

  // Handle "X-X-X" format (morning-afternoon-evening)
  const dashMatch = frequencyStr.match(/^(\d+)-(\d+)-(\d+)$/);
  if (dashMatch) {
    const morning = parseInt(dashMatch[1]);
    const afternoon = parseInt(dashMatch[2]);
    const evening = parseInt(dashMatch[3]);
    return morning + afternoon + evening;
  }

  // Handle text formats
  if (frequencyStr.includes('thrice daily') || frequencyStr.includes('3 times daily')) {
    return 3;
  }
  if (frequencyStr.includes('twice daily') || frequencyStr.includes('2 times daily')) {
    return 2;
  }
  if (frequencyStr.includes('once daily') || frequencyStr.includes('1 time daily')) {
    return 1;
  }
  if (frequencyStr.includes('every other') || frequencyStr.includes('alternate')) {
    return 0.5;
  }

  // Default
  return 1;
};

// Calculate when medicine runs out based on dosage, frequency, duration
const calculateRefillDate = (prescriptionItem) => {
  const {
    quantity,
    frequency,
    duration_days,
    start_date,
  } = prescriptionItem;

  if (!quantity || !duration_days || !start_date) {
    return null;
  }

  // Parse frequency to get daily consumption
  const dailyConsumption = parseFrequency(frequency);

  // Calculate estimated end date
  const startDate = new Date(start_date);
  const endDate = new Date(startDate.getTime() + duration_days * 24 * 60 * 60 * 1000);

  // Refill reminder should be 7 days before end
  const refillDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    estimatedEndDate: endDate,
    refillDueDate: refillDate,
  };
};

// Create refill reminders for all items in a prescription
const scheduleReminders = async (prescriptionId) => {
  try {
    // Get all active items in prescription
    const items = await getMany(
      `SELECT pi.id, pi.prescription_id, p.patient_id, p.store_id,
              pi.medicine_name_raw, pi.quantity, pi.frequency, pi.duration_days,
              pi.start_date, pi.next_refill_date
       FROM prescription_items pi
       JOIN prescriptions p ON pi.prescription_id = p.id
       WHERE pi.prescription_id = $1 AND pi.is_active = true`,
      [prescriptionId],
    );

    const reminders = [];

    for (const item of items) {
      // Skip if already has a scheduled reminder
      const existing = await getOne(
        `SELECT id FROM refill_reminders
         WHERE prescription_item_id = $1 AND status IN ('scheduled', 'sent')`,
        [item.id],
      );

      if (existing) {
        continue;
      }

      // Calculate refill date if not set
      let refillDate = item.next_refill_date;
      if (!refillDate) {
        const dates = calculateRefillDate(item);
        if (!dates) continue;
        refillDate = dates.refillDueDate;
      }

      // Create reminder
      const reminder = await insert('refill_reminders', {
        id: uuidv4(),
        store_id: item.store_id,
        patient_id: item.patient_id,
        prescription_item_id: item.id,
        medicine_name: item.medicine_name_raw,
        refill_due_date: refillDate,
        escalation_level: 0,
        status: 'scheduled',
      });

      reminders.push(reminder);
    }

    return reminders;
  } catch (error) {
    console.error('Schedule reminders error:', error);
    throw error;
  }
};

// Check all active reminders and escalate if needed
const processEscalations = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all scheduled reminders that are due
    const dueReminders = await getMany(
      `SELECT id, escalation_level, refill_due_date, push_sent_at, whatsapp_sent_at, sms_sent_at
       FROM refill_reminders
       WHERE status IN ('scheduled', 'sent') AND patient_response IS NULL
       AND refill_due_date <= CURRENT_DATE`,
    );

    const escalations = [];

    for (const reminder of dueReminders) {
      const daysOverdue = Math.floor((today - new Date(reminder.refill_due_date)) / (1000 * 60 * 60 * 24));
      let newLevel = reminder.escalation_level;

      // Escalation logic
      if (daysOverdue >= 30) {
        newLevel = 5; // Lapsed - gentle check-in
      } else if (daysOverdue >= 5) {
        newLevel = 3; // Urgent reminder
      } else if (daysOverdue >= 2 && reminder.push_sent_at) {
        newLevel = 2; // Follow-up
      } else if (daysOverdue >= 0 && !reminder.push_sent_at) {
        newLevel = 1; // First reminder
      }

      if (newLevel > reminder.escalation_level) {
        await update('refill_reminders', { escalation_level: newLevel }, { id: reminder.id });
        escalations.push({
          id: reminder.id,
          level: newLevel,
        });
      }
    }

    return escalations;
  } catch (error) {
    console.error('Process escalations error:', error);
    throw error;
  }
};

// Get daily refill summary for store dashboard
const getDailyRefillSummary = async (storeId) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Reminders to send today
    const remindersToday = await getMany(
      `SELECT COUNT(*) as count FROM refill_reminders
       WHERE store_id = $1 AND refill_due_date = $2 AND status = 'scheduled'`,
      [storeId, today],
    );

    // Upcoming this week
    const weekStart = new Date();
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingWeek = await getMany(
      `SELECT COUNT(*) as count FROM refill_reminders
       WHERE store_id = $1 AND refill_due_date BETWEEN $2 AND $3
       AND status = 'scheduled'`,
      [storeId, weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]],
    );

    // Overdue
    const overdue = await getMany(
      `SELECT COUNT(*) as count FROM refill_reminders
       WHERE store_id = $1 AND refill_due_date < CURRENT_DATE
       AND status IN ('scheduled', 'sent') AND patient_response IS NULL`,
      [storeId],
    );

    // Converted today
    const convertedToday = await getMany(
      `SELECT COUNT(*) as count FROM refill_reminders
       WHERE store_id = $1 AND DATE(responded_at) = $2
       AND patient_response = 'ordered'`,
      [storeId, today],
    );

    // Revenue recovered today
    const revenueRecovered = await getMany(
      `SELECT COALESCE(SUM(estimated_order_value), 0) as total
       FROM refill_reminders
       WHERE store_id = $1 AND DATE(responded_at) = $2
       AND patient_response = 'ordered'`,
      [storeId, today],
    );

    return {
      remindersToday: parseInt(remindersToday[0]?.count || 0),
      upcomingThisWeek: parseInt(upcomingWeek[0]?.count || 0),
      overdueCount: parseInt(overdue[0]?.count || 0),
      convertedToday: parseInt(convertedToday[0]?.count || 0),
      revenueRecoveredToday: parseFloat(revenueRecovered[0]?.total || 0),
    };
  } catch (error) {
    console.error('Get daily refill summary error:', error);
    throw error;
  }
};

module.exports = {
  parseFrequency,
  calculateRefillDate,
  scheduleReminders,
  processEscalations,
  getDailyRefillSummary,
};
