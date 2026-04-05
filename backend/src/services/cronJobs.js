/**
 * Cron Jobs Service
 * Handles scheduled tasks like refill escalation, daily stats aggregation, and expiry alerts
 */

const cron = require('node-cron');
const { getMany, query, insert, update, getOne } = require('../models');
const { v4: uuidv4 } = require('uuid');

let jobsRegistry = [];

/**
 * Initialize all cron jobs
 */
function initCronJobs() {
  console.log('Initializing cron jobs...');

  // Daily refill escalation processing - runs at 9 AM
  scheduleRefillEscalationJob();

  // Daily store stats aggregation - runs at 11 PM
  scheduleDailyStatsJob();

  // Weekly patient risk assessment - runs every Monday at 2 AM
  scheduleWeeklyRiskAssessmentJob();

  // Daily inventory expiry alerts - runs at 8 AM
  scheduleExpiryAlertsJob();

  console.log(`Successfully initialized ${jobsRegistry.length} cron jobs`);
}

/**
 * Schedule daily refill escalation processing
 * Escalates refill reminders based on due dates
 */
function scheduleRefillEscalationJob() {
  const job = cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running daily refill escalation job...');
    try {
      await processRefillEscalations();
      console.log('[CRON] Refill escalation job completed');
    } catch (error) {
      console.error('[CRON] Refill escalation job error:', error);
    }
  });

  jobsRegistry.push({
    name: 'Refill Escalation',
    schedule: '0 9 * * * (Daily at 9 AM)',
    status: 'active',
    job,
  });
}

/**
 * Process refill escalation logic
 */
async function processRefillEscalations() {
  const today = new Date().toISOString().split('T')[0];

  // Get all overdue reminders
  const overdueReminders = await getMany(`
    SELECT id, escalation_level, refill_due_date, push_sent_at, whatsapp_sent_at, sms_sent_at
    FROM refill_reminders
    WHERE status IN ('scheduled', 'sent')
    AND patient_response IS NULL
    AND refill_due_date <= CURRENT_DATE
    ORDER BY refill_due_date ASC
  `);

  console.log(`[CRON] Processing ${overdueReminders.length} overdue refill reminders`);

  for (const reminder of overdueReminders) {
    const daysOverdue = Math.floor(
      (new Date(today) - new Date(reminder.refill_due_date)) / (1000 * 60 * 60 * 24)
    );

    let newLevel = reminder.escalation_level || 0;
    let shouldEscalate = false;

    // Escalation logic
    if (daysOverdue >= 30) {
      newLevel = 5; // Lapsed - gentle check-in
      shouldEscalate = newLevel > reminder.escalation_level;
    } else if (daysOverdue >= 5) {
      newLevel = 3; // Urgent reminder
      shouldEscalate = newLevel > reminder.escalation_level;
    } else if (daysOverdue >= 2 && reminder.push_sent_at) {
      newLevel = 2; // Follow-up
      shouldEscalate = newLevel > reminder.escalation_level;
    } else if (daysOverdue >= 0 && !reminder.push_sent_at) {
      newLevel = 1; // First reminder
      shouldEscalate = newLevel > reminder.escalation_level;
    }

    if (shouldEscalate) {
      await update('refill_reminders', { escalation_level: newLevel }, { id: reminder.id });
      console.log(`[CRON] Escalated reminder ${reminder.id} to level ${newLevel}`);
    }
  }
}

/**
 * Schedule daily stats aggregation
 * Aggregates daily order and revenue stats
 */
function scheduleDailyStatsJob() {
  const job = cron.schedule('0 23 * * *', async () => {
    console.log('[CRON] Running daily stats aggregation job...');
    try {
      await aggregateDailyStats();
      console.log('[CRON] Daily stats aggregation job completed');
    } catch (error) {
      console.error('[CRON] Daily stats aggregation job error:', error);
    }
  });

  jobsRegistry.push({
    name: 'Daily Stats Aggregation',
    schedule: '0 23 * * * (Daily at 11 PM)',
    status: 'active',
    job,
  });
}

/**
 * Aggregate daily stats for all stores
 */
async function aggregateDailyStats() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const stores = await getMany('SELECT id FROM stores WHERE is_active = true');

  for (const store of stores) {
    try {
      const stats = await getOne(`
        SELECT
          COUNT(*) as total_orders,
          SUM(CASE WHEN order_type = 'refill' THEN 1 ELSE 0 END) as refill_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COUNT(DISTINCT DATE(created_at)) as days_with_orders
        FROM orders
        WHERE store_id = $1 AND DATE(created_at) = $2
      `, [store.id, yesterday]);

      const newPatients = await getOne(`
        SELECT COUNT(*) as count
        FROM store_patients
        WHERE store_id = $1 AND DATE(joined_at) = $2
      `, [store.id, yesterday]);

      const activePatients = await getOne(`
        SELECT COUNT(DISTINCT patient_id) as count
        FROM store_patients
        WHERE store_id = $1 AND is_active = true
      `, [store.id]);

      const refillMetrics = await getOne(`
        SELECT
          COUNT(*) as reminders_sent,
          SUM(CASE WHEN patient_response = 'ordered' THEN 1 ELSE 0 END) as reminders_converted,
          COALESCE(SUM(CASE WHEN patient_response = 'ordered' THEN estimated_order_value ELSE 0 END), 0) as revenue_recovered
        FROM refill_reminders
        WHERE store_id = $1 AND DATE(created_at) = $2
      `, [store.id, yesterday]);

      const inventory = await getOne(`
        SELECT
          SUM(CASE WHEN quantity_in_stock <= reorder_level THEN 1 ELSE 0 END) as low_stock,
          SUM(CASE WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 ELSE 0 END) as expiring_soon
        FROM store_inventory
        WHERE store_id = $1
      `, [store.id]);

      // Insert or update daily stats
      const existingStats = await getOne(
        'SELECT id FROM store_daily_stats WHERE store_id = $1 AND date = $2',
        [store.id, yesterday]
      );

      const statsData = {
        total_orders: parseInt(stats?.total_orders || 0),
        refill_orders: parseInt(stats?.refill_orders || 0),
        total_revenue: parseFloat(stats?.total_revenue || 0),
        new_patients: parseInt(newPatients?.count || 0),
        active_patients: parseInt(activePatients?.count || 0),
        reminders_sent: parseInt(refillMetrics?.reminders_sent || 0),
        reminders_converted: parseInt(refillMetrics?.reminders_converted || 0),
        revenue_recovered: parseFloat(refillMetrics?.revenue_recovered || 0),
        low_stock_items: parseInt(inventory?.low_stock || 0),
        expiring_items: parseInt(inventory?.expiring_soon || 0),
      };

      if (existingStats) {
        await update('store_daily_stats', statsData, { id: existingStats.id });
      } else {
        await insert('store_daily_stats', {
          id: uuidv4(),
          store_id: store.id,
          date: yesterday,
          ...statsData,
        });
      }

      console.log(`[CRON] Updated daily stats for store ${store.id}`);
    } catch (error) {
      console.error(`[CRON] Error aggregating stats for store ${store.id}:`, error);
    }
  }
}

