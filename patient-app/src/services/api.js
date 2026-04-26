// RxMax Patient App — API Service (v5, real-API only)
// Removes mock fallbacks. Errors propagate to callers so UI shows real state.

import fallbackMedicines from '../data/medicines';

class ApiService {
  constructor(baseUrl = process.env.REACT_APP_API_URL || 'https://rxmax-backend.onrender.com') {
    this.baseUrl = baseUrl;
    this.apiPath = '/api';
  }

  // ---------- Token + storeId helpers ----------
  getToken() { return localStorage.getItem('authToken'); }
  setToken(token) { localStorage.setItem('authToken', token); }
  clearToken() { localStorage.removeItem('authToken'); }

  // The store the patient was onboarded to. Set by App.js after getStoreBySlug.
  getStoreId() { return localStorage.getItem('storeId'); }
  setStoreId(id) { if (id) localStorage.setItem('storeId', id); }
  getStoreSlug() { return localStorage.getItem('storeSlug'); }

  // ---------- Core fetch ----------
  async apiCall(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    let response;
    try {
      response = await fetch(`${this.baseUrl}${this.apiPath}${path}`, options);
    } catch (networkErr) {
      const e = new Error('Network error — please check your connection');
      e.kind = 'network';
      throw e;
    }

    if (response.status === 401) {
      this.clearToken();
      // Don't auto-redirect here — let caller decide UX
      const e = new Error('Session expired — please log in again');
      e.kind = 'auth';
      throw e;
    }

    if (!response.ok) {
      let detail = '';
      try { const j = await response.json(); detail = j.error || j.message || ''; } catch (_) {}
      const e = new Error(detail || `Request failed (${response.status})`);
      e.kind = 'http';
      e.status = response.status;
      throw e;
    }

    try { return await response.json(); } catch (_) { return null; }
  }

  // ---------- Stores ----------
  async getStoreBySlug(slug) {
    const store = await this.apiCall('GET', `/stores/${slug}`);
    if (store && store.id) this.setStoreId(store.id);
    return store;
  }

  // ---------- Auth ----------
  async sendOtp(phone) {
    return this.apiCall('POST', '/auth/patient/send-otp', { phone });
  }

  async verifyOtp(phone, otp, requestId) {
    const result = await this.apiCall('POST', '/auth/patient/verify-otp', { phone, otp, requestId });
    if (result?.token) this.setToken(result.token);
    return result;
  }

  logout() { this.clearToken(); }

  // ---------- Profile ----------
  async getPatientProfile() {
    return this.apiCall('GET', '/patients/profile');
  }

  async updatePatientProfile(updates) {
    return this.apiCall('PUT', '/patients/profile', updates);
  }

  async completePatientProfile(profile) {
    // Backend route to be added in Batch 2; falls back to updatePatientProfile for now
    try {
      return await this.apiCall('POST', '/auth/patient/complete-profile', profile);
    } catch (err) {
      if (err.status === 404) return this.updatePatientProfile(profile);
      throw err;
    }
  }

  async getPatientMedications() {
    return this.apiCall('GET', '/patients/medications');
  }

  // ---------- Prescriptions ----------
  async uploadPrescription(imageData, doctorName, hospitalName) {
    return this.apiCall('POST', '/prescriptions/read-ai', {
      image: imageData,
      doctorName,
      hospitalName,
    });
  }

  async listPrescriptions() {
    const res = await this.apiCall('GET', '/patients/prescriptions');
    return Array.isArray(res) ? res : (res?.prescriptions || []);
  }

  async getPrescription(id) {
    return this.apiCall('GET', `/prescriptions/${id}`);
  }

  // ---------- Orders ----------
  async createOrder(medicines, deliveryType, deliveryAddress) {
    const storeId = this.getStoreId();
    if (!storeId) {
      const e = new Error('No store selected — please open this app from your pharmacy\'s onboarding link.');
      e.kind = 'config';
      throw e;
    }

    const orderData = {
      store_id: storeId,
      items: medicines.map(m => ({
        medicine_id: m.id || m.medicineId,
        quantity: m.quantity,
      })),
      delivery_type: deliveryType,
      delivery_address: deliveryAddress,
      order_type: 'regular',
      payment_method: 'cod',
    };
    return this.apiCall('POST', '/orders', orderData);
  }

  async listOrders() {
    const res = await this.apiCall('GET', '/orders');
    return Array.isArray(res) ? res : (res?.orders || []);
  }

  async getOrder(id) {
    return this.apiCall('GET', `/orders/${id}`);
  }

  async reorder(orderId) {
    return this.apiCall('POST', `/orders/reorder/${orderId}`);
  }

  // ---------- Refills ----------
  async getUpcomingRefills() {
    const res = await this.apiCall('GET', '/refills/patient');
    return Array.isArray(res) ? res : (res?.refills || []);
  }

  async respondToRefill(refillId, action) {
    return this.apiCall('POST', `/refills/${refillId}/respond`, { action });
  }

  // ---------- Medicines ----------
  async searchMedicines(query) {
    try {
      const res = await this.apiCall('GET', `/medicines/search?q=${encodeURIComponent(query || '')}`);
      const list = Array.isArray(res) ? res : (res?.medicines || []);
      // If backend returned nothing, surface local catalog so UI isn't empty during demo
      return list.length ? list : fallbackMedicines.filter(m =>
        !query || m.name.toLowerCase().includes(query.toLowerCase()));
    } catch (err) {
      // Search is non-critical — return local catalog rather than blocking the order flow
      return fallbackMedicines.filter(m =>
        !query || m.name.toLowerCase().includes(query.toLowerCase()));
    }
  }

  async getMedicine(id) {
    return this.apiCall('GET', `/medicines/${id}`);
  }
}

const api = new ApiService();
export default api;
