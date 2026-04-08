const express = require('express');
const { getOne, getMany, query } = require('../models');

const router = express.Router();

// Search medicines by name - improved with ILIKE fallback
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }

    const searchTerm = q.trim();
    const searchLimit = Math.min(parseInt(limit) || 20, 100);
    const searchOffset = parseInt(offset) || 0;

    // Use ILIKE for broader matching (works better with Indian brand names)
    const medicines = await getMany(
      `SELECT id, name, generic_name, manufacturer, category, strength,
              pack_size, mrp, is_prescription_required, is_chronic
       FROM medicines
       WHERE name ILIKE $1
          OR generic_name ILIKE $1
          OR manufacturer ILIKE $1
       ORDER BY
         CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END,
         name ASC
       LIMIT $3 OFFSET $4`,
      [`%${searchTerm}%`, `${searchTerm}%`, searchLimit, searchOffset],
    );

    // Get total count for pagination
    const countResult = await getOne(
      `SELECT COUNT(*) as total FROM medicines
       WHERE name ILIKE $1 OR generic_name ILIKE $1 OR manufacturer ILIKE $1`,
      [`%${searchTerm}%`],
    );

    res.json({
      medicines,
      count: medicines.length,
      total: parseInt(countResult?.total || 0),
      offset: searchOffset,
      limit: searchLimit,
    });
  } catch (error) {
    console.error('Search medicines error:', error);
    res.status(500).json({ error: 'Failed to search medicines' });
  }
});

