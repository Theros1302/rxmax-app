const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getOne, getMany, update, insert } = require('../models');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get patient profile
router.get('/profile', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;

    const patient = await getOne(
      `SELECT id, name, phone, email, date_of_birth, gender, blood_group,
              allergies, conditions, address, city, pincode, latitude, longitude,
              created_at
       FROM patients WHERE id = $1`,
      [patientId],
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update patient profile
router.put('/profile', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;
    const {
      name,
      email,
      date_of_birth,
      gender,
      blood_group,
      allergies,
      conditions,
      address,
      city,
      pincode,
      latitude,
      longitude,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (gender !== undefined) updateData.gender = gender;
    if (blood_group !== undefined) updateData.blood_group = blood_group;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    updateData.updated_at = new Date();

    const patient = await update('patients', updateData, { id: patientId });

    res.json({
      message: 'Profile updated successfully',
      patient,
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get connected store details
router.get('/store', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;

    const storePatient = await getOne(
      `SELECT sp.*, s.name, s.slug, s.logo_url, s.phone, s.email,
              s.address, s.city, s.state, s.pincode, s.latitude, s.longitude,
              s.delivery_radius_km, s.delivery_charge, s.min_order_amount
       FROM store_patients sp
       JOIN stores s ON sp.store_id = s.id
       WHERE sp.patient_id = $1 AND sp.is_active = true`,
      [patientId],
    );

    if (!storePatient) {
      return res.status(404).json({ error: 'No connected store' });
    }

    res.json(storePatient);
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// Join a store by slug
router.post('/join-store/:slug', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;
    const { slug } = req.params;

    // Find store by slug
    const store = await getOne('SELECT id FROM stores WHERE slug = $1 AND is_active = true', [slug]);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if already connected
    const existing = await getOne(
      'SELECT id FROM store_patients WHERE store_id = $1 AND patient_id = $2',
      [store.id, patientId],
    );

    if (existing) {
      return res.status(409).json({ error: 'Already connected to this store' });
    }

    // Create connection
    const storePatient = await insert('store_patients', {
      id: uuidv4(),
      store_id: store.id,
      patient_id: patientId,
      is_active: true,
    });

    res.status(201).json({
      message: 'Successfully joined store',
      storePatient,
    });
  } catch (error) {
    console.error('Join store error:', error);
    res.status(500).json({ error: 'Failed to join store' });
  }
});

// Get all prescriptions
router.get('/prescriptions', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;

    const prescriptions = await getMany(
      `SELECT id, store_id, image_url, doctor_name, hospital_name,
              prescription_date, diagnosis, ocr_status, ocr_confidence,
              verified_at, created_at
       FROM prescriptions
       WHERE patient_id = $1
       ORDER BY created_at DESC`,
      [patientId],
    );

    res.json({ prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get active medications with refill dates
router.get('/medications', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;

    const medications = await getMany(
      `SELECT pi.id, pi.medicine_name_raw, pi.dosage, pi.frequency, pi.duration_days,
              pi.start_date, pi.estimated_end_date, pi.next_refill_date,
              pi.is_active, pi.is_chronic,
              m.id as medicine_id, m.name, m.generic_name,
              rr.id as reminder_id, rr.escalation_level, rr.status as reminder_status
       FROM prescription_items pi
       LEFT JOIN medicines m ON pi.medicine_id = m.id
       LEFT JOIN refill_reminders rr ON rr.prescription_item_id = pi.id
       WHERE pi.prescription_id IN (
         SELECT id FROM prescriptions WHERE patient_id = $1
       )
       AND pi.is_active = true
       ORDER BY pi.next_refill_date ASC`,
      [patientId],
    );

    res.json({ medications });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// Get family members
router.get('/family', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;

    const family = await getMany(
      `SELECT sp.id, p.id as patient_id, p.name, p.phone, p.gender,
              sp.relationship, sp.joined_at
       FROM store_patients sp
       JOIN patients p ON sp.patient_id = p.id
       WHERE sp.family_group_id = (
         SELECT family_group_id FROM store_patients WHERE patient_id = $1
       )
       AND p.id != $1`,
      [patientId],
    );

    res.json({ family });
  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({ error: 'Failed to fetch family' });
  }
});

module.exports = router;
