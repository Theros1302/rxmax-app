// RxMax Admin Panel — API Service (v2, real-API only)
// All mock fallbacks removed. Errors propagate to UI.

const rawBase = process.env.REACT_APP_API_URL || 'https://rxmax-backend.onrender.com';
const API_BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`;

const TOKEN_KEY = 'rxmax_admin_token';
const LEGACY_KEY = 'token';

const getToken = () => localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_KEY) || '';

const apiCall = async (method, path, body = null) => {
  const token = getToken();
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body) options.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch (networkErr) {
    const e = new Error('Network error — please check your connection');
    e.kind = 'network';
    throw e;
  }

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_KEY);
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

// ---------- Field mappers (backend → frontend shape) ----------
const mapStore = (s) => s ? ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  owner: s.owner_name || 'Unknown',
  city: s.city,
  state: s.state,
  plan: s.plan,
  patients: s.patient_count || 0,
  orders: s.total_orders || 0,
  revenue: (s.total_revenue || 0) / 100000, // lakhs
  status: s.is_active ? 'Active' : 'Inactive',
  verified: s.is_verified,
  createdAt: s.created_at,
  address: s.address || '',
  phone: s.phone,
  email: s.email || '',
  lastOrder: s.last_order_at || '',
}) : null;

const mapPatient = (p) => p ? ({
  id: p.id,
  name: p.name,
  phone: p.phone,
  email: p.email || '',
  city: p.city || '',
  orders: p.total_orders || 0,
  lifetime: p.lifetime_value || 0,
  riskLevel: p.risk_level || 'normal',
  lastActive: p.last_order_at || '',
  adherenceScore: p.adherence_score || 0,
  loyaltyPoints: p.loyalty_points || 0,
  storeCount: p.store_count || 0,
}) : null;

const mapOrder = (o) => o ? ({
  id: o.id,
  storeId: o.store_id,
  storeName: o.store_name,
  patientId: o.patient_id,
  patientName: o.patient_name,
  amount: o.total_amount,
  status: o.status,
  date: o.created_at,
  phone: o.phone,
  city: o.city,
  orderNumber: o.order_number,
  deliveryType: o.delivery_type,
  subtotal: o.subtotal,
  deliveryCharge: o.delivery_charge,
}) : null;

// ---------- API ----------
export const api = {
  // ---------- Auth ----------
  login: async (phone, password) => {
    const response = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Invalid credentials');
    }
    const data = await response.json();
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_KEY);
  },

  // ---------- Dashboard ----------
  getDashboardMetrics: async () => {
    const d = await apiCall('GET', '/admin/dashboard');
    return {
      totalStores: d.totalStores || d.total_stores || 0,
      totalStoresGrowth: d.storesGrowth || d.stores_growth || 0,
      totalPatients: d.totalPatients || d.total_patients || 0,
      totalPatientsGrowth: d.patientsGrowth || d.patients_growth || 0,
      totalOrdersMonth: d.totalOrders || d.total_orders_month || 0,
      totalRevenueMonth: d.totalRevenue || d.total_revenue_month || 0,
      activeRefillReminders: d.activeReminders || d.active_reminders || 0,
      platformGMV: d.platformGmv || d.platform_gmv || 0,
      revenueData: d.revenueData || d.revenue_data || [],
      ordersByCity: d.ordersByCity || d.orders_by_city || [],
      recentStoreSignups: d.recentSignups || d.recent_signups || [],
    };
  },

  getAnalytics: async () => apiCall('GET', '/admin/analytics'),
  getRefillMetrics: async () => apiCall('GET', '/admin/refills'),
  getPlatformSettings: async () => apiCall('GET', '/admin/settings'),

  // ---------- Stores ----------
  getAllStores: async () => {
    const r = await apiCall('GET', '/admin/stores?status=all&limit=100');
    return (r.stores || []).map(mapStore);
  },

  getStore: async (id) => {
    const r = await apiCall('GET', `/admin/stores/${id}`);
    return mapStore(r.store || r);
  },

  createStore: async (storeData) => {
    const r = await apiCall('POST', '/admin/stores', storeData);
    // Backend should return { store, temporary_password }
    return r;
  },

  updateStore: async (id, updateData) => apiCall('PUT', `/admin/stores/${id}`, updateData),

  // Per-store admin views — these use real backend endpoints (no parseInt of UUIDs!)
  getStorePatients: async (storeId) => {
    const r = await apiCall('GET', `/admin/stores/${storeId}/patients`);
    return (r.patients || []).map(mapPatient);
  },

  getStoreOrders: async (storeId) => {
    const r = await apiCall('GET', `/admin/stores/${storeId}/orders`);
    return (r.orders || []).map(mapOrder);
  },

  getStoreRevenue30Days: async (storeId) => {
    const r = await apiCall('GET', `/admin/stores/${storeId}/revenue?days=30`);
    return r.revenue || r || [];
  },

  // ---------- Patients ----------
  getAllPatients: async () => {
    const r = await apiCall('GET', '/admin/patients?limit=100');
    return (r.patients || []).map(mapPatient);
  },

  getPatient: async (id) => {
    const r = await apiCall('GET', `/admin/patients/${id}`);
    return mapPatient(r.patient || r);
  },

  // ---------- Orders ----------
  getAllOrders: async () => {
    const r = await apiCall('GET', '/admin/orders?limit=100');
    return (r.orders || []).map(mapOrder);
  },

  getOrder: async (id) => {
    const r = await apiCall('GET', `/admin/orders/${id}`);
    return mapOrder(r.order || r);
  },
};

export default api;