// Browse medicines by category
router.get('/browse', async (req, res) => {
  try {
    const { category, limit = 50, offset = 0 } = req.query;

    let whereClause = '';
    const params = [];
    let paramIdx = 1;

    if (category && category !== 'all') {
      whereClause = `WHERE category = $${paramIdx}`;
      params.push(category);
      paramIdx++;
    }

    params.push(Math.min(parseInt(limit) || 50, 100));
    params.push(parseInt(offset) || 0);

    const medicines = await getMany(
      `SELECT id, name, generic_name, manufacturer, category, strength,
              pack_size, mrp, is_prescription_required, is_chronic
       FROM medicines ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params,
    );

    const countResult = await getOne(
      `SELECT COUNT(*) as total FROM medicines ${whereClause}`,
      category && category !== 'all' ? [category] : [],
    );

    // Get all categories
    const categories = await getMany(
      `SELECT DISTINCT category, COUNT(*) as count
       FROM medicines GROUP BY category ORDER BY category`,
    );

    res.json({
      medicines,
      count: medicines.length,
      total: parseInt(countResult?.total || 0),
      categories,
    });
  } catch (error) {
    console.error('Browse medicines error:', error);
    res.status(500).json({ error: 'Failed to browse medicines' });
  }
});

// Get medicine details with alternatives
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await getOne(
      `SELECT id, name, generic_name, manufacturer, category, composition,
              strength, pack_size, mrp, is_prescription_required, is_chronic,
              is_controlled, alternative_ids, created_at
       FROM medicines WHERE id = $1`,
      [id],
    );

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    // Get alternatives
    let alternatives = [];
    if (medicine.alternative_ids && medicine.alternative_ids.length > 0) {
      alternatives = await getMany(
        `SELECT id, name, generic_name, strength, mrp
         FROM medicines
         WHERE id = ANY($1)`,
        [medicine.alternative_ids],
      );
    }

    res.json({
      medicine,
      alternatives,
    });
  } catch (error) {
    console.error('Get medicine detail error:', error);
    res.status(500).json({ error: 'Failed to fetch medicine' });
  }
});

// Seed medicines endpoint (for populating the database)
router.post('/seed', async (req, res) => {
  try {
    const { secret } = req.body;

    // Simple secret check to prevent abuse
    if (secret !== 'rxmax-seed-2026') {
      return res.status(403).json({ error: 'Invalid seed secret' });
    }

    // Check current count
    const countResult = await getOne('SELECT COUNT(*) as total FROM medicines');
    const currentCount = parseInt(countResult?.total || 0);

    if (currentCount > 500) {
      return res.json({
        message: `Database already has ${currentCount} medicines. Skipping seed.`,
        count: currentCount,
      });
    }

    console.log('Starting medicine seed...');

    // Comprehensive Indian pharmacy brand database
    const medicines = generateMedicineDatabase();

    let inserted = 0;
    let skipped = 0;
    const batchSize = 50;

    for (let i = 0; i < medicines.length; i += batchSize) {
      const batch = medicines.slice(i, i + batchSize);

      for (const med of batch) {
        try {
          await query(
            `INSERT INTO medicines (name, generic_name, manufacturer, category, composition, strength, pack_size, mrp, is_prescription_required, is_chronic, is_controlled)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT DO NOTHING`,
            [
              med.name,
              med.generic_name,
              med.manufacturer,
              med.category,
              med.composition || med.generic_name,
              med.strength,
              med.pack_size,
              med.mrp,
              med.is_prescription_required || false,
              med.is_chronic || false,
              med.is_controlled || false,
            ],
          );
          inserted++;
        } catch (err) {
          skipped++;
        }
      }
    }

    const finalCount = await getOne('SELECT COUNT(*) as total FROM medicines');

    console.log(`Seed complete: ${inserted} inserted, ${skipped} skipped`);
    res.json({
      message: 'Seed complete',
      inserted,
      skipped,
      totalInDatabase: parseInt(finalCount?.total || 0),
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Seed failed: ' + error.message });
  }
});

function generateMedicineDatabase() {
  const medicines = [];

  // ===== REAL INDIAN BRAND NAMES =====
  const brands = [
    // Pain Relief & Anti-inflammatory
    { name: 'Dolo 650', generic: 'Paracetamol', mfr: 'Micro Labs', cat: 'tablet', str: '650mg', ps: '15 tablets', mrp: 32, rx: false },
    { name: 'Crocin Advance', generic: 'Paracetamol', mfr: 'GSK', cat: 'tablet', str: '500mg', ps: '15 tablets', mrp: 28, rx: false },
    { name: 'Calpol 500', generic: 'Paracetamol', mfr: 'GSK', cat: 'tablet', str: '500mg', ps: '15 tablets', mrp: 20, rx: false },
    { name: 'Combiflam', generic: 'Ibuprofen + Paracetamol', mfr: 'Sanofi', cat: 'tablet', str: '400mg+325mg', ps: '20 tablets', mrp: 42, rx: false },
    { name: 'Ibugesic Plus', generic: 'Ibuprofen + Paracetamol', mfr: 'Cipla', cat: 'tablet', str: '400mg+325mg', ps: '10 tablets', mrp: 28, rx: false },
    { name: 'Zerodol SP', generic: 'Aceclofenac + Paracetamol + Serratiopeptidase', mfr: 'IPCA Labs', cat: 'tablet', str: '100mg+325mg+15mg', ps: '10 tablets', mrp: 125, rx: true },
    { name: 'Zerodol P', generic: 'Aceclofenac + Paracetamol', mfr: 'IPCA Labs', cat: 'tablet', str: '100mg+325mg', ps: '10 tablets', mrp: 68, rx: true },
    { name: 'Hifenac P', generic: 'Aceclofenac + Paracetamol', mfr: 'Intas', cat: 'tablet', str: '100mg+325mg', ps: '10 tablets', mrp: 65, rx: true },
    { name: 'Voveran SR 100', generic: 'Diclofenac Sodium', mfr: 'Novartis', cat: 'tablet', str: '100mg', ps: '10 tablets', mrp: 48, rx: true },
    { name: 'Voveran 50', generic: 'Diclofenac Sodium', mfr: 'Novartis', cat: 'tablet', str: '50mg', ps: '15 tablets', mrp: 22, rx: true },
    { name: 'Nimesulide', generic: 'Nimesulide', mfr: 'Various', cat: 'tablet', str: '100mg', ps: '10 tablets', mrp: 30, rx: true },
    { name: 'Nise', generic: 'Nimesulide', mfr: 'Dr Reddys', cat: 'tablet', str: '100mg', ps: '10 tablets', mrp: 35, rx: true },
    { name: 'Flexon', generic: 'Ibuprofen + Paracetamol', mfr: 'Aristo', cat: 'tablet', str: '400mg+325mg', ps: '10 tablets', mrp: 25, rx: false },
    { name: 'Saridon', generic: 'Propyphenazone + Paracetamol + Caffeine', mfr: 'Bayer', cat: 'tablet', str: '150mg+250mg+50mg', ps: '10 tablets', mrp: 30, rx: false },
    { name: 'Disprin', generic: 'Aspirin', mfr: 'Reckitt', cat: 'tablet', str: '350mg', ps: '10 tablets', mrp: 9, rx: false },

    // Antibiotics
    { name: 'Augmentin 625 Duo', generic: 'Amoxicillin + Clavulanate', mfr: 'GSK', cat: 'tablet', str: '500mg+125mg', ps: '10 tablets', mrp: 225, rx: true },
    { name: 'Moxikind CV 625', generic: 'Amoxicillin + Clavulanate', mfr: 'Mankind', cat: 'tablet', str: '500mg+125mg', ps: '10 tablets', mrp: 175, rx: true },
    { name: 'Azithral 500', generic: 'Azithromycin', mfr: 'Alembic', cat: 'tablet', str: '500mg', ps: '3 tablets', mrp: 95, rx: true },
    { name: 'Zithromax 500', generic: 'Azithromycin', mfr: 'Pfizer', cat: 'tablet', str: '500mg', ps: '3 tablets', mrp: 140, rx: true },
    { name: 'Azee 500', generic: 'Azithromycin', mfr: 'Cipla', cat: 'tablet', str: '500mg', ps: '3 tablets', mrp: 78, rx: true },
    { name: 'Ciplox 500', generic: 'Ciprofloxacin', mfr: 'Cipla', cat: 'tablet', str: '500mg', ps: '10 tablets', mrp: 68, rx: true },
    { name: 'Cifran 500', generic: 'Ciprofloxacin', mfr: 'Sun Pharma', cat: 'tablet', str: '500mg', ps: '10 tablets', mrp: 72, rx: true },
    { name: 'Zifi 200', generic: 'Cefixime', mfr: 'FDC', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 175, rx: true },
    { name: 'Taxim-O 200', generic: 'Cefixime', mfr: 'Alkem', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 180, rx: true },
    { name: 'Monocef 200', generic: 'Cefixime', mfr: 'Aristo', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 165, rx: true },
    { name: 'Cefakind 500', generic: 'Cephalexin', mfr: 'Mankind', cat: 'capsule', str: '500mg', ps: '10 capsules', mrp: 120, rx: true },
    { name: 'Oflox 200', generic: 'Ofloxacin', mfr: 'Cipla', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 55, rx: true },
    { name: 'Levoflox 500', generic: 'Levofloxacin', mfr: 'Cipla', cat: 'tablet', str: '500mg', ps: '5 tablets', mrp: 72, rx: true },
    { name: 'Norflox 400', generic: 'Norfloxacin', mfr: 'Cipla', cat: 'tablet', str: '400mg', ps: '10 tablets', mrp: 45, rx: true },
    { name: 'Doxycycline 100', generic: 'Doxycycline', mfr: 'Various', cat: 'capsule', str: '100mg', ps: '10 capsules', mrp: 48, rx: true },
    { name: 'Metrogyl 400', generic: 'Metronidazole', mfr: 'J&J', cat: 'tablet', str: '400mg', ps: '15 tablets', mrp: 20, rx: true },

    // Diabetes
    { name: 'Glycomet GP 1', generic: 'Metformin + Glimepiride', mfr: 'USV', cat: 'tablet', str: '500mg+1mg', ps: '15 tablets', mrp: 105, rx: true, chronic: true },
    { name: 'Glycomet GP 2', generic: 'Metformin + Glimepiride', mfr: 'USV', cat: 'tablet', str: '500mg+2mg', ps: '15 tablets', mrp: 130, rx: true, chronic: true },
    { name: 'Glycomet 500', generic: 'Metformin', mfr: 'USV', cat: 'tablet', str: '500mg', ps: '20 tablets', mrp: 30, rx: true, chronic: true },
    { name: 'Glycomet 850', generic: 'Metformin', mfr: 'USV', cat: 'tablet', str: '850mg', ps: '10 tablets', mrp: 22, rx: true, chronic: true },
    { name: 'Glycomet 1000 SR', generic: 'Metformin SR', mfr: 'USV', cat: 'tablet', str: '1000mg', ps: '15 tablets', mrp: 85, rx: true, chronic: true },
    { name: 'Amaryl M 1', generic: 'Glimepiride + Metformin', mfr: 'Sanofi', cat: 'tablet', str: '1mg+500mg', ps: '15 tablets', mrp: 160, rx: true, chronic: true },
    { name: 'Amaryl M 2', generic: 'Glimepiride + Metformin', mfr: 'Sanofi', cat: 'tablet', str: '2mg+500mg', ps: '15 tablets', mrp: 185, rx: true, chronic: true },
    { name: 'Janumet 50/500', generic: 'Sitagliptin + Metformin', mfr: 'MSD', cat: 'tablet', str: '50mg+500mg', ps: '7 tablets', mrp: 325, rx: true, chronic: true },
    { name: 'Galvus Met 50/500', generic: 'Vildagliptin + Metformin', mfr: 'Novartis', cat: 'tablet', str: '50mg+500mg', ps: '10 tablets', mrp: 280, rx: true, chronic: true },
    { name: 'Jardiance 10', generic: 'Empagliflozin', mfr: 'Boehringer', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 520, rx: true, chronic: true },
    { name: 'Trajenta 5', generic: 'Linagliptin', mfr: 'Boehringer', cat: 'tablet', str: '5mg', ps: '10 tablets', mrp: 475, rx: true, chronic: true },
    { name: 'Gluformin 500', generic: 'Metformin', mfr: 'Mankind', cat: 'tablet', str: '500mg', ps: '20 tablets', mrp: 25, rx: true, chronic: true },
    { name: 'Obimet 500', generic: 'Metformin', mfr: 'Zydus', cat: 'tablet', str: '500mg', ps: '20 tablets', mrp: 28, rx: true, chronic: true },

    // Cardiovascular / BP
    { name: 'Telma 40', generic: 'Telmisartan', mfr: 'Glenmark', cat: 'tablet', str: '40mg', ps: '15 tablets', mrp: 135, rx: true, chronic: true },
    { name: 'Telma 80', generic: 'Telmisartan', mfr: 'Glenmark', cat: 'tablet', str: '80mg', ps: '15 tablets', mrp: 205, rx: true, chronic: true },
    { name: 'Telma H', generic: 'Telmisartan + HCTZ', mfr: 'Glenmark', cat: 'tablet', str: '40mg+12.5mg', ps: '15 tablets', mrp: 170, rx: true, chronic: true },
    { name: 'Telma AM', generic: 'Telmisartan + Amlodipine', mfr: 'Glenmark', cat: 'tablet', str: '40mg+5mg', ps: '15 tablets', mrp: 185, rx: true, chronic: true },
    { name: 'Amlodac 5', generic: 'Amlodipine', mfr: 'Zydus', cat: 'tablet', str: '5mg', ps: '15 tablets', mrp: 55, rx: true, chronic: true },
    { name: 'Amlong 5', generic: 'Amlodipine', mfr: 'Micro Labs', cat: 'tablet', str: '5mg', ps: '15 tablets', mrp: 48, rx: true, chronic: true },
    { name: 'Stamlo 5', generic: 'Amlodipine', mfr: 'Dr Reddys', cat: 'tablet', str: '5mg', ps: '15 tablets', mrp: 52, rx: true, chronic: true },
    { name: 'Ecosprin 75', generic: 'Aspirin', mfr: 'USV', cat: 'tablet', str: '75mg', ps: '14 tablets', mrp: 8, rx: false, chronic: true },
    { name: 'Ecosprin 150', generic: 'Aspirin', mfr: 'USV', cat: 'tablet', str: '150mg', ps: '14 tablets', mrp: 10, rx: false, chronic: true },
    { name: 'Ecosprin AV 75/10', generic: 'Aspirin + Atorvastatin', mfr: 'USV', cat: 'capsule', str: '75mg+10mg', ps: '15 capsules', mrp: 95, rx: true, chronic: true },
    { name: 'Atorva 10', generic: 'Atorvastatin', mfr: 'Zydus', cat: 'tablet', str: '10mg', ps: '15 tablets', mrp: 110, rx: true, chronic: true },
    { name: 'Atorva 20', generic: 'Atorvastatin', mfr: 'Zydus', cat: 'tablet', str: '20mg', ps: '15 tablets', mrp: 175, rx: true, chronic: true },
    { name: 'Atorva 40', generic: 'Atorvastatin', mfr: 'Zydus', cat: 'tablet', str: '40mg', ps: '10 tablets', mrp: 195, rx: true, chronic: true },
    { name: 'Lipitor 10', generic: 'Atorvastatin', mfr: 'Pfizer', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 180, rx: true, chronic: true },
    { name: 'Rosuvastatin 10', generic: 'Rosuvastatin', mfr: 'Various', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 120, rx: true, chronic: true },
    { name: 'Rosuvas 10', generic: 'Rosuvastatin', mfr: 'Sun Pharma', cat: 'tablet', str: '10mg', ps: '15 tablets', mrp: 210, rx: true, chronic: true },
    { name: 'Clopitab A 75/75', generic: 'Clopidogrel + Aspirin', mfr: 'Lupin', cat: 'tablet', str: '75mg+75mg', ps: '15 tablets', mrp: 82, rx: true, chronic: true },
    { name: 'Clopilet A 75', generic: 'Clopidogrel + Aspirin', mfr: 'Sun Pharma', cat: 'tablet', str: '75mg+75mg', ps: '15 tablets', mrp: 85, rx: true, chronic: true },
    { name: 'Metoprolol 25', generic: 'Metoprolol', mfr: 'Various', cat: 'tablet', str: '25mg', ps: '10 tablets', mrp: 30, rx: true, chronic: true },
    { name: 'Met XL 25', generic: 'Metoprolol Succinate', mfr: 'Cipla', cat: 'tablet', str: '25mg', ps: '15 tablets', mrp: 68, rx: true, chronic: true },
    { name: 'Concor 5', generic: 'Bisoprolol', mfr: 'Merck', cat: 'tablet', str: '5mg', ps: '14 tablets', mrp: 135, rx: true, chronic: true },
    { name: 'Envas 5', generic: 'Enalapril', mfr: 'Cadila', cat: 'tablet', str: '5mg', ps: '14 tablets', mrp: 35, rx: true, chronic: true },
    { name: 'Losar 50', generic: 'Losartan', mfr: 'Unichem', cat: 'tablet', str: '50mg', ps: '10 tablets', mrp: 42, rx: true, chronic: true },

    // Gastro / Acidity
    { name: 'Pan 40', generic: 'Pantoprazole', mfr: 'Alkem', cat: 'tablet', str: '40mg', ps: '15 tablets', mrp: 88, rx: true },
    { name: 'Pan-D', generic: 'Pantoprazole + Domperidone', mfr: 'Alkem', cat: 'capsule', str: '40mg+30mg', ps: '15 capsules', mrp: 120, rx: true },
    { name: 'Rantac 150', generic: 'Ranitidine', mfr: 'J&J', cat: 'tablet', str: '150mg', ps: '30 tablets', mrp: 30, rx: false },
    { name: 'Omez 20', generic: 'Omeprazole', mfr: 'Dr Reddys', cat: 'capsule', str: '20mg', ps: '15 capsules', mrp: 62, rx: true },
    { name: 'Omez D', generic: 'Omeprazole + Domperidone', mfr: 'Dr Reddys', cat: 'capsule', str: '20mg+10mg', ps: '15 capsules', mrp: 95, rx: true },
    { name: 'Rablet 20', generic: 'Rabeprazole', mfr: 'Lupin', cat: 'tablet', str: '20mg', ps: '10 tablets', mrp: 85, rx: true },
    { name: 'Nexpro RD 40', generic: 'Esomeprazole + Domperidone', mfr: 'Torrent', cat: 'capsule', str: '40mg+30mg', ps: '15 capsules', mrp: 175, rx: true },
    { name: 'Gelusil MPS', generic: 'Aluminium Hydroxide + Magnesium', mfr: 'Pfizer', cat: 'syrup', str: '250ml', ps: '1 bottle', mrp: 95, rx: false },
    { name: 'Digene', generic: 'Antacid Gel', mfr: 'Abbott', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 82, rx: false },
    { name: 'Mucaine Gel', generic: 'Antacid + Oxethazaine', mfr: 'Abbott', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 110, rx: false },

    // Vitamins & Supplements
    { name: 'Shelcal 500', generic: 'Calcium + Vitamin D3', mfr: 'Torrent', cat: 'tablet', str: '500mg+250IU', ps: '15 tablets', mrp: 105, rx: false },
    { name: 'Shelcal HD', generic: 'Calcium + Vitamin D3', mfr: 'Torrent', cat: 'tablet', str: '500mg+1000IU', ps: '15 tablets', mrp: 135, rx: false },
    { name: 'Calcimax 500', generic: 'Calcium + Vitamin D3', mfr: 'Meyer', cat: 'tablet', str: '500mg+250IU', ps: '15 tablets', mrp: 98, rx: false },
    { name: 'Becosules Z', generic: 'B-Complex + Zinc', mfr: 'Pfizer', cat: 'capsule', str: 'Multivitamin', ps: '20 capsules', mrp: 45, rx: false },
    { name: 'Becosules', generic: 'B-Complex', mfr: 'Pfizer', cat: 'capsule', str: 'Multivitamin', ps: '20 capsules', mrp: 35, rx: false },
    { name: 'Supradyn', generic: 'Multivitamin + Minerals', mfr: 'Bayer', cat: 'tablet', str: 'Multivitamin', ps: '15 tablets', mrp: 48, rx: false },
    { name: 'Revital H', generic: 'Multivitamin + Ginseng', mfr: 'Sun Pharma', cat: 'capsule', str: 'Multivitamin', ps: '30 capsules', mrp: 280, rx: false },
    { name: 'Zincovit', generic: 'Zinc + Multivitamin', mfr: 'Apex', cat: 'tablet', str: 'Multivitamin', ps: '15 tablets', mrp: 72, rx: false },
    { name: 'Limcee 500', generic: 'Vitamin C', mfr: 'Abbott', cat: 'tablet', str: '500mg', ps: '15 tablets', mrp: 25, rx: false },
    { name: 'Evion 400', generic: 'Vitamin E', mfr: 'Merck', cat: 'capsule', str: '400mg', ps: '10 capsules', mrp: 42, rx: false },
    { name: 'Neurobion Forte', generic: 'Vitamin B1 + B6 + B12', mfr: 'Merck', cat: 'tablet', str: 'B-Complex', ps: '30 tablets', mrp: 58, rx: false },
    { name: 'Folvite 5', generic: 'Folic Acid', mfr: 'Pfizer', cat: 'tablet', str: '5mg', ps: '45 tablets', mrp: 22, rx: false },
    { name: 'Feronia XT', generic: 'Ferrous Ascorbate + Folic Acid', mfr: 'Piramal', cat: 'tablet', str: '100mg+1.5mg', ps: '10 tablets', mrp: 115, rx: false },
    { name: 'Autrin', generic: 'Iron + Folic Acid + B12', mfr: 'Zydus', cat: 'capsule', str: 'Iron Complex', ps: '10 capsules', mrp: 48, rx: false },
    { name: 'D-Rise 60K', generic: 'Cholecalciferol', mfr: 'USV', cat: 'capsule', str: '60000IU', ps: '4 capsules', mrp: 120, rx: false },
    { name: 'Uprise D3 60K', generic: 'Cholecalciferol', mfr: 'Alkem', cat: 'capsule', str: '60000IU', ps: '4 capsules', mrp: 125, rx: false },
    { name: 'Calcirol D3', generic: 'Cholecalciferol', mfr: 'Cadila', cat: 'capsule', str: '60000IU', ps: '4 capsules', mrp: 110, rx: false },

    // Respiratory / Cough & Cold
    { name: 'Montair LC', generic: 'Montelukast + Levocetirizine', mfr: 'Cipla', cat: 'tablet', str: '10mg+5mg', ps: '15 tablets', mrp: 175, rx: true },
    { name: 'Montek LC', generic: 'Montelukast + Levocetirizine', mfr: 'Sun Pharma', cat: 'tablet', str: '10mg+5mg', ps: '15 tablets', mrp: 165, rx: true },
    { name: 'Sinarest', generic: 'Paracetamol + Phenylephrine + CPM', mfr: 'Centaur', cat: 'tablet', str: 'Combination', ps: '10 tablets', mrp: 28, rx: false },
    { name: 'Alex', generic: 'Dextromethorphan + CPM', mfr: 'Glenmark', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 72, rx: false },
    { name: 'Benadryl', generic: 'Diphenhydramine', mfr: 'J&J', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 82, rx: false },
    { name: 'Grilinctus BM', generic: 'Bromhexine + Guaifenesin + Menthol', mfr: 'Franco Indian', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 65, rx: false },
    { name: 'Ascoril LS', generic: 'Ambroxol + Levosalbutamol + Guaifenesin', mfr: 'Glenmark', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 98, rx: true },
    { name: 'Chericof', generic: 'Dextromethorphan + CPM', mfr: 'Cipla', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 55, rx: false },
    { name: 'Cetrizine', generic: 'Cetirizine', mfr: 'Various', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 15, rx: false },
    { name: 'Allegra 120', generic: 'Fexofenadine', mfr: 'Sanofi', cat: 'tablet', str: '120mg', ps: '10 tablets', mrp: 165, rx: true },
    { name: 'Levocet', generic: 'Levocetirizine', mfr: 'Sun Pharma', cat: 'tablet', str: '5mg', ps: '10 tablets', mrp: 35, rx: false },
    { name: 'Deriphyllin', generic: 'Theophylline + Etophylline', mfr: 'Abbott', cat: 'tablet', str: '150mg+50mg', ps: '15 tablets', mrp: 40, rx: true },
    { name: 'Foracort 200', generic: 'Formoterol + Budesonide', mfr: 'Cipla', cat: 'inhaler', str: '6mcg+200mcg', ps: '120 doses', mrp: 420, rx: true, chronic: true },
    { name: 'Seroflo 250', generic: 'Salmeterol + Fluticasone', mfr: 'Cipla', cat: 'inhaler', str: '25mcg+250mcg', ps: '120 doses', mrp: 485, rx: true, chronic: true },
    { name: 'Budecort 200', generic: 'Budesonide', mfr: 'Cipla', cat: 'inhaler', str: '200mcg', ps: '200 doses', mrp: 250, rx: true, chronic: true },
    { name: 'Asthalin Inhaler', generic: 'Salbutamol', mfr: 'Cipla', cat: 'inhaler', str: '100mcg', ps: '200 doses', mrp: 125, rx: true },
    { name: 'Duolin Inhaler', generic: 'Levosalbutamol + Ipratropium', mfr: 'Cipla', cat: 'inhaler', str: '50mcg+20mcg', ps: '200 doses', mrp: 175, rx: true },

    // Anti-allergic / Skin
    { name: 'Avil 25', generic: 'Pheniramine', mfr: 'Sanofi', cat: 'tablet', str: '25mg', ps: '10 tablets', mrp: 12, rx: false },
    { name: 'Betnovate C', generic: 'Betamethasone + Clioquinol', mfr: 'GSK', cat: 'cream', str: '20g', ps: '1 tube', mrp: 62, rx: true },
    { name: 'Betnovate N', generic: 'Betamethasone + Neomycin', mfr: 'GSK', cat: 'cream', str: '20g', ps: '1 tube', mrp: 58, rx: true },
    { name: 'Candid B', generic: 'Clotrimazole + Beclometasone', mfr: 'Glenmark', cat: 'cream', str: '15g', ps: '1 tube', mrp: 78, rx: true },
    { name: 'Candid Cream', generic: 'Clotrimazole', mfr: 'Glenmark', cat: 'cream', str: '15g', ps: '1 tube', mrp: 55, rx: false },
    { name: 'Clobetasol Cream', generic: 'Clobetasol', mfr: 'Various', cat: 'cream', str: '30g', ps: '1 tube', mrp: 85, rx: true },
    { name: 'Soframycin', generic: 'Framycetin', mfr: 'Sanofi', cat: 'cream', str: '30g', ps: '1 tube', mrp: 65, rx: false },
    { name: 'Boroline', generic: 'Antiseptic Cream', mfr: 'GD Pharma', cat: 'cream', str: '20g', ps: '1 tube', mrp: 35, rx: false },
    { name: 'Panderm Plus', generic: 'Clobetasol + Ofloxacin + Miconazole + Zinc', mfr: 'Macleods', cat: 'cream', str: '15g', ps: '1 tube', mrp: 110, rx: true },
    { name: 'Fluconazole 150', generic: 'Fluconazole', mfr: 'Various', cat: 'capsule', str: '150mg', ps: '1 capsule', mrp: 15, rx: true },

    // Thyroid
    { name: 'Thyronorm 25', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '25mcg', ps: '100 tablets', mrp: 110, rx: true, chronic: true },
    { name: 'Thyronorm 50', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '50mcg', ps: '100 tablets', mrp: 130, rx: true, chronic: true },
    { name: 'Thyronorm 75', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '75mcg', ps: '100 tablets', mrp: 145, rx: true, chronic: true },
    { name: 'Thyronorm 100', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '100mcg', ps: '100 tablets', mrp: 160, rx: true, chronic: true },
    { name: 'Eltroxin 50', generic: 'Levothyroxine', mfr: 'GSK', cat: 'tablet', str: '50mcg', ps: '100 tablets', mrp: 95, rx: true, chronic: true },
    { name: 'Eltroxin 100', generic: 'Levothyroxine', mfr: 'GSK', cat: 'tablet', str: '100mcg', ps: '100 tablets', mrp: 135, rx: true, chronic: true },

    // Chymoral / Enzymes
    { name: 'Chymoral Forte', generic: 'Trypsin + Chymotrypsin', mfr: 'Torrent', cat: 'tablet', str: '100000AU', ps: '10 tablets', mrp: 135, rx: true },
    { name: 'Unienzyme', generic: 'Digestive Enzyme + Charcoal', mfr: 'Unichem', cat: 'tablet', str: 'Enzyme Complex', ps: '15 tablets', mrp: 28, rx: false },
    { name: 'Aristozyme', generic: 'Digestive Enzyme + Fungal Diastase', mfr: 'Aristo', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 92, rx: false },
    { name: 'Vitazyme', generic: 'Digestive Enzyme', mfr: 'East India', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 68, rx: false },

    // Anti-anxiety / Sleep
    { name: 'Alprazolam 0.25', generic: 'Alprazolam', mfr: 'Various', cat: 'tablet', str: '0.25mg', ps: '10 tablets', mrp: 22, rx: true, controlled: true },
    { name: 'Restyl 0.5', generic: 'Alprazolam', mfr: 'Intas', cat: 'tablet', str: '0.5mg', ps: '10 tablets', mrp: 28, rx: true, controlled: true },
    { name: 'Etizola 0.5', generic: 'Etizolam', mfr: 'Sun Pharma', cat: 'tablet', str: '0.5mg', ps: '10 tablets', mrp: 32, rx: true, controlled: true },

    // Eye / Ear Drops
    { name: 'Moxifloxacin Eye Drop', generic: 'Moxifloxacin', mfr: 'Various', cat: 'drops', str: '0.5% 5ml', ps: '1 bottle', mrp: 65, rx: true },
    { name: 'Gentamicin Eye Drop', generic: 'Gentamicin', mfr: 'Various', cat: 'drops', str: '0.3% 10ml', ps: '1 bottle', mrp: 22, rx: true },
    { name: 'Refresh Tears', generic: 'Carboxymethylcellulose', mfr: 'Allergan', cat: 'drops', str: '0.5% 10ml', ps: '1 bottle', mrp: 125, rx: false },
    { name: 'Itone Eye Drop', generic: 'Herbal Eye Drop', mfr: 'Deys', cat: 'drops', str: '10ml', ps: '1 bottle', mrp: 45, rx: false },

    // Miscellaneous
    { name: 'ORS', generic: 'Oral Rehydration Salts', mfr: 'Various', cat: 'powder', str: '21.8g', ps: '5 sachets', mrp: 20, rx: false },
    { name: 'Electral Powder', generic: 'ORS', mfr: 'FDC', cat: 'powder', str: '21.8g', ps: '4 sachets', mrp: 30, rx: false },
    { name: 'Ondem 4', generic: 'Ondansetron', mfr: 'Alkem', cat: 'tablet', str: '4mg', ps: '10 tablets', mrp: 55, rx: true },
    { name: 'Emeset 4', generic: 'Ondansetron', mfr: 'Cipla', cat: 'tablet', str: '4mg', ps: '10 tablets', mrp: 48, rx: true },
    { name: 'Loperamide', generic: 'Loperamide', mfr: 'Various', cat: 'capsule', str: '2mg', ps: '10 capsules', mrp: 20, rx: false },
    { name: 'Norflox TZ', generic: 'Norfloxacin + Tinidazole', mfr: 'Cipla', cat: 'tablet', str: '400mg+600mg', ps: '10 tablets', mrp: 65, rx: true },
    { name: 'Oflomac TZ', generic: 'Ofloxacin + Tinidazole', mfr: 'Macleods', cat: 'tablet', str: '200mg+600mg', ps: '10 tablets', mrp: 52, rx: true },
    { name: 'Cremaffin', generic: 'Liquid Paraffin + Milk of Magnesia', mfr: 'Abbott', cat: 'syrup', str: '225ml', ps: '1 bottle', mrp: 145, rx: false },
    { name: 'Dulcolax', generic: 'Bisacodyl', mfr: 'Sanofi', cat: 'tablet', str: '5mg', ps: '10 tablets', mrp: 30, rx: false },
    { name: 'Isabgol', generic: 'Psyllium Husk', mfr: 'Various', cat: 'powder', str: '100g', ps: '1 pack', mrp: 60, rx: false },
    { name: 'Volini Gel', generic: 'Diclofenac Gel', mfr: 'Sun Pharma', cat: 'gel', str: '30g', ps: '1 tube', mrp: 85, rx: false },
    { name: 'Moov', generic: 'Diclofenac + Menthol', mfr: 'Reckitt', cat: 'cream', str: '50g', ps: '1 tube', mrp: 120, rx: false },
    { name: 'Iodex', generic: 'Pain Relief Balm', mfr: 'GSK', cat: 'cream', str: '40g', ps: '1 tube', mrp: 75, rx: false },
    { name: 'Burnol', generic: 'Aminacrine + Cetrimide', mfr: 'Dr Morepen', cat: 'cream', str: '20g', ps: '1 tube', mrp: 50, rx: false },
    { name: 'Betadine', generic: 'Povidone Iodine', mfr: 'Win Medicare', cat: 'solution', str: '100ml', ps: '1 bottle', mrp: 75, rx: false },
    { name: 'Dettol Antiseptic', generic: 'Chloroxylenol', mfr: 'Reckitt', cat: 'solution', str: '120ml', ps: '1 bottle', mrp: 85, rx: false },
    { name: 'Strepsils', generic: 'Amylmetacresol + Dichlorbenzyl', mfr: 'Reckitt', cat: 'lozenge', str: '8 lozenges', ps: '1 pack', mrp: 45, rx: false },
    { name: 'Vicks Vaporub', generic: 'Menthol + Camphor + Eucalyptus', mfr: 'P&G', cat: 'ointment', str: '50g', ps: '1 jar', mrp: 105, rx: false },
  ];

  // Convert to proper format
  for (const b of brands) {
    medicines.push({
      name: b.name,
      generic_name: b.generic,
      manufacturer: b.mfr,
      category: b.cat,
      composition: b.generic,
      strength: b.str,
      pack_size: parseInt(b.ps) || 10,
      mrp: b.mrp,
      is_prescription_required: b.rx || false,
      is_chronic: b.chronic || false,
      is_controlled: b.controlled || false,
    });
  }

  // Now generate variants to reach thousands
  const manufacturers = ['Cipla', 'Sun Pharma', 'Dr Reddys', 'Lupin', 'Aurobindo', 'Zydus Cadila', 'Torrent', 'Alkem', 'Glenmark', 'IPCA Labs', 'Intas', 'Mankind', 'Macleods', 'Abbott India', 'Piramal', 'Biocon', 'Natco', 'Hetero', 'Laurus Labs', 'Strides'];

  const genericDrugs = [
    { generic: 'Paracetamol', strengths: ['250mg', '500mg', '650mg', '1000mg'], cat: 'tablet' },
    { generic: 'Ibuprofen', strengths: ['200mg', '400mg', '600mg'], cat: 'tablet' },
    { generic: 'Amoxicillin', strengths: ['250mg', '500mg'], cat: 'capsule' },
    { generic: 'Ciprofloxacin', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
    { generic: 'Azithromycin', strengths: ['250mg', '500mg'], cat: 'tablet' },
    { generic: 'Metformin', strengths: ['250mg', '500mg', '850mg', '1000mg'], cat: 'tablet' },
    { generic: 'Amlodipine', strengths: ['2.5mg', '5mg', '10mg'], cat: 'tablet' },
    { generic: 'Atorvastatin', strengths: ['5mg', '10mg', '20mg', '40mg', '80mg'], cat: 'tablet' },
    { generic: 'Losartan', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Omeprazole', strengths: ['10mg', '20mg', '40mg'], cat: 'capsule' },
    { generic: 'Pantoprazole', strengths: ['20mg', '40mg'], cat: 'tablet' },
    { generic: 'Cetirizine', strengths: ['5mg', '10mg'], cat: 'tablet' },
    { generic: 'Montelukast', strengths: ['4mg', '5mg', '10mg'], cat: 'tablet' },
    { generic: 'Levothyroxine', strengths: ['12.5mcg', '25mcg', '50mcg', '75mcg', '100mcg', '125mcg', '150mcg'], cat: 'tablet' },
    { generic: 'Telmisartan', strengths: ['20mg', '40mg', '80mg'], cat: 'tablet' },
    { generic: 'Rosuvastatin', strengths: ['5mg', '10mg', '20mg', '40mg'], cat: 'tablet' },
    { generic: 'Metoprolol', strengths: ['12.5mg', '25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Clopidogrel', strengths: ['75mg'], cat: 'tablet' },
    { generic: 'Ranitidine', strengths: ['150mg', '300mg'], cat: 'tablet' },
    { generic: 'Rabeprazole', strengths: ['10mg', '20mg'], cat: 'tablet' },
    { generic: 'Cefixime', strengths: ['100mg', '200mg', '400mg'], cat: 'tablet' },
    { generic: 'Levofloxacin', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
    { generic: 'Doxycycline', strengths: ['100mg'], cat: 'capsule' },
    { generic: 'Gabapentin', strengths: ['100mg', '300mg', '400mg', '600mg'], cat: 'capsule' },
    { generic: 'Pregabalin', strengths: ['50mg', '75mg', '150mg', '300mg'], cat: 'capsule' },
    { generic: 'Duloxetine', strengths: ['20mg', '30mg', '60mg'], cat: 'capsule' },
    { generic: 'Escitalopram', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },
    { generic: 'Sertraline', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Fluoxetine', strengths: ['20mg', '40mg', '60mg'], cat: 'capsule' },
    { generic: 'Clonazepam', strengths: ['0.25mg', '0.5mg', '1mg', '2mg'], cat: 'tablet' },
    { generic: 'Prednisolone', strengths: ['5mg', '10mg', '20mg', '40mg'], cat: 'tablet' },
    { generic: 'Deflazacort', strengths: ['6mg', '12mg', '24mg', '30mg'], cat: 'tablet' },
    { generic: 'Aceclofenac', strengths: ['100mg', '200mg'], cat: 'tablet' },
    { generic: 'Etoricoxib', strengths: ['60mg', '90mg', '120mg'], cat: 'tablet' },
    { generic: 'Tramadol', strengths: ['50mg', '100mg'], cat: 'capsule' },
    { generic: 'Tamsulosin', strengths: ['0.2mg', '0.4mg'], cat: 'capsule' },
    { generic: 'Finasteride', strengths: ['1mg', '5mg'], cat: 'tablet' },
    { generic: 'Sildenafil', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Tadalafil', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },
  ];

  // Generate manufacturer variants for each generic
  for (const drug of genericDrugs) {
    for (const mfr of manufacturers.slice(0, 8)) {
      for (const str of drug.strengths) {
        const brandPrefix = mfr.substring(0, 3).toUpperCase();
        medicines.push({
          name: `${brandPrefix}-${drug.generic.substring(0, 6)} ${str}`,
          generic_name: drug.generic,
          manufacturer: mfr,
          category: drug.cat,
          composition: drug.generic,
          strength: str,
          pack_size: 10,
          mrp: Math.floor(Math.random() * 200) + 20,
          is_prescription_required: true,
          is_chronic: false,
          is_controlled: false,
        });
      }
    }
  }

  return medicines;
}

// Bulk seed endpoint for generating 100,000+ medicines
router.post('/seed-bulk', async (req, res) => {
  try {
    const { secret, count = 100000 } = req.body;

    // Simple secret check to prevent abuse
    if (secret !== 'rxmaxadmin2026') {
      return res.status(403).json({ error: 'Invalid seed secret' });
    }

    const targetCount = Math.min(Math.max(parseInt(count) || 100000, 1000), 1000000);
    console.log(`Starting bulk medicine seed for ${targetCount} medicines...`);

    // Get current count
    const countResult = await getOne('SELECT COUNT(*) as total FROM medicines');
    const currentCount = parseInt(countResult?.total || 0);

    if (currentCount >= targetCount) {
      return res.json({
        message: `Database already has ${currentCount} medicines. Target is ${targetCount}. Skipping.`,
        currentCount,
        targetCount,
      });
    }

    const remainingNeeded = targetCount - currentCount;

    // Expanded lists for bulk generation
    const genericDrugs = [
      // Pain Relief (8 drugs)
      { generic: 'Paracetamol', strengths: ['500mg', '650mg'], cat: 'tablet' },
      { generic: 'Ibuprofen', strengths: ['200mg', '400mg', '600mg'], cat: 'tablet' },
      { generic: 'Aspirin', strengths: ['100mg', '300mg', '500mg'], cat: 'tablet' },
      { generic: 'Diclofenac', strengths: ['50mg', '75mg', '100mg'], cat: 'tablet' },
      { generic: 'Naproxen', strengths: ['250mg', '500mg'], cat: 'tablet' },
      { generic: 'Indomethacin', strengths: ['25mg', '50mg', '75mg'], cat: 'tablet' },
      { generic: 'Meloxicam', strengths: ['7.5mg', '15mg'], cat: 'tablet' },
      { generic: 'Piroxicam', strengths: ['10mg', '20mg'], cat: 'tablet' },

      // Antibiotics (12 drugs)
      { generic: 'Amoxicillin', strengths: ['250mg', '500mg', '1000mg'], cat: 'tablet' },
      { generic: 'Azithromycin', strengths: ['250mg', '500mg'], cat: 'tablet' },
      { generic: 'Ciprofloxacin', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
      { generic: 'Cefixime', strengths: ['100mg', '200mg', '400mg'], cat: 'tablet' },
      { generic: 'Cephalexin', strengths: ['250mg', '500mg'], cat: 'capsule' },
      { generic: 'Ofloxacin', strengths: ['100mg', '200mg', '400mg'], cat: 'tablet' },
      { generic: 'Levofloxacin', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
      { generic: 'Erythromycin', strengths: ['250mg', '500mg'], cat: 'tablet' },
      { generic: 'Doxycycline', strengths: ['50mg', '100mg'], cat: 'capsule' },
      { generic: 'Metronidazole', strengths: ['200mg', '400mg'], cat: 'tablet' },
      { generic: 'Norfloxacin', strengths: ['400mg'], cat: 'tablet' },
      { generic: 'Trimethoprim', strengths: ['100mg', '200mg'], cat: 'tablet' },

      // Antacids & GI (8 drugs)
      { generic: 'Omeprazole', strengths: ['10mg', '20mg', '40mg'], cat: 'capsule' },
      { generic: 'Pantoprazole', strengths: ['20mg', '40mg'], cat: 'tablet' },
      { generic: 'Ranitidine', strengths: ['75mg', '150mg', '300mg'], cat: 'tablet' },
      { generic: 'Famotidine', strengths: ['10mg', '20mg', '40mg'], cat: 'tablet' },
      { generic: 'Domperidone', strengths: ['10mg'], cat: 'tablet' },
      { generic: 'Metoclopramide', strengths: ['10mg'], cat: 'tablet' },
      { generic: 'Rauwolfia', strengths: ['100mg', '200mg'], cat: 'tablet' },
      { generic: 'Loperamide', strengths: ['2mg'], cat: 'capsule' },

      // Diabetes (10 drugs)
      { generic: 'Metformin', strengths: ['250mg', '500mg', '850mg', '1000mg'], cat: 'tablet' },
      { generic: 'Glimepiride', strengths: ['1mg', '2mg', '4mg'], cat: 'tablet' },
      { generic: 'Glyburide', strengths: ['1.25mg', '2.5mg', '5mg'], cat: 'tablet' },
      { generic: 'Sitagliptin', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
      { generic: 'Vildagliptin', strengths: ['50mg', '100mg'], cat: 'tablet' },
      { generic: 'Insulin Glargine', strengths: ['100 IU/ml'], cat: 'injection' },
      { generic: 'Insulin NPH', strengths: ['100 IU/ml'], cat: 'injection' },
      { generic: 'Empagliflozin', strengths: ['10mg', '25mg'], cat: 'tablet' },
      { generic: 'Canagliflozin', strengths: ['100mg', '300mg'], cat: 'tablet' },
      { generic: 'Linagliptin', strengths: ['2.5mg', '5mg'], cat: 'tablet' },

      // Cardiovascular/Hypertension (15 drugs)
      { generic: 'Amlodipine', strengths: ['2.5mg', '5mg', '10mg'], cat: 'tablet' },
      { generic: 'Enalapril', strengths: ['2.5mg', '5mg', '10mg'], cat: 'tablet' },
      { generic: 'Lisinopril', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },
      { generic: 'Losartan', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
      { generic: 'Telmisartan', strengths: ['20mg', '40mg', '80mg'], cat: 'tablet' },
      { generic: 'Valsartan', strengths: ['80mg', '160mg', '320mg'], cat: 'tablet' },
      { generic: 'Nifedipine', strengths: ['10mg', '20mg', '30mg'], cat: 'tablet' },
      { generic: 'Diltiazem', strengths: ['30mg', '60mg', '90mg'], cat: 'tablet' },
      { generic: 'Verapamil', strengths: ['40mg', '80mg', '120mg'], cat: 'tablet' },
      { generic: 'Atorvastatin', strengths: ['10mg', '20mg', '40mg', '80mg'], cat: 'tablet' },
      { generic: 'Simvastatin', strengths: ['10mg', '20mg', '40mg'], cat: 'tablet' },
      { generic: 'Rosuvastatin', strengths: ['5mg', '10mg', '20mg', '40mg'], cat: 'tablet' },
      { generic: 'Pravastatin', strengths: ['10mg', '20mg', '40mg'], cat: 'tablet' },
      { generic: 'Clopidogrel', strengths: ['75mg'], cat: 'tablet' },
      { generic: 'Aspirin', strengths: ['75mg', '150mg'], cat: 'tablet' },

      // Thyroid (4 drugs)
      { generic: 'Levothyroxine', strengths: ['25mcg', '50mcg', '75mcg', '100mcg', '150mcg'], cat: 'tablet' },
      { generic: 'Liothyronine', strengths: ['5mcg', '25mcg', '50mcg'], cat: 'tablet' },
      { generic: 'Propranolol', strengths: ['10mg', '20mg', '40mg', '80mg'], cat: 'tablet' },
      { generic: 'Carbimazole', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },

      // Anti-inflammatory/Immunosuppressant (8 drugs)
      { generic: 'Prednisolone', strengths: ['5mg', '10mg', '20mg', '50mg'], cat: 'tablet' },
      { generic: 'Dexamethasone', strengths: ['0.5mg', '1mg', '2mg', '4mg'], cat: 'tablet' },
      { generic: 'Methylprednisolone', strengths: ['4mg', '8mg', '16mg'], cat: 'tablet' },
      { generic: 'Hydroxychloroquine', strengths: ['200mg', '400mg'], cat: 'tablet' },
      { generic: 'Sulfasalazine', strengths: ['500mg'], cat: 'tablet' },
      { generic: 'Azathioprine', strengths: ['50mg'], cat: 'tablet' },
      { generic: 'Mycophenolate', strengths: ['250mg', '500mg'], cat: 'capsule' },
      { generic: 'Tacrolimus', strengths: ['0.5mg', '1mg', '5mg'], cat: 'capsule' },

      // Respiratory (8 drugs)
      { generic: 'Salbutamol', strengths: ['100mcg', '200mcg'], cat: 'inhaler' },
      { generic: 'Ipratropium', strengths: ['20mcg'], cat: 'inhaler' },
      { generic: 'Fluticasone', strengths: ['50mcg', '125mcg', '250mcg'], cat: 'inhaler' },
      { generic: 'Budesonide', strengths: ['100mcg', '200mcg'], cat: 'inhaler' },
      { generic: 'Montelukast', strengths: ['4mg', '5mg', '10mg'], cat: 'tablet' },
      { generic: 'Theophylline', strengths: ['100mg', '200mg', '300mg'], cat: 'tablet' },
      { generic: 'Bromhexine', strengths: ['4mg', '8mg'], cat: 'tablet' },
      { generic: 'Ambroxol', strengths: ['15mg', '30mg'], cat: 'tablet' },

      // Neurological (12 drugs)
      { generic: 'Phenytoin', strengths: ['25mg', '50mg', '100mg'], cat: 'capsule' },
      { generic: 'Carbamazepine', strengths: ['100mg', '200mg', '400mg'], cat: 'tablet' },
      { generic: 'Valproic Acid', strengths: ['200mg', '500mg'], cat: 'capsule' },
      { generic: 'Levetiracetam', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
      { generic: 'Gabapentin', strengths: ['100mg', '300mg', '400mg', '600mg'], cat: 'capsule' },
      { generic: 'Pregabalin', strengths: ['50mg', '75mg', '150mg', '300mg'], cat: 'capsule' },
      { generic: 'Topiramate', strengths: ['25mg', '50mg', '100mg', '200mg'], cat: 'tablet' },
      { generic: 'Lamotrigine', strengths: ['25mg', '50mg', '100mg', '200mg'], cat: 'tablet' },
      { generic: 'Baclofen', strengths: ['10mg'], cat: 'tablet' },
      { generic: 'Amantadine', strengths: ['100mg'], cat: 'tablet' },
      { generic: 'Memantine', strengths: ['5mg', '10mg'], cat: 'tablet' },
      { generic: 'Donepezil', strengths: ['5mg', '10mg'], cat: 'tablet' },

      // Psychiatric (10 drugs)
      { generic: 'Chlorpromazine', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
      { generic: 'Haloperidol', strengths: ['1mg', '2mg', '5mg', '10mg'], cat: 'tablet' },
      { generic: 'Risperidone', strengths: ['0.5mg', '1mg', '2mg', '3mg', '4mg'], cat: 'tablet' },
      { generic: 'Olanzapine', strengths: ['2.5mg', '5mg', '7.5mg', '10mg'], cat: 'tablet' },
      { generic: 'Quetiapine', strengths: ['25mg', '50mg', '100mg', '200mg'], cat: 'tablet' },
      { generic: 'Fluoxetine', strengths: ['20mg', '40mg', '60mg'], cat: 'capsule' },
      { generic: 'Sertraline', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
      { generic: 'Escitalopram', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },
      { generic: 'Duloxetine', strengths: ['20mg', '30mg', '60mg'], cat: 'capsule' },
      { generic: 'Venlafaxine', strengths: ['37.5mg', '75mg', '150mg'], cat: 'capsule' },

      // Anxiety/Sleep (6 drugs)
      { generic: 'Alprazolam', strengths: ['0.25mg', '0.5mg', '1mg', '2mg'], cat: 'tablet' },
      { generic: 'Clonazepam', strengths: ['0.5mg', '1mg', '2mg'], cat: 'tablet' },
      { generic: 'Lorazepam', strengths: ['1mg', '2mg'], cat: 'tablet' },
      { generic: 'Diazepam', strengths: ['2mg', '5mg', '10mg'], cat: 'tablet' },
      { generic: 'Zopiclone', strengths: ['3.75mg', '7.5mg'], cat: 'tablet' },
      { generic: 'Zolpidem', strengths: ['5mg', '10mg'], cat: 'tablet' },

      // Eye Drops (6 drugs)
      { generic: 'Timolol', strengths: ['0.25%', '0.5%'], cat: 'eye drops' },
      { generic: 'Dorzolamide', strengths: ['2%'], cat: 'eye drops' },
      { generic: 'Latanoprost', strengths: ['0.005%'], cat: 'eye drops' },
      { generic: 'Moxifloxacin', strengths: ['0.5%'], cat: 'eye drops' },
      { generic: 'Ofloxacin', strengths: ['0.3%'], cat: 'eye drops' },
      { generic: 'Artificial Tears', strengths: ['0.5%'], cat: 'eye drops' },

      // Ear Drops (4 drugs)
      { generic: 'Ofloxacin', strengths: ['0.3%'], cat: 'ear drops' },
      { generic: 'Ciprofloxacin', strengths: ['0.3%'], cat: 'ear drops' },
      { generic: 'Neomycin', strengths: ['3.5mg/ml'], cat: 'ear drops' },
      { generic: 'Acetic Acid', strengths: ['2%'], cat: 'ear drops' },

      // Nasal Sprays (5 drugs)
      { generic: 'Fluticasone', strengths: ['50mcg'], cat: 'nasal spray' },
      { generic: 'Mometasone', strengths: ['50mcg'], cat: 'nasal spray' },
      { generic: 'Xylometazoline', strengths: ['0.1%'], cat: 'nasal spray' },
      { generic: 'Oxymetazoline', strengths: ['0.05%'], cat: 'nasal spray' },
      { generic: 'Saline', strengths: ['0.9%'], cat: 'nasal spray' },

      // Inhalers (6 drugs)
      { generic: 'Albuterol', strengths: ['100mcg'], cat: 'inhaler' },
      { generic: 'Salmeterol', strengths: ['25mcg'], cat: 'inhaler' },
      { generic: 'Mometasone', strengths: ['100mcg', '200mcg'], cat: 'inhaler' },
      { generic: 'Beclomethasone', strengths: ['50mcg', '100mcg'], cat: 'inhaler' },
      { generic: 'Tiotropium', strengths: ['18mcg'], cat: 'inhaler' },
      { generic: 'Combination ICS/LABA', strengths: ['100/25mcg'], cat: 'inhaler' },

      // Injections (10 drugs)
      { generic: 'Hepatitis B Vaccine', strengths: ['20mcg'], cat: 'injection' },
      { generic: 'Tetanus Toxoid', strengths: ['10 units'], cat: 'injection' },
      { generic: 'Influenza Vaccine', strengths: ['15mcg'], cat: 'injection' },
      { generic: 'BCG Vaccine', strengths: ['0.1ml'], cat: 'injection' },
      { generic: 'Penicillin G', strengths: ['1MU', '3MU'], cat: 'injection' },
      { generic: 'Ceftriaxone', strengths: ['250mg', '500mg', '1g', '2g'], cat: 'injection' },
      { generic: 'Gentamicin', strengths: ['40mg', '80mg', '120mg'], cat: 'injection' },
      { generic: 'Calcium Gluconate', strengths: ['10%'], cat: 'injection' },
      { generic: 'Magnesium Sulfate', strengths: ['50%'], cat: 'injection' },
      { generic: 'Vitamin B Complex', strengths: ['1ml'], cat: 'injection' },

      // Sachets (6 drugs)
      { generic: 'Oral Rehydration Salts', strengths: ['1 sachet'], cat: 'sachet' },
      { generic: 'Electrolyte Powder', strengths: ['1 sachet'], cat: 'sachet' },
      { generic: 'Fiber Supplement', strengths: ['10g'], cat: 'sachet' },
      { generic: 'Vitamin C Powder', strengths: ['1000mg'], cat: 'sachet' },
      { generic: 'Zinc Supplement', strengths: ['15mg'], cat: 'sachet' },
      { generic: 'Probiotic Powder', strengths: ['1 sachet'], cat: 'sachet' },

      // Ointments (8 drugs)
      { generic: 'Neomycin Ointment', strengths: ['500 IU/g'], cat: 'ointment' },
      { generic: 'Mupirocin', strengths: ['2%'], cat: 'ointment' },
      { generic: 'Clotrimazole', strengths: ['1%'], cat: 'ointment' },
      { generic: 'Miconazole', strengths: ['2%'], cat: 'ointment' },
      { generic: 'Ketoconazole', strengths: ['2%'], cat: 'ointment' },
      { generic: 'Hydrocortisone', strengths: ['0.5%', '1%'], cat: 'ointment' },
      { generic: 'Triamcinolone', strengths: ['0.1%'], cat: 'ointment' },
      { generic: 'Bacitracin', strengths: ['500 IU/g'], cat: 'ointment' },

      // Gels (6 drugs)
      { generic: 'Benzoyl Peroxide', strengths: ['2.5%', '5%', '10%'], cat: 'gel' },
      { generic: 'Salicylic Acid', strengths: ['2%', '6%'], cat: 'gel' },
      { generic: 'Tretinoin', strengths: ['0.025%', '0.05%', '0.1%'], cat: 'gel' },
      { generic: 'Adapalene', strengths: ['0.1%'], cat: 'gel' },
      { generic: 'Metronidazole', strengths: ['1%'], cat: 'gel' },
      { generic: 'Lidocaine', strengths: ['2%'], cat: 'gel' },

      // Shampoos (5 drugs)
      { generic: 'Ketoconazole', strengths: ['2%'], cat: 'shampoo' },
      { generic: 'Zinc Pyrithione', strengths: ['1%', '2%'], cat: 'shampoo' },
      { generic: 'Selenium Sulfide', strengths: ['2.5%'], cat: 'shampoo' },
      { generic: 'Coal Tar', strengths: ['2%'], cat: 'shampoo' },
      { generic: 'Salicylic Acid', strengths: ['1.5%', '3%'], cat: 'shampoo' },

      // Lotions (6 drugs)
      { generic: 'Calamine Lotion', strengths: ['8%'], cat: 'lotion' },
      { generic: 'Hydrating Lotion', strengths: ['regular'], cat: 'lotion' },
      { generic: 'Sunscreen Lotion', strengths: ['SPF 30', 'SPF 50'], cat: 'lotion' },
      { generic: 'Antifungal Lotion', strengths: ['1%'], cat: 'lotion' },
      { generic: 'Moisturizing Lotion', strengths: ['heavy'], cat: 'lotion' },
      { generic: 'Insect Repellent Lotion', strengths: ['5%'], cat: 'lotion' },

      // Mouthwashes (5 drugs)
      { generic: 'Chlorhexidine', strengths: ['0.12%', '0.2%'], cat: 'mouthwash' },
      { generic: 'Povidone Iodine', strengths: ['1%'], cat: 'mouthwash' },
      { generic: 'Hydrogen Peroxide', strengths: ['1.5%'], cat: 'mouthwash' },
      { generic: 'Fluoride Mouthwash', strengths: ['0.05%'], cat: 'mouthwash' },
      { generic: 'Herbal Mouthwash', strengths: ['regular'], cat: 'mouthwash' },

      // Dental Products (6 drugs)
      { generic: 'Fluoride Toothpaste', strengths: ['1000ppm', '1500ppm'], cat: 'dental' },
      { generic: 'Desensitizing Toothpaste', strengths: ['regular'], cat: 'dental' },
      { generic: 'Whitening Gel', strengths: ['15%', '35%'], cat: 'dental' },
      { generic: 'Tooth Repair Gel', strengths: ['regular'], cat: 'dental' },
      { generic: 'Gum Care Gel', strengths: ['regular'], cat: 'dental' },
      { generic: 'Mint Dental Spray', strengths: ['regular'], cat: 'dental' },

      // Baby Care (8 drugs)
      { generic: 'Baby Powder', strengths: ['talc-free'], cat: 'baby care' },
      { generic: 'Diaper Rash Cream', strengths: ['10%'], cat: 'baby care' },
      { generic: 'Baby Oil', strengths: ['mineral'], cat: 'baby care' },
      { generic: 'Baby Soap', strengths: ['mild'], cat: 'baby care' },
      { generic: 'Baby Lotion', strengths: ['regular'], cat: 'baby care' },
      { generic: 'Baby Shampoo', strengths: ['tear-free'], cat: 'baby care' },
      { generic: 'Baby Wipes', strengths: ['fragrance-free'], cat: 'baby care' },
      { generic: 'Teething Gel', strengths: ['7.5%'], cat: 'baby care' },

      // Surgical Items (6 drugs)
      { generic: 'Sterile Gauze', strengths: ['2x2', '4x4', '8x8'], cat: 'surgical' },
      { generic: 'Medical Tape', strengths: ['1 inch', '2 inch'], cat: 'surgical' },
      { generic: 'Sterile Gloves', strengths: ['size S', 'size M', 'size L', 'size XL'], cat: 'surgical' },
      { generic: 'Antiseptic Wipes', strengths: ['70% alcohol'], cat: 'surgical' },
      { generic: 'Surgical Face Mask', strengths: ['3-ply'], cat: 'surgical' },
      { generic: 'Bandages', strengths: ['elastic', 'non-elastic'], cat: 'surgical' },

      // Medical Devices (6 drugs)
      { generic: 'Digital Thermometer', strengths: ['regular'], cat: 'device' },
      { generic: 'Blood Pressure Monitor', strengths: ['digital'], cat: 'device' },
      { generic: 'Glucometer', strengths: ['digital'], cat: 'device' },
      { generic: 'Oximeter', strengths: ['digital'], cat: 'device' },
      { generic: 'Digital Scale', strengths: ['capacity 180kg'], cat: 'device' },
      { generic: 'Nebulizer', strengths: ['compressor type'], cat: 'device' },

      // Ayurvedic (10 drugs)
      { generic: 'Ashwagandha', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Brahmi', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Tulsi', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Neem', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Turmeric', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Ginger', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Triphala', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Giloy', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Shilajit', strengths: ['100mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Chyawanprash', strengths: ['500g', '1kg'], cat: 'ayurvedic' },

      // Homeopathic (10 drugs)
      { generic: 'Arnica Montana', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Belladonna', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Sulphur', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Hepar Sulphur', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Calcarea Carb', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Silicea', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Pulsatilla', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Lycopodium', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Sepia', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Nux Vomica', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
    ];

    const manufacturers = [
      'Cipla', 'Sun Pharma', 'Dr Reddys', 'Lupin', 'Aurobindo', 'Zydus Cadila',
      'Torrent', 'Alkem', 'Glenmark', 'IPCA Labs', 'Intas', 'Mankind',
      'Macleods', 'Abbott India', 'Piramal', 'Biocon', 'Natco', 'Hetero',
      'Laurus Labs', 'Strides', 'Wockhardt', 'Alembic', 'Granules India',
      'Divis Labs', 'Ajanta Pharma', 'Eris Lifesciences', 'Pfizer India',
      'Sanofi India', 'Bayer India', 'Novo Nordisk', 'AstraZeneca', 'Boehringer Ingelheim',
      'Merck', 'Johnson & Johnson', 'Roche', 'Novartis', 'GSK', 'Glaxo',
      'MSD', 'Cadila', 'Sandoz', 'Mylan', 'Ranbaxy', 'Orchid Chemicals',
      'Medpharma', 'FDC', 'Aristo', 'Reddy Labs', 'Windlas', 'Lyka Labs',
      'Shilpa Medicare', 'Hikma', 'Micro Labs', 'Baxter', 'USV', 'Teva',
    ];

    const medicines = [];

    // Generate medicines systematically: each generic × manufacturers × strengths × pack sizes
    let medicineId = 0;
    for (const drug of genericDrugs) {
      for (const mfr of manufacturers) {
        for (const str of drug.strengths) {
          for (const packSize of [10, 20, 30, 50, 100]) {
            medicineId++;

            // Generate realistic brand name
            const mfrPrefix = mfr.substring(0, 4).toUpperCase();
            const genericShort = drug.generic.substring(0, 5);
            const brandName = `${mfrPrefix}-${genericShort} ${str}`;

            // Calculate realistic MRP based on strength
            const baseMrp = Math.floor(Math.random() * 150) + 30;
            const strengthMultiplier = parseInt(str.match(/\d+/)?.[0]) / 100;
            const mrp = Math.max(Math.floor(baseMrp * (1 + strengthMultiplier * 0.5)), 10);

            medicines.push({
              name: brandName,
              generic_name: drug.generic,
              manufacturer: mfr,
              category: drug.cat,
              composition: drug.generic,
              strength: str,
              pack_size: packSize,
              mrp: mrp,
              is_prescription_required: ['tablet', 'capsule', 'injection'].includes(drug.cat),
              is_chronic: ['tablet', 'capsule'].includes(drug.cat) && Math.random() > 0.6,
              is_controlled: false,
            });

            // Stop when we reach target
            if (medicines.length >= remainingNeeded) break;
          }
          if (medicines.length >= remainingNeeded) break;
        }
        if (medicines.length >= remainingNeeded) break;
      }
      if (medicines.length >= remainingNeeded) break;
    }

    console.log(`Generated ${medicines.length} medicines for insertion`);

    // Batch insert with 500-item batches
    const batchSize = 500;
    let inserted = 0;
    let skipped = 0;
    const startTime = Date.now();

    for (let i = 0; i < medicines.length; i += batchSize) {
      const batch = medicines.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(medicines.length / batchSize);

      // Build single INSERT statement for entire batch
      const values = batch
        .map((med, idx) => {
          const offset = idx * 11;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`;
        })
        .join(',');

      const params = batch.flatMap(med => [
        med.name,
        med.generic_name,
        med.manufacturer,
        med.category,
        med.composition,
        med.strength,
        med.pack_size,
        med.mrp,
        med.is_prescription_required,
        med.is_chronic,
        med.is_controlled,
      ]);

      try {
        await query(
          `INSERT INTO medicines (name, generic_name, manufacturer, category, composition, strength, pack_size, mrp, is_prescription_required, is_chronic, is_controlled)
           VALUES ${values}
           ON CONFLICT(name) DO NOTHING`,
          params,
        );
        inserted += batch.length;
        console.log(`Batch ${batchNum}/${totalBatches} inserted (${inserted}/${medicines.length})`);
      } catch (err) {
        console.error(`Batch ${batchNum} error:`, err.message);
        skipped += batch.length;
      }
    }

    const finalCount = await getOne('SELECT COUNT(*) as total FROM medicines');
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`Bulk seed complete in ${duration}s: ${inserted} inserted, ${skipped} skipped`);
    res.json({
      message: 'Bulk seed complete',
      inserted,
      skipped,
      totalInDatabase: parseInt(finalCount?.total || 0),
      durationSeconds: parseFloat(duration),
    });
  } catch (error) {
    console.error('Bulk seed error:', error);
    res.status(500).json({ error: 'Bulk seed failed: ' + error.message });
  }
});

