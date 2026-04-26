// RxMax Store Dashboard — API Service (v3, real-API only)
// All mock fallbacks removed. Errors propagate to UI so failures are visible
// instead of silently showing fake data from another store.

const RAW_BASE = (process.env.REACT_APP_API_URL || 'https://rxmax-backend.onrender.com').replace(/\/+$/, '');
const API_BASE_URL = RAW_BASE;

const TOKEN_KEY = 'medibuddy_token';   // kept for existing sessions
const STORE_KEY = 'rxmax_store_id';

// ========== HELPER ==========

const apiCall = async (method, path, body = null) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (networkErr) {
    const e = new Error('Network error — please check your connection');
    e.kind = 'network';
    throw e;
  }

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORE_KEY);
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
};

const unwrap = (res, key) => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res[key])) return res[key];
  return [];
};

// ========== API ==========

export const api = {
  // ---------- Auth ----------
  login: async (phone, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/store/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Invalid credentials');
    }
    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(STORE_KEY, (data.store && data.store.id) || data.storeId);
    return data;
  },

  register: async (storeData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/store/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    const data = await response.json();
    const storeId = (data.store && data.store.id) || data.storeId;
    const slug = (data.store && data.store.slug) || storeId;
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(STORE_KEY, storeId);
    return {
      ...data,
      storeId,
      patientLink: `https://rxmax-patient-app.vercel.app/store/${slug}`,
    };
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORE_KEY);
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),

  // ---------- Dashboard ----------
  getDashboardSummary: async () => apiCall('GET', '/api/stores/dashboard/summary'),
  getDailyRevenue:     async () => apiCall('GET', '/api/stores/analytics/detailed'),
  getDailyReport:      async (date)  => apiCall('GET', `/api/stores/reports/daily${date ? `?date=${date}` : ''}`),
  getMonthlyReport:    async (month) => apiCall('GET', `/api/stores/reports/monthly${month ? `?month=${month}` : ''}`),
  getRevenueAlerts:    async () => apiCall('GET', '/api/stores/revenue-alerts'),

  // ---------- Patients ----------
  getPatients:        async (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    const res = await apiCall('GET', `/api/stores/patients${qs ? `?${qs}` : ''}`);
    return unwrap(res, 'patients');
  },
  getPatientById:     async (id) => apiCall('GET', `/api/stores/patients/${id}`),
  getPatientOrders:   async (id) => {
    const res = await apiCall('GET', `/api/stores/patients/${id}/orders`);
    return unwrap(res, 'orders');
  },
  // Will be wired in Batch 3 once backend route exists
  addPatient:         async (data) => apiCall('POST', '/api/stores/patients', data),

  // ---------- Inventory ----------
  getInventory:       async () => {
    const res = await apiCall('GET', '/api/stores/inventory');
    return unwrap(res, 'inventory');
  },
  addInventoryItem:   async (item) => apiCall('POST', '/api/stores/inventory', item),
  bulkUploadInventory: async (items) => apiCall('POST', '/api/stores/inventory/bulk', { items }),
  updateInventoryItem: async (id, updates) => apiCall('PUT', `/api/stores/inventory/${id}`, updates),

  // ---------- Orders ----------
  getOrders:          async (filters = {}) => {
    const qs = new URLSearchParams(filters).toString();
    const res = await apiCall('GET', `/api/orders${qs ? `?${qs}` : ''}`);
    return unwrap(res, 'orders');
  },
  getOrderById:       async (id) => apiCall('GET', `/api/orders/${id}`),
  updateOrderStatus:  async (orderId, status) => apiCall('PUT', `/api/orders/${orderId}/status`, { status }),

  // ---------- Refills ----------
  getRefills:         async () => {
    const res = await apiCall('GET', '/api/refills/store');
    return unwrap(res, 'refills');
  },
  sendRefillReminder: async (refillId) => apiCall('POST', `/api/refills/${refillId}/notify`),
  escalateRefill:     async (refillId) => apiCall('POST', `/api/refills/${refillId}/escalate`),

  // ---------- Prescriptions ----------
  getPrescriptions:   async () => {
    const res = await apiCall('GET', '/api/prescriptions/store');
    return unwrap(res, 'prescriptions');
  },
  getPrescriptionById: async (id) => apiCall('GET', `/api/prescriptions/${id}`),
  reviewPrescription: async (id, action = 'verified') => apiCall('POST', `/api/prescriptions/${id}/verify`, { action }),


  // ---------- Methods called by existing pages (may need backend route in batch 2/3) ----------
  addPatientNote:      async (patientId, note) => apiCall('POST', `/api/stores/patients/${patientId}/notes`, { note }),
  sendRefillNudge:     async (refillId) => apiCall('POST', `/api/refills/${refillId}/notify`),
  toggleAutoNudge:     async (enabled) => apiCall('PUT', '/api/stores/settings/auto-nudge', { enabled }),
  updateOperatingHours: async (hours) => apiCall('PUT', '/api/stores/profile', { operating_hours: hours }),
  updateRefillSettings: async (settings) => apiCall('PUT', '/api/stores/settings/refills', settings),
  deactivateStore:     async () => apiCall('PUT', '/api/stores/profile', { is_active: false }),
  // ---------- Store profile ----------
  getStoreProfile:    async () => apiCall('GET', '/api/stores/profile'),
  updateStoreProfile: async (updates) => apiCall('PUT', '/api/stores/profile', updates),
};

export default api;
