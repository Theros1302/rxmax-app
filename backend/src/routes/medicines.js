const express = require('express');
const { getOne, getMany } = require('../models');

const router = express.Router();

// Search medicines by name
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }

    // Full-text search on name and generic_name
    const medicines = await getMany(
      `SELECT id, name, generic_name, manufacturer, category, strength,
              pack_size, mrp, is_prescription_required, is_chronic
       FROM medicines
       WHERE to_tsvector('english', name) @@ plainto_tsquery('english', $1)
          OR to_tsvector('english', generic_name) @@ plainto_tsquery('english', $1)
       ORDER BY name ASC
       LIMIT $2`,
      [q.trim(), parseInt(limit)],
    );

    res.json({ medicines, count: medicines.length });
  } catch (error) {
    console.error('Search medicines error:', error);
    res.status(500).json({ error: 'Failed to search medicines' });
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

module.exports = router;
