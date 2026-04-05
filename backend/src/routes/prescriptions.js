const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getOne, getMany, insert, update, query } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { readPrescriptionFromFile, readPrescriptionFromBase64 } = require('../services/prescriptionAI');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for prescription images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `prescription-${Date.now()}-${uuidv4().slice(0, 8)}.jpg`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP allowed'));
    }
  },
});

// ============================================================
// Upload prescription image WITH AI reading
// ============================================================
router.post('/upload', authenticateToken, requireRole(['patient']), upload.single('prescription_image'), async (req, res) => {
  try {
    const patientId = req.user.id;
    const { store_id, doctor_name, hospital_name } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No prescription image provided' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const imagePath = req.file.path;

    // Create prescription record first
    const prescription = await insert('prescriptions', {
      id: uuidv4(),
      patient_id: patientId,
      store_id: store_id || null,
      image_url: imageUrl,
      doctor_name: doctor_name || null,
      hospital_name: hospital_name || null,
      ocr_status: 'processing',
    });

    // Run AI extraction on the uploaded image
    let aiResult;
    try {
      aiResult = await readPrescriptionFromFile(imagePath);
    } catch (aiError) {
      console.error('AI extraction failed:', aiError.message);
      // Mark as failed but still return the prescription
      await update('prescriptions', { ocr_status: 'failed' }, { id: prescription.id });
      return res.status(201).json({
        message: 'Prescription uploaded but AI reading failed. You can add medicines manually.',
        prescription: {
          id: prescription.id,
          image_url: prescription.image_url,
          ocr_status: 'failed',
        },
        ai_result: null,
        medicines: [],
      });
    }

    // Update prescription with AI-extracted metadata
    const updateData = {
      ocr_status: 'completed',
      ocr_confidence: aiResult.confidence || 0,
    };
    if (aiResult.doctor_name && !doctor_name) updateData.doctor_name = aiResult.doctor_name;
    if (aiResult.hospital_name && !hospital_name) updateData.hospital_name = aiResult.hospital_name;
    if (aiResult.diagnosis) updateData.diagnosis = aiResult.diagnosis;
    if (aiResult.prescription_date) updateData.prescription_date = aiResult.prescription_date;

    await update('prescriptions', updateData, { id: prescription.id });

    // Insert extracted medicines as prescription items
    const createdItems = [];
    for (const med of aiResult.medicines) {
      try {
        const startDate = new Date().toISOString().split('T')[0];
        const durationDays = med.duration_days || 7;
        const estimatedEndDate = new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0];
        const nextRefillDate = new Date(Date.now() + (durationDays - 7) * 86400000).toISOString().split('T')[0];

        const item = await insert('prescription_items', {
          id: uuidv4(),
          prescription_id: prescription.id,
          medicine_id: null,
          medicine_name_raw: med.medicine_name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration_days: durationDays,
          quantity: med.quantity || null,
          instructions: med.instructions || null,
          start_date: startDate,
          estimated_end_date: estimatedEndDate,
          next_refill_date: nextRefillDate,
          is_active: true,
          is_chronic: durationDays >= 30,
        });

        createdItems.push({
          id: item.id,
          name: med.medicine_name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration_days: durationDays,
          quantity: med.quantity,
          instruction: med.instructions || med.frequency,
        });
      } catch (itemError) {
        console.error('Failed to insert medicine item:', itemError.message);
      }
    }

    res.status(201).json({
      message: 'Prescription uploaded and analyzed successfully',
      prescription: {
        id: prescription.id,
        image_url: prescription.image_url,
        doctor_name: updateData.doctor_name || doctor_name || aiResult.doctor_name,
        hospital_name: updateData.hospital_name || hospital_name || aiResult.hospital_name,
        diagnosis: aiResult.diagnosis,
        ocr_status: 'completed',
        ocr_confidence: aiResult.confidence,
        ai_processed: true,
        demo_mode: aiResult.demo_mode || false,
      },
      medicines: createdItems,
    });
  } catch (error) {
    console.error('Upload prescription error:', error);
    res.status(500).json({ error: 'Failed to upload prescription' });
  }
});

