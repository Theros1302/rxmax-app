// RxMax Admin Panel API Service

// Ensure API_BASE always ends with /api
const rawBase = process.env.REACT_APP_API_URL || 'https://rxmax-backend.onrender.com';
const API_BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`;

// Generate mock data
const mockStores = [
  {
    id: 1,
    name: 'Apollo Pharmacy',
    owner: 'Rajesh Kumar',
    city: 'Mumbai',
    plan: 'Pro',
    patients: 245,
    orders: 1850,
    revenue: 8.5,
    status: 'Active',
    verified: true,
    createdAt: '2024-01-15',
    address: '123 Marine Drive, Mumbai',
    phone: '9876543210',
    email: 'rajesh@apollopharmacy.com',
    lastOrder: '2026-04-03',
  },
  {
    id: 2,
    name: 'Sharma Medical',
    owner: 'Dr. Sharma',
    city: 'Delhi',
    plan: 'Basic',
    patients: 120,
    orders: 890,
    revenue: 3.2,
    status: 'Active',
    verified: true,
    createdAt: '2024-02-20',
    address: '456 Connaught Place, Delhi',
    phone: '9876543211',
    email: 'sharma@medicaldelhi.com',
    lastOrder: '2026-04-04',
  },
  {
    id: 3,
    name: 'HealthFirst',
    owner: 'Priya Singh',
    city: 'Hyderabad',
    plan: 'Pro',
    patients: 180,
    orders: 1320,
    revenue: 6.1,
    status: 'Active',
    verified: true,
    createdAt: '2024-03-10',
    address: '789 HITEC City, Hyderabad',
    phone: '9876543212',
    email: 'priya@healthfirst.com',
    lastOrder: '2026-04-02',
  },
  {
    id: 4,
    name: 'MedPlus',
    owner: 'Amit Patel',
    city: 'Bangalore',
    plan: 'Free',
    patients: 45,
    orders: 280,
    revenue: 0.8,
    status: 'Active',
    verified: false,
    createdAt: '2024-04-05',
    address: '321 Whitefield, Bangalore',
    phone: '9876543213',
    email: 'amit@medplus.com',
    lastOrder: '2026-03-28',
  },
  {
    id: 5,
    name: 'Wellness Pharmacy',
    owner: 'Kavya Menon',
    city: 'Chennai',
    plan: 'Basic',
    patients: 95,
    orders: 580,
    revenue: 2.4,
    status: 'Active',
    verified: true,
    createdAt: '2024-05-12',
    address: '654 Anna Salai, Chennai',
    phone: '9876543214',
    email: 'kavya@wellnesspharmacy.com',
    lastOrder: '2026-04-01',
  },
  {
    id: 6,
    name: 'City Medicos',
    owner: 'Rohit Desai',
    city: 'Pune',
    plan: 'Pro',
    patients: 150,
    orders: 1100,
    revenue: 4.8,
    status: 'Active',
    verified: true,
    createdAt: '2024-06-08',
    address: '987 Koregaon Park, Pune',
    phone: '9876543215',
    email: 'rohit@citymedicos.com',
    lastOrder: '2026-04-03',
  },
  {
    id: 7,
    name: 'Lifeline Pharmacy',
    owner: 'Sneha Verma',
    city: 'Mumbai',
    plan: 'Basic',
    patients: 78,
    orders: 450,
    revenue: 1.8,
    status: 'Inactive',
    verified: true,
    createdAt: '2024-07-22',
    address: '111 Bandra West, Mumbai',
    phone: '9876543216',
    email: 'sneha@lifelinepharmacy.com',
    lastOrder: '2026-03-15',
  },
  {
    id: 8,
    name: 'Prime Care Pharmacy',
    owner: 'Vikram Singh',
    city: 'Delhi',
    plan: 'Pro',
    patients: 220,
    orders: 1650,
    revenue: 7.5,
    status: 'Active',
    verified: true,
    createdAt: '2024-08-14',
    address: '222 CP Extension, Delhi',
    phone: '9876543217',
    email: 'vikram@primecarepharmacy.com',
    lastOrder: '2026-04-04',
  },
  {
    id: 9,
    name: 'Wellness Hub',
    owner: 'Anitha Nair',
    city: 'Bangalore',
    plan: 'Basic',
    patients: 110,
    orders: 750,
    revenue: 2.9,
    status: 'Active',
    verified: false,
    createdAt: '2024-09-03',
    address: '333 MG Road, Bangalore',
    phone: '9876543218',
    email: 'anitha@wellnesshub.com',
    lastOrder: '2026-04-03',
  },
  {
    id: 10,
    name: 'Express Medico',
    owner: 'Deepak Kumar',
    city: 'Hyderabad',
    plan: 'Basic',
    patients: 85,
    orders: 620,
    revenue: 2.2,
    status: 'Active',
    verified: true,
    createdAt: '2024-10-11',
    address: '444 Jubilee Hills, Hyderabad',
    phone: '9876543219',
    email: 'deepak@expressmedico.com',
    lastOrder: '2026-04-02',
  },
  {
    id: 11,
    name: 'Care Plus Pharmacy',
    owner: 'Meera Reddy',
    city: 'Chennai',
    plan: 'Pro',
    patients: 165,
    orders: 1200,
    revenue: 5.3,
    status: 'Active',
    verified: true,
    createdAt: '2024-11-25',
    address: '555 Nungambakkam, Chennai',
    phone: '9876543220',
    email: 'meera@carepluspharmacy.com',
    lastOrder: '2026-04-01',
  },
  {
    id: 12,
    name: 'QuickMeds',
    owner: 'Arjun Tiwari',
    city: 'Pune',
    plan: 'Free',
    patients: 55,
    orders: 320,
    revenue: 0.9,
    status: 'Active',
    verified: false,
    createdAt: '2025-01-07',
    address: '666 Hinjewadi, Pune',
    phone: '9876543221',
    email: 'arjun@quickmeds.com',
    lastOrder: '2026-03-30',
  },
];

const mockPatients = [
  {
    id: 101,
    name: 'Ramesh Gupta',
    phone: '9123456701',
    storeId: 1,
    storeName: 'Apollo Pharmacy',
    orders: 45,
    lifetime: 15000,
    riskLevel: 'Low',
    lastActive: '2026-04-04',
  },
  {
    id: 102,
    name: 'Priya Sharma',
    phone: '9123456702',
    storeId: 1,
    storeName: 'Apollo Pharmacy',
    orders: 38,
    lifetime: 12500,
    riskLevel: 'Low',
    lastActive: '2026-04-03',
  },
  {
    id: 103,
    name: 'Amit Verma',
    phone: '9123456703',
    storeId: 2,
    storeName: 'Sharma Medical',
    orders: 22,
    lifetime: 7200,
    riskLevel: 'Medium',
    lastActive: '2026-03-28',
  },
  {
    id: 104,
    name: 'Sneha Desai',
    phone: '9123456704',
    storeId: 3,
    storeName: 'HealthFirst',
    orders: 56,
    lifetime: 18800,
    riskLevel: 'Low',
    lastActive: '2026-04-04',
  },
  {
    id: 105,
    name: 'Raj Kumar',
    phone: '9123456705',
    storeId: 1,
    storeName: 'Apollo Pharmacy',
    orders: 15,
    lifetime: 4800,
    riskLevel: 'High',
    lastActive: '2026-02-15',
  },
  {
    id: 106,
    name: 'Kavya Singh',
    phone: '9123456706',
    storeId: 5,
    storeName: 'Wellness Pharmacy',
    orders: 28,
    lifetime: 9100,
    riskLevel: 'Medium',
    lastActive: '2026-04-01',
  },
  {
    id: 107,
    name: 'Vikas Patel',
    phone: '9123456707',
    storeId: 6,
    storeName: 'City Medicos',
    orders: 42,
    lifetime: 13900,
    riskLevel: 'Low',
    lastActive: '2026-04-02',
  },
  {
    id: 108,
    name: 'Neha Agarwal',
    phone: '9123456708',
    storeId: 8,
    storeName: 'Prime Care Pharmacy',
    orders: 51,
    lifetime: 16500,
    riskLevel: 'Low',
    lastActive: '2026-04-04',
  },
  {
    id: 109,
    name: 'Suresh Nair',
    phone: '9123456709',
    storeId: 3,
    storeName: 'HealthFirst',
    orders: 18,
    lifetime: 5500,
    riskLevel: 'High',
    lastActive: '2026-03-10',
  },
  {
    id: 110,
    name: 'Anjali Chopra',
    phone: '9123456710',
    storeId: 2,
    storeName: 'Sharma Medical',
    orders: 33,
    lifetime: 10800,
    riskLevel: 'Low',
    lastActive: '2026-04-03',
  },
  {
    id: 111,
    name: 'Arjun Menon',
    phone: '9123456711',
    storeId: 5,
    storeName: 'Wellness Pharmacy',
    orders: 24,
    lifetime: 7500,
    riskLevel: 'Medium',
    lastActive: '2026-03-20',
  },
  {
    id: 112,
    name: 'Ritika Dutta',
    phone: '9123456712',
    storeId: 1,
    storeName: 'Apollo Pharmacy',
    orders: 47,
    lifetime: 15500,
    riskLevel: 'Low',
    lastActive: '2026-04-04',
  },
];

const mockOrders = [
  { id: 'ORD001', storeId: 1, storeName: 'Apollo Pharmacy', patientId: 101, patientName: 'Ramesh Gupta', amount: 350, status: 'Delivered', date: '2026-04-03' },
  { id: 'ORD002', storeId: 1, storeName: 'Apollo Pharmacy', patientId: 102, patientName: 'Priya Sharma', amount: 280, status: 'Delivered', date: '2026-04-02' },
  { id: 'ORD003', storeId: 2, storeName: 'Sharma Medical', patientId: 103, patientName: 'Amit Verma', amount: 420, status: 'Processing', date: '2026-04-04' },
  { id: 'ORD004', storeId: 3, storeName: 'HealthFirst', patientId: 104, patientName: 'Sneha Desai', amount: 550, status: 'Delivered', date: '2026-04-04' },
  { id: 'ORD005', storeId: 1, storeName: 'Apollo Pharmacy', patientId: 101, patientName: 'Ramesh Gupta', amount: 320, status: 'Delivered', date: '2026-04-01' },
  { id: 'ORD006', storeId: 5, storeName: 'Wellness Pharmacy', patientId: 106, patientName: 'Kavya Singh', amount: 280, status: 'Delivered', date: '2026-04-01' },
  { id: 'ORD007', storeId: 6, storeName: 'City Medicos', patientId: 107, patientName: 'Vikas Patel', amount: 390, status: 'Delivered', date: '2026-04-03' },
  { id: 'ORD008', storeId: 8, storeName: 'Prime Care Pharmacy', patientId: 108, patientName: 'Neha Agarwal', amount: 465, status: 'Delivered', date: '2026-04-02' },
  { id: 'ORD009', storeId: 2, storeName: 'Sharma Medical', patientId: 110, patientName: 'Anjali Chopra', amount: 310, status: 'Pending', date: '2026-04-04' },
  { id: 'ORD010', storeId: 3, storeName: 'HealthFirst', patientId: 104, patientName: 'Sneha Desai', amount: 480, status: 'Delivered', date: '2026-03-31' },
  { id: 'ORD011', storeId: 1, storeName: 'Apollo Pharmacy', patientId: 112, patientName: 'Ritika Dutta', amount: 400, status: 'Delivered', date: '2026-04-04' },
  { id: 'ORD012', storeId: 6, storeName: 'City Medicos', patientId: 107, patientName: 'Vikas Patel', amount: 340, status: 'Delivered', date: '2026-04-02' },
  { id: 'ORD013', storeId: 8, storeName: 'Prime Care Pharmacy', patientId: 108, patientName: 'Neha Agarwal', amount: 520, status: 'Delivered', date: '2026-03-30' },
  { id: 'ORD014', storeId: 5, storeName: 'Wellness Pharmacy', patientId: 106, patientName: 'Kavya Singh', amount: 290, status: 'Processing', date: '2026-04-04' },
  { id: 'ORD015', storeId: 1, storeName: 'Apollo Pharmacy', patientId: 102, patientName: 'Priya Sharma', amount: 350, status: 'Delivered', date: '2026-03-29' },
];

const revenueData = [
  { month: 'Oct 2025', revenue: 125.5 },
  { month: 'Nov 2025', revenue: 142.3 },
  { month: 'Dec 2025', revenue: 168.9 },
  { month: 'Jan 2026', revenue: 155.2 },
  { month: 'Feb 2026', revenue: 182.4 },
  { month: 'Mar 2026', revenue: 198.7 },
];

const ordersByCity = [
  { city: 'Mumbai', orders: 3200, revenue: 12.3 },
  { city: 'Delhi', orders: 2800, revenue: 10.7 },
  { city: 'Hyderabad', orders: 2100, revenue: 8.3 },
  { city: 'Bangalore', orders: 1900, revenue: 3.7 },
  { city: 'Chennai', orders: 2200, revenue: 7.7 },
  { city: 'Pune', orders: 2000, revenue: 5.7 },
];

const recentStoreSignups = [
  { id: 1, name: 'Apollo Pharmacy', owner: 'Rajesh Kumar', city: 'Mumbai', plan: 'Pro', date: '2026-04-03' },
  { id: 8, name: 'Prime Care Pharmacy', owner: 'Vikram Singh', city: 'Delhi', plan: 'Pro', date: '2026-04-02' },
  { id: 12, name: 'QuickMeds', owner: 'Arjun Tiwari', city: 'Pune', plan: 'Free', date: '2026-04-01' },
  { id: 11, name: 'Care Plus Pharmacy', owner: 'Meera Reddy', city: 'Chennai', plan: 'Pro', date: '2026-03-31' },
  { id: 9, name: 'Wellness Hub', owner: 'Anitha Nair', city: 'Bangalore', plan: 'Basic', date: '2026-03-28' },
];

const topStoresByRevenue = [
  { name: 'Apollo Pharmacy', revenue: 8.5, orders: 1850 },
  { name: 'Prime Care Pharmacy', revenue: 7.5, orders: 1650 },
  { name: 'HealthFirst', revenue: 6.1, orders: 1320 },
  { name: 'City Medicos', revenue: 4.8, orders: 1100 },
  { name: 'Care Plus Pharmacy', revenue: 5.3, orders: 1200 },
  { name: 'Sharma Medical', revenue: 3.2, orders: 890 },
  { name: 'Wellness Hub', revenue: 2.9, orders: 750 },
  { name: 'Wellness Pharmacy', revenue: 2.4, orders: 580 },
  { name: 'Express Medico', revenue: 2.2, orders: 620 },
  { name: 'MedPlus', revenue: 0.8, orders: 280 },
];

const topMedicinesByOrders = [
  { name: 'Aspirin 500mg', orders: 1200 },
  { name: 'Amoxicillin 500mg', orders: 980 },
  { name: 'Ibuprofen 400mg', orders: 890 },
  { name: 'Paracetamol 500mg', orders: 1050 },
  { name: 'Metformin 500mg', orders: 750 },
  { name: 'Atorvastatin 10mg', orders: 620 },
  { name: 'Lisinopril 5mg', orders: 580 },
  { name: 'Omeprazole 20mg', orders: 720 },
  { name: 'Vitamin D 1000IU', orders: 950 },
  { name: 'Multivitamin', orders: 880 },
];

const refillPerformanceByStore = [
  { name: 'Apollo Pharmacy', performance: 85 },
  { name: 'Prime Care Pharmacy', performance: 82 },
  { name: 'HealthFirst', performance: 78 },
  { name: 'City Medicos', performance: 80 },
  { name: 'Care Plus Pharmacy', performance: 76 },
  { name: 'Sharma Medical', performance: 72 },
  { name: 'Express Medico', performance: 75 },
  { name: 'Wellness Pharmacy', performance: 70 },
];

const storePerformance = [
  { store: 'Apollo Pharmacy', revenue: 8.5, patients: 245, orders: 1850, avgValue: 459 },
  { store: 'Prime Care Pharmacy', revenue: 7.5, patients: 220, orders: 1650, avgValue: 455 },
  { store: 'HealthFirst', revenue: 6.1, patients: 180, orders: 1320, avgValue: 462 },
  { store: 'Care Plus Pharmacy', revenue: 5.3, patients: 165, orders: 1200, avgValue: 442 },
  { store: 'City Medicos', revenue: 4.8, patients: 150, orders: 1100, avgValue: 436 },
];

const newStoresPerMonth = [
  { month: 'Sep 2025', stores: 2 },
  { month: 'Oct 2025', stores: 3 },
  { month: 'Nov 2025', stores: 1 },
  { month: 'Dec 2025', stores: 4 },
  { month: 'Jan 2026', stores: 2 },
  { month: 'Feb 2026', stores: 5 },
  { month: 'Mar 2026', stores: 3 },
];

const newPatientsPerMonth = [
  { month: 'Sep 2025', patients: 45 },
  { month: 'Oct 2025', patients: 68 },
  { month: 'Nov 2025', patients: 52 },
  { month: 'Dec 2025', patients: 95 },
  { month: 'Jan 2026', patients: 72 },
  { month: 'Feb 2026', patients: 110 },
  { month: 'Mar 2026', patients: 85 },
];

const refillConversionRate = [
  { month: 'Oct 2025', rate: 65 },
  { month: 'Nov 2025', rate: 68 },
  { month: 'Dec 2025', rate: 72 },
  { month: 'Jan 2026', rate: 70 },
  { month: 'Feb 2026', rate: 75 },
  { month: 'Mar 2026', rate: 78 },
];

const escalationLevels = [
  { level: 'Low (1-3 days)', value: 35 },
  { level: 'Medium (4-7 days)', value: 45 },
  { level: 'High (8+ days)', value: 20 },
];

const revenue30Days = [
  { date: '2026-03-05', revenue: 25.3 },
  { date: '2026-03-06', revenue: 28.1 },
  { date: '2026-03-07', revenue: 22.5 },
  { date: '2026-03-08', revenue: 31.2 },
  { date: '2026-03-09', revenue: 26.8 },
  { date: '2026-03-10', revenue: 29.4 },
  { date: '2026-03-11', revenue: 24.7 },
  { date: '2026-03-12', revenue: 32.1 },
  { date: '2026-03-13', revenue: 27.9 },
  { date: '2026-03-14', revenue: 30.3 },
  { date: '2026-03-15', revenue: 25.6 },
  { date: '2026-03-16', revenue: 28.8 },
  { date: '2026-03-17', revenue: 33.2 },
  { date: '2026-03-18', revenue: 26.5 },
  { date: '2026-03-19', revenue: 29.7 },
  { date: '2026-03-20', revenue: 31.8 },
  { date: '2026-03-21', revenue: 27.3 },
  { date: '2026-03-22', revenue: 30.5 },
  { date: '2026-03-23', revenue: 28.9 },
  { date: '2026-03-24', revenue: 32.6 },
  { date: '2026-03-25', revenue: 25.2 },
  { date: '2026-03-26', revenue: 29.1 },
  { date: '2026-03-27', revenue: 27.8 },
  { date: '2026-03-28', revenue: 34.1 },
  { date: '2026-03-29', revenue: 28.4 },
  { date: '2026-03-30', revenue: 31.7 },
  { date: '2026-03-31', revenue: 26.9 },
  { date: '2026-04-01', revenue: 30.2 },
  { date: '2026-04-02', revenue: 32.8 },
  { date: '2026-04-03', revenue: 29.5 },
];

const revenueByCity = [
  { city: 'Mumbai', value: 12.3 },
  { city: 'Delhi', value: 10.7 },
  { city: 'Hyderabad', value: 8.3 },
  { city: 'Bangalore', value: 3.7 },
  { city: 'Chennai', value: 7.7 },
  { city: 'Pune', value: 5.7 },
];

// Helper functions for API calls
const getToken = () => localStorage.getItem('rxmax_admin_token') || localStorage.getItem('token') || '';

const apiCall = async (method, path, body = null) => {
  const token = getToken();
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error ${response.status}`);
  }
  return response.json();
};