module.exports = router;
const express = require('express');
const { getOne, getMany, query } = require('../models');

const router = express.Router();

// Search medicines by name - improved with ILIKE fallback
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }

    const searchTerm = q.trim();
    const searchLimit = Math.min(parseInt(limit) || 20, 100);
    const searchOffset = parseInt(offset) || 0;

    // Use ILIKE for broader matching (works better with Indian brand names)
    const medicines = await getMany(
      `SELECT id, name, generic_name, manufacturer, category, strength,
              pack_size, mrp, is_prescription_required, is_chronic
       FROM medicines
       WHERE name ILIKE $1
          OR generic_name ILIKE $1
          OR manufacturer ILIKE $1
       ORDER BY
         CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END,
         name ASC
       LIMIT $3 OFFSET $4`,
      [`%${searchTerm}%`, `${searchTerm}%`, searchLimit, searchOffset],
    );

    // Get total count for pagination
    const countResult = await getOne(
      `SELECT COUNT(*) as total FROM medicines
       WHERE name ILIKE $1 OR generic_name ILIKE $1 OR manufacturer ILIKE $1`,
      [`%${searchTerm}%`],
    );

    res.json({
      medicines,
      count: medicines.length,
      total: parseInt(countResult?.total || 0),
      offset: searchOffset,
      limit: searchLimit,
    });
  } catch (error) {
    console.error('Search medicines error:', error);
    res.status(500).json({ error: 'Failed to search medicines' });
  }
});

