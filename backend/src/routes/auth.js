const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../middleware/auth');
const { query, getOne, insert } = require('../models');

const router = express.Router();

// Store Owner Registration
router.post('/store/register', async (req, res) => {
  try {
    const body = req.body;

    // Accept both camelCase (frontend) and snake_case field names
    const name = body.storeName || body.name;
    const owner_name = body.ownerName || body.owner_name;
    const phone = body.phone;
    const email = body.email;
    const password = body.password;
    const address = body.address;
    const city = body.city;
    const state = body.state;
    const pincode = body.pincode;
    const license_number = body.licenseNumber || body.license_number || null;
    const gst_number = body.gstNumber || body.gst_number || null;

    // Validation
    if (!name || !owner_name || !phone || !password || !address || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if phone already registered
    const existingStore = await getOne('SELECT id FROM stores WHERE phone = $1', [phone]);
    if (existingStore) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    // Generate slug from store name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '') + `-${uuidv4().slice(0, 4)}`;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create store
    const store = await insert('stores', {
      id: uuidv4(),
      name,
      slug,
      owner_name,
      phone,
      email,
      password_hash: passwordHash,
      address,
      city,
      state,
      pincode,
      license_number,
      gst_number,
      is_active: true,
      is_verified: false,
    });

    const token = generateToken(store.id, 'store', { storeId: store.id, phone });

    res.status(201).json({
      message: 'Store registered successfully',
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        phone: store.phone,
        email: store.email,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Store Owner Login
router.post('/store/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password required' });
    }

    const store = await getOne('SELECT id, phone, password_hash, name, slug FROM stores WHERE phone = $1', [
      phone,
    ]);

    if (!store) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, store.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(store.id, 'store', { storeId: store.id, phone: store.phone });

    res.json({
      message: 'Login successful',
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        phone: store.phone,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Send OTP to Patient
router.post('/patient/send-otp', async (req, res) => {
  try {
    const { phone, purpose = 'login' } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await insert('otp_codes', {
      id: uuidv4(),
      phone,
      code: otp,
      purpose,
      expires_at: expiresAt,
    });

    // In production, send actual SMS via Twilio, AWS SNS, etc.
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      message: 'OTP sent successfully',
      // For development/testing - remove in production
      debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and Login/Signup Patient
router.post('/patient/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    // Demo mode: accept "123456" as universal OTP
    const isDemoOtp = otp === '123456';

    if (!isDemoOtp) {
      // Verify OTP from database
      const otpRecord = await getOne(
        `SELECT * FROM otp_codes
         WHERE phone = $1 AND code = $2 AND is_used = false AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [phone, otp],
      );

      if (!otpRecord) {
        return res.status(401).json({ error: 'Invalid or expired OTP' });
      }

      // Mark OTP as used
      await query('UPDATE otp_codes SET is_used = true WHERE id = $1', [otpRecord.id]);
    }

    // Find or create patient
    let patient = await getOne('SELECT id, name, phone FROM patients WHERE phone = $1', [phone]);
    let isNewPatient = false;

    if (!patient) {
      patient = await insert('patients', {
        id: uuidv4(),
        phone,
        is_active: true,
      });
      isNewPatient = true;
    }

    // Auto-connect patient to the default store (first active store)
    const defaultStore = await getOne(
      'SELECT id FROM stores WHERE is_active = true ORDER BY created_at ASC LIMIT 1',
      [],
    );

    if (defaultStore) {
      const existingLink = await getOne(
        'SELECT id FROM store_patients WHERE store_id = $1 AND patient_id = $2',
        [defaultStore.id, patient.id],
      );

      if (!existingLink) {
        await insert('store_patients', {
          id: uuidv4(),
          store_id: defaultStore.id,
          patient_id: patient.id,
          is_active: true,
        });
        console.log(`Patient ${phone} auto-connected to store ${defaultStore.id}`);
      }
    }

    const token = generateToken(patient.id, 'patient', { patientId: patient.id, phone });

    res.json({
      message: 'OTP verified successfully',
      isNewPatient,
      patient: {
        id: patient.id,
        name: patient.name || null,
        phone: patient.phone,
      },
      token,
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

module.exports = router;