// ============================================================
// Upload prescription via base64 image (for mobile/web apps)
// ============================================================
router.post('/upload-base64', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;
    const { image_data, store_id, doctor_name, hospital_name } = req.body;

    if (!image_data) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Save base64 image to file
    const filename = `prescription-${Date.now()}-${uuidv4().slice(0, 8)}.jpg`;
    const filePath = path.join(uploadsDir, filename);

    // Strip data URL prefix
    let base64Clean = image_data;
    let mimeType = 'image/jpeg';
    if (image_data.startsWith('data:')) {
      const match = image_data.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Clean = match[2];
      }
    }

    fs.writeFileSync(filePath, Buffer.from(base64Clean, 'base64'));

    const imageUrl = `/uploads/${filename}`;

    // Create prescription record
    const prescription = await insert('prescriptions', {
      id: uuidv4(),
      patient_id: patientId,
      store_id: store_id || null,
      image_url: imageUrl,
      doctor_name: doctor_name || null,
      hospital_name: hospital_name || null,
      ocr_status: 'processing',
    });

    // Run AI extraction
    let aiResult;
    try {
      aiResult = await readPrescriptionFromBase64(base64Clean, mimeType);
    } catch (aiError) {
      console.error('AI extraction failed:', aiError.message);
      await update('prescriptions', { ocr_status: 'failed' }, { id: prescription.id });
      return res.status(201).json({
        message: 'Prescription uploaded but AI reading failed.',
        prescription: {
          id: prescription.id,
          image_url: imageUrl,
          ocr_status: 'failed',
        },
        ai_result: null,
        medicines: [],
      });
    }

    // Update prescription with AI data
    const updateData = {
      ocr_status: 'completed',
      ocr_confidence: aiResult.confidence || 0,
    };
    if (aiResult.doctor_name && !doctor_name) updateData.doctor_name = aiResult.doctor_name;
    if (aiResult.hospital_name && !hospital_name) updateData.hospital_name = aiResult.hospital_name;
    if (aiResult.diagnosis) updateData.diagnosis = aiResult.diagnosis;
    if (aiResult.prescription_date) updateData.prescription_date = aiResult.prescription_date;

    await update('prescriptions', updateData, { id: prescription.id });

    // Insert extracted medicines
    const createdItems = [];
    for (const med of aiResult.medicines) {
      try {
        const startDate = new Date().toISOString().split('T')[0];
        const durationDays = med.duration_days || 7;
        const estimatedEndDate = new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0];
        const nextRefillDate = new Date(Date.now() + (durationDays - 7) * 86400000).toISOString().split('T')[0];

        const item = await insert('prescription_items', {
          id: uuidv4(),
          prescription_id: prescription.id,
          medicine_id: null,
          medicine_name_raw: med.medicine_name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration_days: durationDays,
          quantity: med.quantity || null,
          instructions: med.instructions || null,
          start_date: startDate,
          estimated_end_date: estimatedEndDate,
          next_refill_date: nextRefillDate,
          is_active: true,
          is_chronic: durationDays >= 30,
        });

        createdItems.push({
          id: item.id,
          name: med.medicine_name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration_days: durationDays,
          quantity: med.quantity,
          instruction: med.instructions || med.frequency,
        });
      } catch (itemError) {
        console.error('Failed to insert medicine item:', itemError.message);
      }
    }

    res.status(201).json({
      message: 'Prescription uploaded and analyzed successfully',
      prescription: {
        id: prescription.id,
        image_url: imageUrl,
        doctor_name: updateData.doctor_name || doctor_name || aiResult.doctor_name,
        hospital_name: updateData.hospital_name || hospital_name || aiResult.hospital_name,
        diagnosis: aiResult.diagnosis,
        ocr_status: 'completed',
        ocr_confidence: aiResult.confidence,
        ai_processed: true,
        demo_mode: aiResult.demo_mode || false,
      },
      medicines: createdItems,
    });
  } catch (error) {
    console.error('Upload base64 prescription error:', error);
    res.status(500).json({ error: 'Failed to upload prescription' });
  }
});