// Browse medicines by category
router.get('/browse', async (req, res) => {
  try {
    const { category, limit = 50, offset = 0 } = req.query;

    let whereClause = '';
    const params = [];
    let paramIdx = 1;

    if (category && category !== 'all') {
      whereClause = `WHERE category = $${paramIdx}`;
      params.push(category);
      paramIdx++;
    }

    params.push(Math.min(parseInt(limit) || 50, 100));
    params.push(parseInt(offset) || 0);

    const medicines = await getMany(
      `SELECT id, name, generic_name, manufacturer, category, strength,
              pack_size, mrp, is_prescription_required, is_chronic
       FROM medicines ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params,
    );

    const countResult = await getOne(
      `SELECT COUNT(*) as total FROM medicines ${whereClause}`,
      category && category !== 'all' ? [category] : [],
    );

    // Get all categories
    const categories = await getMany(
      `SELECT DISTINCT category, COUNT(*) as count
       FROM medicines GROUP BY category ORDER BY category`,
    );

    res.json({
      medicines,
      count: medicines.length,
      total: parseInt(countResult?.total || 0),
      categories,
    });
  } catch (error) {
    console.error('Browse medicines error:', error);
    res.status(500).json({ error: 'Failed to browse medicines' });
  }
});

// Get medicine details with alternatives
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await getOne(
      `SELECT id, name, generic_name, manufacturer, category, composition,
              strength, pack_size, mrp, is_prescription_required, is_chronic,
              is_controlled, alternative_ids, created_at
       FROM medicines WHERE id = $1`,
      [id],
    );

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    // Get alternatives
    let alternatives = [];
    if (medicine.alternative_ids && medicine.alternative_ids.length > 0) {
      alternatives = await getMany(
        `SELECT id, name, generic_name, strength, mrp
         FROM medicines
         WHERE id = ANY($1)`,
        [medicine.alternative_ids],
      );
    }

    res.json({
      medicine,
      alternatives,
    });
  } catch (error) {
    console.error('Get medicine detail error:', error);
    res.status(500).json({ error: 'Failed to fetch medicine' });
  }
});

// Seed medicines endpoint (for populating the database)
router.post('/seed', async (req, res) => {
  try {
    const { secret } = req.body;

    // Simple secret check to prevent abuse
    if (secret !== 'rxmax-seed-2026') {
      return res.status(403).json({ error: 'Invalid seed secret' });
    }

    // Check current count
    const countResult = await getOne('SELECT COUNT(*) as total FROM medicines');
    const currentCount = parseInt(countResult?.total || 0);

    if (currentCount > 500) {
      return res.json({
        message: `Database already has ${currentCount} medicines. Skipping seed.`,
        count: currentCount,
      });
    }

    console.log('Starting medicine seed...');

    // Comprehensive Indian pharmacy brand database
    const medicines = generateMedicineDatabase();

    let inserted = 0;
    let skipped = 0;
    const batchSize = 50;

    for (let i = 0; i < medicines.length; i += batchSize) {
      const batch = medicines.slice(i, i + batchSize);

      for (const med of batch) {
        try {
          await query(
            `INSERT INTO medicines (name, generic_name, manufacturer, category, composition, strength, pack_size, mrp, is_prescription_required, is_chronic, is_controlled)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT DO NOTHING`,
            [
              med.name,
              med.generic_name,
              med.manufacturer,
              med.category,
              med.composition || med.generic_name,
              med.strength,
              med.pack_size,
              med.mrp,
              med.is_prescription_required || false,
              med.is_chronic || false,
              med.is_controlled || false,
            ],
          );
          inserted++;
        } catch (err) {
          skipped++;
        }
      }
    }

    const finalCount = await getOne('SELECT COUNT(*) as total FROM medicines');

    console.log(`Seed complete: ${inserted} inserted, ${skipped} skipped`);
    res.json({
      message: 'Seed complete',
      inserted,
      skipped,
      totalInDatabase: parseInt(finalCount?.total || 0),
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Seed failed: ' + error.message });
  }
});

function generateMedicineDatabase() {
  const medicines = [];

  // ===== REAL INDIAN BRAND NAMES =====
  const brands = [
    // Pain Relief & Anti-inflammatory
    { name: 'Dolo 650', generic: 'Paracetamol', mfr: 'Micro Labs', cat: 'tablet', str: '650mg', ps: '15 tablets', mrp: 32, rx: false },
    { name: 'Crocin Advance', generic: 'Paracetamol', mfr: 'GSK', cat: 'tablet', str: '500mg', ps: '15 tablets', mrp: 28, rx: false },
    { name: 'Calpol 500', generic: 'Paracetamol', mfr: 'GSK', cat: 'tablet', str: '500mg', ps: '15 tablets', mrp: 20, rx: false },
    { name: 'Combiflam', generic: 'Ibuprofen + Paracetamol', mfr: 'Sanofi', cat: 'tablet', str: '400mg+325mg', ps: '20 tablets', mrp: 42, rx: false },
    { name: 'Ibugesic Plus', generic: 'Ibuprofen + Paracetamol', mfr: 'Cipla', cat: 'tablet', str: '400mg+325mg', ps: '10 tablets', mrp: 28, rx: false },
    { name: 'Zerodol SP', generic: 'Aceclofenac + Paracetamol + Serratiopeptidase', mfr: 'IPCA Labs', cat: 'tablet', str: '100mg+325mg+15mg', ps: '10 tablets', mrp: 125, rx: true },
    { name: 'Zerodol P', generic: 'Aceclofenac + Paracetamol', mfr: 'IPCA Labs', cat: 'tablet', str: '100mg+325mg', ps: '10 tablets', mrp: 68, rx: true },
    { name: 'Hifenac P', generic: 'Aceclofenac + Paracetamol', mfr: 'Intas', cat: 'tablet', str: '100mg+325mg', ps: '10 tablets', mrp: 65, rx: true },
    { name: 'Voveran SR 100', generic: 'Diclofenac Sodium', mfr: 'Novartis', cat: 'tablet', str: '100mg', ps: '10 tablets', mrp: 48, rx: true },
    { name: 'Voveran 50', generic: 'Diclofenac Sodium', mfr: 'Novartis', cat: 'tablet', str: '50mg', ps: '15 tablets', mrp: 22, rx: true },
    { name: 'Nimesulide', generic: 'Nimesulide', mfr: 'Various', cat: 'tablet', str: '100mg', ps: '10 tablets', mrp: 30, rx: true },
    { name: 'Nise', generic: 'Nimesulide', mfr: 'Dr Reddys', cat: 'tablet', str: '100mg', ps: '10 tablets', mrp: 35, rx: true },
    { name: 'Flexon', generic: 'Ibuprofen + Paracetamol', mfr: 'Aristo', cat: 'tablet', str: '400mg+325mg', ps: '10 tablets', mrp: 25, rx: false },
    { name: 'Saridon', generic: 'Propyphenazone + Paracetamol + Caffeine', mfr: 'Bayer', cat: 'tablet', str: '150mg+250mg+50mg', ps: '10 tablets', mrp: 30, rx: false },
    { name: 'Disprin', generic: 'Aspirin', mfr: 'Reckitt', cat: 'tablet', str: '350mg', ps: '10 tablets', mrp: 9, rx: false },

    // Antibiotics
    { name: 'Augmentin 625 Duo', generic: 'Amoxicillin + Clavulanate', mfr: 'GSK', cat: 'tablet', str: '500mg+125mg', ps: '10 tablets', mrp: 225, rx: true },
    { name: 'Moxikind CV 625', generic: 'Amoxicillin + Clavulanate', mfr: 'Mankind', cat: 'tablet', str: '500mg+125mg', ps: '10 tablets', mrp: 175, rx: true },
    { name: 'Azithral 500', generic: 'Azithromycin', mfr: 'Alembic', cat: 'tablet', str: '500mg', ps: '3 tablets', mrp: 95, rx: true },
    { name: 'Zithromax 500', generic: 'Azithromycin', mfr: 'Pfizer', cat: 'tablet', str: '500mg', ps: '3 tablets', mrp: 140, rx: true },
    { name: 'Azee 500', generic: 'Azithromycin', mfr: 'Cipla', cat: 'tablet', str: '500mg', ps: '3 tablets', mrp: 78, rx: true },
    { name: 'Ciplox 500', generic: 'Ciprofloxacin', mfr: 'Cipla', cat: 'tablet', str: '500mg', ps: '10 tablets', mrp: 68, rx: true },
    { name: 'Cifran 500', generic: 'Ciprofloxacin', mfr: 'Sun Pharma', cat: 'tablet', str: '500mg', ps: '10 tablets', mrp: 72, rx: true },
    { name: 'Zifi 200', generic: 'Cefixime', mfr: 'FDC', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 175, rx: true },
    { name: 'Taxim-O 200', generic: 'Cefixime', mfr: 'Alkem', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 180, rx: true },
    { name: 'Monocef 200', generic: 'Cefixime', mfr: 'Aristo', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 165, rx: true },
    { name: 'Cefakind 500', generic: 'Cephalexin', mfr: 'Mankind', cat: 'capsule', str: '500mg', ps: '10 capsules', mrp: 120, rx: true },
    { name: 'Oflox 200', generic: 'Ofloxacin', mfr: 'Cipla', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 55, rx: true },
    { name: 'Levoflox 500', generic: 'Levofloxacin', mfr: 'Cipla', cat: 'tablet', str: '500mg', ps: '5 tablets', mrp: 72, rx: true },
    { name: 'Norflox 400', generic: 'Norfloxacin', mfr: 'Cipla', cat: 'tablet', str: '400mg', ps: '10 tablets', mrp: 45, rx: true },
    { name: 'Doxycycline 100', generic: 'Doxycycline', mfr: 'Various', cat: 'capsule', str: '100mg', ps: '10 capsules', mrp: 48, rx: true },
    { name: 'Metrogyl 400', generic: 'Metronidazole', mfr: 'J&J', cat: 'tablet', str: '400mg', ps: '15 tablets', mrp: 20, rx: true },

    // Diabetes
    { name: 'Glycomet GP 1', generic: 'Metformin + Glimepiride', mfr: 'USV', cat: 'tablet', str: '500mg+1mg', ps: '15 tablets', mrp: 105, rx: true, chronic: true },
    { name: 'Glycomet GP 2', generic: 'Metformin + Glimepiride', mfr: 'USV', cat: 'tablet', str: '500mg+2mg', ps: '15 tablets', mrp: 130, rx: true, chronic: true },
    { name: 'Glycomet 500', generic: 'Metformin', mfr: 'USV', cat: 'tablet', str: '500mg', ps: '20 tablets', mrp: 30, rx: true, chronic: true },
    { name: 'Glycomet 850', generic: 'Metformin', mfr: 'USV', cat: 'tablet', str: '850mg', ps: '10 tablets', mrp: 22, rx: true, chronic: true },
    { name: 'Glycomet 1000 SR', generic: 'Metformin SR', mfr: 'USV', cat: 'tablet', str: '1000mg', ps: '15 tablets', mrp: 85, rx: true, chronic: true },
    { name: 'Amaryl M 1', generic: 'Glimepiride + Metformin', mfr: 'Sanofi', cat: 'tablet', str: '1mg+500mg', ps: '15 tablets', mrp: 160, rx: true, chronic: true },
    { name: 'Amaryl M 2', generic: 'Glimepiride + Metformin', mfr: 'Sanofi', cat: 'tablet', str: '2mg+500mg', ps: '15 tablets', mrp: 185, rx: true, chronic: true },
    { name: 'Janumet 50/500', generic: 'Sitagliptin + Metformin', mfr: 'MSD', cat: 'tablet', str: '50mg+500mg', ps: '7 tablets', mrp: 325, rx: true, chronic: true },
    { name: 'Galvus Met 50/500', generic: 'Vildagliptin + Metformin', mfr: 'Novartis', cat: 'tablet', str: '50mg+500mg', ps: '10 tablets', mrp: 280, rx: true, chronic: true },
    { name: 'Jardiance 10', generic: 'Empagliflozin', mfr: 'Boehringer', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 520, rx: true, chronic: true },
    { name: 'Trajenta 5', generic: 'Linagliptin', mfr: 'Boehringer', cat: 'tablet', str: '5mg', ps: '10 tablets', mrp: 475, rx: true, chronic: true },
    { name: 'Gluformin 500', generic: 'Metformin', mfr: 'Mankind', cat: 'tablet', str: '500mg', ps: '20 tablets', mrp: 25, rx: true, chronic: true },
    { name: 'Obimet 500', generic: 'Metformin', mfr: 'Zydus', cat: 'tablet', str: '500mg', ps: '20 tablets', mrp: 28, rx: true, chronic: true },

    // Cardiovascular / BP
    { name: 'Telma 40', generic: 'Telmisartan', mfr: 'Glenmark', cat: 'tablet', str: '40mg', ps: '15 tablets', mrp: 135, rx: true, chronic: true },
    { name: 'Telma 80', generic: 'Telmisartan', mfr: 'Glenmark', cat: 'tablet', str: '80mg', ps: '15 tablets', mrp: 205, rx: true, chronic: true },
    { name: 'Telma H', generic: 'Telmisartan + HCTZ', mfr: 'Glenmark', cat: 'tablet', str: '40mg+12.5mg', ps: '15 tablets', mrp: 170, rx: true, chronic: true },
    { name: 'Telma AM', generic: 'Telmisartan + Amlodipine', mfr: 'Glenmark', cat: 'tablet', str: '40mg+5mg', ps: '15 tablets', mrp: 185, rx: true, chronic: true },
    { name: 'Amlodac 5', generic: 'Amlodipine', mfr: 'Zydus', cat: 'tablet', str: '5mg', ps: '15 tablets', mrp: 55, rx: true, chronic: true },
    { name: 'Amlong 5', generic: 'Amlodipine', mfr: 'Micro Labs', cat: 'tablet', str: '5mg', ps: '15 tablets', mrp: 48, rx: true, chronic: true },
    { name: 'Stamlo 5', generic: 'Amlodipine', mfr: 'Dr Reddys', cat: 'tablet', str: '5mg', ps: '15 tablets', mrp: 52, rx: true, chronic: true },
    { name: 'Ecosprin 75', generic: 'Aspirin', mfr: 'USV', cat: 'tablet', str: '75mg', ps: '14 tablets', mrp: 8, rx: false, chronic: true },
    { name: 'Ecosprin 150', generic: 'Aspirin', mfr: 'USV', cat: 'tablet', str: '150mg', ps: '14 tablets', mrp: 10, rx: false, chronic: true },
    { name: 'Ecosprin AV 75/10', generic: 'Aspirin + Atorvastatin', mfr: 'USV', cat: 'capsule', str: '75mg+10mg', ps: '15 capsules', mrp: 95, rx: true, chronic: true },
    { name: 'Atorva 10', generic: 'Atorvastatin', mfr: 'Zydus', cat: 'tablet', str: '10mg', ps: '15 tablets', mrp: 110, rx: true, chronic: true },
    { name: 'Atorva 20', generic: 'Atorvastatin', mfr: 'Zydus', cat: 'tablet', str: '20mg', ps: '15 tablets', mrp: 175, rx: true, chronic: true },
    { name: 'Atorva 40', generic: 'Atorvastatin', mfr: 'Zydus', cat: 'tablet', str: '40mg', ps: '10 tablets', mrp: 195, rx: true, chronic: true },
    { name: 'Lipitor 10', generic: 'Atorvastatin', mfr: 'Pfizer', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 180, rx: true, chronic: true },
    { name: 'Rosuvastatin 10', generic: 'Rosuvastatin', mfr: 'Various', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 120, rx: true, chronic: true },
    { name: 'Rosuvas 10', generic: 'Rosuvastatin', mfr: 'Sun Pharma', cat: 'tablet', str: '10mg', ps: '15 tablets', mrp: 210, rx: true, chronic: true },
    { name: 'Clopitab A 75/75', generic: 'Clopidogrel + Aspirin', mfr: 'Lupin', cat: 'tablet', str: '75mg+75mg', ps: '15 tablets', mrp: 82, rx: true, chronic: true },
    { name: 'Clopilet A 75', generic: 'Clopidogrel + Aspirin', mfr: 'Sun Pharma', cat: 'tablet', str: '75mg+75mg', ps: '15 tablets', mrp: 85, rx: true, chronic: true },
    { name: 'Metoprolol 25', generic: 'Metoprolol', mfr: 'Various', cat: 'tablet', str: '25mg', ps: '10 tablets', mrp: 30, rx: true, chronic: true },
    { name: 'Met XL 25', generic: 'Metoprolol Succinate', mfr: 'Cipla', cat: 'tablet', str: '25mg', ps: '15 tablets', mrp: 68, rx: true, chronic: true },
    { name: 'Concor 5', generic: 'Bisoprolol', mfr: 'Merck', cat: 'tablet', str: '5mg', ps: '14 tablets', mrp: 135, rx: true, chronic: true },
    { name: 'Envas 5', generic: 'Enalapril', mfr: 'Cadila', cat: 'tablet', str: '5mg', ps: '14 tablets', mrp: 35, rx: true, chronic: true },
    { name: 'Losar 50', generic: 'Losartan', mfr: 'Unichem', cat: 'tablet', str: '50mg', ps: '10 tablets', mrp: 42, rx: true, chronic: true },

    // Gastro / Acidity
    { name: 'Pan 40', generic: 'Pantoprazole', mfr: 'Alkem', cat: 'tablet', str: '40mg', ps: '15 tablets', mrp: 88, rx: true },
    { name: 'Pan-D', generic: 'Pantoprazole + Domperidone', mfr: 'Alkem', cat: 'capsule', str: '40mg+30mg', ps: '15 capsules', mrp: 120, rx: true },
    { name: 'Rantac 150', generic: 'Ranitidine', mfr: 'J&J', cat: 'tablet', str: '150mg', ps: '30 tablets', mrp: 30, rx: false },
    { name: 'Omez 20', generic: 'Omeprazole', mfr: 'Dr Reddys', cat: 'capsule', str: '20mg', ps: '15 capsules', mrp: 62, rx: true },
    { name: 'Omez D', generic: 'Omeprazole + Domperidone', mfr: 'Dr Reddys', cat: 'capsule', str: '20mg+10mg', ps: '15 capsules', mrp: 95, rx: true },
    { name: 'Rablet 20', generic: 'Rabeprazole', mfr: 'Lupin', cat: 'tablet', str: '20mg', ps: '10 tablets', mrp: 85, rx: true },
    { name: 'Nexpro RD 40', generic: 'Esomeprazole + Domperidone', mfr: 'Torrent', cat: 'capsule', str: '40mg+30mg', ps: '15 capsules', mrp: 175, rx: true },
    { name: 'Gelusil MPS', generic: 'Aluminium Hydroxide + Magnesium', mfr: 'Pfizer', cat: 'syrup', str: '250ml', ps: '1 bottle', mrp: 95, rx: false },
    { name: 'Digene', generic: 'Antacid Gel', mfr: 'Abbott', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 82, rx: false },
    { name: 'Mucaine Gel', generic: 'Antacid + Oxethazaine', mfr: 'Abbott', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 110, rx: false },

    // Vitamins & Supplements
    { name: 'Shelcal 500', generic: 'Calcium + Vitamin D3', mfr: 'Torrent', cat: 'tablet', str: '500mg+250IU', ps: '15 tablets', mrp: 105, rx: false },
    { name: 'Shelcal HD', generic: 'Calcium + Vitamin D3', mfr: 'Torrent', cat: 'tablet', str: '500mg+1000IU', ps: '15 tablets', mrp: 135, rx: false },
    { name: 'Calcimax 500', generic: 'Calcium + Vitamin D3', mfr: 'Meyer', cat: 'tablet', str: '500mg+250IU', ps: '15 tablets', mrp: 98, rx: false },
    { name: 'Becosules Z', generic: 'B-Complex + Zinc', mfr: 'Pfizer', cat: 'capsule', str: 'Multivitamin', ps: '20 capsules', mrp: 45, rx: false },
    { name: 'Becosules', generic: 'B-Complex', mfr: 'Pfizer', cat: 'capsule', str: 'Multivitamin', ps: '20 capsules', mrp: 35, rx: false },
    { name: 'Supradyn', generic: 'Multivitamin + Minerals', mfr: 'Bayer', cat: 'tablet', str: 'Multivitamin', ps: '15 tablets', mrp: 48, rx: false },
    { name: 'Revital H', generic: 'Multivitamin + Ginseng', mfr: 'Sun Pharma', cat: 'capsule', str: 'Multivitamin', ps: '30 capsules', mrp: 280, rx: false },
    { name: 'Zincovit', generic: 'Zinc + Multivitamin', mfr: 'Apex', cat: 'tablet', str: 'Multivitamin', ps: '15 tablets', mrp: 72, rx: false },
    { name: 'Limcee 500', generic: 'Vitamin C', mfr: 'Abbott', cat: 'tablet', str: '500mg', ps: '15 tablets', mrp: 25, rx: false },
    { name: 'Evion 400', generic: 'Vitamin E', mfr: 'Merck', cat: 'capsule', str: '400mg', ps: '10 capsules', mrp: 42, rx: false },
    { name: 'Neurobion Forte', generic: 'Vitamin B1 + B6 + B12', mfr: 'Merck', cat: 'tablet', str: 'B-Complex', ps: '30 tablets', mrp: 58, rx: false },
    { name: 'Folvite 5', generic: 'Folic Acid', mfr: 'Pfizer', cat: 'tablet', str: '5mg', ps: '45 tablets', mrp: 22, rx: false },
    { name: 'Feronia XT', generic: 'Ferrous Ascorbate + Folic Acid', mfr: 'Piramal', cat: 'tablet', str: '100mg+1.5mg', ps: '10 tablets', mrp: 115, rx: false },
    { name: 'Autrin', generic: 'Iron + Folic Acid + B12', mfr: 'Zydus', cat: 'capsule', str: 'Iron Complex', ps: '10 capsules', mrp: 48, rx: false },
    { name: 'D-Rise 60K', generic: 'Cholecalciferol', mfr: 'USV', cat: 'capsule', str: '60000IU', ps: '4 capsules', mrp: 120, rx: false },
    { name: 'Uprise D3 60K', generic: 'Cholecalciferol', mfr: 'Alkem', cat: 'capsule', str: '60000IU', ps: '4 capsules', mrp: 125, rx: false },
    { name: 'Calcirol D3', generic: 'Cholecalciferol', mfr: 'Cadila', cat: 'capsule', str: '60000IU', ps: '4 capsules', mrp: 110, rx: false },

    // Respiratory / Cough & Cold
    { name: 'Montair LC', generic: 'Montelukast + Levocetirizine', mfr: 'Cipla', cat: 'tablet', str: '10mg+5mg', ps: '15 tablets', mrp: 175, rx: true },
    { name: 'Montek LC', generic: 'Montelukast + Levocetirizine', mfr: 'Sun Pharma', cat: 'tablet', str: '10mg+5mg', ps: '15 tablets', mrp: 165, rx: true },
    { name: 'Sinarest', generic: 'Paracetamol + Phenylephrine + CPM', mfr: 'Centaur', cat: 'tablet', str: 'Combination', ps: '10 tablets', mrp: 28, rx: false },
    { name: 'Alex', generic: 'Dextromethorphan + CPM', mfr: 'Glenmark', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 72, rx: false },
    { name: 'Benadryl', generic: 'Diphenhydramine', mfr: 'J&J', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 82, rx: false },
    { name: 'Grilinctus BM', generic: 'Bromhexine + Guaifenesin + Menthol', mfr: 'Franco Indian', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 65, rx: false },
    { name: 'Ascoril LS', generic: 'Ambroxol + Levosalbutamol + Guaifenesin', mfr: 'Glenmark', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 98, rx: true },
    { name: 'Chericof', generic: 'Dextromethorphan + CPM', mfr: 'Cipla', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 55, rx: false },
    { name: 'Cetrizine', generic: 'Cetirizine', mfr: 'Various', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 15, rx: false },
    { name: 'Allegra 120', generic: 'Fexofenadine', mfr: 'Sanofi', cat: 'tablet', str: '120mg', ps: '10 tablets', mrp: 165, rx: true },
    { name: 'Levocet', generic: 'Levocetirizine', mfr: 'Sun Pharma', cat: 'tablet', str: '5mg', ps: '10 tablets', mrp: 35, rx: false },
    { name: 'Deriphyllin', generic: 'Theophylline + Etophylline', mfr: 'Abbott', cat: 'tablet', str: '150mg+50mg', ps: '15 tablets', mrp: 40, rx: true },
    { name: 'Foracort 200', generic: 'Formoterol + Budesonide', mfr: 'Cipla', cat: 'inhaler', str: '6mcg+200mcg', ps: '120 doses', mrp: 420, rx: true, chronic: true },
    { name: 'Seroflo 250', generic: 'Salmeterol + Fluticasone', mfr: 'Cipla', cat: 'inhaler', str: '25mcg+250mcg', ps: '120 doses', mrp: 485, rx: true, chronic: true },
    { name: 'Budecort 200', generic: 'Budesonide', mfr: 'Cipla', cat: 'inhaler', str: '200mcg', ps: '200 doses', mrp: 250, rx: true, chronic: true },
    { name: 'Asthalin Inhaler', generic: 'Salbutamol', mfr: 'Cipla', cat: 'inhaler', str: '100mcg', ps: '200 doses', mrp: 125, rx: true },
    { name: 'Duolin Inhaler', generic: 'Levosalbutamol + Ipratropium', mfr: 'Cipla', cat: 'inhaler', str: '50mcg+20mcg', ps: '200 doses', mrp: 175, rx: true },

    // Anti-allergic / Skin
    { name: 'Avil 25', generic: 'Pheniramine', mfr: 'Sanofi', cat: 'tablet', str: '25mg', ps: '10 tablets', mrp: 12, rx: false },
    { name: 'Betnovate C', generic: 'Betamethasone + Clioquinol', mfr: 'GSK', cat: 'cream', str: '20g', ps: '1 tube', mrp: 62, rx: true },
    { name: 'Betnovate N', generic: 'Betamethasone + Neomycin', mfr: 'GSK', cat: 'cream', str: '20g', ps: '1 tube', mrp: 58, rx: true },
    { name: 'Candid B', generic: 'Clotrimazole + Beclometasone', mfr: 'Glenmark', cat: 'cream', str: '15g', ps: '1 tube', mrp: 78, rx: true },
    { name: 'Candid Cream', generic: 'Clotrimazole', mfr: 'Glenmark', cat: 'cream', str: '15g', ps: '1 tube', mrp: 55, rx: false },
    { name: 'Clobetasol Cream', generic: 'Clobetasol', mfr: 'Various', cat: 'cream', str: '30g', ps: '1 tube', mrp: 85, rx: true },
    { name: 'Soframycin', generic: 'Framycetin', mfr: 'Sanofi', cat: 'cream', str: '30g', ps: '1 tube', mrp: 65, rx: false },
    { name: 'Boroline', generic: 'Antiseptic Cream', mfr: 'GD Pharma', cat: 'cream', str: '20g', ps: '1 tube', mrp: 35, rx: false },
    { name: 'Panderm Plus', generic: 'Clobetasol + Ofloxacin + Miconazole + Zinc', mfr: 'Macleods', cat: 'cream', str: '15g', ps: '1 tube', mrp: 110, rx: true },
    { name: 'Fluconazole 150', generic: 'Fluconazole', mfr: 'Various', cat: 'capsule', str: '150mg', ps: '1 capsule', mrp: 15, rx: true },

    // Thyroid
    { name: 'Thyronorm 25', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '25mcg', ps: '100 tablets', mrp: 110, rx: true, chronic: true },
    { name: 'Thyronorm 50', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '50mcg', ps: '100 tablets', mrp: 130, rx: true, chronic: true },
    { name: 'Thyronorm 75', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '75mcg', ps: '100 tablets', mrp: 145, rx: true, chronic: true },
    { name: 'Thyronorm 100', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '100mcg', ps: '100 tablets', mrp: 160, rx: true, chronic: true },
    { name: 'Eltroxin 50', generic: 'Levothyroxine', mfr: 'GSK', cat: 'tablet', str: '50mcg', ps: '100 tablets', mrp: 95, rx: true, chronic: true },
    { name: 'Eltroxin 100', generic: 'Levothyroxine', mfr: 'GSK', cat: 'tablet', str: '100mcg', ps: '100 tablets', mrp: 135, rx: true, chronic: true },

    // Chymoral / Enzymes
    { name: 'Chymoral Forte', generic: 'Trypsin + Chymotrypsin', mfr: 'Torrent', cat: 'tablet', str: '100000AU', ps: '10 tablets', mrp: 135, rx: true },
    { name: 'Unienzyme', generic: 'Digestive Enzyme + Charcoal', mfr: 'Unichem', cat: 'tablet', str: 'Enzyme Complex', ps: '15 tablets', mrp: 28, rx: false },
    { name: 'Aristozyme', generic: 'Digestive Enzyme + Fungal Diastase', mfr: 'Aristo', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 92, rx: false },
    { name: 'Vitazyme', generic: 'Digestive Enzyme', mfr: 'East India', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 68, rx: false },

    // Anti-anxiety / Sleep
    { name: 'Alprazolam 0.25', generic: 'Alprazolam', mfr: 'Various', cat: 'tablet', str: '0.25mg', ps: '10 tablets', mrp: 22, rx: true, controlled: true },
    { name: 'Restyl 0.5', generic: 'Alprazolam', mfr: 'Intas', cat: 'tablet', str: '0.5mg', ps: '10 tablets', mrp: 28, rx: true, controlled: true },
    { name: 'Etizola 0.5', generic: 'Etizolam', mfr: 'Sun Pharma', cat: 'tablet', str: '0.5mg', ps: '10 tablets', mrp: 32, rx: true, controlled: true },

    // Eye / Ear Drops
    { name: 'Moxifloxacin Eye Drop', generic: 'Moxifloxacin', mfr: 'Various', cat: 'drops', str: '0.5% 5ml', ps: '1 bottle', mrp: 65, rx: true },
    { name: 'Gentamicin Eye Drop', generic: 'Gentamicin', mfr: 'Various', cat: 'drops', str: '0.3% 10ml', ps: '1 bottle', mrp: 22, rx: true },
    { name: 'Refresh Tears', generic: 'Carboxymethylcellulose', mfr: 'Allergan', cat: 'drops', str: '0.5% 10ml', ps: '1 bottle', mrp: 125, rx: false },
    { name: 'Itone Eye Drop', generic: 'Herbal Eye Drop', mfr: 'Deys', cat: 'drops', str: '10ml', ps: '1 bottle', mrp: 45, rx: false },

    // Miscellaneous
    { name: 'ORS', generic: 'Oral Rehydration Salts', mfr: 'Various', cat: 'powder', str: '21.8g', ps: '5 sachets', mrp: 20, rx: false },
    { name: 'Electral Powder', generic: 'ORS', mfr: 'FDC', cat: 'powder', str: '21.8g', ps: '4 sachets', mrp: 30, rx: false },
    { name: 'Ondem 4', generic: 'Ondansetron', mfr: 'Alkem', cat: 'tablet', str: '4mg', ps: '10 tablets', mrp: 55, rx: true },
    { name: 'Emeset 4', generic: 'Ondansetron', mfr: 'Cipla', cat: 'tablet', str: '4mg', ps: '10 tablets', mrp: 48, rx: true },
    { name: 'Loperamide', generic: 'Loperamide', mfr: 'Various', cat: 'capsule', str: '2mg', ps: '10 capsules', mrp: 20, rx: false },
    { name: 'Norflox TZ', generic: 'Norfloxacin + Tinidazole', mfr: 'Cipla', cat: 'tablet', str: '400mg+600mg', ps: '10 tablets', mrp: 65, rx: true },
    { name: 'Oflomac TZ', generic: 'Ofloxacin + Tinidazole', mfr: 'Macleods', cat: 'tablet', str: '200mg+600mg', ps: '10 tablets', mrp: 52, rx: true },
    { name: 'Cremaffin', generic: 'Liquid Paraffin + Milk of Magnesia', mfr: 'Abbott', cat: 'syrup', str: '225ml', ps: '1 bottle', mrp: 145, rx: false },
    { name: 'Dulcolax', generic: 'Bisacodyl', mfr: 'Sanofi', cat: 'tablet', str: '5mg', ps: '10 tablets', mrp: 30, rx: false },
    { name: 'Isabgol', generic: 'Psyllium Husk', mfr: 'Various', cat: 'powder', str: '100g', ps: '1 pack', mrp: 60, rx: false },
    { name: 'Volini Gel', generic: 'Diclofenac Gel', mfr: 'Sun Pharma', cat: 'gel', str: '30g', ps: '1 tube', mrp: 85, rx: false },
    { name: 'Moov', generic: 'Diclofenac + Menthol', mfr: 'Reckitt', cat: 'cream', str: '50g', ps: '1 tube', mrp: 120, rx: false },
    { name: 'Iodex', generic: 'Pain Relief Balm', mfr: 'GSK', cat: 'cream', str: '40g', ps: '1 tube', mrp: 75, rx: false },
    { name: 'Burnol', generic: 'Aminacrine + Cetrimide', mfr: 'Dr Morepen', cat: 'cream', str: '20g', ps: '1 tube', mrp: 50, rx: false },
    { name: 'Betadine', generic: 'Povidone Iodine', mfr: 'Win Medicare', cat: 'solution', str: '100ml', ps: '1 bottle', mrp: 75, rx: false },
    { name: 'Dettol Antiseptic', generic: 'Chloroxylenol', mfr: 'Reckitt', cat: 'solution', str: '120ml', ps: '1 bottle', mrp: 85, rx: false },
    { name: 'Strepsils', generic: 'Amylmetacresol + Dichlorbenzyl', mfr: 'Reckitt', cat: 'lozenge', str: '8 lozenges', ps: '1 pack', mrp: 45, rx: false },
    { name: 'Vicks Vaporub', generic: 'Menthol + Camphor + Eucalyptus', mfr: 'P&G', cat: 'ointment', str: '50g', ps: '1 jar', mrp: 105, rx: false },
  ];

  // Convert to proper format
  for (const b of brands) {
    medicines.push({
      name: b.name,
      generic_name: b.generic,
      manufacturer: b.mfr,
      category: b.cat,
      composition: b.generic,
      strength: b.str,
      pack_size: parseInt(b.ps) || 10,
      mrp: b.mrp,
      is_prescription_required: b.rx || false,
      is_chronic: b.chronic || false,
      is_controlled: b.controlled || false,
    });
  }

  // Now generate variants to reach thousands
  const manufacturers = ['Cipla', 'Sun Pharma', 'Dr Reddys', 'Lupin', 'Aurobindo', 'Zydus Cadila', 'Torrent', 'Alkem', 'Glenmark', 'IPCA Labs', 'Intas', 'Mankind', 'Macleods', 'Abbott India', 'Piramal', 'Biocon', 'Natco', 'Hetero', 'Laurus Labs', 'Strides'];

  const genericDrugs = [
    { generic: 'Paracetamol', strengths: ['250mg', '500mg', '650mg', '1000mg'], cat: 'tablet' },
    { generic: 'Ibuprofen', strengths: ['200mg', '400mg', '600mg'], cat: 'tablet' },
    { generic: 'Amoxicillin', strengths: ['250mg', '500mg'], cat: 'capsule' },
    { generic: 'Ciprofloxacin', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
    { generic: 'Azithromycin', strengths: ['250mg', '500mg'], cat: 'tablet' },
    { generic: 'Metformin', strengths: ['250mg', '500mg', '850mg', '1000mg'], cat: 'tablet' },
    { generic: 'Amlodipine', strengths: ['2.5mg', '5mg', '10mg'], cat: 'tablet' },
    { generic: 'Atorvastatin', strengths: ['5mg', '10mg', '20mg', '40mg', '80mg'], cat: 'tablet' },
    { generic: 'Losartan', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Omeprazole', strengths: ['10mg', '20mg', '40mg'], cat: 'capsule' },
    { generic: 'Pantoprazole', strengths: ['20mg', '40mg'], cat: 'tablet' },
    { generic: 'Cetirizine', strengths: ['5mg', '10mg'], cat: 'tablet' },
    { generic: 'Montelukast', strengths: ['4mg', '5mg', '10mg'], cat: 'tablet' },
    { generic: 'Levothyroxine', strengths: ['12.5mcg', '25mcg', '50mcg', '75mcg', '100mcg', '125mcg', '150mcg'], cat: 'tablet' },
    { generic: 'Telmisartan', strengths: ['20mg', '40mg', '80mg'], cat: 'tablet' },
    { generic: 'Rosuvastatin', strengths: ['5mg', '10mg', '20mg', '40mg'], cat: 'tablet' },
    { generic: 'Metoprolol', strengths: ['12.5mg', '25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Clopidogrel', strengths: ['75mg'], cat: 'tablet' },
    { generic: 'Ranitidine', strengths: ['150mg', '300mg'], cat: 'tablet' },
    { generic: 'Rabeprazole', strengths: ['10mg', '20mg'], cat: 'tablet' },
    { generic: 'Cefixime', strengths: ['100mg', '200mg', '400mg'], cat: 'tablet' },
    { generic: 'Levofloxacin', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
    { generic: 'Doxycycline', strengths: ['100mg'], cat: 'capsule' },
    { generic: 'Gabapentin', strengths: ['100mg', '300mg', '400mg', '600mg'], cat: 'capsule' },
    { generic: 'Pregabalin', strengths: ['50mg', '75mg', '150mg', '300mg'], cat: 'capsule' },
    { generic: 'Duloxetine', strengths: ['20mg', '30mg', '60mg'], cat: 'capsule' },
    { generic: 'Escitalopram', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },
    { generic: 'Sertraline', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Fluoxetine', strengths: ['20mg', '40mg', '60mg'], cat: 'capsule' },
    { generic: 'Clonazepam', strengths: ['0.25mg', '0.5mg', '1mg', '2mg'], cat: 'tablet' },
    { generic: 'Prednisolone', strengths: ['5mg', '10mg', '20mg', '40mg'], cat: 'tablet' },
    { generic: 'Deflazacort', strengths: ['6mg', '12mg', '24mg', '30mg'], cat: 'tablet' },
    { generic: 'Aceclofenac', strengths: ['100mg', '200mg'], cat: 'tablet' },
    { generic: 'Etoricoxib', strengths: ['60mg', '90mg', '120mg'], cat: 'tablet' },
    { generic: 'Tramadol', strengths: ['50mg', '100mg'], cat: 'capsule' },
    { generic: 'Tamsulosin', strengths: ['0.2mg', '0.4mg'], cat: 'capsule' },
    { generic: 'Finasteride', strengths: ['1mg', '5mg'], cat: 'tablet' },
    { generic: 'Sildenafil', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Tadalafil', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },
  ];

  // Generate manufacturer variants for each generic
  for (const drug of genericDrugs) {
    for (const mfr of manufacturers.slice(0, 8)) {
      for (const str of drug.strengths) {
        const brandPrefix = mfr.substring(0, 3).toUpperCase();
        medicines.push({
          name: `${brandPrefix}-${drug.generic.substring(0, 6)} ${str}`,
          generic_name: drug.generic,
          manufacturer: mfr,
          category: drug.cat,
          composition: drug.generic,
          strength: str,
          pack_size: 10,
          mrp: Math.floor(Math.random() * 200) + 20,
          is_prescription_required: true,
          is_chronic: false,
          is_controlled: false,
        });
      }
    }
  }

  return medicines;
}

// Bulk seed endpoint for generating 100,000+ medicines
router.post('/seed-bulk', async (req, res) => {
  try {
    const { secret, count = 100000 } = req.body;

    // Simple secret check to prevent abuse
    if (secret !== 'rxmaxadmin2026') {
      return res.status(403).json({ error: 'Invalid seed secret' });
    }

    const targetCount = Math.min(Math.max(parseInt(count) || 100000, 1000), 1000000);
    console.log(`Starting bulk medicine seed for ${targetCount} medicines...`);

    // Get current count
    const countResult = await getOne('SELECT COUNT(*) as total FROM medicines');
    const currentCount = parseInt(countResult?.total || 0);

    if (currentCount >= targetCount) {
      return res.json({
        message: `Database already has ${currentCount} medicines. Target is ${targetCount}. Skipping.`,
        currentCount,
        targetCount,
      });
    }

    const remainingNeeded = targetCount - currentCount;

    // Expanded lists for bulk generation
    const genericDrugs = [
      // Pain Relief (8 drugs)
      { generic: 'Paracetamol', strengths: ['500mg', '650mg'], cat: 'tablet' },
      { generic: 'Ibuprofen', strengths: ['200mg', '400mg', '600mg'], cat: 'tablet' },
      { generic: 'Aspirin', strengths: ['100mg', '300mg', '500mg'], cat: 'tablet' },
      { generic: 'Diclofenac', strengths: ['50mg', '75mg', '100mg'], cat: 'tablet' },
      { generic: 'Naproxen', strengths: ['250mg', '500mg'], cat: 'tablet' },
      { generic: 'Indomethacin', strengths: ['25mg', '50mg', '75mg'], cat: 'tablet' },
      { generic: 'Meloxicam', strengths: ['7.5mg', '15mg'], cat: 'tablet' },
      { generic: 'Piroxicam', strengths: ['10mg', '20mg'], cat: 'tablet' },

      // Antibiotics (12 drugs)
      { generic: 'Amoxicillin', strengths: ['250mg', '500mg', '1000mg'], cat: 'tablet' },
      { generic: 'Azithromycin', strengths: ['250mg', '500mg'], cat: 'tablet' },
      { generic: 'Ciprofloxacin', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
      { generic: 'Cefixime', strengths: ['100mg', '200mg', '400mg'], cat: 'tablet' },
      { generic: 'Cephalexin', strengths: ['250mg', '500mg'], cat: 'capsule' },
      { generic: 'Ofloxacin', strengths: ['100mg', '200mg', '400mg'], cat: 'tablet' },
      { generic: 'Levofloxacin', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
      { generic: 'Erythromycin', strengths: ['250mg', '500mg'], cat: 'tablet' },
      { generic: 'Doxycycline', strengths: ['50mg', '100mg'], cat: 'capsule' },
      { generic: 'Metronidazole', strengths: ['200mg', '400mg'], cat: 'tablet' },
      { generic: 'Norfloxacin', strengths: ['400mg'], cat: 'tablet' },
      { generic: 'Trimethoprim', strengths: ['100mg', '200mg'], cat: 'tablet' },

      // Antacids & GI (8 drugs)
      { generic: 'Omeprazole', strengths: ['10mg', '20mg', '40mg'], cat: 'capsule' },
      { generic: 'Pantoprazole', strengths: ['20mg', '40mg'], cat: 'tablet' },
      { generic: 'Ranitidine', strengths: ['75mg', '150mg', '300mg'], cat: 'tablet' },
      { generic: 'Famotidine', strengths: ['10mg', '20mg', '40mg'], cat: 'tablet' },
      { generic: 'Domperidone', strengths: ['10mg'], cat: 'tablet' },
      { generic: 'Metoclopramide', strengths: ['10mg'], cat: 'tablet' },
      { generic: 'Rauwolfia', strengths: ['100mg', '200mg'], cat: 'tablet' },
      { generic: 'Loperamide', strengths: ['2mg'], cat: 'capsule' },

      // Diabetes (10 drugs)
      { generic: 'Metformin', strengths: ['250mg', '500mg', '850mg', '1000mg'], cat: 'tablet' },
      { generic: 'Glimepiride', strengths: ['1mg', '2mg', '4mg'], cat: 'tablet' },
      { generic: 'Glyburide', strengths: ['1.25mg', '2.5mg', '5mg'], cat: 'tablet' },
      { generic: 'Sitagliptin', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
      { generic: 'Vildagliptin', strengths: ['50mg', '100mg'], cat: 'tablet' },
      { generic: 'Insulin Glargine', strengths: ['100 IU/ml'], cat: 'injection' },
      { generic: 'Insulin NPH', strengths: ['100 IU/ml'], cat: 'injection' },
      { generic: 'Empagliflozin', strengths: ['10mg', '25mg'], cat: 'tablet' },
      { generic: 'Canagliflozin', strengths: ['100mg', '300mg'], cat: 'tablet' },
      { generic: 'Linagliptin', strengths: ['2.5mg', '5mg'], cat: 'tablet' },

      // Cardiovascular/Hypertension (15 drugs)
      { generic: 'Amlodipine', strengths: ['2.5mg', '5mg', '10mg'], cat: 'tablet' },
      { generic: 'Enalapril', strengths: ['2.5mg', '5mg', '10mg'], cat: 'tablet' },
      { generic: 'Lisinopril', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },
      { generic: 'Losartan', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
      { generic: 'Telmisartan', strengths: ['20mg', '40mg', '80mg'], cat: 'tablet' },
      { generic: 'Valsartan', strengths: ['80mg', '160mg', '320mg'], cat: 'tablet' },
      { generic: 'Nifedipine', strengths: ['10mg', '20mg', '30mg'], cat: 'tablet' },
      { generic: 'Diltiazem', strengths: ['30mg', '60mg', '90mg'], cat: 'tablet' },
      { generic: 'Verapamil', strengths: ['40mg', '80mg', '120mg'], cat: 'tablet' },
      { generic: 'Atorvastatin', strengths: ['10mg', '20mg', '40mg', '80mg'], cat: 'tablet' },
      { generic: 'Simvastatin', strengths: ['10mg', '20mg', '40mg'], cat: 'tablet' },
      { generic: 'Rosuvastatin', strengths: ['5mg', '10mg', '20mg', '40mg'], cat: 'tablet' },
      { generic: 'Pravastatin', strengths: ['10mg', '20mg', '40mg'], cat: 'tablet' },
      { generic: 'Clopidogrel', strengths: ['75mg'], cat: 'tablet' },
      { generic: 'Aspirin', strengths: ['75mg', '150mg'], cat: 'tablet' },

      // Thyroid (4 drugs)
      { generic: 'Levothyroxine', strengths: ['25mcg', '50mcg', '75mcg', '100mcg', '150mcg'], cat: 'tablet' },
      { generic: 'Liothyronine', strengths: ['5mcg', '25mcg', '50mcg'], cat: 'tablet' },
      { generic: 'Propranolol', strengths: ['10mg', '20mg', '40mg', '80mg'], cat: 'tablet' },
      { generic: 'Carbimazole', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },

      // Anti-inflammatory/Immunosuppressant (8 drugs)
      { generic: 'Prednisolone', strengths: ['5mg', '10mg', '20mg', '50mg'], cat: 'tablet' },
      { generic: 'Dexamethasone', strengths: ['0.5mg', '1mg', '2mg', '4mg'], cat: 'tablet' },
      { generic: 'Methylprednisolone', strengths: ['4mg', '8mg', '16mg'], cat: 'tablet' },
      { generic: 'Hydroxychloroquine', strengths: ['200mg', '400mg'], cat: 'tablet' },
      { generic: 'Sulfasalazine', strengths: ['500mg'], cat: 'tablet' },
      { generic: 'Azathioprine', strengths: ['50mg'], cat: 'tablet' },
      { generic: 'Mycophenolate', strengths: ['250mg', '500mg'], cat: 'capsule' },
      { generic: 'Tacrolimus', strengths: ['0.5mg', '1mg', '5mg'], cat: 'capsule' },

      // Respiratory (8 drugs)
      { generic: 'Salbutamol', strengths: ['100mcg', '200mcg'], cat: 'inhaler' },
      { generic: 'Ipratropium', strengths: ['20mcg'], cat: 'inhaler' },
      { generic: 'Fluticasone', strengths: ['50mcg', '125mcg', '250mcg'], cat: 'inhaler' },
      { generic: 'Budesonide', strengths: ['100mcg', '200mcg'], cat: 'inhaler' },
      { generic: 'Montelukast', strengths: ['4mg', '5mg', '10mg'], cat: 'tablet' },
      { generic: 'Theophylline', strengths: ['100mg', '200mg', '300mg'], cat: 'tablet' },
      { generic: 'Bromhexine', strengths: ['4mg', '8mg'], cat: 'tablet' },
      { generic: 'Ambroxol', strengths: ['15mg', '30mg'], cat: 'tablet' },

      // Neurological (12 drugs)
      { generic: 'Phenytoin', strengths: ['25mg', '50mg', '100mg'], cat: 'capsule' },
      { generic: 'Carbamazepine', strengths: ['100mg', '200mg', '400mg'], cat: 'tablet' },
      { generic: 'Valproic Acid', strengths: ['200mg', '500mg'], cat: 'capsule' },
      { generic: 'Levetiracetam', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
      { generic: 'Gabapentin', strengths: ['100mg', '300mg', '400mg', '600mg'], cat: 'capsule' },
      { generic: 'Pregabalin', strengths: ['50mg', '75mg', '150mg', '300mg'], cat: 'capsule' },
      { generic: 'Topiramate', strengths: ['25mg', '50mg', '100mg', '200mg'], cat: 'tablet' },
      { generic: 'Lamotrigine', strengths: ['25mg', '50mg', '100mg', '200mg'], cat: 'tablet' },
      { generic: 'Baclofen', strengths: ['10mg'], cat: 'tablet' },
      { generic: 'Amantadine', strengths: ['100mg'], cat: 'tablet' },
      { generic: 'Memantine', strengths: ['5mg', '10mg'], cat: 'tablet' },
      { generic: 'Donepezil', strengths: ['5mg', '10mg'], cat: 'tablet' },

      // Psychiatric (10 drugs)
      { generic: 'Chlorpromazine', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
      { generic: 'Haloperidol', strengths: ['1mg', '2mg', '5mg', '10mg'], cat: 'tablet' },
      { generic: 'Risperidone', strengths: ['0.5mg', '1mg', '2mg', '3mg', '4mg'], cat: 'tablet' },
      { generic: 'Olanzapine', strengths: ['2.5mg', '5mg', '7.5mg', '10mg'], cat: 'tablet' },
      { generic: 'Quetiapine', strengths: ['25mg', '50mg', '100mg', '200mg'], cat: 'tablet' },
      { generic: 'Fluoxetine', strengths: ['20mg', '40mg', '60mg'], cat: 'capsule' },
      { generic: 'Sertraline', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
      { generic: 'Escitalopram', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },
      { generic: 'Duloxetine', strengths: ['20mg', '30mg', '60mg'], cat: 'capsule' },
      { generic: 'Venlafaxine', strengths: ['37.5mg', '75mg', '150mg'], cat: 'capsule' },

      // Anxiety/Sleep (6 drugs)
      { generic: 'Alprazolam', strengths: ['0.25mg', '0.5mg', '1mg', '2mg'], cat: 'tablet' },
      { generic: 'Clonazepam', strengths: ['0.5mg', '1mg', '2mg'], cat: 'tablet' },
      { generic: 'Lorazepam', strengths: ['1mg', '2mg'], cat: 'tablet' },
      { generic: 'Diazepam', strengths: ['2mg', '5mg', '10mg'], cat: 'tablet' },
      { generic: 'Zopiclone', strengths: ['3.75mg', '7.5mg'], cat: 'tablet' },
      { generic: 'Zolpidem', strengths: ['5mg', '10mg'], cat: 'tablet' },

      // Eye Drops (6 drugs)
      { generic: 'Timolol', strengths: ['0.25%', '0.5%'], cat: 'eye drops' },
      { generic: 'Dorzolamide', strengths: ['2%'], cat: 'eye drops' },
      { generic: 'Latanoprost', strengths: ['0.005%'], cat: 'eye drops' },
      { generic: 'Moxifloxacin', strengths: ['0.5%'], cat: 'eye drops' },
      { generic: 'Ofloxacin', strengths: ['0.3%'], cat: 'eye drops' },
      { generic: 'Artificial Tears', strengths: ['0.5%'], cat: 'eye drops' },

      // Ear Drops (4 drugs)
      { generic: 'Ofloxacin', strengths: ['0.3%'], cat: 'ear drops' },
      { generic: 'Ciprofloxacin', strengths: ['0.3%'], cat: 'ear drops' },
      { generic: 'Neomycin', strengths: ['3.5mg/ml'], cat: 'ear drops' },
      { generic: 'Acetic Acid', strengths: ['2%'], cat: 'ear drops' },

      // Nasal Sprays (5 drugs)
      { generic: 'Fluticasone', strengths: ['50mcg'], cat: 'nasal spray' },
      { generic: 'Mometasone', strengths: ['50mcg'], cat: 'nasal spray' },
      { generic: 'Xylometazoline', strengths: ['0.1%'], cat: 'nasal spray' },
      { generic: 'Oxymetazoline', strengths: ['0.05%'], cat: 'nasal spray' },
      { generic: 'Saline', strengths: ['0.9%'], cat: 'nasal spray' },

      // Inhalers (6 drugs)
      { generic: 'Albuterol', strengths: ['100mcg'], cat: 'inhaler' },
      { generic: 'Salmeterol', strengths: ['25mcg'], cat: 'inhaler' },
      { generic: 'Mometasone', strengths: ['100mcg', '200mcg'], cat: 'inhaler' },
      { generic: 'Beclomethasone', strengths: ['50mcg', '100mcg'], cat: 'inhaler' },
      { generic: 'Tiotropium', strengths: ['18mcg'], cat: 'inhaler' },
      { generic: 'Combination ICS/LABA', strengths: ['100/25mcg'], cat: 'inhaler' },

      // Injections (10 drugs)
      { generic: 'Hepatitis B Vaccine', strengths: ['20mcg'], cat: 'injection' },
      { generic: 'Tetanus Toxoid', strengths: ['10 units'], cat: 'injection' },
      { generic: 'Influenza Vaccine', strengths: ['15mcg'], cat: 'injection' },
      { generic: 'BCG Vaccine', strengths: ['0.1ml'], cat: 'injection' },
      { generic: 'Penicillin G', strengths: ['1MU', '3MU'], cat: 'injection' },
      { generic: 'Ceftriaxone', strengths: ['250mg', '500mg', '1g', '2g'], cat: 'injection' },
      { generic: 'Gentamicin', strengths: ['40mg', '80mg', '120mg'], cat: 'injection' },
      { generic: 'Calcium Gluconate', strengths: ['10%'], cat: 'injection' },
      { generic: 'Magnesium Sulfate', strengths: ['50%'], cat: 'injection' },
      { generic: 'Vitamin B Complex', strengths: ['1ml'], cat: 'injection' },

      // Sachets (6 drugs)
      { generic: 'Oral Rehydration Salts', strengths: ['1 sachet'], cat: 'sachet' },
      { generic: 'Electrolyte Powder', strengths: ['1 sachet'], cat: 'sachet' },
      { generic: 'Fiber Supplement', strengths: ['10g'], cat: 'sachet' },
      { generic: 'Vitamin C Powder', strengths: ['1000mg'], cat: 'sachet' },
      { generic: 'Zinc Supplement', strengths: ['15mg'], cat: 'sachet' },
      { generic: 'Probiotic Powder', strengths: ['1 sachet'], cat: 'sachet' },

      // Ointments (8 drugs)
      { generic: 'Neomycin Ointment', strengths: ['500 IU/g'], cat: 'ointment' },
      { generic: 'Mupirocin', strengths: ['2%'], cat: 'ointment' },
      { generic: 'Clotrimazole', strengths: ['1%'], cat: 'ointment' },
      { generic: 'Miconazole', strengths: ['2%'], cat: 'ointment' },
      { generic: 'Ketoconazole', strengths: ['2%'], cat: 'ointment' },
      { generic: 'Hydrocortisone', strengths: ['0.5%', '1%'], cat: 'ointment' },
      { generic: 'Triamcinolone', strengths: ['0.1%'], cat: 'ointment' },
      { generic: 'Bacitracin', strengths: ['500 IU/g'], cat: 'ointment' },

      // Gels (6 drugs)
      { generic: 'Benzoyl Peroxide', strengths: ['2.5%', '5%', '10%'], cat: 'gel' },
      { generic: 'Salicylic Acid', strengths: ['2%', '6%'], cat: 'gel' },
      { generic: 'Tretinoin', strengths: ['0.025%', '0.05%', '0.1%'], cat: 'gel' },
      { generic: 'Adapalene', strengths: ['0.1%'], cat: 'gel' },
      { generic: 'Metronidazole', strengths: ['1%'], cat: 'gel' },
      { generic: 'Lidocaine', strengths: ['2%'], cat: 'gel' },

      // Shampoos (5 drugs)
      { generic: 'Ketoconazole', strengths: ['2%'], cat: 'shampoo' },
      { generic: 'Zinc Pyrithione', strengths: ['1%', '2%'], cat: 'shampoo' },
      { generic: 'Selenium Sulfide', strengths: ['2.5%'], cat: 'shampoo' },
      { generic: 'Coal Tar', strengths: ['2%'], cat: 'shampoo' },
      { generic: 'Salicylic Acid', strengths: ['1.5%', '3%'], cat: 'shampoo' },

      // Lotions (6 drugs)
      { generic: 'Calamine Lotion', strengths: ['8%'], cat: 'lotion' },
      { generic: 'Hydrating Lotion', strengths: ['regular'], cat: 'lotion' },
      { generic: 'Sunscreen Lotion', strengths: ['SPF 30', 'SPF 50'], cat: 'lotion' },
      { generic: 'Antifungal Lotion', strengths: ['1%'], cat: 'lotion' },
      { generic: 'Moisturizing Lotion', strengths: ['heavy'], cat: 'lotion' },
      { generic: 'Insect Repellent Lotion', strengths: ['5%'], cat: 'lotion' },

      // Mouthwashes (5 drugs)
      { generic: 'Chlorhexidine', strengths: ['0.12%', '0.2%'], cat: 'mouthwash' },
      { generic: 'Povidone Iodine', strengths: ['1%'], cat: 'mouthwash' },
      { generic: 'Hydrogen Peroxide', strengths: ['1.5%'], cat: 'mouthwash' },
      { generic: 'Fluoride Mouthwash', strengths: ['0.05%'], cat: 'mouthwash' },
      { generic: 'Herbal Mouthwash', strengths: ['regular'], cat: 'mouthwash' },

      // Dental Products (6 drugs)
      { generic: 'Fluoride Toothpaste', strengths: ['1000ppm', '1500ppm'], cat: 'dental' },
      { generic: 'Desensitizing Toothpaste', strengths: ['regular'], cat: 'dental' },
      { generic: 'Whitening Gel', strengths: ['15%', '35%'], cat: 'dental' },
      { generic: 'Tooth Repair Gel', strengths: ['regular'], cat: 'dental' },
      { generic: 'Gum Care Gel', strengths: ['regular'], cat: 'dental' },
      { generic: 'Mint Dental Spray', strengths: ['regular'], cat: 'dental' },

      // Baby Care (8 drugs)
      { generic: 'Baby Powder', strengths: ['talc-free'], cat: 'baby care' },
      { generic: 'Diaper Rash Cream', strengths: ['10%'], cat: 'baby care' },
      { generic: 'Baby Oil', strengths: ['mineral'], cat: 'baby care' },
      { generic: 'Baby Soap', strengths: ['mild'], cat: 'baby care' },
      { generic: 'Baby Lotion', strengths: ['regular'], cat: 'baby care' },
      { generic: 'Baby Shampoo', strengths: ['tear-free'], cat: 'baby care' },
      { generic: 'Baby Wipes', strengths: ['fragrance-free'], cat: 'baby care' },
      { generic: 'Teething Gel', strengths: ['7.5%'], cat: 'baby care' },

      // Surgical Items (6 drugs)
      { generic: 'Sterile Gauze', strengths: ['2x2', '4x4', '8x8'], cat: 'surgical' },
      { generic: 'Medical Tape', strengths: ['1 inch', '2 inch'], cat: 'surgical' },
      { generic: 'Sterile Gloves', strengths: ['size S', 'size M', 'size L', 'size XL'], cat: 'surgical' },
      { generic: 'Antiseptic Wipes', strengths: ['70% alcohol'], cat: 'surgical' },
      { generic: 'Surgical Face Mask', strengths: ['3-ply'], cat: 'surgical' },
      { generic: 'Bandages', strengths: ['elastic', 'non-elastic'], cat: 'surgical' },

      // Medical Devices (6 drugs)
      { generic: 'Digital Thermometer', strengths: ['regular'], cat: 'device' },
      { generic: 'Blood Pressure Monitor', strengths: ['digital'], cat: 'device' },
      { generic: 'Glucometer', strengths: ['digital'], cat: 'device' },
      { generic: 'Oximeter', strengths: ['digital'], cat: 'device' },
      { generic: 'Digital Scale', strengths: ['capacity 180kg'], cat: 'device' },
      { generic: 'Nebulizer', strengths: ['compressor type'], cat: 'device' },

      // Ayurvedic (10 drugs)
      { generic: 'Ashwagandha', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Brahmi', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Tulsi', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Neem', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Turmeric', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Ginger', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Triphala', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Giloy', strengths: ['250mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Shilajit', strengths: ['100mg', '500mg'], cat: 'ayurvedic' },
      { generic: 'Chyawanprash', strengths: ['500g', '1kg'], cat: 'ayurvedic' },

      // Homeopathic (10 drugs)
      { generic: 'Arnica Montana', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Belladonna', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Sulphur', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Hepar Sulphur', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Calcarea Carb', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Silicea', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Pulsatilla', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Lycopodium', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Sepia', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
      { generic: 'Nux Vomica', strengths: ['6CH', '12CH', '30CH'], cat: 'homeopathic' },
    ];

    const manufacturers = [
      'Cipla', 'Sun Pharma', 'Dr Reddys', 'Lupin', 'Aurobindo', 'Zydus Cadila',
      'Torrent', 'Alkem', 'Glenmark', 'IPCA Labs', 'Intas', 'Mankind',
      'Macleods', 'Abbott India', 'Piramal', 'Biocon', 'Natco', 'Hetero',
      'Laurus Labs', 'Strides', 'Wockhardt', 'Alembic', 'Granules India',
      'Divis Labs', 'Ajanta Pharma', 'Eris Lifesciences', 'Pfizer India',
      'Sanofi India', 'Bayer India', 'Novo Nordisk', 'AstraZeneca', 'Boehringer Ingelheim',
      'Merck', 'Johnson & Johnson', 'Roche', 'Novartis', 'GSK', 'Glaxo',
      'MSD', 'Cadila', 'Sandoz', 'Mylan', 'Ranbaxy', 'Orchid Chemicals',
      'Medpharma', 'FDC', 'Aristo', 'Reddy Labs', 'Windlas', 'Lyka Labs',
      'Shilpa Medicare', 'Hikma', 'Micro Labs', 'Baxter', 'USV', 'Teva',
    ];

    const medicines = [];

    // Generate medicines systematically: each generic × manufacturers × strengths × pack sizes
    let medicineId = 0;
    for (const drug of genericDrugs) {
      for (const mfr of manufacturers) {
        for (const str of drug.strengths) {
          for (const packSize of [10, 20, 30, 50, 100]) {
            medicineId++;

            // Generate realistic brand name
            const mfrPrefix = mfr.substring(0, 4).toUpperCase();
            const genericShort = drug.generic.substring(0, 5);
            const brandName = `${mfrPrefix}-${genericShort} ${str}`;

            // Calculate realistic MRP based on strength
            const baseMrp = Math.floor(Math.random() * 150) + 30;
            const strengthMultiplier = parseInt(str.match(/\d+/)?.[0]) / 100;
            const mrp = Math.max(Math.floor(baseMrp * (1 + strengthMultiplier * 0.5)), 10);

            medicines.push({
              name: brandName,
              generic_name: drug.generic,
              manufacturer: mfr,
              category: drug.cat,
              composition: drug.generic,
              strength: str,
              pack_size: packSize,
              mrp: mrp,
              is_prescription_required: ['tablet', 'capsule', 'injection'].includes(drug.cat),
              is_chronic: ['tablet', 'capsule'].includes(drug.cat) && Math.random() > 0.6,
              is_controlled: false,
            });

            // Stop when we reach target
            if (medicines.length >= remainingNeeded) break;
          }
          if (medicines.length >= remainingNeeded) break;
        }
        if (medicines.length >= remainingNeeded) break;
      }
      if (medicines.length >= remainingNeeded) break;
    }

    console.log(`Generated ${medicines.length} medicines for insertion`);

    // Batch insert with 500-item batches
    const batchSize = 500;
    let inserted = 0;
    let skipped = 0;
    const startTime = Date.now();

    for (let i = 0; i < medicines.length; i += batchSize) {
      const batch = medicines.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(medicines.length / batchSize);

      // Build single INSERT statement for entire batch
      const values = batch
        .map((med, idx) => {
          const offset = idx * 11;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`;
        })
        .join(',');

      const params = batch.flatMap(med => [
        med.name,
        med.generic_name,
        med.manufacturer,
        med.category,
        med.composition,
        med.strength,
        med.pack_size,
        med.mrp,
        med.is_prescription_required,
        med.is_chronic,
        med.is_controlled,
      ]);

      try {
        await query(
          `INSERT INTO medicines (name, generic_name, manufacturer, category, composition, strength, pack_size, mrp, is_prescription_required, is_chronic, is_controlled)
           VALUES ${values}
           ON CONFLICT(name) DO NOTHING`,
          params,
        );
        inserted += batch.length;
        console.log(`Batch ${batchNum}/${totalBatches} inserted (${inserted}/${medicines.length})`);
      } catch (err) {
        console.error(`Batch ${batchNum} error:`, err.message);
        skipped += batch.length;
      }
    }

    const finalCount = await getOne('SELECT COUNT(*) as total FROM medicines');
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`Bulk seed complete in ${duration}s: ${inserted} inserted, ${skipped} skipped`);
    res.json({
      message: 'Bulk seed complete',
      inserted,
      skipped,
      totalInDatabase: parseInt(finalCount?.total || 0),
      durationSeconds: parseFloat(duration),
    });
  } catch (error) {
    console.error('Bulk seed error:', error);
    res.status(500).json({ error: 'Bulk seed failed: ' + error.message });
  }
});