/**
 * Schedule weekly patient risk assessment
 */
function scheduleWeeklyRiskAssessmentJob() {
  const job = cron.schedule('0 2 * * 1', async () => {
    console.log('[CRON] Running weekly patient risk assessment job...');
    try {
      await assessPatientRisks();
      console.log('[CRON] Weekly patient risk assessment completed');
    } catch (error) {
      console.error('[CRON] Weekly patient risk assessment error:', error);
    }
  });

  jobsRegistry.push({
    name: 'Weekly Patient Risk Assessment',
    schedule: '0 2 * * 1 (Weekly on Monday at 2 AM)',
    status: 'active',
    job,
  });
}

/**
 * Assess patient risk levels based on adherence and order history
 */
async function assessPatientRisks() {
  const storePatients = await getMany(`
    SELECT
      sp.id,
      sp.patient_id,
      sp.store_id,
      sp.adherence_score,
      sp.last_order_at,
      sp.total_orders
    FROM store_patients
    WHERE is_active = true
  `);

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

  for (const sp of storePatients) {
    let riskLevel = 'normal';

    // Assess risk
    if (sp.adherence_score < 50) {
      riskLevel = 'at_risk';
    } else if (new Date(sp.last_order_at) < ninetyDaysAgo) {
      riskLevel = 'lapsed';
    } else if (new Date(sp.last_order_at) < thirtyDaysAgo) {
      riskLevel = 'at_risk';
    }

    if (riskLevel !== sp.risk_level) {
      await update('store_patients', { risk_level: riskLevel }, { id: sp.id });
      console.log(`[CRON] Updated patient ${sp.patient_id} risk level to ${riskLevel}`);
    }
  }
}

/**
 * Schedule inventory expiry alerts
 */
function scheduleExpiryAlertsJob() {
  const job = cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Running inventory expiry alerts job...');
    try {
      await checkExpiryAlerts();
      console.log('[CRON] Inventory expiry alerts job completed');
    } catch (error) {
      console.error('[CRON] Inventory expiry alerts job error:', error);
    }
  });

  jobsRegistry.push({
    name: 'Inventory Expiry Alerts',
    schedule: '0 8 * * * (Daily at 8 AM)',
    status: 'active',
    job,
  });
}

/**
 * Check for expiring inventory and create alerts
 */
async function checkExpiryAlerts() {
  // Get items expiring within 30 days
  const expiringItems = await getMany(`
    SELECT
      si.id,
      si.store_id,
      si.medicine_id,
      m.name as medicine_name,
      si.batch_number,
      si.expiry_date,
      si.quantity_in_stock
    FROM store_inventory si
    JOIN medicines m ON si.medicine_id = m.id
    WHERE si.expiry_date > CURRENT_DATE
    AND si.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND si.is_available = true
  `);

  console.log(`[CRON] Found ${expiringItems.length} items expiring within 30 days`);

  // Create notifications for store owners
  for (const item of expiringItems) {
    try {
      const daysUntilExpiry = Math.floor(
        (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      );

      await insert('notifications', {
        id: uuidv4(),
        recipient_type: 'store',
        recipient_id: item.store_id,
        title: 'Inventory Expiry Alert',
        body: `${item.medicine_name} (Batch: ${item.batch_number}) expires in ${daysUntilExpiry} days. Stock: ${item.quantity_in_stock} units`,
        channel: 'in_app',
        reference_type: 'inventory_expiry',
        reference_id: item.id,
        status: 'pending',
      });

      console.log(`[CRON] Created expiry alert for item ${item.id}`);
    } catch (error) {
      console.error(`[CRON] Error creating expiry alert for item ${item.id}:`, error);
    }
  }
}

/**
 * Stop all cron jobs
 */
function stopAllJobs() {
  jobsRegistry.forEach(job => {
    job.job.stop();
  });
  console.log('All cron jobs stopped');
}

/**
 * Get cron jobs status
 */
function getJobsStatus() {
  return jobsRegistry.map(job => ({
    name: job.name,
    schedule: job.schedule,
    status: job.status,
  }));
}

module.exports = {
  initCronJobs,
  stopAllJobs,
  getJobsStatus,
  processRefillEscalations,
  aggregateDailyStats,
  assessPatientRisks,
  checkExpiryAlerts,
};
