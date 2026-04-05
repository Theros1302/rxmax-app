const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getOne, getMany, insert, update, query } = require('../models');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Helper to generate order number
const generateOrderNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const count = await getOne(
    `SELECT COUNT(*) as count FROM orders WHERE EXTRACT(YEAR FROM created_at) = $1`,
    [year],
  );
  const sequence = (parseInt(count.count) + 1).toString().padStart(5, '0');
  return `RX-${year}-${sequence}`;
};

// Create order
router.post('/', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;
    const {
      store_id,
      items,
      prescription_id,
      order_type = 'regular',
      delivery_type = 'delivery',
      delivery_address,
      delivery_notes,
      payment_method = 'cod',
    } = req.body;

    if (!store_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Store ID and items required' });
    }

    // Verify patient is connected to store
    const storePatient = await getOne(
      'SELECT id FROM store_patients WHERE store_id = $1 AND patient_id = $2',
      [store_id, patientId],
    );

    if (!storePatient) {
      return res.status(403).json({ error: 'Not connected to this store' });
    }

    // Calculate totals and create order items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { medicine_id, prescription_item_id, quantity } = item;

      if (!quantity || quantity <= 0) {
        continue;
      }

      let medicineName = '';
      let unitPrice = 0;

      if (medicine_id) {
        const medicine = await getOne(
          `SELECT si.selling_price, m.name
           FROM store_inventory si
           JOIN medicines m ON si.medicine_id = m.id
           WHERE si.store_id = $1 AND si.medicine_id = $2 AND si.is_available = true`,
          [store_id, medicine_id],
        );

        if (!medicine) {
          return res.status(400).json({ error: `Medicine ${medicine_id} not available` });
        }

        medicineName = medicine.name;
        unitPrice = parseFloat(medicine.selling_price);
      } else if (prescription_item_id) {
        const prescItem = await getOne(
          `SELECT pi.medicine_name_raw, si.selling_price
           FROM prescription_items pi
           LEFT JOIN store_inventory si ON si.medicine_id = pi.medicine_id AND si.store_id = $1
           WHERE pi.id = $2`,
          [store_id, prescription_item_id],
        );

        if (!prescItem) {
          return res.status(400).json({ error: 'Prescription item not found' });
        }

        medicineName = prescItem.medicine_name_raw;
        unitPrice = prescItem.selling_price || 0;
      }

      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;

      orderItems.push({
        medicine_id,
        prescription_item_id,
        medicine_name: medicineName,
        quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ error: 'No valid items in order' });
    }

    // Get delivery charge
    const store = await getOne(
      'SELECT delivery_charge, min_order_amount FROM stores WHERE id = $1',
      [store_id],
    );

    const deliveryCharge = subtotal >= (store.min_order_amount || 0) ? 0 : parseFloat(store.delivery_charge || 0);
    const totalAmount = subtotal + deliveryCharge;

    // Create order
    const orderNumber = await generateOrderNumber();
    const order = await insert('orders', {
      id: uuidv4(),
      order_number: orderNumber,
      store_id,
      patient_id: patientId,
      prescription_id: prescription_id || null,
      order_type,
      subtotal,
      delivery_charge: deliveryCharge,
      total_amount: totalAmount,
      delivery_type,
      delivery_address: delivery_address || null,
      delivery_notes: delivery_notes || null,
      status: 'placed',
      payment_status: payment_method === 'cod' ? 'cod' : 'pending',
      payment_method,
    });

    // Insert order items
    for (const item of orderItems) {
      await insert('order_items', {
        id: uuidv4(),
        order_id: order.id,
        medicine_id: item.medicine_id || null,
        prescription_item_id: item.prescription_item_id || null,
        medicine_name: item.medicine_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// List orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = '';
    const params = [userId];

    if (userRole === 'patient') {
      sql = `
        SELECT id, order_number, status, subtotal, delivery_charge, total_amount,
               delivery_type, created_at, updated_at
        FROM orders WHERE patient_id = $1
      `;
    } else if (userRole === 'store') {
      sql = `
        SELECT id, order_number, patient_id, status, subtotal, delivery_charge,
               total_amount, delivery_type, created_at, updated_at
        FROM orders WHERE store_id = $1
      `;
    }

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const orders = await getMany(sql, params);

    res.json({
      orders,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order detail
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { id: orderId } = req.params;

    let order;
    if (userRole === 'patient') {
      order = await getOne(
        `SELECT * FROM orders WHERE id = $1 AND patient_id = $2`,
        [orderId, userId],
      );
    } else if (userRole === 'store') {
      order = await getOne(
        `SELECT * FROM orders WHERE id = $1 AND store_id = $2`,
        [orderId, userId],
      );
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const items = await getMany(
      `SELECT id, medicine_name, quantity, unit_price, discount_percent, total_price
       FROM order_items WHERE order_id = $1`,
      [orderId],
    );

    res.json({
      order,
      items,
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (store only)
router.put('/:id/status', authenticateToken, requireRole(['store']), async (req, res) => {
  try {
    const storeId = req.user.id;
    const { id: orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'picked_up',
      'cancelled',
      'rejected',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify order belongs to store
    const order = await getOne(
      'SELECT id FROM orders WHERE id = $1 AND store_id = $2',
      [orderId, storeId],
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData = {
      status,
      updated_at: new Date(),
    };

    if (status === 'confirmed') {
      updateData.confirmed_at = new Date();
    } else if (status === 'delivered' || status === 'picked_up') {
      updateData.delivered_at = new Date();
      updateData.payment_status = 'paid';
    }

    const updatedOrder = await update('orders', updateData, { id: orderId });

    res.json({
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Quick reorder from previous order
router.post('/reorder/:orderId', authenticateToken, requireRole(['patient']), async (req, res) => {
  try {
    const patientId = req.user.id;
    const { orderId } = req.params;

    // Get original order
    const originalOrder = await getOne(
      `SELECT id, store_id FROM orders WHERE id = $1 AND patient_id = $2`,
      [orderId, patientId],
    );

    if (!originalOrder) {
      return res.status(404).json({ error: 'Original order not found' });
    }

    // Get original items
    const originalItems = await getMany(
      `SELECT medicine_id, prescription_item_id, quantity FROM order_items WHERE order_id = $1`,
      [orderId],
    );

    if (originalItems.length === 0) {
      return res.status(400).json({ error: 'No items to reorder' });
    }

    // Create new order with same items
    const storeId = originalOrder.store_id;
    let subtotal = 0;
    const orderItems = [];

    for (const item of originalItems) {
      const { medicine_id, prescription_item_id, quantity } = item;

      let unitPrice = 0;
      let medicineName = '';

      if (medicine_id) {
        const medicine = await getOne(
          `SELECT si.selling_price, m.name FROM store_inventory si
           JOIN medicines m ON si.medicine_id = m.id
           WHERE si.store_id = $1 AND si.medicine_id = $2 AND si.is_available = true`,
          [storeId, medicine_id],
        );
        if (medicine) {
          unitPrice = parseFloat(medicine.selling_price);
          medicineName = medicine.name;
        }
      }

      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;

      orderItems.push({
        medicine_id,
        prescription_item_id,
        medicine_name: medicineName,
        quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
      });
    }

    // Get delivery charge
    const store = await getOne(
      'SELECT delivery_charge, min_order_amount FROM stores WHERE id = $1',
      [storeId],
    );

    const deliveryCharge = subtotal >= (store.min_order_amount || 0) ? 0 : parseFloat(store.delivery_charge || 0);
    const totalAmount = subtotal + deliveryCharge;

    const orderNumber = await generateOrderNumber();
    const newOrder = await insert('orders', {
      id: uuidv4(),
      order_number: orderNumber,
      store_id: storeId,
      patient_id: patientId,
      order_type: 'regular',
      subtotal,
      delivery_charge: deliveryCharge,
      total_amount: totalAmount,
      status: 'placed',
      payment_status: 'pending',
      payment_method: 'cod',
    });

    // Insert items
    for (const item of orderItems) {
      await insert('order_items', {
        id: uuidv4(),
        order_id: newOrder.id,
        medicine_id: item.medicine_id || null,
        prescription_item_id: item.prescription_item_id || null,
        medicine_name: item.medicine_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      });
    }

    res.status(201).json({
      message: 'Order reordered successfully',
      order: {
        id: newOrder.id,
        order_number: newOrder.order_number,
        total_amount: newOrder.total_amount,
      },
    });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Failed to reorder' });
  }
});

module.exports = router;
