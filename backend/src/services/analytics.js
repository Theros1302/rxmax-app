/**
 * Analytics Service
 * Provides comprehensive analytics queries for admin and store dashboards
 */

const { getOne, getMany, query } = require('../models');

/**
 * Get platform-wide dashboard metrics
 */
async function getPlatformDashboard() {
  try {
    // Total stores count
    const storesResult = await getOne('SELECT COUNT(*) as count FROM stores WHERE is_active = true');
    const totalStores = parseInt(storesResult?.count || 0);

    // Total patients count
    const patientsResult = await getOne('SELECT COUNT(DISTINCT patient_id) as count FROM store_patients WHERE is_active = true');
    const totalPatients = parseInt(patientsResult?.count || 0);

    // Total orders count
    const ordersResult = await getOne(`
      SELECT COUNT(*) as count FROM orders
      WHERE status IN ('confirmed', 'ready', 'out_for_delivery', 'delivered', 'picked_up')
    `);
    const totalOrders = parseInt(ordersResult?.count || 0);

    // Total revenue
    const revenueResult = await getOne(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders
      WHERE status IN ('confirmed', 'ready', 'out_for_delivery', 'delivered', 'picked_up')
    `);
    const totalRevenue = parseFloat(revenueResult?.total || 0);

    // Growth rates (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const recentOrders = await getOne(`
      SELECT COUNT(*) as count FROM orders
      WHERE status IN ('confirmed', 'ready', 'out_for_delivery', 'delivered', 'picked_up')
      AND created_at::date >= $1
    `, [thirtyDaysAgo]);

    const previousOrders = await getOne(`
      SELECT COUNT(*) as count FROM orders
      WHERE status IN ('confirmed', 'ready', 'out_for_delivery', 'delivered', 'picked_up')
      AND created_at::date BETWEEN $1 AND $2
    `, [sixtyDaysAgo, thirtyDaysAgo]);

    const orderGrowth = previousOrders?.count > 0
      ? ((parseInt(recentOrders?.count || 0) - parseInt(previousOrders?.count)) / parseInt(previousOrders?.count)) * 100
      : 0;

    return {
      totalStores,
      totalPatients,
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      orderGrowthPercent: parseFloat(orderGrowth.toFixed(2)),
    };
  } catch (error) {
    console.error('Get platform dashboard error:', error);
    throw error;
  }
}

/**
 * Get revenue analytics by city
 */
async function getRevenueByCity() {
  try {
    const results = await getMany(`
      SELECT
        s.city,
        COUNT(DISTINCT s.id) as store_count,
        COUNT(DISTINCT o.patient_id) as unique_patients,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        AVG(o.total_amount) as avg_order_value
      FROM stores s
      LEFT JOIN orders o ON s.id = o.store_id AND o.status IN ('confirmed', 'ready', 'out_for_delivery', 'delivered', 'picked_up')
      WHERE s.is_active = true
      GROUP BY s.city
      ORDER BY total_revenue DESC
    `);

    return results.map(row => ({
      city: row.city,
      storeCount: parseInt(row.store_count),
      uniquePatients: parseInt(row.unique_patients),
      orderCount: parseInt(row.order_count),
      totalRevenue: parseFloat(row.total_revenue),
      avgOrderValue: parseFloat(row.avg_order_value || 0),
    }));
  } catch (error) {
    console.error('Get revenue by city error:', error);
    throw error;
  }
}

/**
 * Get top performing stores
 */
async function getTopStores(limit = 20) {
  try {
    const results = await getMany(`
      SELECT
        s.id,
        s.name,
        s.slug,
        s.city,
        COUNT(DISTINCT sp.patient_id) as patient_count,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        AVG(o.total_amount) as avg_order_value,
        AVG(sp.adherence_score) as avg_adherence_score
      FROM stores s
      LEFT JOIN store_patients sp ON s.id = sp.store_id AND sp.is_active = true
      LEFT JOIN orders o ON s.id = o.store_id AND o.status IN ('confirmed', 'ready', 'out_for_delivery', 'delivered', 'picked_up')
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.slug, s.city
      ORDER BY total_revenue DESC
      LIMIT $1
    `, [limit]);

    return results.map(row => ({
      storeId: row.id,
      storeName: row.name,
      slug: row.slug,
      city: row.city,
      patientCount: parseInt(row.patient_count),
      orderCount: parseInt(row.order_count),
      totalRevenue: parseFloat(row.total_revenue),
      avgOrderValue: parseFloat(row.avg_order_value || 0),
      avgAdherenceScore: parseFloat(row.avg_adherence_score || 0),
    }));
  } catch (error) {
    console.error('Get top stores error:', error);
    throw error;
  }
}

/**
 * Get top medicines by orders and revenue
 */
async function getTopMedicines(limit = 20) {
  try {
    const results = await getMany(`
      SELECT
        oi.medicine_name as name,
        COUNT(DISTINCT o.id) as order_count,
        SUM(oi.quantity) as total_quantity,
        COALESCE(SUM(oi.total_price), 0) as total_revenue,
        AVG(oi.unit_price) as avg_price
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('confirmed', 'ready', 'out_for_delivery', 'delivered', 'picked_up')
      GROUP BY oi.medicine_name
      ORDER BY order_count DESC
      LIMIT $1
    `, [limit]);

    return results.map(row => ({
      medicineName: row.name,
      orderCount: parseInt(row.order_count),
      totalQuantity: parseInt(row.total_quantity),
      totalRevenue: parseFloat(row.total_revenue),
      avgPrice: parseFloat(row.avg_price || 0),
    }));
  } catch (error) {
    console.error('Get top medicines error:', error);
    throw error;
  }
}

/**
 * Get store-specific analytics
 */
async function getStoreAnalytics(storeId) {
  try {
    // Basic metrics
    const storeMetrics = await getOne(`
      SELECT
        COUNT(DISTINCT sp.patient_id) as patient_count,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        AVG(sp.adherence_score) as avg_adherence_score,
        AVG(sp.lifetime_value) as avg_customer_value
      FROM stores s
      LEFT JOIN store_patients sp ON s.id = sp.store_id AND sp.is_active = true
      LEFT JOIN orders o ON s.id = o.store_id AND o.status IN ('confirmed', 'ready', 'out_for_delivery', 'delivered', 'picked_up')
      WHERE s.id = $1
    `, [storeId]);

    // Risk analysis
    const riskAnalysis = await getMany(`
      SELECT
        risk_level,
        COUNT(DISTINCT patient_id) as patient_count
      FROM store_patients
      WHERE store_id = $1 AND is_active = true
      GROUP BY risk_level
    `, [storeId]);

    // Orders by status
    const ordersByStatus = await getMany(`
      SELECT
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE store_id = $1
      GROUP BY status
    `, [storeId]);

    // Top medicines
    const topMedicines = await getMany(`
      SELECT
        oi.medicine_name,
        COUNT(DISTINCT o.id) as order_count,
        SUM(oi.quantity) as total_quantity,
        COALESCE(SUM(oi.total_price), 0) as revenue
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id = $1 AND o.status IN ('confirmed', 'ready', 'out_for_delivery', 'delivered', 'picked_up')
      GROUP BY oi.medicine_name
      ORDER BY order_count DESC
      LIMIT 10
    `, [storeId]);

    // Refill metrics
    const refillMetrics = await getOne(`
      SELECT
        COUNT(*) as total_reminders,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count,
        SUM(CASE WHEN patient_response = 'ordered' THEN 1 ELSE 0 END) as converted_count,
        COALESCE(SUM(CASE WHEN patient_response = 'ordered' THEN estimated_order_value ELSE 0 END), 0) as revenue_from_refills
      FROM refill_reminders
      WHERE store_id = $1
    `, [storeId]);

    return {
      metrics: storeMetrics ? {
        patientCount: parseInt(storeMetrics.patient_count),
        totalOrders: parseInt(storeMetrics.total_orders),
        totalRevenue: parseFloat(storeMetrics.total_revenue),
        avgAdherenceScore: parseFloat(storeMetrics.avg_adherence_score || 0),
        avgCustomerValue: parseFloat(storeMetrics.avg_customer_value || 0),
      } : null,
      riskAnalysis: riskAnalysis.reduce((acc, row) => {
        acc[row.risk_level] = parseInt(row.patient_count);
        return acc;
      }, {}),
      ordersByStatus: ordersByStatus.map(row => ({
        status: row.status,
        count: parseInt(row.count),
        revenue: parseFloat(row.revenue),
      })),
      topMedicines: topMedicines.map(row => ({
        medicineName: row.medicine_name,
        orderCount: parseInt(row.order_count),
        totalQuantity: parseInt(row.total_quantity),
        revenue: parseFloat(row.revenue),
      })),
      refillMetrics: refillMetrics ? {
        totalReminders: parseInt(refillMetrics.total_reminders),
        scheduledCount: parseInt(refillMetrics.scheduled_count),
        convertedCount: parseInt(refillMetrics.converted_count),
        revenueFromRefills: parseFloat(refillMetrics.revenue_from_refills),
      } : null,
    };
  } catch (error) {
    console.error('Get store analytics error:', error);
    throw error;
  }
}

/**
 * Get trend data for date range
 */
async function getTrendAnalytics(storeId = null, startDate, endDate) {
  try {
    let sql = `
      SELECT
        DATE(o.created_at) as date,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COUNT(DISTINCT o.patient_id) as unique_patients
      FROM orders o
      WHERE o.status IN ('confirmed', 'ready', 'out_for_delivery', 'delivered', 'picked_up')
      AND o.created_at::date BETWEEN $1 AND $2
    `;

    const params = [startDate, endDate];

    if (storeId) {
      sql += ` AND o.store_id = $3`;
      params.push(storeId);
    }

    sql += ` GROUP BY DATE(o.created_at) ORDER BY date ASC`;

    const results = await getMany(sql, params);

    return results.map(row => ({
      date: row.date,
      orderCount: parseInt(row.order_count),
      revenue: parseFloat(row.revenue),
      uniquePatients: parseInt(row.unique_patients),
    }));
  } catch (error) {
    console.error('Get trend analytics error:', error);
    throw error;
  }
}

module.exports = {
  getPlatformDashboard,
  getRevenueByCity,
  getTopStores,
  getTopMedicines,
  getStoreAnalytics,
  getTrendAnalytics,
};