module.exports = router;
const express = require('express');
const { getOne, getMany, query } = require('../models');

const router = express.Router();

// Search medicines by name - improved with ILIKE fallback
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }

    const searchTerm = q.trim();
    const searchLimit = Math.min(parseInt(limit) || 20, 100);
    const searchOffset = parseInt(offset) || 0;

    // Use ILIKE for broader matching (works better with Indian brand names)
    const medicines = await getMany(
      `SELECT id, name, generic_name, manufacturer, category, strength,
              pack_size, mrp, is_prescription_required, is_chronic
       FROM medicines
       WHERE name ILIKE $1
          OR generic_name ILIKE $1
          OR manufacturer ILIKE $1
       ORDER BY
         CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END,
         name ASC
       LIMIT $3 OFFSET $4`,
      [`%${searchTerm}%`, `${searchTerm}%`, searchLimit, searchOffset],
    );

    // Get total count for pagination
    const countResult = await getOne(
      `SELECT COUNT(*) as total FROM medicines
       WHERE name ILIKE $1 OR generic_name ILIKE $1 OR manufacturer ILIKE $1`,
      [`%${searchTerm}%`],
    );

    res.json({
      medicines,
      count: medicines.length,
      total: parseInt(countResult?.total || 0),
      offset: searchOffset,
      limit: searchLimit,
    });
  } catch (error) {
    console.error('Search medicines error:', error);
    res.status(500).json({ error: 'Failed to search medicines' });
  }
});

