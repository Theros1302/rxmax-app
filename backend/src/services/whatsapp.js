/**
 * WhatsApp Integration Service
 * Supports Gupshup and Wati APIs
 * Falls back to console logging in mock mode
 */

const axios = require('axios');

const WHATSAPP_PROVIDER = process.env.WHATSAPP_PROVIDER || 'gupshup';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';
const MOCK_MODE = !WHATSAPP_API_KEY;

// Gupshup API endpoints
const GUPSHUP_API_URL = 'https://api.gupshup.io/sm/api/v1/msg/send/';

// Wati API endpoints
const WATI_API_URL = 'https://api.wati.io/api/v1/sendMessage';

/**
 * Send a WhatsApp message using template
 * @param {string} phone - Phone number with country code (e.g., 919876543210)
 * @param {string} template - Template name (e.g., 'REFILL_REMINDER')
 * @param {object} params - Template parameters
 * @returns {Promise<object>} Message response
 */
async function sendWhatsAppMessage(phone, template, params = {}) {
  try {
    if (MOCK_MODE) {
      console.log(`[WHATSAPP MOCK] Sending to ${phone} using template: ${template}`, params);
      return {
        success: true,
        mock: true,
        message_id: `mock_${Date.now()}`,
        status: 'sent',
      };
    }

    if (WHATSAPP_PROVIDER === 'gupshup') {
      return await sendViaGupshup(phone, template, params);
    } else if (WHATSAPP_PROVIDER === 'wati') {
      return await sendViaWati(phone, template, params);
    }

    throw new Error(`Unknown WhatsApp provider: ${WHATSAPP_PROVIDER}`);
  } catch (error) {
    console.error('WhatsApp send error:', error);
    throw error;
  }
}

/**
 * Send via Gupshup API
 */
async function sendViaGupshup(phone, template, params) {
  try {
    const payload = {
      phone,
      template: template,
      'template-params': JSON.stringify(Object.values(params)),
    };

    const response = await axios.post(GUPSHUP_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return {
      success: true,
      provider: 'gupshup',
      message_id: response.data.messageId,
      status: response.data.status || 'sent',
    };
  } catch (error) {
    console.error('Gupshup API error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send via Wati API
 */
async function sendViaWati(phone, template, params) {
  try {
    const payload = {
      waNumber: `+${phone}`,
      templateName: template,
      templateParams: Object.values(params),
    };

    const response = await axios.post(WATI_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      provider: 'wati',
      message_id: response.data.messageId,
      status: response.data.result || 'sent',
    };
  } catch (error) {
    console.error('Wati API error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send refill reminder
 */
async function sendRefillReminder(phone, medicineName, storeName) {
  return sendWhatsAppMessage(phone, 'REFILL_REMINDER', {
    medicine_name: medicineName,
    store_name: storeName,
  });
}

/**
 * Send order confirmation
 */
async function sendOrderConfirmation(phone, orderId, storeName) {
  return sendWhatsAppMessage(phone, 'ORDER_CONFIRMATION', {
    order_id: orderId,
    store_name: storeName,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send order ready notification
 */
async function sendOrderReady(phone, orderId, storeName) {
  return sendWhatsAppMessage(phone, 'ORDER_READY', {
    order_id: orderId,
    store_name: storeName,
  });
}

/**
 * Send order delivered notification
 */
async function sendOrderDelivered(phone, orderId, storeName) {
  return sendWhatsAppMessage(phone, 'ORDER_DELIVERED', {
    order_id: orderId,
    store_name: storeName,
  });
}

module.exports = {
  sendWhatsAppMessage,
  sendRefillReminder,
  sendOrderConfirmation,
  sendOrderReady,
  sendOrderDelivered,
};
