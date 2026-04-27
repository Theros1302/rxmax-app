const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { query, getOne, getMany, update, insert } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { getTrendAnalytics, getStoreAnalytics } = require('../services/analytics');

const router = express.Router();

// Get store public profile
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Accept either UUID (admin links) or slug (clean URLs)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const store = await getOne(
      `SELECT id, name, slug, owner_name, phone, email, logo_url, tagline,
              address, city, state, pincode, latitude, longitude,
              delivery_radius_km, delivery_charge, min_order_amount,
              is_delivery_enabled, is_pickup_enabled, operating_hours
       FROM stores WHERE ${isUuid ? 'id' : 'slug'} = $1 AND is_active = true`,
      [slug],
    );

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// Update store profile (auth required, store role)
router.put('/profile', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const {
      name,
      tagline,
      logo_url,
      primary_color,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      delivery_radius_km,
      delivery_charge,
      min_order_amount,
      is_delivery_enabled,
      is_pickup_enabled,
      operating_hours,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (primary_color !== undefined) updateData.primary_color = primary_color;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (delivery_radius_km !== undefined) updateData.delivery_radius_km = delivery_radius_km;
    if (delivery_charge !== undefined) updateData.delivery_charge = delivery_charge;
    if (min_order_amount !== undefined) updateData.min_order_amount = min_order_amount;
    if (is_delivery_enabled !== undefined) updateData.is_delivery_enabled = is_delivery_enabled;
    if (is_pickup_enabled !== undefined) updateData.is_pickup_enabled = is_pickup_enabled;
    if (operating_hours !== undefined) updateData.operating_hours = JSON.stringify(operating_hours);
    updateData.updated_at = new Date();

    const store = await update('stores', updateData, { id: storeId });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({
      message: 'Store profile updated successfully',
      store,
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

// Dashboard summary
router.get('/dashboard/summary', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Today's orders
    const todayOrders = await getMany(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
       FROM orders
       WHERE store_id = $1 AND DATE(created_at) = $2`,
      [storeId, today],
    );

    // Pending refills
    const pendingRefills = await getMany(
      `SELECT COUNT(*) as count FROM refill_reminders
       WHERE store_id = $1 AND status = 'scheduled' AND refill_due_date <= $2`,
      [storeId, today],
    );

    // At-risk patients
    const atRiskPatients = await getMany(
      `SELECT COUNT(*) as count FROM store_patients
       WHERE store_id = $1 AND risk_level IN ('at_risk', 'lapsed')`,
      [storeId],
    );

    // Low stock items
    const lowStockItems = await getMany(
      `SELECT COUNT(*) as count FROM store_inventory
       WHERE store_id = $1 AND quantity_in_stock <= reorder_level`,
      [storeId],
    );

    res.json({
      todayOrdersCount: parseInt(todayOrders[0]?.count || 0),
      todayRevenue: parseFloat(todayOrders[0]?.revenue || 0),
      pendingRefillsCount: parseInt(pendingRefills[0]?.count || 0),
      atRiskPatientsCount: parseInt(atRiskPatients[0]?.count || 0),
      lowStockItemsCount: parseInt(lowStockItems[0]?.count || 0),
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// List all patients with CRM data
router.get('/patients', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { risk_level, tags, sort = 'lifetime_value', limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT sp.id, p.id as patient_id, p.name, p.phone, p.email,
             sp.loyalty_points, sp.lifetime_value, sp.total_orders,
             sp.adherence_score, sp.risk_level, sp.last_order_at,
             sp.tags, sp.joined_at
      FROM store_patients sp
      JOIN patients p ON sp.patient_id = p.id
      WHERE sp.store_id = $1
    `;
    const params = [storeId];
    let paramCount = 1;

    if (risk_level) {
      paramCount++;
      sql += ` AND sp.risk_level = $${paramCount}`;
      params.push(risk_level);
    }

    if (tags) {
      paramCount++;
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      sql += ` AND sp.tags && $${paramCount}::text[]`;
      params.push(tagsArray);
    }

    // Order by
    const validSorts = ['lifetime_value', 'adherence_score', 'last_order_at', 'joined_at'];
    const sortBy = validSorts.includes(sort) ? sort : 'lifetime_value';
    sql += ` ORDER BY sp.${sortBy} DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const patients = await getMany(sql, params);

    res.json({
      patients,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('List patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Single patient detail with order history
router.get('/patients/:patientId', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { patientId } = req.params;

    const patient = await getOne(
      `SELECT sp.*, p.name, p.phone, p.email, p.date_of_birth, p.gender,
              p.blood_group, p.allergies, p.conditions, p.address, p.city, p.pincode
       FROM store_patients sp
       JOIN patients p ON sp.patient_id = p.id
       WHERE sp.store_id = $1 AND sp.patient_id = $2`,
      [storeId, patientId],
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Order history
    const orders = await getMany(
      `SELECT id, order_number, status, total_amount, created_at
       FROM orders
       WHERE store_id = $1 AND patient_id = $2
       ORDER BY created_at DESC LIMIT 20`,
      [storeId, patientId],
    );

    res.json({
      patient,
      orders,
    });
  } catch (error) {
    console.error('Get patient detail error:', error);
    res.status(500).json({ error: 'Failed to fetch patient detail' });
  }
});

// Get patient order history (new enhanced endpoint)
router.get('/patients/:patientId/orders', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { patientId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const orders = await getMany(
      `SELECT id, order_number, status, subtotal, delivery_charge, total_amount,
              delivery_type, created_at
       FROM orders
       WHERE store_id = $1 AND patient_id = $2
       ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [storeId, patientId, parseInt(limit), parseInt(offset)],
    );

    const totalResult = await getOne(
      `SELECT COUNT(*) as count FROM orders WHERE store_id = $1 AND patient_id = $2`,
      [storeId, patientId],
    );

    res.json({
      orders,
      total: parseInt(totalResult?.count || 0),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get patient order history error:', error);
    res.status(500).json({ error: 'Failed to fetch patient order history' });
  }
});

// List inventory with alerts
router.get('/inventory', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { alert_type, limit = 100 } = req.query;

    let sql = `
      SELECT si.id, si.medicine_id, si.quantity_in_stock, si.reorder_level,
             si.selling_price, si.discount_percent, si.batch_number, si.expiry_date,
             si.is_available, m.name, m.generic_name, m.strength, m.pack_size,
             (si.quantity_in_stock <= si.reorder_level) as low_stock,
             (si.expiry_date <= CURRENT_DATE + INTERVAL '30 days') as expiring_soon
      FROM store_inventory si
      JOIN medicines m ON si.medicine_id = m.id
      WHERE si.store_id = $1 AND si.is_available = true
    `;
    const params = [storeId];

    if (alert_type === 'low_stock') {
      sql += ` AND si.quantity_in_stock <= si.reorder_level`;
    } else if (alert_type === 'expiring') {
      sql += ` AND si.expiry_date <= CURRENT_DATE + INTERVAL '30 days'`;
    }

    sql += ` ORDER BY si.updated_at DESC LIMIT $2`;
    params.push(parseInt(limit));

    const inventory = await getMany(sql, params);
    res.json({ inventory });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Add/update inventory item
router.post('/inventory', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const {
      medicine_id,
      quantity_in_stock,
      reorder_level,
      selling_price,
      discount_percent,
      batch_number,
      expiry_date,
    } = req.body;

    if (!medicine_id || quantity_in_stock === undefined || !selling_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if exists
    const existing = await getOne(
      `SELECT id FROM store_inventory
       WHERE store_id = $1 AND medicine_id = $2 AND batch_number = $3`,
      [storeId, medicine_id, batch_number || null],
    );

    let inventory;
    if (existing) {
      inventory = await update(
        'store_inventory',
        {
          quantity_in_stock,
          reorder_level: reorder_level || 10,
          selling_price,
          discount_percent: discount_percent || 0,
          expiry_date,
          updated_at: new Date(),
        },
        { id: existing.id },
      );
    } else {
      inventory = await query(
        `INSERT INTO store_inventory
         (id, store_id, medicine_id, quantity_in_stock, reorder_level, selling_price,
          discount_percent, batch_number, expiry_date, is_available, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW())
         RETURNING *`,
        [
          uuidv4(),
          storeId,
          medicine_id,
          quantity_in_stock,
          reorder_level || 10,
          selling_price,
          discount_percent || 0,
          batch_number,
          expiry_date,
        ],
      );
      inventory = inventory.rows[0];
    }

    res.status(201).json({
      message: 'Inventory updated successfully',
      inventory,
    });
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// Bulk inventory upload
router.post('/inventory/bulk', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array required' });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];
        const {
          medicine_id,
          quantity_in_stock,
          reorder_level,
          selling_price,
          discount_percent,
          batch_number,
          expiry_date,
        } = item;

        if (!medicine_id || quantity_in_stock === undefined || !selling_price) {
          errors.push({ index: i, error: 'Missing required fields' });
          continue;
        }

        const existing = await getOne(
          `SELECT id FROM store_inventory
           WHERE store_id = $1 AND medicine_id = $2 AND batch_number = $3`,
          [storeId, medicine_id, batch_number || null],
        );

        let inventory;
        if (existing) {
          inventory = await update(
            'store_inventory',
            {
              quantity_in_stock,
              reorder_level: reorder_level || 10,
              selling_price,
              discount_percent: discount_percent || 0,
              expiry_date,
              updated_at: new Date(),
            },
            { id: existing.id },
          );
        } else {
          inventory = await insert('store_inventory', {
            id: uuidv4(),
            store_id: storeId,
            medicine_id,
            quantity_in_stock,
            reorder_level: reorder_level || 10,
            selling_price,
            discount_percent: discount_percent || 0,
            batch_number,
            expiry_date,
            is_available: true,
          });
        }

        results.push(inventory);
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    res.json({
      message: `Bulk upload completed: ${results.length} successful, ${errors.length} failed`,
      successful: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Bulk inventory upload error:', error);
    res.status(500).json({ error: 'Failed to process bulk upload' });
  }
});

// Revenue alerts - upcoming refills with revenue at risk
router.get('/revenue-alerts', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;

    const alerts = await getMany(
      `SELECT rr.id, rr.patient_id, rr.medicine_name, rr.refill_due_date,
              rr.escalation_level, rr.estimated_order_value,
              p.name as patient_name, p.phone,
              sp.risk_level, sp.adherence_score
       FROM refill_reminders rr
       JOIN patients p ON rr.patient_id = p.id
       LEFT JOIN store_patients sp ON sp.store_id = $1 AND sp.patient_id = p.id
       WHERE rr.store_id = $1 AND rr.status = 'scheduled'
       AND rr.refill_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
       ORDER BY rr.refill_due_date ASC`,
      [storeId],
    );

    const totalRevenue = alerts.reduce((sum, alert) => sum + parseFloat(alert.estimated_order_value || 0), 0);

    res.json({
      alerts,
      totalRevenueAtRisk: totalRevenue,
      alertCount: alerts.length,
    });
  } catch (error) {
    console.error('Revenue alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue alerts' });
  }
});

// Detailed analytics with date range filter
router.get('/analytics/detailed', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const analytics = await getStoreAnalytics(storeId);
    const trends = await getTrendAnalytics(storeId, startDate, endDate);

    res.json({
      analytics,
      trends,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error('Get detailed analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch detailed analytics' });
  }
});

// Daily report generation
router.get('/reports/daily', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    const stats = await getOne(
      `SELECT * FROM store_daily_stats WHERE store_id = $1 AND date = $2`,
      [storeId, reportDate],
    );

    if (!stats) {
      return res.json({
        date: reportDate,
        message: 'No data available for this date',
      });
    }

    res.json({
      date: reportDate,
      report: stats,
    });
  } catch (error) {
    console.error('Get daily report error:', error);
    res.status(500).json({ error: 'Failed to fetch daily report' });
  }
});

// Monthly report generation
router.get('/reports/monthly', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { month, year } = req.query;
    const now = new Date();
    const reportMonth = month || now.getMonth() + 1;
    const reportYear = year || now.getFullYear();

    const startDate = `${reportYear}-${String(reportMonth).padStart(2, '0')}-01`;
    const endDate = `${reportYear}-${String(reportMonth).padStart(2, '0')}-31`;

    const stats = await getMany(
      `SELECT * FROM store_daily_stats WHERE store_id = $1 AND date BETWEEN $2 AND $3
       ORDER BY date ASC`,
      [storeId, startDate, endDate],
    );

    const totals = {
      total_orders: stats.reduce((sum, s) => sum + (s.total_orders || 0), 0),
      total_revenue: stats.reduce((sum, s) => sum + parseFloat(s.total_revenue || 0), 0),
      refill_orders: stats.reduce((sum, s) => sum + (s.refill_orders || 0), 0),
      new_patients: stats.reduce((sum, s) => sum + (s.new_patients || 0), 0),
      reminders_converted: stats.reduce((sum, s) => sum + (s.reminders_converted || 0), 0),
      revenue_recovered: stats.reduce((sum, s) => sum + parseFloat(s.revenue_recovered || 0), 0),
    };

    res.json({
      month: reportMonth,
      year: reportYear,
      dailyStats: stats,
      monthlyTotals: totals,
    });
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly report' });
  }
});

module.exports = router;