// Browse medicines by category
router.get('/browse', async (req, res) => {
  try {
    const { category, limit = 50, offset = 0 } = req.query;

    let whereClause = '';
    const params = [];
    let paramIdx = 1;

    if (category && category !== 'all') {
      whereClause = `WHERE category = $${paramIdx}`;
      params.push(category);
      paramIdx++;
    }

    params.push(Math.min(parseInt(limit) || 50, 100));
    params.push(parseInt(offset) || 0);

    const medicines = await getMany(
      `SELECT id, name, generic_name, manufacturer, category, strength,
              pack_size, mrp, is_prescription_required, is_chronic
       FROM medicines ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params,
    );

    const countResult = await getOne(
      `SELECT COUNT(*) as total FROM medicines ${whereClause}`,
      category && category !== 'all' ? [category] : [],
    );

    // Get all categories
    const categories = await getMany(
      `SELECT DISTINCT category, COUNT(*) as count
       FROM medicines GROUP BY category ORDER BY category`,
    );

    res.json({
      medicines,
      count: medicines.length,
      total: parseInt(countResult?.total || 0),
      categories,
    });
  } catch (error) {
    console.error('Browse medicines error:', error);
    res.status(500).json({ error: 'Failed to browse medicines' });
  }
});

// Get medicine details with alternatives
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await getOne(
      `SELECT id, name, generic_name, manufacturer, category, composition,
              strength, pack_size, mrp, is_prescription_required, is_chronic,
              is_controlled, alternative_ids, created_at
       FROM medicines WHERE id = $1`,
      [id],
    );

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    // Get alternatives
    let alternatives = [];
    if (medicine.alternative_ids && medicine.alternative_ids.length > 0) {
      alternatives = await getMany(
        `SELECT id, name, generic_name, strength, mrp
         FROM medicines
         WHERE id = ANY($1)`,
        [medicine.alternative_ids],
      );
    }

    res.json({
      medicine,
      alternatives,
    });
  } catch (error) {
    console.error('Get medicine detail error:', error);
    res.status(500).json({ error: 'Failed to fetch medicine' });
  }
});

// Seed medicines endpoint (for populating the database)
router.post('/seed', async (req, res) => {
  try {
    const { secret } = req.body;

    // Simple secret check to prevent abuse
    if (secret !== 'rxmax-seed-2026') {
      return res.status(403).json({ error: 'Invalid seed secret' });
    }

    // Check current count
    const countResult = await getOne('SELECT COUNT(*) as total FROM medicines');
    const currentCount = parseInt(countResult?.total || 0);

    if (currentCount > 500) {
      return res.json({
        message: `Database already has ${currentCount} medicines. Skipping seed.`,
        count: currentCount,
      });
    }

    console.log('Starting medicine seed...');

    // Comprehensive Indian pharmacy brand database
    const medicines = generateMedicineDatabase();

    let inserted = 0;
    let skipped = 0;
    const batchSize = 50;

    for (let i = 0; i < medicines.length; i += batchSize) {
      const batch = medicines.slice(i, i + batchSize);

      for (const med of batch) {
        try {
          await query(
            `INSERT INTO medicines (name, generic_name, manufacturer, category, composition, strength, pack_size, mrp, is_prescription_required, is_chronic, is_controlled)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT DO NOTHING`,
            [
              med.name,
              med.generic_name,
              med.manufacturer,
              med.category,
              med.composition || med.generic_name,
              med.strength,
              med.pack_size,
              med.mrp,
              med.is_prescription_required || false,
              med.is_chronic || false,
              med.is_controlled || false,
            ],
          );
          inserted++;
        } catch (err) {
          skipped++;
        }
      }
    }

    const finalCount = await getOne('SELECT COUNT(*) as total FROM medicines');

    console.log(`Seed complete: ${inserted} inserted, ${skipped} skipped`);
    res.json({
      message: 'Seed complete',
      inserted,
      skipped,
      totalInDatabase: parseInt(finalCount?.total || 0),
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Seed failed: ' + error.message });
  }
});

function generateMedicineDatabase() {
  const medicines = [];

  // ===== REAL INDIAN BRAND NAMES =====
  const brands = [
    // Pain Relief & Anti-inflammatory
    { name: 'Dolo 650', generic: 'Paracetamol', mfr: 'Micro Labs', cat: 'tablet', str: '650mg', ps: '15 tablets', mrp: 32, rx: false },
    { name: 'Crocin Advance', generic: 'Paracetamol', mfr: 'GSK', cat: 'tablet', str: '500mg', ps: '15 tablets', mrp: 28, rx: false },
    { name: 'Calpol 500', generic: 'Paracetamol', mfr: 'GSK', cat: 'tablet', str: '500mg', ps: '15 tablets', mrp: 20, rx: false },
    { name: 'Combiflam', generic: 'Ibuprofen + Paracetamol', mfr: 'Sanofi', cat: 'tablet', str: '400mg+325mg', ps: '20 tablets', mrp: 42, rx: false },
    { name: 'Ibugesic Plus', generic: 'Ibuprofen + Paracetamol', mfr: 'Cipla', cat: 'tablet', str: '400mg+325mg', ps: '10 tablets', mrp: 28, rx: false },
    { name: 'Zerodol SP', generic: 'Aceclofenac + Paracetamol + Serratiopeptidase', mfr: 'IPCA Labs', cat: 'tablet', str: '100mg+325mg+15mg', ps: '10 tablets', mrp: 125, rx: true },
    { name: 'Zerodol P', generic: 'Aceclofenac + Paracetamol', mfr: 'IPCA Labs', cat: 'tablet', str: '100mg+325mg', ps: '10 tablets', mrp: 68, rx: true },
    { name: 'Hifenac P', generic: 'Aceclofenac + Paracetamol', mfr: 'Intas', cat: 'tablet', str: '100mg+325mg', ps: '10 tablets', mrp: 65, rx: true },
    { name: 'Voveran SR 100', generic: 'Diclofenac Sodium', mfr: 'Novartis', cat: 'tablet', str: '100mg', ps: '10 tablets', mrp: 48, rx: true },
    { name: 'Voveran 50', generic: 'Diclofenac Sodium', mfr: 'Novartis', cat: 'tablet', str: '50mg', ps: '15 tablets', mrp: 22, rx: true },
    { name: 'Nimesulide', generic: 'Nimesulide', mfr: 'Various', cat: 'tablet', str: '100mg', ps: '10 tablets', mrp: 30, rx: true },
    { name: 'Nise', generic: 'Nimesulide', mfr: 'Dr Reddys', cat: 'tablet', str: '100mg', ps: '10 tablets', mrp: 35, rx: true },
    { name: 'Flexon', generic: 'Ibuprofen + Paracetamol', mfr: 'Aristo', cat: 'tablet', str: '400mg+325mg', ps: '10 tablets', mrp: 25, rx: false },
    { name: 'Saridon', generic: 'Propyphenazone + Paracetamol + Caffeine', mfr: 'Bayer', cat: 'tablet', str: '150mg+250mg+50mg', ps: '10 tablets', mrp: 30, rx: false },
    { name: 'Disprin', generic: 'Aspirin', mfr: 'Reckitt', cat: 'tablet', str: '350mg', ps: '10 tablets', mrp: 9, rx: false },

    // Antibiotics
    { name: 'Augmentin 625 Duo', generic: 'Amoxicillin + Clavulanate', mfr: 'GSK', cat: 'tablet', str: '500mg+125mg', ps: '10 tablets', mrp: 225, rx: true },
    { name: 'Moxikind CV 625', generic: 'Amoxicillin + Clavulanate', mfr: 'Mankind', cat: 'tablet', str: '500mg+125mg', ps: '10 tablets', mrp: 175, rx: true },
    { name: 'Azithral 500', generic: 'Azithromycin', mfr: 'Alembic', cat: 'tablet', str: '500mg', ps: '3 tablets', mrp: 95, rx: true },
    { name: 'Zithromax 500', generic: 'Azithromycin', mfr: 'Pfizer', cat: 'tablet', str: '500mg', ps: '3 tablets', mrp: 140, rx: true },
    { name: 'Azee 500', generic: 'Azithromycin', mfr: 'Cipla', cat: 'tablet', str: '500mg', ps: '3 tablets', mrp: 78, rx: true },
    { name: 'Ciplox 500', generic: 'Ciprofloxacin', mfr: 'Cipla', cat: 'tablet', str: '500mg', ps: '10 tablets', mrp: 68, rx: true },
    { name: 'Cifran 500', generic: 'Ciprofloxacin', mfr: 'Sun Pharma', cat: 'tablet', str: '500mg', ps: '10 tablets', mrp: 72, rx: true },
    { name: 'Zifi 200', generic: 'Cefixime', mfr: 'FDC', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 175, rx: true },
    { name: 'Taxim-O 200', generic: 'Cefixime', mfr: 'Alkem', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 180, rx: true },
    { name: 'Monocef 200', generic: 'Cefixime', mfr: 'Aristo', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 165, rx: true },
    { name: 'Cefakind 500', generic: 'Cephalexin', mfr: 'Mankind', cat: 'capsule', str: '500mg', ps: '10 capsules', mrp: 120, rx: true },
    { name: 'Oflox 200', generic: 'Ofloxacin', mfr: 'Cipla', cat: 'tablet', str: '200mg', ps: '10 tablets', mrp: 55, rx: true },
    { name: 'Levoflox 500', generic: 'Levofloxacin', mfr: 'Cipla', cat: 'tablet', str: '500mg', ps: '5 tablets', mrp: 72, rx: true },
    { name: 'Norflox 400', generic: 'Norfloxacin', mfr: 'Cipla', cat: 'tablet', str: '400mg', ps: '10 tablets', mrp: 45, rx: true },
    { name: 'Doxycycline 100', generic: 'Doxycycline', mfr: 'Various', cat: 'capsule', str: '100mg', ps: '10 capsules', mrp: 48, rx: true },
    { name: 'Metrogyl 400', generic: 'Metronidazole', mfr: 'J&J', cat: 'tablet', str: '400mg', ps: '15 tablets', mrp: 20, rx: true },

    // Diabetes
    { name: 'Glycomet GP 1', generic: 'Metformin + Glimepiride', mfr: 'USV', cat: 'tablet', str: '500mg+1mg', ps: '15 tablets', mrp: 105, rx: true, chronic: true },
    { name: 'Glycomet GP 2', generic: 'Metformin + Glimepiride', mfr: 'USV', cat: 'tablet', str: '500mg+2mg', ps: '15 tablets', mrp: 130, rx: true, chronic: true },
    { name: 'Glycomet 500', generic: 'Metformin', mfr: 'USV', cat: 'tablet', str: '500mg', ps: '20 tablets', mrp: 30, rx: true, chronic: true },
    { name: 'Glycomet 850', generic: 'Metformin', mfr: 'USV', cat: 'tablet', str: '850mg', ps: '10 tablets', mrp: 22, rx: true, chronic: true },
    { name: 'Glycomet 1000 SR', generic: 'Metformin SR', mfr: 'USV', cat: 'tablet', str: '1000mg', ps: '15 tablets', mrp: 85, rx: true, chronic: true },
    { name: 'Amaryl M 1', generic: 'Glimepiride + Metformin', mfr: 'Sanofi', cat: 'tablet', str: '1mg+500mg', ps: '15 tablets', mrp: 160, rx: true, chronic: true },
    { name: 'Amaryl M 2', generic: 'Glimepiride + Metformin', mfr: 'Sanofi', cat: 'tablet', str: '2mg+500mg', ps: '15 tablets', mrp: 185, rx: true, chronic: true },
    { name: 'Janumet 50/500', generic: 'Sitagliptin + Metformin', mfr: 'MSD', cat: 'tablet', str: '50mg+500mg', ps: '7 tablets', mrp: 325, rx: true, chronic: true },
    { name: 'Galvus Met 50/500', generic: 'Vildagliptin + Metformin', mfr: 'Novartis', cat: 'tablet', str: '50mg+500mg', ps: '10 tablets', mrp: 280, rx: true, chronic: true },
    { name: 'Jardiance 10', generic: 'Empagliflozin', mfr: 'Boehringer', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 520, rx: true, chronic: true },
    { name: 'Trajenta 5', generic: 'Linagliptin', mfr: 'Boehringer', cat: 'tablet', str: '5mg', ps: '10 tablets', mrp: 475, rx: true, chronic: true },
    { name: 'Gluformin 500', generic: 'Metformin', mfr: 'Mankind', cat: 'tablet', str: '500mg', ps: '20 tablets', mrp: 25, rx: true, chronic: true },
    { name: 'Obimet 500', generic: 'Metformin', mfr: 'Zydus', cat: 'tablet', str: '500mg', ps: '20 tablets', mrp: 28, rx: true, chronic: true },

    // Cardiovascular / BP
    { name: 'Telma 40', generic: 'Telmisartan', mfr: 'Glenmark', cat: 'tablet', str: '40mg', ps: '15 tablets', mrp: 135, rx: true, chronic: true },
    { name: 'Telma 80', generic: 'Telmisartan', mfr: 'Glenmark', cat: 'tablet', str: '80mg', ps: '15 tablets', mrp: 205, rx: true, chronic: true },
    { name: 'Telma H', generic: 'Telmisartan + HCTZ', mfr: 'Glenmark', cat: 'tablet', str: '40mg+12.5mg', ps: '15 tablets', mrp: 170, rx: true, chronic: true },
    { name: 'Telma AM', generic: 'Telmisartan + Amlodipine', mfr: 'Glenmark', cat: 'tablet', str: '40mg+5mg', ps: '15 tablets', mrp: 185, rx: true, chronic: true },
    { name: 'Amlodac 5', generic: 'Amlodipine', mfr: 'Zydus', cat: 'tablet', str: '5mg', ps: '15 tablets', mrp: 55, rx: true, chronic: true },
    { name: 'Amlong 5', generic: 'Amlodipine', mfr: 'Micro Labs', cat: 'tablet', str: '5mg', ps: '15 tablets', mrp: 48, rx: true, chronic: true },
    { name: 'Stamlo 5', generic: 'Amlodipine', mfr: 'Dr Reddys', cat: 'tablet', str: '5mg', ps: '15 tablets', mrp: 52, rx: true, chronic: true },
    { name: 'Ecosprin 75', generic: 'Aspirin', mfr: 'USV', cat: 'tablet', str: '75mg', ps: '14 tablets', mrp: 8, rx: false, chronic: true },
    { name: 'Ecosprin 150', generic: 'Aspirin', mfr: 'USV', cat: 'tablet', str: '150mg', ps: '14 tablets', mrp: 10, rx: false, chronic: true },
    { name: 'Ecosprin AV 75/10', generic: 'Aspirin + Atorvastatin', mfr: 'USV', cat: 'capsule', str: '75mg+10mg', ps: '15 capsules', mrp: 95, rx: true, chronic: true },
    { name: 'Atorva 10', generic: 'Atorvastatin', mfr: 'Zydus', cat: 'tablet', str: '10mg', ps: '15 tablets', mrp: 110, rx: true, chronic: true },
    { name: 'Atorva 20', generic: 'Atorvastatin', mfr: 'Zydus', cat: 'tablet', str: '20mg', ps: '15 tablets', mrp: 175, rx: true, chronic: true },
    { name: 'Atorva 40', generic: 'Atorvastatin', mfr: 'Zydus', cat: 'tablet', str: '40mg', ps: '10 tablets', mrp: 195, rx: true, chronic: true },
    { name: 'Lipitor 10', generic: 'Atorvastatin', mfr: 'Pfizer', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 180, rx: true, chronic: true },
    { name: 'Rosuvastatin 10', generic: 'Rosuvastatin', mfr: 'Various', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 120, rx: true, chronic: true },
    { name: 'Rosuvas 10', generic: 'Rosuvastatin', mfr: 'Sun Pharma', cat: 'tablet', str: '10mg', ps: '15 tablets', mrp: 210, rx: true, chronic: true },
    { name: 'Clopitab A 75/75', generic: 'Clopidogrel + Aspirin', mfr: 'Lupin', cat: 'tablet', str: '75mg+75mg', ps: '15 tablets', mrp: 82, rx: true, chronic: true },
    { name: 'Clopilet A 75', generic: 'Clopidogrel + Aspirin', mfr: 'Sun Pharma', cat: 'tablet', str: '75mg+75mg', ps: '15 tablets', mrp: 85, rx: true, chronic: true },
    { name: 'Metoprolol 25', generic: 'Metoprolol', mfr: 'Various', cat: 'tablet', str: '25mg', ps: '10 tablets', mrp: 30, rx: true, chronic: true },
    { name: 'Met XL 25', generic: 'Metoprolol Succinate', mfr: 'Cipla', cat: 'tablet', str: '25mg', ps: '15 tablets', mrp: 68, rx: true, chronic: true },
    { name: 'Concor 5', generic: 'Bisoprolol', mfr: 'Merck', cat: 'tablet', str: '5mg', ps: '14 tablets', mrp: 135, rx: true, chronic: true },
    { name: 'Envas 5', generic: 'Enalapril', mfr: 'Cadila', cat: 'tablet', str: '5mg', ps: '14 tablets', mrp: 35, rx: true, chronic: true },
    { name: 'Losar 50', generic: 'Losartan', mfr: 'Unichem', cat: 'tablet', str: '50mg', ps: '10 tablets', mrp: 42, rx: true, chronic: true },

    // Gastro / Acidity
    { name: 'Pan 40', generic: 'Pantoprazole', mfr: 'Alkem', cat: 'tablet', str: '40mg', ps: '15 tablets', mrp: 88, rx: true },
    { name: 'Pan-D', generic: 'Pantoprazole + Domperidone', mfr: 'Alkem', cat: 'capsule', str: '40mg+30mg', ps: '15 capsules', mrp: 120, rx: true },
    { name: 'Rantac 150', generic: 'Ranitidine', mfr: 'J&J', cat: 'tablet', str: '150mg', ps: '30 tablets', mrp: 30, rx: false },
    { name: 'Omez 20', generic: 'Omeprazole', mfr: 'Dr Reddys', cat: 'capsule', str: '20mg', ps: '15 capsules', mrp: 62, rx: true },
    { name: 'Omez D', generic: 'Omeprazole + Domperidone', mfr: 'Dr Reddys', cat: 'capsule', str: '20mg+10mg', ps: '15 capsules', mrp: 95, rx: true },
    { name: 'Rablet 20', generic: 'Rabeprazole', mfr: 'Lupin', cat: 'tablet', str: '20mg', ps: '10 tablets', mrp: 85, rx: true },
    { name: 'Nexpro RD 40', generic: 'Esomeprazole + Domperidone', mfr: 'Torrent', cat: 'capsule', str: '40mg+30mg', ps: '15 capsules', mrp: 175, rx: true },
    { name: 'Gelusil MPS', generic: 'Aluminium Hydroxide + Magnesium', mfr: 'Pfizer', cat: 'syrup', str: '250ml', ps: '1 bottle', mrp: 95, rx: false },
    { name: 'Digene', generic: 'Antacid Gel', mfr: 'Abbott', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 82, rx: false },
    { name: 'Mucaine Gel', generic: 'Antacid + Oxethazaine', mfr: 'Abbott', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 110, rx: false },

    // Vitamins & Supplements
    { name: 'Shelcal 500', generic: 'Calcium + Vitamin D3', mfr: 'Torrent', cat: 'tablet', str: '500mg+250IU', ps: '15 tablets', mrp: 105, rx: false },
    { name: 'Shelcal HD', generic: 'Calcium + Vitamin D3', mfr: 'Torrent', cat: 'tablet', str: '500mg+1000IU', ps: '15 tablets', mrp: 135, rx: false },
    { name: 'Calcimax 500', generic: 'Calcium + Vitamin D3', mfr: 'Meyer', cat: 'tablet', str: '500mg+250IU', ps: '15 tablets', mrp: 98, rx: false },
    { name: 'Becosules Z', generic: 'B-Complex + Zinc', mfr: 'Pfizer', cat: 'capsule', str: 'Multivitamin', ps: '20 capsules', mrp: 45, rx: false },
    { name: 'Becosules', generic: 'B-Complex', mfr: 'Pfizer', cat: 'capsule', str: 'Multivitamin', ps: '20 capsules', mrp: 35, rx: false },
    { name: 'Supradyn', generic: 'Multivitamin + Minerals', mfr: 'Bayer', cat: 'tablet', str: 'Multivitamin', ps: '15 tablets', mrp: 48, rx: false },
    { name: 'Revital H', generic: 'Multivitamin + Ginseng', mfr: 'Sun Pharma', cat: 'capsule', str: 'Multivitamin', ps: '30 capsules', mrp: 280, rx: false },
    { name: 'Zincovit', generic: 'Zinc + Multivitamin', mfr: 'Apex', cat: 'tablet', str: 'Multivitamin', ps: '15 tablets', mrp: 72, rx: false },
    { name: 'Limcee 500', generic: 'Vitamin C', mfr: 'Abbott', cat: 'tablet', str: '500mg', ps: '15 tablets', mrp: 25, rx: false },
    { name: 'Evion 400', generic: 'Vitamin E', mfr: 'Merck', cat: 'capsule', str: '400mg', ps: '10 capsules', mrp: 42, rx: false },
    { name: 'Neurobion Forte', generic: 'Vitamin B1 + B6 + B12', mfr: 'Merck', cat: 'tablet', str: 'B-Complex', ps: '30 tablets', mrp: 58, rx: false },
    { name: 'Folvite 5', generic: 'Folic Acid', mfr: 'Pfizer', cat: 'tablet', str: '5mg', ps: '45 tablets', mrp: 22, rx: false },
    { name: 'Feronia XT', generic: 'Ferrous Ascorbate + Folic Acid', mfr: 'Piramal', cat: 'tablet', str: '100mg+1.5mg', ps: '10 tablets', mrp: 115, rx: false },
    { name: 'Autrin', generic: 'Iron + Folic Acid + B12', mfr: 'Zydus', cat: 'capsule', str: 'Iron Complex', ps: '10 capsules', mrp: 48, rx: false },
    { name: 'D-Rise 60K', generic: 'Cholecalciferol', mfr: 'USV', cat: 'capsule', str: '60000IU', ps: '4 capsules', mrp: 120, rx: false },
    { name: 'Uprise D3 60K', generic: 'Cholecalciferol', mfr: 'Alkem', cat: 'capsule', str: '60000IU', ps: '4 capsules', mrp: 125, rx: false },
    { name: 'Calcirol D3', generic: 'Cholecalciferol', mfr: 'Cadila', cat: 'capsule', str: '60000IU', ps: '4 capsules', mrp: 110, rx: false },

    // Respiratory / Cough & Cold
    { name: 'Montair LC', generic: 'Montelukast + Levocetirizine', mfr: 'Cipla', cat: 'tablet', str: '10mg+5mg', ps: '15 tablets', mrp: 175, rx: true },
    { name: 'Montek LC', generic: 'Montelukast + Levocetirizine', mfr: 'Sun Pharma', cat: 'tablet', str: '10mg+5mg', ps: '15 tablets', mrp: 165, rx: true },
    { name: 'Sinarest', generic: 'Paracetamol + Phenylephrine + CPM', mfr: 'Centaur', cat: 'tablet', str: 'Combination', ps: '10 tablets', mrp: 28, rx: false },
    { name: 'Alex', generic: 'Dextromethorphan + CPM', mfr: 'Glenmark', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 72, rx: false },
    { name: 'Benadryl', generic: 'Diphenhydramine', mfr: 'J&J', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 82, rx: false },
    { name: 'Grilinctus BM', generic: 'Bromhexine + Guaifenesin + Menthol', mfr: 'Franco Indian', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 65, rx: false },
    { name: 'Ascoril LS', generic: 'Ambroxol + Levosalbutamol + Guaifenesin', mfr: 'Glenmark', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 98, rx: true },
    { name: 'Chericof', generic: 'Dextromethorphan + CPM', mfr: 'Cipla', cat: 'syrup', str: '100ml', ps: '1 bottle', mrp: 55, rx: false },
    { name: 'Cetrizine', generic: 'Cetirizine', mfr: 'Various', cat: 'tablet', str: '10mg', ps: '10 tablets', mrp: 15, rx: false },
    { name: 'Allegra 120', generic: 'Fexofenadine', mfr: 'Sanofi', cat: 'tablet', str: '120mg', ps: '10 tablets', mrp: 165, rx: true },
    { name: 'Levocet', generic: 'Levocetirizine', mfr: 'Sun Pharma', cat: 'tablet', str: '5mg', ps: '10 tablets', mrp: 35, rx: false },
    { name: 'Deriphyllin', generic: 'Theophylline + Etophylline', mfr: 'Abbott', cat: 'tablet', str: '150mg+50mg', ps: '15 tablets', mrp: 40, rx: true },
    { name: 'Foracort 200', generic: 'Formoterol + Budesonide', mfr: 'Cipla', cat: 'inhaler', str: '6mcg+200mcg', ps: '120 doses', mrp: 420, rx: true, chronic: true },
    { name: 'Seroflo 250', generic: 'Salmeterol + Fluticasone', mfr: 'Cipla', cat: 'inhaler', str: '25mcg+250mcg', ps: '120 doses', mrp: 485, rx: true, chronic: true },
    { name: 'Budecort 200', generic: 'Budesonide', mfr: 'Cipla', cat: 'inhaler', str: '200mcg', ps: '200 doses', mrp: 250, rx: true, chronic: true },
    { name: 'Asthalin Inhaler', generic: 'Salbutamol', mfr: 'Cipla', cat: 'inhaler', str: '100mcg', ps: '200 doses', mrp: 125, rx: true },
    { name: 'Duolin Inhaler', generic: 'Levosalbutamol + Ipratropium', mfr: 'Cipla', cat: 'inhaler', str: '50mcg+20mcg', ps: '200 doses', mrp: 175, rx: true },

    // Anti-allergic / Skin
    { name: 'Avil 25', generic: 'Pheniramine', mfr: 'Sanofi', cat: 'tablet', str: '25mg', ps: '10 tablets', mrp: 12, rx: false },
    { name: 'Betnovate C', generic: 'Betamethasone + Clioquinol', mfr: 'GSK', cat: 'cream', str: '20g', ps: '1 tube', mrp: 62, rx: true },
    { name: 'Betnovate N', generic: 'Betamethasone + Neomycin', mfr: 'GSK', cat: 'cream', str: '20g', ps: '1 tube', mrp: 58, rx: true },
    { name: 'Candid B', generic: 'Clotrimazole + Beclometasone', mfr: 'Glenmark', cat: 'cream', str: '15g', ps: '1 tube', mrp: 78, rx: true },
    { name: 'Candid Cream', generic: 'Clotrimazole', mfr: 'Glenmark', cat: 'cream', str: '15g', ps: '1 tube', mrp: 55, rx: false },
    { name: 'Clobetasol Cream', generic: 'Clobetasol', mfr: 'Various', cat: 'cream', str: '30g', ps: '1 tube', mrp: 85, rx: true },
    { name: 'Soframycin', generic: 'Framycetin', mfr: 'Sanofi', cat: 'cream', str: '30g', ps: '1 tube', mrp: 65, rx: false },
    { name: 'Boroline', generic: 'Antiseptic Cream', mfr: 'GD Pharma', cat: 'cream', str: '20g', ps: '1 tube', mrp: 35, rx: false },
    { name: 'Panderm Plus', generic: 'Clobetasol + Ofloxacin + Miconazole + Zinc', mfr: 'Macleods', cat: 'cream', str: '15g', ps: '1 tube', mrp: 110, rx: true },
    { name: 'Fluconazole 150', generic: 'Fluconazole', mfr: 'Various', cat: 'capsule', str: '150mg', ps: '1 capsule', mrp: 15, rx: true },

    // Thyroid
    { name: 'Thyronorm 25', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '25mcg', ps: '100 tablets', mrp: 110, rx: true, chronic: true },
    { name: 'Thyronorm 50', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '50mcg', ps: '100 tablets', mrp: 130, rx: true, chronic: true },
    { name: 'Thyronorm 75', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '75mcg', ps: '100 tablets', mrp: 145, rx: true, chronic: true },
    { name: 'Thyronorm 100', generic: 'Levothyroxine', mfr: 'Abbott', cat: 'tablet', str: '100mcg', ps: '100 tablets', mrp: 160, rx: true, chronic: true },
    { name: 'Eltroxin 50', generic: 'Levothyroxine', mfr: 'GSK', cat: 'tablet', str: '50mcg', ps: '100 tablets', mrp: 95, rx: true, chronic: true },
    { name: 'Eltroxin 100', generic: 'Levothyroxine', mfr: 'GSK', cat: 'tablet', str: '100mcg', ps: '100 tablets', mrp: 135, rx: true, chronic: true },

    // Chymoral / Enzymes
    { name: 'Chymoral Forte', generic: 'Trypsin + Chymotrypsin', mfr: 'Torrent', cat: 'tablet', str: '100000AU', ps: '10 tablets', mrp: 135, rx: true },
    { name: 'Unienzyme', generic: 'Digestive Enzyme + Charcoal', mfr: 'Unichem', cat: 'tablet', str: 'Enzyme Complex', ps: '15 tablets', mrp: 28, rx: false },
    { name: 'Aristozyme', generic: 'Digestive Enzyme + Fungal Diastase', mfr: 'Aristo', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 92, rx: false },
    { name: 'Vitazyme', generic: 'Digestive Enzyme', mfr: 'East India', cat: 'syrup', str: '200ml', ps: '1 bottle', mrp: 68, rx: false },

    // Anti-anxiety / Sleep
    { name: 'Alprazolam 0.25', generic: 'Alprazolam', mfr: 'Various', cat: 'tablet', str: '0.25mg', ps: '10 tablets', mrp: 22, rx: true, controlled: true },
    { name: 'Restyl 0.5', generic: 'Alprazolam', mfr: 'Intas', cat: 'tablet', str: '0.5mg', ps: '10 tablets', mrp: 28, rx: true, controlled: true },
    { name: 'Etizola 0.5', generic: 'Etizolam', mfr: 'Sun Pharma', cat: 'tablet', str: '0.5mg', ps: '10 tablets', mrp: 32, rx: true, controlled: true },

    // Eye / Ear Drops
    { name: 'Moxifloxacin Eye Drop', generic: 'Moxifloxacin', mfr: 'Various', cat: 'drops', str: '0.5% 5ml', ps: '1 bottle', mrp: 65, rx: true },
    { name: 'Gentamicin Eye Drop', generic: 'Gentamicin', mfr: 'Various', cat: 'drops', str: '0.3% 10ml', ps: '1 bottle', mrp: 22, rx: true },
    { name: 'Refresh Tears', generic: 'Carboxymethylcellulose', mfr: 'Allergan', cat: 'drops', str: '0.5% 10ml', ps: '1 bottle', mrp: 125, rx: false },
    { name: 'Itone Eye Drop', generic: 'Herbal Eye Drop', mfr: 'Deys', cat: 'drops', str: '10ml', ps: '1 bottle', mrp: 45, rx: false },

    // Miscellaneous
    { name: 'ORS', generic: 'Oral Rehydration Salts', mfr: 'Various', cat: 'powder', str: '21.8g', ps: '5 sachets', mrp: 20, rx: false },
    { name: 'Electral Powder', generic: 'ORS', mfr: 'FDC', cat: 'powder', str: '21.8g', ps: '4 sachets', mrp: 30, rx: false },
    { name: 'Ondem 4', generic: 'Ondansetron', mfr: 'Alkem', cat: 'tablet', str: '4mg', ps: '10 tablets', mrp: 55, rx: true },
    { name: 'Emeset 4', generic: 'Ondansetron', mfr: 'Cipla', cat: 'tablet', str: '4mg', ps: '10 tablets', mrp: 48, rx: true },
    { name: 'Loperamide', generic: 'Loperamide', mfr: 'Various', cat: 'capsule', str: '2mg', ps: '10 capsules', mrp: 20, rx: false },
    { name: 'Norflox TZ', generic: 'Norfloxacin + Tinidazole', mfr: 'Cipla', cat: 'tablet', str: '400mg+600mg', ps: '10 tablets', mrp: 65, rx: true },
    { name: 'Oflomac TZ', generic: 'Ofloxacin + Tinidazole', mfr: 'Macleods', cat: 'tablet', str: '200mg+600mg', ps: '10 tablets', mrp: 52, rx: true },
    { name: 'Cremaffin', generic: 'Liquid Paraffin + Milk of Magnesia', mfr: 'Abbott', cat: 'syrup', str: '225ml', ps: '1 bottle', mrp: 145, rx: false },
    { name: 'Dulcolax', generic: 'Bisacodyl', mfr: 'Sanofi', cat: 'tablet', str: '5mg', ps: '10 tablets', mrp: 30, rx: false },
    { name: 'Isabgol', generic: 'Psyllium Husk', mfr: 'Various', cat: 'powder', str: '100g', ps: '1 pack', mrp: 60, rx: false },
    { name: 'Volini Gel', generic: 'Diclofenac Gel', mfr: 'Sun Pharma', cat: 'gel', str: '30g', ps: '1 tube', mrp: 85, rx: false },
    { name: 'Moov', generic: 'Diclofenac + Menthol', mfr: 'Reckitt', cat: 'cream', str: '50g', ps: '1 tube', mrp: 120, rx: false },
    { name: 'Iodex', generic: 'Pain Relief Balm', mfr: 'GSK', cat: 'cream', str: '40g', ps: '1 tube', mrp: 75, rx: false },
    { name: 'Burnol', generic: 'Aminacrine + Cetrimide', mfr: 'Dr Morepen', cat: 'cream', str: '20g', ps: '1 tube', mrp: 50, rx: false },
    { name: 'Betadine', generic: 'Povidone Iodine', mfr: 'Win Medicare', cat: 'solution', str: '100ml', ps: '1 bottle', mrp: 75, rx: false },
    { name: 'Dettol Antiseptic', generic: 'Chloroxylenol', mfr: 'Reckitt', cat: 'solution', str: '120ml', ps: '1 bottle', mrp: 85, rx: false },
    { name: 'Strepsils', generic: 'Amylmetacresol + Dichlorbenzyl', mfr: 'Reckitt', cat: 'lozenge', str: '8 lozenges', ps: '1 pack', mrp: 45, rx: false },
    { name: 'Vicks Vaporub', generic: 'Menthol + Camphor + Eucalyptus', mfr: 'P&G', cat: 'ointment', str: '50g', ps: '1 jar', mrp: 105, rx: false },
  ];

  // Convert to proper format
  for (const b of brands) {
    medicines.push({
      name: b.name,
      generic_name: b.generic,
      manufacturer: b.mfr,
      category: b.cat,
      composition: b.generic,
      strength: b.str,
      pack_size: parseInt(b.ps) || 10,
      mrp: b.mrp,
      is_prescription_required: b.rx || false,
      is_chronic: b.chronic || false,
      is_controlled: b.controlled || false,
    });
  }

  // Now generate variants to reach thousands
  const manufacturers = ['Cipla', 'Sun Pharma', 'Dr Reddys', 'Lupin', 'Aurobindo', 'Zydus Cadila', 'Torrent', 'Alkem', 'Glenmark', 'IPCA Labs', 'Intas', 'Mankind', 'Macleods', 'Abbott India', 'Piramal', 'Biocon', 'Natco', 'Hetero', 'Laurus Labs', 'Strides'];

  const genericDrugs = [
    { generic: 'Paracetamol', strengths: ['250mg', '500mg', '650mg', '1000mg'], cat: 'tablet' },
    { generic: 'Ibuprofen', strengths: ['200mg', '400mg', '600mg'], cat: 'tablet' },
    { generic: 'Amoxicillin', strengths: ['250mg', '500mg'], cat: 'capsule' },
    { generic: 'Ciprofloxacin', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
    { generic: 'Azithromycin', strengths: ['250mg', '500mg'], cat: 'tablet' },
    { generic: 'Metformin', strengths: ['250mg', '500mg', '850mg', '1000mg'], cat: 'tablet' },
    { generic: 'Amlodipine', strengths: ['2.5mg', '5mg', '10mg'], cat: 'tablet' },
    { generic: 'Atorvastatin', strengths: ['5mg', '10mg', '20mg', '40mg', '80mg'], cat: 'tablet' },
    { generic: 'Losartan', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Omeprazole', strengths: ['10mg', '20mg', '40mg'], cat: 'capsule' },
    { generic: 'Pantoprazole', strengths: ['20mg', '40mg'], cat: 'tablet' },
    { generic: 'Cetirizine', strengths: ['5mg', '10mg'], cat: 'tablet' },
    { generic: 'Montelukast', strengths: ['4mg', '5mg', '10mg'], cat: 'tablet' },
    { generic: 'Levothyroxine', strengths: ['12.5mcg', '25mcg', '50mcg', '75mcg', '100mcg', '125mcg', '150mcg'], cat: 'tablet' },
    { generic: 'Telmisartan', strengths: ['20mg', '40mg', '80mg'], cat: 'tablet' },
    { generic: 'Rosuvastatin', strengths: ['5mg', '10mg', '20mg', '40mg'], cat: 'tablet' },
    { generic: 'Metoprolol', strengths: ['12.5mg', '25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Clopidogrel', strengths: ['75mg'], cat: 'tablet' },
    { generic: 'Ranitidine', strengths: ['150mg', '300mg'], cat: 'tablet' },
    { generic: 'Rabeprazole', strengths: ['10mg', '20mg'], cat: 'tablet' },
    { generic: 'Cefixime', strengths: ['100mg', '200mg', '400mg'], cat: 'tablet' },
    { generic: 'Levofloxacin', strengths: ['250mg', '500mg', '750mg'], cat: 'tablet' },
    { generic: 'Doxycycline', strengths: ['100mg'], cat: 'capsule' },
    { generic: 'Gabapentin', strengths: ['100mg', '300mg', '400mg', '600mg'], cat: 'capsule' },
    { generic: 'Pregabalin', strengths: ['50mg', '75mg', '150mg', '300mg'], cat: 'capsule' },
    { generic: 'Duloxetine', strengths: ['20mg', '30mg', '60mg'], cat: 'capsule' },
    { generic: 'Escitalopram', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },
    { generic: 'Sertraline', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Fluoxetine', strengths: ['20mg', '40mg', '60mg'], cat: 'capsule' },
    { generic: 'Clonazepam', strengths: ['0.25mg', '0.5mg', '1mg', '2mg'], cat: 'tablet' },
    { generic: 'Prednisolone', strengths: ['5mg', '10mg', '20mg', '40mg'], cat: 'tablet' },
    { generic: 'Deflazacort', strengths: ['6mg', '12mg', '24mg', '30mg'], cat: 'tablet' },
    { generic: 'Aceclofenac', strengths: ['100mg', '200mg'], cat: 'tablet' },
    { generic: 'Etoricoxib', strengths: ['60mg', '90mg', '120mg'], cat: 'tablet' },
    { generic: 'Tramadol', strengths: ['50mg', '100mg'], cat: 'capsule' },
    { generic: 'Tamsulosin', strengths: ['0.2mg', '0.4mg'], cat: 'capsule' },
    { generic: 'Finasteride', strengths: ['1mg', '5mg'], cat: 'tablet' },
    { generic: 'Sildenafil', strengths: ['25mg', '50mg', '100mg'], cat: 'tablet' },
    { generic: 'Tadalafil', strengths: ['5mg', '10mg', '20mg'], cat: 'tablet' },
  ];

  // Generate manufacturer variants for each generic
  for (const drug of genericDrugs) {
    for (const mfr of manufacturers.slice(0, 8)) {
      for (const str of drug.strengths) {
        const brandPrefix = mfr.substring(0, 3).toUpperCase();
        medicines.push({
          name: `${brandPrefix}-${drug.generic.substring(0, 6)} ${str}`,
          generic_name: drug.generic,
          manufacturer: mfr,
          category: drug.cat,
          composition: drug.generic,
          strength: str,
          pack_size: 10,
          mrp: Math.floor(Math.random() * 200) + 20,
          is_prescription_required: true,
          is_chronic: false,
          is_controlled: false,
        });
      }
    }
  }

  return medicines;
}

module.exports = router;