// ============================================================
// Add extracted items from prescription (manual entry)
// ============================================================
router.post('/:id/items', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;
    const { id: prescriptionId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array required' });
    }

    // Verify prescription belongs to patient
    const prescription = await getOne(
      'SELECT id FROM prescriptions WHERE id = $1 AND patient_id = $2',
      [prescriptionId, patientId],
    );

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Insert all items
    const createdItems = [];
    for (const item of items) {
      const {
        medicine_name_raw,
        medicine_id,
        dosage,
        frequency,
        duration_days,
        quantity,
        instructions,
        start_date,
      } = item;

      if (!medicine_name_raw || !dosage || !frequency || !duration_days) {
        continue; // Skip invalid items
      }

      const startDate = start_date || new Date().toISOString().split('T')[0];
      const estimatedEndDate = new Date(new Date(startDate).getTime() + duration_days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // Calculate next refill date (7 days before end)
      const nextRefillDate = new Date(new Date(estimatedEndDate).getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const prescriptionItem = await insert('prescription_items', {
        id: uuidv4(),
        prescription_id: prescriptionId,
        medicine_id: medicine_id || null,
        medicine_name_raw,
        dosage,
        frequency,
        duration_days,
        quantity: quantity || null,
        instructions: instructions || null,
        start_date: startDate,
        estimated_end_date: estimatedEndDate,
        next_refill_date: nextRefillDate,
        is_active: true,
        is_chronic: false,
      });

      createdItems.push(prescriptionItem);
    }

    // Update prescription status
    await update('prescriptions', { ocr_status: 'completed' }, { id: prescriptionId });

    res.status(201).json({
      message: 'Prescription items added successfully',
      items: createdItems,
    });
  } catch (error) {
    console.error('Add prescription items error:', error);
    res.status(500).json({ error: 'Failed to add prescription items' });
  }
});

// ============================================================
// Get prescription with items
// ============================================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id: prescriptionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch prescription
    let prescription;

    if (userRole === 'patient') {
      prescription = await getOne(
        `SELECT id, patient_id, store_id, image_url, doctor_name, hospital_name,
                prescription_date, diagnosis, ocr_status, ocr_confidence, verified_at, created_at
         FROM prescriptions WHERE id = $1 AND patient_id = $2`,
        [prescriptionId, userId],
      );
    } else if (userRole === 'store') {
      prescription = await getOne(
        `SELECT id, patient_id, store_id, image_url, doctor_name, hospital_name,
                prescription_date, diagnosis, ocr_status, ocr_confidence, verified_at, created_at
         FROM prescriptions WHERE id = $1 AND store_id = $2`,
        [prescriptionId, userId],
      );
    }

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Fetch items
    const items = await getMany(
      `SELECT id, medicine_id, medicine_name_raw, dosage, frequency, duration_days,
              quantity, instructions, start_date, estimated_end_date, next_refill_date,
              is_active, is_chronic, created_at
       FROM prescription_items
       WHERE prescription_id = $1
       ORDER BY created_at ASC`,
      [prescriptionId],
    );

    res.json({
      prescription,
      items,
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

// ============================================================
// Store owner verifies prescription OCR
// ============================================================
router.put('/:id/verify', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { id: prescriptionId } = req.params;
    const { doctor_name, hospital_name, prescription_date, diagnosis, ocr_confidence } = req.body;

    // Verify prescription belongs to store
    const prescription = await getOne(
      'SELECT id FROM prescriptions WHERE id = $1 AND store_id = $2',
      [prescriptionId, storeId],
    );

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const updateData = {
      ocr_status: 'verified',
      verified_by: storeId,
      verified_at: new Date(),
    };

    if (doctor_name !== undefined) updateData.doctor_name = doctor_name;
    if (hospital_name !== undefined) updateData.hospital_name = hospital_name;
    if (prescription_date !== undefined) updateData.prescription_date = prescription_date;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (ocr_confidence !== undefined) updateData.ocr_confidence = ocr_confidence;

    const updatedPrescription = await update('prescriptions', updateData, { id: prescriptionId });

    res.json({
      message: 'Prescription verified successfully',
      prescription: updatedPrescription,
    });
  } catch (error) {
    console.error('Verify prescription error:', error);
    res.status(500).json({ error: 'Failed to verify prescription' });
  }
});

module.exports = router;