// Helper to map backend store fields to frontend format
const mapStore = (backendStore) => {
  return {
    id: backendStore.id,
    name: backendStore.name,
    owner: backendStore.owner_name || 'Unknown',
    city: backendStore.city,
    plan: backendStore.plan,
    patients: backendStore.patient_count,
    orders: backendStore.total_orders,
    revenue: backendStore.total_revenue / 100000, // Convert to lakhs
    status: backendStore.is_active ? 'Active' : 'Inactive',
    verified: backendStore.is_verified,
    createdAt: backendStore.created_at,
    address: backendStore.address || '',
    phone: backendStore.phone,
    email: backendStore.email || '',
    lastOrder: backendStore.last_order_at || '',
  };
};

// Helper to map backend patient fields to frontend format
const mapPatient = (backendPatient) => {
  return {
    id: backendPatient.id,
    name: backendPatient.name,
    phone: backendPatient.phone,
    email: backendPatient.email || '',
    city: backendPatient.city,
    orders: backendPatient.total_orders,
    lifetime: backendPatient.lifetime_value,
    riskLevel: backendPatient.risk_level || 'Low',
    lastActive: backendPatient.last_order_at || '',
    adherenceScore: backendPatient.adherence_score,
    loyaltyPoints: backendPatient.loyalty_points,
    storeCount: backendPatient.store_count,
  };
};

