const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { authenticateToken, requireRole, generateToken } = require('../middleware/auth');
const { getOne, getMany, update, insert, query } = require('../models');
const {
  getPlatformDashboard,
  getRevenueByCity,
  getTopStores,
  getTopMedicines,
  getStoreAnalytics,
  getTrendAnalytics,
} = require('../services/analytics');
const { v4: uuidv4 } = require('uuid');

// Hardcoded admin credentials for MVP
const ADMIN_PHONE = process.env.ADMIN_PHONE || '9999999999';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'rxmaxadmin2026';

// ====================================
// ADMIN AUTH MIDDLEWARE
// ====================================
const requireAdmin = requireRole(['admin']);

// ====================================
// 1. POST /api/admin/login
// ====================================
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    // Check credentials (MVP: plaintext comparison, TODO: use bcrypt)
    if (phone === ADMIN_PHONE && password === ADMIN_PASSWORD) {
      const token = generateToken('admin', 'admin', {
        adminId: 'prashant',
        adminName: 'Prashant (Platform Owner)',
      });

      return res.json({
        message: 'Admin login successful',
        token,
        admin: {
          id: 'prashant',
          name: 'Prashant (Platform Owner)',
          role: 'admin',
        },
      });
    }

    return res.status(401).json({ error: 'Invalid phone or password' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ====================================
// 2. GET /api/admin/dashboard
// Platform-wide dashboard metrics
// ====================================
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const dashboard = await getPlatformDashboard();
    res.json(dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// ====================================
// 3. GET /api/admin/stores
// List all stores with pagination, search, filters
// ====================================
router.get('/stores', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { city, plan, status = 'active', search, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT
        s.id,
        s.name,
        s.slug,
        s.city,
        s.phone,
        s.plan,
        s.is_active,
        s.is_verified,
        s.created_at,
        COUNT(DISTINCT sp.patient_id) as patient_count,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM stores s
      LEFT JOIN store_patients sp ON s.id = sp.store_id AND sp.is_active = true
      LEFT JOIN orders o ON s.id = o.store_id AND o.status IN ('confirmed', 'ready', 'out_for_delivery', 'delivered', 'picked_up')
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (status === 'active') {
      sql += ` AND s.is_active = true`;
    } else if (status === 'inactive') {
      sql += ` AND s.is_active = false`;
    }

    if (city) {
      paramCount++;
      sql += ` AND s.city = $${paramCount}`;
      params.push(city);
    }

    if (plan) {
      paramCount++;
      sql += ` AND s.plan = $${paramCount}`;
      params.push(plan);
    }

    if (search) {
      paramCount++;
      sql += ` AND (s.name ILIKE $${paramCount} OR s.phone LIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    sql += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await getMany(sql, params);
    const stores = result.map(store => ({
      ...store,
      patient_count: parseInt(store.patient_count),
      total_orders: parseInt(store.total_orders),
      total_revenue: parseFloat(store.total_revenue),
    }));

    res.json({
      total_stores: stores.length,
      stores,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// ====================================
// 4. GET /api/admin/stores/:id
// Single store detail with full metrics
// ====================================
router.get('/stores/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const store = await getOne(`
      SELECT * FROM stores WHERE id = $1
    `, [id]);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const analytics = await getStoreAnalytics(id);

    res.json({
      store,
      analytics,
    });
  } catch (error) {
    console.error('Get store detail error:', error);
    res.status(500).json({ error: 'Failed to fetch store detail' });
  }
});

// ====================================
// 5. PUT /api/admin/stores/:id
// Update store (activate/deactivate, change plan, verify)
// ====================================
router.put('/stores/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, plan, is_verified } = req.body;

    const updateData = {};
    if (is_active !== undefined) updateData.is_active = is_active;
    if (plan !== undefined) updateData.plan = plan;
    if (is_verified !== undefined) updateData.is_verified = is_verified;
    updateData.updated_at = new Date();

    if (Object.keys(updateData).length === 1) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const updatedStore = await update('stores', updateData, { id });

    if (!updatedStore) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({
      message: 'Store updated successfully',
      store: updatedStore,
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

// ====================================
// 5b. POST /api/admin/stores
// Admin creates a new store
// ====================================
router.post('/stores', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    const name = body.name;
    const owner_name = body.owner_name;
    const phone = body.phone;
    const email = body.email;
    const password = body.password;
    const address = body.address;
    const city = body.city;
    const state = body.state;
    const pincode = body.pincode;
    const license_number = body.license_number || null;
    const gst_number = body.gst_number || null;

    // Validation
    // Password is optional. Auto-generate a friendly one if admin didn't provide.
    let temporaryPasswordGenerated = false;
    let effectivePassword = password;
    if (!effectivePassword) {
      const syllables = ['rxmax', 'pharma', 'apollo', 'clinic', 'medic', 'health', 'care', 'plus'];
      const word = syllables[Math.floor(Math.random() * syllables.length)];
      const digits = Math.floor(1000 + Math.random() * 9000);
      effectivePassword = `${word}${digits}!`;
      temporaryPasswordGenerated = true;
    }

    if (!name || !owner_name || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Missing required fields: name, owner_name, phone, address, city, state, pincode' });
    }

    if (effectivePassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if phone already registered
    const existingStore = await getOne('SELECT id FROM stores WHERE phone = $1', [phone]);
    if (existingStore) {
      return res.status(409).json({ error: 'A store with this phone number already exists' });
    }

    // Generate slug from store name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '') + `-${uuidv4().slice(0, 4)}`;

    // Hash password
    const passwordHash = await bcrypt.hash(effectivePassword, 10);

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

    res.status(201).json({
      message: 'Store created successfully',
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        phone: store.phone,
        email: store.email,
        city: store.city,
      },
      // Returned ONCE on creation. Admin must share these with the store owner.
      temporary_password: effectivePassword,
      temporary_password_generated: temporaryPasswordGenerated,
      patient_onboarding_link: `https://rxmax-patient-app.vercel.app/store/${store.slug}`,
      store_login_link: 'https://rxmax-store-dashboard.vercel.app',
    });
  } catch (error) {
    console.error('Admin create store error:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// ====================================
// 6. GET /api/admin/patients
// List all patients across all stores
// ====================================
router.get('/patients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { city, risk_level, store_id, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT
        p.id,
        p.phone,
        p.name,
        p.email,
        p.city,
        p.created_at,
        sp.loyalty_points,
        sp.lifetime_value,
        sp.total_orders,
        sp.adherence_score,
        sp.risk_level,
        sp.last_order_at,
        COUNT(DISTINCT s.id) as store_count
      FROM patients p
      LEFT JOIN store_patients sp ON p.id = sp.patient_id AND sp.is_active = true
      LEFT JOIN stores s ON sp.store_id = s.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (city) {
      paramCount++;
      sql += ` AND p.city = $${paramCount}`;
      params.push(city);
    }

    if (risk_level) {
      paramCount++;
      sql += ` AND sp.risk_level = $${paramCount}`;
      params.push(risk_level);
    }

    if (store_id) {
      paramCount++;
      sql += ` AND sp.store_id = $${paramCount}`;
      params.push(store_id);
    }

    sql += ` GROUP BY p.id, sp.id ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const patients = await getMany(sql, params);

    res.json({
      patients,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// ====================================
// 7. GET /api/admin/orders
// List all orders across all stores with filters
// ====================================
router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, city, startDate, endDate, store_id, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.subtotal,
        o.delivery_charge,
        o.total_amount,
        o.delivery_type,
        o.created_at,
        s.name as store_name,
        s.city,
        p.name as patient_name,
        p.phone
      FROM orders o
      INNER JOIN stores s ON o.store_id = s.id
      INNER JOIN patients p ON o.patient_id = p.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      sql += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    if (city) {
      paramCount++;
      sql += ` AND s.city = $${paramCount}`;
      params.push(city);
    }

    if (store_id) {
      paramCount++;
      sql += ` AND o.store_id = $${paramCount}`;
      params.push(store_id);
    }

    if (startDate) {
      paramCount++;
      sql += ` AND o.created_at::date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      sql += ` AND o.created_at::date <= $${paramCount}`;
      params.push(endDate);
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const orders = await getMany(sql, params);

    res.json({
      orders,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ====================================
// 8. GET /api/admin/analytics
// Platform analytics with detailed breakdown
// ====================================
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const dashboard = await getPlatformDashboard();
    const revenueByCity = await getRevenueByCity();
    const topStores = await getTopStores(10);
    const topMedicines = await getTopMedicines(15);

    res.json({
      summary: dashboard,
      revenueByCity,
      topStores,
      topMedicines,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ====================================
// 9. GET /api/admin/analytics/stores
// Store comparison analytics
// ====================================
router.get('/analytics/stores', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { city } = req.query;

    const topStores = await getTopStores(50);
    const filteredStores = city
      ? topStores.filter(s => s.city === city)
      : topStores;

    res.json({
      filter: city ? { city } : null,
      stores: filteredStores,
      totalStores: filteredStores.length,
    });
  } catch (error) {
    console.error('Get store analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch store analytics' });
  }
});

// ====================================
// 10. GET /api/admin/refills
// Platform-wide refill analytics
// ====================================
router.get('/refills', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const refillData = await getMany(`
      SELECT
        s.id as store_id,
        s.name as store_name,
        COUNT(*) as total_reminders,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count,
        SUM(CASE WHEN patient_response = 'ordered' THEN 1 ELSE 0 END) as converted_count,
        COALESCE(SUM(CASE WHEN patient_response = 'ordered' THEN estimated_order_value ELSE 0 END), 0) as revenue_from_refills,
        AVG(escalation_level) as avg_escalation_level
      FROM refill_reminders rr
      INNER JOIN stores s ON rr.store_id = s.id
      GROUP BY s.id, s.name
      ORDER BY revenue_from_refills DESC
    `);

    const totals = await getOne(`
      SELECT
        COUNT(*) as total_reminders,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count,
        SUM(CASE WHEN patient_response = 'ordered' THEN 1 ELSE 0 END) as converted_count,
        COALESCE(SUM(CASE WHEN patient_response = 'ordered' THEN estimated_order_value ELSE 0 END), 0) as total_revenue
      FROM refill_reminders
    `);

    res.json({
      summary: {
        totalReminders: parseInt(totals?.total_reminders || 0),
        scheduledCount: parseInt(totals?.scheduled_count || 0),
        convertedCount: parseInt(totals?.converted_count || 0),
        totalRevenue: parseFloat(totals?.total_revenue || 0),
      },
      byStore: refillData.map(row => ({
        storeId: row.store_id,
        storeName: row.store_name,
        totalReminders: parseInt(row.total_reminders),
        scheduledCount: parseInt(row.scheduled_count),
        convertedCount: parseInt(row.converted_count),
        revenueFromRefills: parseFloat(row.revenue_from_refills),
        avgEscalationLevel: parseFloat(row.avg_escalation_level || 0),
      })),
    });
  } catch (error) {
    console.error('Get refills analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch refill analytics' });
  }
});

// ====================================
// 11. POST /api/admin/stores/:id/notify
// Send notification to store
// ====================================
router.post('/stores/:id/notify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id: storeId } = req.params;
    const { title, body, channel = 'in_app' } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const notification = await insert('notifications', {
      id: uuidv4(),
      recipient_type: 'store',
      recipient_id: storeId,
      title,
      body,
      channel,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Notification sent',
      notification,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ====================================
// 12. POST /api/admin/broadcast
// Broadcast to all stores
// ====================================
router.post('/broadcast', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, body, channel = 'in_app', filters = {} } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    let storeQuery = 'SELECT id FROM stores WHERE is_active = true';
    const params = [];
    let paramCount = 0;

    if (filters.city) {
      paramCount++;
      storeQuery += ` AND city = $${paramCount}`;
      params.push(filters.city);
    }

    if (filters.plan) {
      paramCount++;
      storeQuery += ` AND plan = $${paramCount}`;
      params.push(filters.plan);
    }

    const stores = await getMany(storeQuery, params);

    const notifications = [];
    for (const store of stores) {
      const notification = await insert('notifications', {
        id: uuidv4(),
        recipient_type: 'store',
        recipient_id: store.id,
        title,
        body,
        channel,
        status: 'pending',
      });
      notifications.push(notification);
    }

    res.status(201).json({
      message: `Broadcast to ${notifications.length} stores`,
      notificationCount: notifications.length,
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to broadcast' });
  }
});

// ====================================
// 13. GET /api/admin/analytics/trends
// Get trend data for a date range
// ====================================
router.get('/analytics/trends', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const trends = await getTrendAnalytics(null, startDate, endDate);

    res.json({
      dateRange: { startDate, endDate },
      trends,
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

module.exports = router;