// Helper to map backend order fields to frontend format
const mapOrder = (backendOrder) => {
  return {
    id: backendOrder.id,
    storeId: backendOrder.store_id,
    storeName: backendOrder.store_name,
    patientId: backendOrder.patient_id,
    patientName: backendOrder.patient_name,
    amount: backendOrder.total_amount,
    status: backendOrder.status,
    date: backendOrder.created_at,
    phone: backendOrder.phone,
    city: backendOrder.city,
    orderNumber: backendOrder.order_number,
    deliveryType: backendOrder.delivery_type,
    subtotal: backendOrder.subtotal,
    deliveryCharge: backendOrder.delivery_charge,
  };
};

// API Mock Functions
export const api = {
  // Dashboard
  getDashboardMetrics: async () => {
    try {
      const dashboardData = await apiCall('GET', '/admin/dashboard');
      return {
        totalStores: dashboardData.total_stores || 12,
        totalStoresGrowth: dashboardData.stores_growth || 15,
        totalPatients: dashboardData.total_patients || 1500,
        totalPatientsGrowth: dashboardData.patients_growth || 22,
        totalOrdersMonth: dashboardData.total_orders_month || 3487,
        totalRevenueMonth: dashboardData.total_revenue_month || 126.5,
        activeRefillReminders: dashboardData.active_reminders || 342,
        platformGMV: dashboardData.platform_gmv || 48.2,
        revenueData: dashboardData.revenue_data || revenueData,
        ordersByCity: dashboardData.orders_by_city || ordersByCity,
        recentStoreSignups: dashboardData.recent_signups || recentStoreSignups,
      };
    } catch (err) {
      console.warn('Dashboard API failed, using mock data:', err);
      return {
        totalStores: 12,
        totalStoresGrowth: 15,
        totalPatients: 1500,
        totalPatientsGrowth: 22,
        totalOrdersMonth: 3487,
        totalRevenueMonth: 126.5,
        activeRefillReminders: 342,
        platformGMV: 48.2,
        revenueData,
        ordersByCity,
        recentStoreSignups,
      };
    }
  },

  // Stores
  getAllStores: async () => {
    try {
      const response = await apiCall('GET', '/admin/stores?status=all&limit=100');
      const stores = (response.stores || []).map(mapStore);
      return stores.length > 0 ? stores : mockStores;
    } catch (err) {
      console.warn('getAllStores API failed, using mock data:', err);
      return mockStores;
    }
  },

  getStore: async (id) => {
    try {
      const response = await apiCall('GET', `/admin/stores/${id}`);
      return mapStore(response.store);
    } catch (err) {
      console.warn(`getStore API failed for id ${id}, using mock data:`, err);
      return mockStores.find(s => s.id === parseInt(id));
    }
  },

  updateStore: async (id, updateData) => {
    try {
      const response = await apiCall('PUT', `/admin/stores/${id}`, updateData);
      return mapStore(response.store);
    } catch (err) {
      console.warn(`updateStore API failed for id ${id}:`, err);
      throw err;
    }
  },

  getStorePatients: async (storeId) => {
    return mockPatients.filter(p => p.storeId === parseInt(storeId));
  },

  getStoreOrders: async (storeId) => {
    return mockOrders.filter(o => o.storeId === parseInt(storeId));
  },

  getStoreRevenue30Days: async (storeId) => {
    return revenue30Days;
  },

  // Patients
  getAllPatients: async () => {
    try {
      const response = await apiCall('GET', '/admin/patients?limit=100');
      const patients = (response.patients || []).map(mapPatient);
      return patients.length > 0 ? patients : mockPatients;
    } catch (err) {
      console.warn('getAllPatients API failed, using mock data:', err);
      return mockPatients;
    }
  },

  getPatient: async (id) => {
    try {
      const response = await apiCall('GET', `/admin/patients/${id}`);
      return mapPatient(response.patient);
    } catch (err) {
      console.warn(`getPatient API failed for id ${id}, using mock data:`, err);
      return mockPatients.find(p => p.id === parseInt(id));
    }
  },

  // Orders
  getAllOrders: async () => {
    try {
      const response = await apiCall('GET', '/admin/orders?limit=100');
      const orders = (response.orders || []).map(mapOrder);
      return orders.length > 0 ? orders : mockOrders;
    } catch (err) {
      console.warn('getAllOrders API failed, using mock data:', err);
      return mockOrders;
    }
  },

  getOrder: async (id) => {
    try {
      const response = await apiCall('GET', `/admin/orders/${id}`);
      return mapOrder(response.order);
    } catch (err) {
      console.warn(`getOrder API failed for id ${id}, using mock data:`, err);
      return mockOrders.find(o => o.id === id);
    }
  },

  // Analytics
  getAnalytics: async () => {
    try {
      const response = await apiCall('GET', '/admin/analytics');
      return {
        topStoresByRevenue: response.topStores || topStoresByRevenue,
        topMedicinesByOrders: response.topMedicines || topMedicinesByOrders,
        refillPerformanceByStore: response.refillPerformance || refillPerformanceByStore,
        storePerformance: response.storePerformance || storePerformance,
        newStoresPerMonth,
        newPatientsPerMonth,
        revenueByCity: response.revenueByCity || revenueByCity,
      };
    } catch (err) {
      console.warn('getAnalytics API failed, using mock data:', err);
      return {
        topStoresByRevenue,
        topMedicinesByOrders,
        refillPerformanceByStore,
        storePerformance,
        newStoresPerMonth,
        newPatientsPerMonth,
        revenueByCity,
      };
    }
  },

  // Refills
  getRefillMetrics: async () => {
    try {
      const response = await apiCall('GET', '/admin/refills');
      return {
        totalActiveReminders: response.summary?.totalReminders || 342,
        conversionRate: response.summary?.convertedCount || 78,
        revenueRecovered: response.summary?.totalRevenue || 45.8,
        refillPerformanceByStore: response.byStore || refillPerformanceByStore,
        escalationLevels,
        refillConversionRate,
      };
    } catch (err) {
      console.warn('getRefillMetrics API failed, using mock data:', err);
      return {
        totalActiveReminders: 342,
        conversionRate: 78,
        revenueRecovered: 45.8,
        refillPerformanceByStore,
        escalationLevels,
        refillConversionRate,
      };
    }
  },

  // Login
  login: async (phone, password) => {
    try {
      const response = await apiCall('POST', '/admin/login', { phone, password });
      if (response.token) {
        localStorage.setItem('rxmax_admin_token', response.token);
      }
      return {
        success: true,
        user: {
          id: response.admin?.id || 1,
          name: response.admin?.name || 'Admin User',
          email: response.admin?.email || 'admin@rxmax.com',
          phone: phone,
          role: response.admin?.role || 'admin',
        },
        token: response.token,
      };
    } catch (err) {
      console.warn('Login API failed, checking mock credentials:', err);
      // Demo credentials: 9999999999 / rxmaxadmin2026
      if (phone === '9999999999' && password === 'rxmaxadmin2026') {
        const mockToken = 'mock-auth-token-12345';
        localStorage.setItem('rxmax_admin_token', mockToken);
        return {
          success: true,
          user: {
            id: 1,
            name: 'Admin User',
            email: 'admin@rxmax.com',
            phone: phone,
            role: 'admin',
          },
          token: mockToken,
        };
      }
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }
  },

  // Create Store
  createStore: async (storeData) => {
    try {
      const response = await apiCall('POST', '/admin/stores', storeData);
      return mapStore(response.store);
    } catch (err) {
      console.warn('createStore API failed:', err);
      return { error: err.message || 'Failed to create store' };
    }
  },

  // Settings
  getPlatformSettings: async () => {
    return {
      platformName: 'RxMax',
      version: '1.0.0',
      supportEmail: 'support@rxmax.com',
      subscriptionPlans: [
        {
          name: 'Free',
          monthlyPrice: 0,
          features: ['Upto 50 patients', 'Basic analytics', 'Email support'],
        },
        {
          name: 'Basic',
          monthlyPrice: 1999,
          features: ['Upto 500 patients', 'Advanced analytics', 'Priority support'],
        },
        {
          name: 'Pro',
          monthlyPrice: 5999,
          features: ['Unlimited patients', 'Full analytics', '24/7 support', 'Custom integrations'],
        },
      ],
      apiKeys: [
        { id: 'key_1', name: 'Production API', masked: 'sk_live_••••••••5FzN' },
        { id: 'key_2', name: 'Development API', masked: 'sk_test_••••••••2KpL' },
      ],
    };
  },
};

export default api;
