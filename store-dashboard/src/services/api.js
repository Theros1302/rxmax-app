// Comprehensive RxMax API Service
// Real backend calls with comprehensive mock data fallback

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://rxmax-app.onrender.com';

// ========== MOCK DATA ==========

const MOCK_PATIENTS = [
  {
    id: 'P001',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@email.com',
    dateOfBirth: '1975-05-15',
    gender: 'Male',
    conditions: ['Hypertension', 'Diabetes'],
    allergies: ['Penicillin'],
    adherenceScore: 92,
    lifetimeValue: 45680,
    totalOrders: 28,
    memberSince: '2022-03-10',
    lastOrderDate: '2026-03-15',
    riskLevel: 'low',
    notes: [{ date: '2026-03-10', text: 'Called for refill reminder - patient very responsive' }],
    medications: [
      { id: 'M001', name: 'Amlodipine 5mg', quantity: 30, refillDate: '2026-04-10', status: 'active' },
      { id: 'M002', name: 'Metformin 500mg', quantity: 60, refillDate: '2026-04-05', status: 'active' }
    ]
  },
  {
    id: 'P002',
    name: 'Priya Sharma',
    phone: '9876543211',
    email: 'priya@email.com',
    dateOfBirth: '1988-08-22',
    gender: 'Female',
    conditions: ['Thyroid', 'PCOD'],
    allergies: [],
    adherenceScore: 78,
    lifetimeValue: 32450,
    totalOrders: 19,
    memberSince: '2023-01-15',
    lastOrderDate: '2026-02-28',
    riskLevel: 'medium',
    notes: [],
    medications: [{ id: 'M003', name: 'Levothyroxine 75mcg', quantity: 30, refillDate: '2026-03-25', status: 'active' }]
  },
  {
    id: 'P003',
    name: 'Amit Patel',
    phone: '9876543212',
    email: 'amit@email.com',
    dateOfBirth: '1982-12-03',
    gender: 'Male',
    conditions: ['Asthma', 'Allergies'],
    allergies: ['Aspirin'],
    adherenceScore: 65,
    lifetimeValue: 18920,
    totalOrders: 11,
    memberSince: '2023-07-20',
    lastOrderDate: '2026-01-15',
    riskLevel: 'high',
    notes: [],
    medications: []
  },
  {
    id: 'P004',
    name: 'Deepika Gupta',
    phone: '9876543213',
    email: 'deepika@email.com',
    dateOfBirth: '1995-03-11',
    gender: 'Female',
    conditions: ['Migraine', 'Anxiety'],
    allergies: [],
    adherenceScore: 88,
    lifetimeValue: 28560,
    totalOrders: 16,
    memberSince: '2022-11-05',
    lastOrderDate: '2026-03-12',
    riskLevel: 'low',
    notes: [],
    medications: [{ id: 'M004', name: 'Escitalopram 10mg', quantity: 30, refillDate: '2026-03-28', status: 'active' }]
  },
  {
    id: 'P005',
    name: 'Vikram Singh',
    phone: '9876543214',
    email: 'vikram@email.com',
    dateOfBirth: '1970-06-18',
    gender: 'Male',
    conditions: ['Heart Condition', 'High Cholesterol'],
    allergies: ['Iodine'],
    adherenceScore: 95,
    lifetimeValue: 62340,
    totalOrders: 35,
    memberSince: '2021-09-12',
    lastOrderDate: '2026-03-18',
    riskLevel: 'low',
    notes: [],
    medications: [
      { id: 'M005', name: 'Atorvastatin 20mg', quantity: 30, refillDate: '2026-04-15', status: 'active' },
      { id: 'M006', name: 'Aspirin 75mg', quantity: 30, refillDate: '2026-04-15', status: 'active' }
    ]
  },
  {
    id: 'P006',
    name: 'Neha Desai',
    phone: '9876543215',
    email: 'neha@email.com',
    dateOfBirth: '1992-09-25',
    gender: 'Female',
    conditions: ['PCOS', 'Irregular Periods'],
    allergies: [],
    adherenceScore: 72,
    lifetimeValue: 21340,
    totalOrders: 12,
    memberSince: '2023-04-08',
    lastOrderDate: '2026-03-01',
    riskLevel: 'medium',
    notes: [],
    medications: []
  },
  {
    id: 'P007',
    name: 'Arjun Verma',
    phone: '9876543216',
    email: 'arjun@email.com',
    dateOfBirth: '1968-01-30',
    gender: 'Male',
    conditions: ['Prostate', 'BPH'],
    allergies: ['Sulfonamides'],
    adherenceScore: 58,
    lifetimeValue: 15670,
    totalOrders: 8,
    memberSince: '2023-10-14',
    lastOrderDate: '2025-12-20',
    riskLevel: 'high',
    notes: [],
    medications: []
  },
  {
    id: 'P008',
    name: 'Sneha Mehta',
    phone: '9876543217',
    email: 'sneha@email.com',
    dateOfBirth: '1999-04-07',
    gender: 'Female',
    conditions: ['Acne', 'Skin Care'],
    allergies: [],
    adherenceScore: 85,
    lifetimeValue: 12450,
    totalOrders: 7,
    memberSince: '2024-02-10',
    lastOrderDate: '2026-03-14',
    riskLevel: 'low',
    notes: [],
    medications: []
  },
  {
    id: 'P009',
    name: 'Sanjay Reddy',
    phone: '9876543218',
    email: 'sanjay@email.com',
    dateOfBirth: '1980-07-14',
    gender: 'Male',
    conditions: ['Arthritis', 'Joint Pain'],
    allergies: ['NSAIDs'],
    adherenceScore: 68,
    lifetimeValue: 34560,
    totalOrders: 20,
    memberSince: '2022-05-22',
    lastOrderDate: '2026-02-10',
    riskLevel: 'medium',
    notes: [],
    medications: []
  },
  {
    id: 'P010',
    name: 'Kavya Nair',
    phone: '9876543219',
    email: 'kavya@email.com',
    dateOfBirth: '1987-11-19',
    gender: 'Female',
    conditions: ['Depression', 'Anxiety'],
    allergies: [],
    adherenceScore: 81,
    lifetimeValue: 28900,
    totalOrders: 16,
    memberSince: '2023-03-01',
    lastOrderDate: '2026-03-16',
    riskLevel: 'low',
    notes: [],
    medications: [{ id: 'M007', name: 'Sertraline 50mg', quantity: 30, refillDate: '2026-04-02', status: 'active' }]
  },
  {
    id: 'P011',
    name: 'Rohan Kapoor',
    phone: '9876543220',
    email: 'rohan@email.com',
    dateOfBirth: '1978-02-28',
    gender: 'Male',
    conditions: ['Diabetes', 'Hypertension'],
    allergies: [],
    adherenceScore: 73,
    lifetimeValue: 38920,
    totalOrders: 22,
    memberSince: '2022-07-15',
    lastOrderDate: '2026-03-11',
    riskLevel: 'medium',
    notes: [],
    medications: []
  },
  {
    id: 'P012',
    name: 'Anjali Singh',
    phone: '9876543221',
    email: 'anjali@email.com',
    dateOfBirth: '1993-10-05',
    gender: 'Female',
    conditions: ['Migraine'],
    allergies: [],
    adherenceScore: 91,
    lifetimeValue: 24560,
    totalOrders: 14,
    memberSince: '2023-05-20',
    lastOrderDate: '2026-03-17',
    riskLevel: 'low',
    notes: [],
    medications: []
  },
  {
    id: 'P013',
    name: 'Manish Iyer',
    phone: '9876543222',
    email: 'manish@email.com',
    dateOfBirth: '1981-08-12',
    gender: 'Male',
    conditions: ['Hypertension', 'High Cholesterol'],
    allergies: [],
    adherenceScore: 55,
    lifetimeValue: 19870,
    totalOrders: 9,
    memberSince: '2024-01-10',
    lastOrderDate: '2025-11-30',
    riskLevel: 'high',
    notes: [],
    medications: []
  },
  {
    id: 'P014',
    name: 'Swati Nair',
    phone: '9876543223',
    email: 'swati@email.com',
    dateOfBirth: '1996-06-22',
    gender: 'Female',
    conditions: ['Thyroid'],
    allergies: [],
    adherenceScore: 87,
    lifetimeValue: 31200,
    totalOrders: 18,
    memberSince: '2023-02-14',
    lastOrderDate: '2026-03-13',
    riskLevel: 'low',
    notes: [],
    medications: []
  },
  {
    id: 'P015',
    name: 'Rajiv Desai',
    phone: '9876543224',
    email: 'rajiv@email.com',
    dateOfBirth: '1975-04-18',
    gender: 'Male',
    conditions: ['Asthma', 'COPD'],
    allergies: [],
    adherenceScore: 62,
    lifetimeValue: 22340,
    totalOrders: 13,
    memberSince: '2023-09-05',
    lastOrderDate: '2026-02-28',
    riskLevel: 'high',
    notes: [],
    medications: []
  }
];

const MOCK_ORDERS = Array.from({ length: 20 }, (_, i) => ({
  id: `ORD${String(i + 1).padStart(5, '0')}`,
  patientId: MOCK_PATIENTS[i % MOCK_PATIENTS.length].id,
  patientName: MOCK_PATIENTS[i % MOCK_PATIENTS.length].name,
  patientPhone: MOCK_PATIENTS[i % MOCK_PATIENTS.length].phone,
  items: [
    { id: `M${String(i + 1).padStart(3, '0')}`, name: `Medicine ${i + 1}`, quantity: Math.floor(Math.random() * 5) + 1, price: 250 + Math.random() * 500 }
  ],
  totalAmount: Math.floor(250 + Math.random() * 2000),
  status: ['pending', 'confirmed', 'preparing', 'ready', 'delivered'][Math.floor(Math.random() * 5)],
  paymentStatus: 'paid',
  createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
  date: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
  deliveryAddress: 'Store Address',
  notes: ''
}));

const MOCK_INVENTORY = [
  { id: 'INV001', name: 'Amlodipine 5mg', stock: 450, sellingPrice: 35, mrp: 45, discount: 22, expiry: '2026-06-30', status: 'good' },
  { id: 'INV002', name: 'Metformin 500mg', stock: 320, sellingPrice: 28, mrp: 40, discount: 30, expiry: '2026-08-15', status: 'good' },
  { id: 'INV003', name: 'Levothyroxine 75mcg', stock: 180, sellingPrice: 65, mrp: 85, discount: 24, expiry: '2026-07-20', status: 'low' },
  { id: 'INV004', name: 'Atorvastatin 20mg', stock: 55, sellingPrice: 42, mrp: 60, discount: 30, expiry: '2026-05-10', status: 'critical' },
  { id: 'INV005', name: 'Aspirin 75mg', stock: 620, sellingPrice: 15, mrp: 25, discount: 40, expiry: '2027-01-30', status: 'good' },
  { id: 'INV006', name: 'Escitalopram 10mg', stock: 210, sellingPrice: 52, mrp: 75, discount: 31, expiry: '2026-09-12', status: 'good' },
  { id: 'INV007', name: 'Sertraline 50mg', stock: 140, sellingPrice: 58, mrp: 85, discount: 32, expiry: '2026-08-05', status: 'low' },
  { id: 'INV008', name: 'Ibuprofen 400mg', stock: 890, sellingPrice: 18, mrp: 30, discount: 40, expiry: '2027-03-20', status: 'good' },
  { id: 'INV009', name: 'Amoxicillin 500mg', stock: 340, sellingPrice: 28, mrp: 45, discount: 38, expiry: '2026-10-14', status: 'good' },
  { id: 'INV010', name: 'Cetrizine 10mg', stock: 760, sellingPrice: 22, mrp: 35, discount: 37, expiry: '2027-05-08', status: 'good' },
  { id: 'INV011', name: 'Omeprazole 20mg', stock: 425, sellingPrice: 35, mrp: 55, discount: 36, expiry: '2026-11-25', status: 'good' },
  { id: 'INV012', name: 'Vitamin B12 1000mcg', stock: 88, sellingPrice: 45, mrp: 65, discount: 31, expiry: '2026-04-18', status: 'critical' },
  { id: 'INV013', name: 'Paracetamol 500mg', stock: 1200, sellingPrice: 8, mrp: 15, discount: 47, expiry: '2027-02-10', status: 'good' },
  { id: 'INV014', name: 'Vitamin D3 2000IU', stock: 340, sellingPrice: 42, mrp: 60, discount: 30, expiry: '2026-12-30', status: 'good' },
  { id: 'INV015', name: 'Cough Syrup', stock: 125, sellingPrice: 95, mrp: 140, discount: 32, expiry: '2026-07-15', status: 'low' },
  { id: 'INV016', name: 'Dolomite Tablet', stock: 560, sellingPrice: 28, mrp: 45, discount: 38, expiry: '2027-01-20', status: 'good' },
  { id: 'INV017', name: 'Calcium + Vitamin D', stock: 310, sellingPrice: 52, mrp: 75, discount: 31, expiry: '2026-09-05', status: 'good' },
  { id: 'INV018', name: 'Multivitamin', stock: 480, sellingPrice: 35, mrp: 55, discount: 36, expiry: '2026-11-12', status: 'good' },
  { id: 'INV019', name: 'Glucose Monitor', stock: 45, sellingPrice: 1200, mrp: 1500, discount: 20, expiry: '2027-06-30', status: 'good' },
  { id: 'INV020', name: 'Blood Pressure Monitor', stock: 28, sellingPrice: 2500, mrp: 3500, discount: 29, expiry: '2027-08-15', status: 'low' }
];

const MOCK_REFILLS = [
  { id: 'R001', patientId: 'P001', patientName: 'Rajesh Kumar', medicine: 'Amlodipine 5mg', refillDueDate: '2026-04-05', daysRemaining: 0, estimatedValue: 1050, reminderStatus: 'sent', escalationLevel: 'urgent', status: 'pending' },
  { id: 'R002', patientId: 'P001', patientName: 'Rajesh Kumar', medicine: 'Metformin 500mg', refillDueDate: '2026-04-10', daysRemaining: 5, estimatedValue: 1680, reminderStatus: 'sent', escalationLevel: 'normal', status: 'pending' },
  { id: 'R003', patientId: 'P002', patientName: 'Priya Sharma', medicine: 'Levothyroxine 75mcg', refillDueDate: '2026-04-03', daysRemaining: -2, estimatedValue: 1950, reminderStatus: 'not_sent', escalationLevel: 'critical', status: 'pending' },
  { id: 'R004', patientId: 'P004', patientName: 'Deepika Gupta', medicine: 'Escitalopram 10mg', refillDueDate: '2026-04-08', daysRemaining: 3, estimatedValue: 1560, reminderStatus: 'sent', escalationLevel: 'normal', status: 'pending' },
  { id: 'R005', patientId: 'P005', patientName: 'Vikram Singh', medicine: 'Atorvastatin 20mg', refillDueDate: '2026-04-15', daysRemaining: 10, estimatedValue: 1260, reminderStatus: 'not_sent', escalationLevel: 'low', status: 'pending' },
  { id: 'R006', patientId: 'P005', patientName: 'Vikram Singh', medicine: 'Aspirin 75mg', refillDueDate: '2026-04-15', daysRemaining: 10, estimatedValue: 450, reminderStatus: 'not_sent', escalationLevel: 'low', status: 'pending' },
  { id: 'R007', patientId: 'P010', patientName: 'Kavya Nair', medicine: 'Sertraline 50mg', refillDueDate: '2026-04-07', daysRemaining: 2, estimatedValue: 1740, reminderStatus: 'sent', escalationLevel: 'normal', status: 'pending' },
  { id: 'R008', patientId: 'P006', patientName: 'Neha Desai', medicine: 'Supplements', refillDueDate: '2026-04-12', daysRemaining: 7, estimatedValue: 2150, reminderStatus: 'not_sent', escalationLevel: 'low', status: 'pending' },
  { id: 'R009', patientId: 'P009', patientName: 'Sanjay Reddy', medicine: 'Joint Supplement', refillDueDate: '2026-04-02', daysRemaining: -3, estimatedValue: 1890, reminderStatus: 'sent', escalationLevel: 'critical', status: 'pending' },
  { id: 'R010', patientId: 'P012', patientName: 'Anjali Singh', medicine: 'Migraine Relief', refillDueDate: '2026-04-20', daysRemaining: 15, estimatedValue: 1200, reminderStatus: 'not_sent', escalationLevel: 'low', status: 'pending' }
];

const MOCK_PRESCRIPTIONS = [
  { id: 'RX001', patientId: 'P001', patientName: 'Rajesh Kumar', medicines: ['Amlodipine 5mg', 'Metformin 500mg'], submittedDate: '2026-03-18', doctorName: 'Dr. Mehta', status: 'reviewed' },
  { id: 'RX002', patientId: 'P002', patientName: 'Priya Sharma', medicines: ['Levothyroxine 75mcg'], submittedDate: '2026-03-20', doctorName: 'Dr. Sharma', status: 'pending' },
  { id: 'RX003', patientId: 'P004', patientName: 'Deepika Gupta', medicines: ['Escitalopram 10mg'], submittedDate: '2026-03-15', doctorName: 'Dr. Patel', status: 'reviewed' },
  { id: 'RX004', patientId: 'P005', patientName: 'Vikram Singh', medicines: ['Atorvastatin 20mg', 'Aspirin 75mg'], submittedDate: '2026-03-22', doctorName: 'Dr. Kumar', status: 'pending' },
  { id: 'RX005', patientId: 'P010', patientName: 'Kavya Nair', medicines: ['Sertraline 50mg'], submittedDate: '2026-03-19', doctorName: 'Dr. Singh', status: 'reviewed' }
];

const generateDailyRevenue = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(8000 + Math.random() * 5000),
      orders: Math.floor(8 + Math.random() * 12)
    });
  }
  return data;
};

const MOCK_STORE_PROFILE = {
  id: 'STORE001',
  storeName: 'RxMax Central Pharmacy',
  ownerName: 'Dr. Ramesh Kumar',
  phone: '9876543200',
  email: 'admin@rxmaxpharmacy.com',
  address: '123 Main Street, Medical Complex',
  city: 'Bangalore',
  pincode: '560001',
  state: 'Karnataka',
  licenseNumber: 'LIC2021001',
  gstNumber: '18AAPCP1234A1Z0',
  registrationDate: '2021-06-15',
  subscribedPlan: 'professional',
  operatingHours: {
    monday: '9:00-21:00',
    tuesday: '9:00-21:00',
    wednesday: '9:00-21:00',
    thursday: '9:00-21:00',
    friday: '9:00-21:00',
    saturday: '10:00-20:00',
    sunday: 'Closed'
  },
  deliverySettings: {
    enableDelivery: true,
    deliveryRadius: 5,
    deliveryCharge: 50,
    freeDeliveryAbove: 500
  },
  refillSettings: {
    autoNudge: true,
    nudgeTime: '09:00',
    reminderDays: 3
  }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Generic API call helper with authentication
 * Tries to call the local server first, throws on error for fallback
 */
const apiCall = async (method, path, body = null) => {
  const token = localStorage.getItem('medibuddy_token');
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
};

// ========== API FUNCTIONS ==========

export const api = {
  // Auth
  login: async (phone, password) => {
    // Try server first
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/store/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('medibuddy_token', data.token);
        localStorage.setItem('rxmax_store_id', data.store?.id || data.storeId);
        return data;
      }
      // If server returned an auth error, throw to reach fallback
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Login failed');
    } catch (error) {
      console.log('Server login failed, checking demo credentials:', error.message);
    }

    // Mock fallback: Accept demo credentials
    if (phone === '9876543200' && password === 'demo123') {
      const token = 'mock_token_' + Date.now();
      localStorage.setItem('medibuddy_token', token);
      localStorage.setItem('rxmax_store_id', 'STORE001');
      return { token, storeId: 'STORE001', store: { id: 'STORE001', name: 'Apollo Pharmacy - Banjara Hills', slug: 'apollo-banjara' } };
    }
    throw new Error('Invalid credentials');
  },

  register: async (storeData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData)
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('medibuddy_token', data.token);
        localStorage.setItem('rxmax_store_id', data.storeId);
        return data;
      }
    } catch (error) {
      console.log('Backend unavailable, using mock data');
    }
    // Mock: Auto-approve registration
    const token = 'mock_token_' + Date.now();
    const storeId = 'STORE' + Math.floor(Math.random() * 10000);
    localStorage.setItem('medibuddy_token', token);
    localStorage.setItem('rxmax_store_id', storeId);
    return { token, storeId, storeName: storeData.storeName, patientLink: `https://rxmax.app/patient/${storeId}` };
  },

  // Dashboard
  getDashboardSummary: async () => {
    try {
      return await apiCall('GET', '/api/stores/dashboard/summary');
    } catch (error) {
      console.log('Using mock dashboard data');
    }
    return {
      totalOrders: MOCK_ORDERS.length,
      totalRevenue: MOCK_ORDERS.reduce((sum, o) => sum + o.totalAmount, 0),
      activePatients: MOCK_PATIENTS.length,
      pendingRefills: MOCK_REFILLS.length
    };
  },

  getDailyRevenue: async () => {
    try {
      return await apiCall('GET', '/api/stores/analytics/detailed');
    } catch (error) {
      console.log('Using mock revenue data');
    }
    return generateDailyRevenue();
  },

  // Patients
  getPatients: async () => {
    try {
      return await apiCall('GET', '/api/stores/patients');
    } catch (error) {
      console.log('Using mock patients data');
    }
    return MOCK_PATIENTS;
  },

  getPatientById: async (id) => {
    try {
      return await apiCall('GET', `/api/stores/patients/${id}`);
    } catch (error) {
      console.log('Using mock patient data');
    }
    return MOCK_PATIENTS.find(p => p.id === id) || MOCK_PATIENTS[0];
  },

  updatePatientNotes: async (patientId, notes) => {
    // Keep mock for now as per requirements
    console.log('Mock: Patient notes updated locally');
    return { success: true, notes };
  },

  addPatientNote: async (patientId, note) => {
    try {
      return await apiCall('POST', `/api/stores/patients/${patientId}/notes`, {
        text: note,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.log('Mock: Note added locally');
    }
    return { success: true, note: { text: note, date: new Date().toISOString().split('T')[0] } };
  },

  // Orders
  getOrders: async () => {
    try {
      return await apiCall('GET', '/api/orders');
    } catch (error) {
      console.log('Using mock orders data');
    }
    return MOCK_ORDERS;
  },

  getOrderById: async (id) => {
    try {
      return await apiCall('GET', `/api/orders/${id}`);
    } catch (error) {
      console.log('Using mock order data');
    }
    return MOCK_ORDERS.find(o => o.id === id) || MOCK_ORDERS[0];
  },

  getRecentOrders: async (limit) => {
    try {
      return await apiCall('GET', `/api/orders?limit=${limit}`);
    } catch (error) {
      console.log('Using mock recent orders data');
    }
    return MOCK_ORDERS.slice(0, limit);
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      return await apiCall('PUT', `/api/orders/${orderId}/status`, { status });
    } catch (error) {
      console.log('Mock: Order status updated locally');
    }
    return { success: true, status };
  },

  // Inventory
  getInventory: async () => {
    try {
      return await apiCall('GET', '/api/stores/inventory');
    } catch (error) {
      console.log('Using mock inventory data');
    }
    return MOCK_INVENTORY;
  },

  updateStock: async (medicineId, newStock) => {
    // Keep mock for now as per requirements
    console.log('Mock: Stock updated locally');
    return { success: true, medicineId, newStock };
  },

  updateInventory: async (itemId, updates) => {
    try {
      return await apiCall('PUT', `/api/stores/inventory/${itemId}`, updates);
    } catch (error) {
      console.log('Mock: Inventory updated locally');
    }
    return { success: true, ...updates };
  },

  addMedicine: async (medicineData) => {
    try {
      return await apiCall('POST', '/api/stores/inventory', medicineData);
    } catch (error) {
      console.log('Mock: Medicine added locally');
    }
    return { success: true, id: 'INV' + Math.floor(Math.random() * 10000) };
  },

  // Refills
  getRefills: async () => {
    try {
      return await apiCall('GET', '/api/refills/upcoming');
    } catch (error) {
      console.log('Using mock refills data');
    }
    return MOCK_REFILLS;
  },

  sendReminder: async (refillId) => {
    try {
      return await apiCall('POST', `/api/refills/${refillId}/nudge`, { channel: 'whatsapp' });
    } catch (error) {
      console.log('Mock: Reminder sent locally');
    }
    return { success: true, message: 'Reminder sent to patient' };
  },

  sendRefillNudge: async (refillId) => {
    try {
      return await apiCall('POST', `/api/refills/${refillId}/nudge`, { channel: 'whatsapp' });
    } catch (error) {
      console.log('Mock: Nudge sent locally');
    }
    return { success: true, message: 'Nudge sent to patient' };
  },

  autoNudgeAll: async () => {
    // Keep mock for now as per requirements
    console.log('Mock: Auto nudge all triggered locally');
    return { success: true, message: 'Auto nudges sent' };
  },

  toggleAutoNudge: async (enabled) => {
    try {
      return await apiCall('PATCH', '/api/settings/auto-nudge', { enabled });
    } catch (error) {
      console.log('Mock: Auto nudge toggled locally');
    }
    return { success: true, enabled };
  },

  // Prescriptions
  getPrescriptions: async () => {
    try {
      return await apiCall('GET', '/api/prescriptions');
    } catch (error) {
      console.log('Using mock prescriptions data');
    }
    return MOCK_PRESCRIPTIONS;
  },

  reviewPrescription: async (prescriptionId) => {
    try {
      return await apiCall('PATCH', `/api/prescriptions/${prescriptionId}/review`, {});
    } catch (error) {
      console.log('Mock: Prescription reviewed locally');
    }
    return { success: true, status: 'reviewed' };
  },

  // Store Settings
  getStoreProfile: async () => {
    try {
      return await apiCall('GET', '/api/stores/apollo-pharmacy');
    } catch (error) {
      console.log('Using mock store profile');
    }
    return MOCK_STORE_PROFILE;
  },

  updateStoreProfile: async (updates) => {
    try {
      return await apiCall('PUT', '/api/stores/profile', updates);
    } catch (error) {
      console.log('Mock: Store profile updated locally');
    }
    return { success: true, ...updates };
  },

  updateOperatingHours: async (hours) => {
    try {
      return await apiCall('PATCH', '/api/stores/operating-hours', hours);
    } catch (error) {
      console.log('Mock: Operating hours updated locally');
    }
    return { success: true, ...hours };
  },

  updateRefillSettings: async (settings) => {
    try {
      return await apiCall('PATCH', '/api/stores/refill-settings', settings);
    } catch (error) {
      console.log('Mock: Refill settings updated locally');
    }
    return { success: true, ...settings };
  },

  deactivateStore: async () => {
    try {
      return await apiCall('POST', '/api/stores/deactivate', {});
    } catch (error) {
      console.log('Mock: Store deactivated locally');
    }
    return { success: true, message: 'Store deactivated' };
  },

  // Analytics
  getOrdersByType: async () => {
    // Keep mock for now as per requirements
    console.log('Using mock orders by type data');
    return [
      { type: 'prescription', count: 12, revenue: 5400 },
      { type: 'otc', count: 8, revenue: 2800 }
    ];
  },

  getTopMedicines: async () => {
    // Keep mock for now as per requirements
    console.log('Using mock top medicines data');
    return MOCK_INVENTORY.slice(0, 5);
  },

  getNewPatients: async () => {
    // Keep mock for now as per requirements
    console.log('Using mock new patients data');
    return MOCK_PATIENTS.slice(0, 5);
  },

  getRefillConversionRate: async () => {
    // Keep mock for now as per requirements
    console.log('Using mock refill conversion rate');
    return { rate: 78, trend: 'up', previousRate: 72 };
  }
};
// Comprehensive RxMax API Service
// Real backend calls with comprehensive mock data fallback

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://rxmax-app.onrender.com';

// ========== MOCK DATA ==========

const MOCK_PATIENTS = [
  {
    id: 'P001',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@email.com',
    dateOfBirth: '1975-05-15',
    gender: 'Male',
    conditions: ['Hypertension', 'Diabetes'],
    allergies: ['Penicillin'],
    adherenceScore: 92,
    lifetimeValue: 45680,
    totalOrders: 28,
    memberSince: '2022-03-10',
    lastOrderDate: '2026-03-15',
    riskLevel: 'low',
    notes: [{ date: '2026-03-10', text: 'Called for refill reminder - patient very responsive' }],
    medications: [
      { id: 'M001', name: 'Amlodipine 5mg', quantity: 30, refillDate: '2026-04-10', status: 'active' },
      { id: 'M002', name: 'Metformin 500mg', quantity: 60, refillDate: '2026-04-05', status: 'active' }
    ]
  },
  {
    id: 'P002',
    name: 'Priya Sharma',
    phone: '9876543211',
    email: 'priya@email.com',
    dateOfBirth: '1988-08-22',
    gender: 'Female',
    conditions: ['Thyroid', 'PCOD'],
    allergies: [],
    adherenceScore: 78,
    lifetimeValue: 32450,
    totalOrders: 19,
    memberSince: '2023-01-15',
    lastOrderDate: '2026-02-28',
    riskLevel: 'medium',
    notes: [],
    medications: [{ id: 'M003', name: 'Levothyroxine 75mcg', quantity: 30, refillDate: '2026-03-25', status: 'active' }]
  },
  {
    id: 'P003',
    name: 'Amit Patel',
    phone: '9876543212',
    email: 'amit@email.com',
    dateOfBirth: '1982-12-03',
    gender: 'Male',
    conditions: ['Asthma', 'Allergies'],
    allergies: ['Aspirin'],
    adherenceScore: 65,
    lifetimeValue: 18920,
    totalOrders: 11,
    memberSince: '2023-07-20',
    lastOrderDate: '2026-01-15',
    riskLevel: 'high',
    notes: [],
    medications: []
  },
  {
    id: 'P004',
    name: 'Deepika Gupta',
    phone: '9876543213',
    email: 'deepika@email.com',
    dateOfBirth: '1995-03-11',
    gender: 'Female',
    conditions: ['Migraine', 'Anxiety'],
    allergies: [],
    adherenceScore: 88,
    lifetimeValue: 28560,
    totalOrders: 16,
    memberSince: '2022-11-05',
    lastOrderDate: '2026-03-12',
    riskLevel: 'low',
    notes: [],
    medications: [{ id: 'M004', name: 'Escitalopram 10mg', quantity: 30, refillDate: '2026-03-28', status: 'active' }]
  },
  {
    id: 'P005',
    name: 'Vikram Singh',
    phone: '9876543214',
    email: 'vikram@email.com',
    dateOfBirth: '1970-06-18',
    gender: 'Male',
    conditions: ['Heart Condition', 'High Cholesterol'],
    allergies: ['Iodine'],
    adherenceScore: 95,
    lifetimeValue: 62340,
    totalOrders: 35,
    memberSince: '2021-09-12',
    lastOrderDate: '2026-03-18',
    riskLevel: 'low',
    notes: [],
    medications: [
      { id: 'M005', name: 'Atorvastatin 20mg', quantity: 30, refillDate: '2026-04-15', status: 'active' },
      { id: 'M006', name: 'Aspirin 75mg', quantity: 30, refillDate: '2026-04-15', status: 'active' }
    ]
  },
  {
    id: 'P006',
    name: 'Neha Desai',
    phone: '9876543215',
    email: 'neha@email.com',
    dateOfBirth: '1992-09-25',
    gender: 'Female',
    conditions: ['PCOS', 'Irregular Periods'],
    allergies: [],
    adherenceScore: 72,
    lifetimeValue: 21340,
    totalOrders: 12,
    memberSince: '2023-04-08',
    lastOrderDate: '2026-03-01',
    riskLevel: 'medium',
    notes: [],
    medications: []
  },
  {
    id: 'P007',
    name: 'Arjun Verma',
    phone: '9876543216',
    email: 'arjun@email.com',
    dateOfBirth: '1968-01-30',
    gender: 'Male',
    conditions: ['Prostate', 'BPH'],
    allergies: ['Sulfonamides'],
    adherenceScore: 58,
    lifetimeValue: 15670,
    totalOrders: 8,
    memberSince: '2023-10-14',
    lastOrderDate: '2025-12-20',
    riskLevel: 'high',
    notes: [],
    medications: []
  },
  {
    id: 'P008',
    name: 'Sneha Mehta',
    phone: '9876543217',
    email: 'sneha@email.com',
    dateOfBirth: '1999-04-07',
    gender: 'Female',
    conditions: ['Acne', 'Skin Care'],
    allergies: [],
    adherenceScore: 85,
    lifetimeValue: 12450,
    totalOrders: 7,
    memberSince: '2024-02-10',
    lastOrderDate: '2026-03-14',
    riskLevel: 'low',
    notes: [],
    medications: []
  },
  {
    id: 'P009',
    name: 'Sanjay Reddy',
    phone: '9876543218',
    email: 'sanjay@email.com',
    dateOfBirth: '1980-07-14',
    gender: 'Male',
    conditions: ['Arthritis', 'Joint Pain'],
    allergies: ['NSAIDs'],
    adherenceScore: 68,
    lifetimeValue: 34560,
    totalOrders: 20,
    memberSince: '2022-05-22',
    lastOrderDate: '2026-02-10',
    riskLevel: 'medium',
    notes: [],
    medications: []
  },
  {
    id: 'P010',
    name: 'Kavya Nair',
    phone: '9876543219',
    email: 'kavya@email.com',
    dateOfBirth: '1987-11-19',
    gender: 'Female',
    conditions: ['Depression', 'Anxiety'],
    allergies: [],
    adherenceScore: 81,
    lifetimeValue: 28900,
    totalOrders: 16,
    memberSince: '2023-03-01',
    lastOrderDate: '2026-03-16',
    riskLevel: 'low',
    notes: [],
    medications: [{ id: 'M007', name: 'Sertraline 50mg', quantity: 30, refillDate: '2026-04-02', status: 'active' }]
  },
  {
    id: 'P011',
    name: 'Rohan Kapoor',
    phone: '9876543220',
    email: 'rohan@email.com',
    dateOfBirth: '1978-02-28',
    gender: 'Male',
    conditions: ['Diabetes', 'Hypertension'],
    allergies: [],
    adherenceScore: 73,
    lifetimeValue: 38920,
    totalOrders: 22,
    memberSince: '2022-07-15',
    lastOrderDate: '2026-03-11',
    riskLevel: 'medium',
    notes: [],
    medications: []
  },
  {
    id: 'P012',
    name: 'Anjali Singh',
    phone: '9876543221',
    email: 'anjali@email.com',
    dateOfBirth: '1993-10-05',
    gender: 'Female',
    conditions: ['Migraine'],
    allergies: [],
    adherenceScore: 91,
    lifetimeValue: 24560,
    totalOrders: 14,
    memberSince: '2023-05-20',
    lastOrderDate: '2026-03-17',
    riskLevel: 'low',
    notes: [],
    medications: []
  },
  {
    id: 'P013',
    name: 'Manish Iyer',
    phone: '9876543222',
    email: 'manish@email.com',
    dateOfBirth: '1981-08-12',
    gender: 'Male',
    conditions: ['Hypertension', 'High Cholesterol'],
    allergies: [],
    adherenceScore: 55,
    lifetimeValue: 19870,
    totalOrders: 9,
    memberSince: '2024-01-10',
    lastOrderDate: '2025-11-30',
    riskLevel: 'high',
    notes: [],
    medications: []
  },
  {
    id: 'P014',
    name: 'Swati Nair',
    phone: '9876543223',
    email: 'swati@email.com',
    dateOfBirth: '1996-06-22',
    gender: 'Female',
    conditions: ['Thyroid'],
    allergies: [],
    adherenceScore: 87,
    lifetimeValue: 31200,
    totalOrders: 18,
    memberSince: '2023-02-14',
    lastOrderDate: '2026-03-13',
    riskLevel: 'low',
    notes: [],
    medications: []
  },
  {
    id: 'P015',
    name: 'Rajiv Desai',
    phone: '9876543224',
    email: 'rajiv@email.com',
    dateOfBirth: '1975-04-18',
    gender: 'Male',
    conditions: ['Asthma', 'COPD'],
    allergies: [],
    adherenceScore: 62,
    lifetimeValue: 22340,
    totalOrders: 13,
    memberSince: '2023-09-05',
    lastOrderDate: '2026-02-28',
    riskLevel: 'high',
    notes: [],
    medications: []
  }
];

const MOCK_ORDERS = Array.from({ length: 20 }, (_, i) => ({
  id: `ORD${String(i + 1).padStart(5, '0')}`,
  patientId: MOCK_PATIENTS[i % MOCK_PATIENTS.length].id,
  patientName: MOCK_PATIENTS[i % MOCK_PATIENTS.length].name,
  patientPhone: MOCK_PATIENTS[i % MOCK_PATIENTS.length].phone,
  items: [
    { id: `M${String(i + 1).padStart(3, '0')}`, name: `Medicine ${i + 1}`, quantity: Math.floor(Math.random() * 5) + 1, price: 250 + Math.random() * 500 }
  ],
  totalAmount: Math.floor(250 + Math.random() * 2000),
  status: ['pending', 'confirmed', 'preparing', 'ready', 'delivered'][Math.floor(Math.random() * 5)],
  paymentStatus: 'paid',
  createdAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
  date: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
  deliveryAddress: 'Store Address',
  notes: ''
}));

const MOCK_INVENTORY = [
  { id: 'INV001', name: 'Amlodipine 5mg', stock: 450, sellingPrice: 35, mrp: 45, discount: 22, expiry: '2026-06-30', status: 'good' },
  { id: 'INV002', name: 'Metformin 500mg', stock: 320, sellingPrice: 28, mrp: 40, discount: 30, expiry: '2026-08-15', status: 'good' },
  { id: 'INV003', name: 'Levothyroxine 75mcg', stock: 180, sellingPrice: 65, mrp: 85, discount: 24, expiry: '2026-07-20', status: 'low' },
  { id: 'INV004', name: 'Atorvastatin 20mg', stock: 55, sellingPrice: 42, mrp: 60, discount: 30, expiry: '2026-05-10', status: 'critical' },
  { id: 'INV005', name: 'Aspirin 75mg', stock: 620, sellingPrice: 15, mrp: 25, discount: 40, expiry: '2027-01-30', status: 'good' },
  { id: 'INV006', name: 'Escitalopram 10mg', stock: 210, sellingPrice: 52, mrp: 75, discount: 31, expiry: '2026-09-12', status: 'good' },
  { id: 'INV007', name: 'Sertraline 50mg', stock: 140, sellingPrice: 58, mrp: 85, discount: 32, expiry: '2026-08-05', status: 'low' },
  { id: 'INV008', name: 'Ibuprofen 400mg', stock: 890, sellingPrice: 18, mrp: 30, discount: 40, expiry: '2027-03-20', status: 'good' },
  { id: 'INV009', name: 'Amoxicillin 500mg', stock: 340, sellingPrice: 28, mrp: 45, discount: 38, expiry: '2026-10-14', status: 'good' },
  { id: 'INV010', name: 'Cetrizine 10mg', stock: 760, sellingPrice: 22, mrp: 35, discount: 37, expiry: '2027-05-08', status: 'good' },
  { id: 'INV011', name: 'Omeprazole 20mg', stock: 425, sellingPrice: 35, mrp: 55, discount: 36, expiry: '2026-11-25', status: 'good' },
  { id: 'INV012', name: 'Vitamin B12 1000mcg', stock: 88, sellingPrice: 45, mrp: 65, discount: 31, expiry: '2026-04-18', status: 'critical' },
  { id: 'INV013', name: 'Paracetamol 500mg', stock: 1200, sellingPrice: 8, mrp: 15, discount: 47, expiry: '2027-02-10', status: 'good' },
  { id: 'INV014', name: 'Vitamin D3 2000IU', stock: 340, sellingPrice: 42, mrp: 60, discount: 30, expiry: '2026-12-30', status: 'good' },
  { id: 'INV015', name: 'Cough Syrup', stock: 125, sellingPrice: 95, mrp: 140, discount: 32, expiry: '2026-07-15', status: 'low' },
  { id: 'INV016', name: 'Dolomite Tablet', stock: 560, sellingPrice: 28, mrp: 45, discount: 38, expiry: '2027-01-20', status: 'good' },
  { id: 'INV017', name: 'Calcium + Vitamin D', stock: 310, sellingPrice: 52, mrp: 75, discount: 31, expiry: '2026-09-05', status: 'good' },
  { id: 'INV018', name: 'Multivitamin', stock: 480, sellingPrice: 35, mrp: 55, discount: 36, expiry: '2026-11-12', status: 'good' },
  { id: 'INV019', name: 'Glucose Monitor', stock: 45, sellingPrice: 1200, mrp: 1500, discount: 20, expiry: '2027-06-30', status: 'good' },
  { id: 'INV020', name: 'Blood Pressure Monitor', stock: 28, sellingPrice: 2500, mrp: 3500, discount: 29, expiry: '2027-08-15', status: 'low' }
];

const MOCK_REFILLS = [
  { id: 'R001', patientId: 'P001', patientName: 'Rajesh Kumar', medicine: 'Amlodipine 5mg', refillDueDate: '2026-04-05', daysRemaining: 0, estimatedValue: 1050, reminderStatus: 'sent', escalationLevel: 'urgent', status: 'pending' },
  { id: 'R002', patientId: 'P001', patientName: 'Rajesh Kumar', medicine: 'Metformin 500mg', refillDueDate: '2026-04-10', daysRemaining: 5, estimatedValue: 1680, reminderStatus: 'sent', escalationLevel: 'normal', status: 'pending' },
  { id: 'R003', patientId: 'P002', patientName: 'Priya Sharma', medicine: 'Levothyroxine 75mcg', refillDueDate: '2026-04-03', daysRemaining: -2, estimatedValue: 1950, reminderStatus: 'not_sent', escalationLevel: 'critical', status: 'pending' },
  { id: 'R004', patientId: 'P004', patientName: 'Deepika Gupta', medicine: 'Escitalopram 10mg', refillDueDate: '2026-04-08', daysRemaining: 3, estimatedValue: 1560, reminderStatus: 'sent', escalationLevel: 'normal', status: 'pending' },
  { id: 'R005', patientId: 'P005', patientName: 'Vikram Singh', medicine: 'Atorvastatin 20mg', refillDueDate: '2026-04-15', daysRemaining: 10, estimatedValue: 1260, reminderStatus: 'not_sent', escalationLevel: 'low', status: 'pending' },
  { id: 'R006', patientId: 'P005', patientName: 'Vikram Singh', medicine: 'Aspirin 75mg', refillDueDate: '2026-04-15', daysRemaining: 10, estimatedValue: 450, reminderStatus: 'not_sent', escalationLevel: 'low', status: 'pending' },
  { id: 'R007', patientId: 'P010', patientName: 'Kavya Nair', medicine: 'Sertraline 50mg', refillDueDate: '2026-04-07', daysRemaining: 2, estimatedValue: 1740, reminderStatus: 'sent', escalationLevel: 'normal', status: 'pending' },
  { id: 'R008', patientId: 'P006', patientName: 'Neha Desai', medicine: 'Supplements', refillDueDate: '2026-04-12', daysRemaining: 7, estimatedValue: 2150, reminderStatus: 'not_sent', escalationLevel: 'low', status: 'pending' },
  { id: 'R009', patientId: 'P009', patientName: 'Sanjay Reddy', medicine: 'Joint Supplement', refillDueDate: '2026-04-02', daysRemaining: -3, estimatedValue: 1890, reminderStatus: 'sent', escalationLevel: 'critical', status: 'pending' },
  { id: 'R010', patientId: 'P012', patientName: 'Anjali Singh', medicine: 'Migraine Relief', refillDueDate: '2026-04-20', daysRemaining: 15, estimatedValue: 1200, reminderStatus: 'not_sent', escalationLevel: 'low', status: 'pending' }
];

const MOCK_PRESCRIPTIONS = [
  { id: 'RX001', patientId: 'P001', patientName: 'Rajesh Kumar', medicines: ['Amlodipine 5mg', 'Metformin 500mg'], submittedDate: '2026-03-18', doctorName: 'Dr. Mehta', status: 'reviewed' },
  { id: 'RX002', patientId: 'P002', patientName: 'Priya Sharma', medicines: ['Levothyroxine 75mcg'], submittedDate: '2026-03-20', doctorName: 'Dr. Sharma', status: 'pending' },
  { id: 'RX003', patientId: 'P004', patientName: 'Deepika Gupta', medicines: ['Escitalopram 10mg'], submittedDate: '2026-03-15', doctorName: 'Dr. Patel', status: 'reviewed' },
  { id: 'RX004', patientId: 'P005', patientName: 'Vikram Singh', medicines: ['Atorvastatin 20mg', 'Aspirin 75mg'], submittedDate: '2026-03-22', doctorName: 'Dr. Kumar', status: 'pending' },
  { id: 'RX005', patientId: 'P010', patientName: 'Kavya Nair', medicines: ['Sertraline 50mg'], submittedDate: '2026-03-19', doctorName: 'Dr. Singh', status: 'reviewed' }
];

const generateDailyRevenue = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(8000 + Math.random() * 5000),
      orders: Math.floor(8 + Math.random() * 12)
    });
  }
  return data;
};

const MOCK_STORE_PROFILE = {
  id: 'STORE001',
  storeName: 'RxMax Central Pharmacy',
  ownerName: 'Dr. Ramesh Kumar',
  phone: '9876543200',
  email: 'admin@rxmaxpharmacy.com',
  address: '123 Main Street, Medical Complex',
  city: 'Bangalore',
  pincode: '560001',
  state: 'Karnataka',
  licenseNumber: 'LIC2021001',
  gstNumber: '18AAPCP1234A1Z0',
  registrationDate: '2021-06-15',
  subscribedPlan: 'professional',
  operatingHours: {
    monday: '9:00-21:00',
    tuesday: '9:00-21:00',
    wednesday: '9:00-21:00',
    thursday: '9:00-21:00',
    friday: '9:00-21:00',
    saturday: '10:00-20:00',
    sunday: 'Closed'
  },
  deliverySettings: {
    enableDelivery: true,
    deliveryRadius: 5,
    deliveryCharge: 50,
    freeDeliveryAbove: 500
  },
  refillSettings: {
    autoNudge: true,
    nudgeTime: '09:00',
    reminderDays: 3
  }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Generic API call helper with authentication
 * Tries to call the local server first, throws on error for fallback
 */
const apiCall = async (method, path, body = null) => {
  const token = localStorage.getItem('medibuddy_token');
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
};

// ========== API FUNCTIONS ==========

export const api = {
  // Auth
  login: async (phone, password) => {
    // Try server first
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/store/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('medibuddy_token', data.token);
        localStorage.setItem('rxmax_store_id', data.storeId);
        return data;
      }
    } catch (error) {
      console.log('Server unavailable, checking local credentials');
    }

    // Mock fallback: Accept demo credentials
    if (phone === '9876543200' && password === 'demo123') {
      const token = 'mock_token_' + Date.now();
      localStorage.setItem('medibuddy_token', token);
      localStorage.setItem('rxmax_store_id', 'STORE001');
      return { token, storeId: 'STORE001', storeName: 'RxMax Central Pharmacy' };
    }
    throw new Error('Invalid credentials');
  },

  register: async (storeData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData)
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('medibuddy_token', data.token);
        localStorage.setItem('rxmax_store_id', data.storeId);
        return data;
      }
    } catch (error) {
      console.log('Backend unavailable, using mock data');
    }
    // Mock: Auto-approve registration
    const token = 'mock_token_' + Date.now();
    const storeId = 'STORE' + Math.floor(Math.random() * 10000);
    localStorage.setItem('medibuddy_token', token);
    localStorage.setItem('rxmax_store_id', storeId);
    return { token, storeId, storeName: storeData.storeName, patientLink: `https://rxmax.app/patient/${storeId}` };
  },

  // Dashboard
  getDashboardSummary: async () => {
    try {
      return await apiCall('GET', '/api/stores/dashboard/summary');
    } catch (error) {
      console.log('Using mock dashboard data');
    }
    return {
      totalOrders: MOCK_ORDERS.length,
      totalRevenue: MOCK_ORDERS.reduce((sum, o) => sum + o.totalAmount, 0),
      activePatients: MOCK_PATIENTS.length,
      pendingRefills: MOCK_REFILLS.length
    };
  },

  getDailyRevenue: async () => {
    try {
      return await apiCall('GET', '/api/stores/analytics/detailed');
    } catch (error) {
      console.log('Using mock revenue data');
    }
    return generateDailyRevenue();
  },

  // Patients
  getPatients: async () => {
    try {
      return await apiCall('GET', '/api/stores/patients');
    } catch (error) {
      console.log('Using mock patients data');
    }
    return MOCK_PATIENTS;
  },

  getPatientById: async (id) => {
    try {
      return await apiCall('GET', `/api/stores/patients/${id}`);
    } catch (error) {
      console.log('Using mock patient data');
    }
    return MOCK_PATIENTS.find(p => p.id === id) || MOCK_PATIENTS[0];
  },

  updatePatientNotes: async (patientId, notes) => {
    // Keep mock for now as per requirements
    console.log('Mock: Patient notes updated locally');
    return { success: true, notes };
  },

  addPatientNote: async (patientId, note) => {
    try {
      return await apiCall('POST', `/api/stores/patients/${patientId}/notes`, {
        text: note,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.log('Mock: Note added locally');
    }
    return { success: true, note: { text: note, date: new Date().toISOString().split('T')[0] } };
  },

  // Orders
  getOrders: async () => {
    try {
      return await apiCall('GET', '/api/orders');
    } catch (error) {
      console.log('Using mock orders data');
    }
    return MOCK_ORDERS;
  },

  getOrderById: async (id) => {
    try {
      return await apiCall('GET', `/api/orders/${id}`);
    } catch (error) {
      console.log('Using mock order data');
    }
    return MOCK_ORDERS.find(o => o.id === id) || MOCK_ORDERS[0];
  },

  getRecentOrders: async (limit) => {
    try {
      return await apiCall('GET', `/api/orders?limit=${limit}`);
    } catch (error) {
      console.log('Using mock recent orders data');
    }
    return MOCK_ORDERS.slice(0, limit);
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      return await apiCall('PUT', `/api/orders/${orderId}/status`, { status });
    } catch (error) {
      console.log('Mock: Order status updated locally');
    }
    return { success: true, status };
  },

  // Inventory
  getInventory: async () => {
    try {
      return await apiCall('GET', '/api/stores/inventory');
    } catch (error) {
      console.log('Using mock inventory data');
    }
    return MOCK_INVENTORY;
  },

  updateStock: async (medicineId, newStock) => {
    // Keep mock for now as per requirements
    console.log('Mock: Stock updated locally');
    return { success: true, medicineId, newStock };
  },

  updateInventory: async (itemId, updates) => {
    try {
      return await apiCall('PUT', `/api/stores/inventory/${itemId}`, updates);
    } catch (error) {
      console.log('Mock: Inventory updated locally');
    }
    return { success: true, ...updates };
  },

  addMedicine: async (medicineData) => {
    try {
      return await apiCall('POST', '/api/stores/inventory', medicineData);
    } catch (error) {
      console.log('Mock: Medicine added locally');
    }
    return { success: true, id: 'INV' + Math.floor(Math.random() * 10000) };
  },

  // Refills
  getRefills: async () => {
    try {
      return await apiCall('GET', '/api/refills/upcoming');
    } catch (error) {
      console.log('Using mock refills data');
    }
    return MOCK_REFILLS;
  },

  sendReminder: async (refillId) => {
    try {
      return await apiCall('POST', `/api/refills/${refillId}/nudge`, { channel: 'whatsapp' });
    } catch (error) {
      console.log('Mock: Reminder sent locally');
    }
    return { success: true, message: 'Reminder sent to patient' };
  },

  sendRefillNudge: async (refillId) => {
    try {
      return await apiCall('POST', `/api/refills/${refillId}/nudge`, { channel: 'whatsapp' });
    } catch (error) {
      console.log('Mock: Nudge sent locally');
    }
    return { success: true, message: 'Nudge sent to patient' };
  },

  autoNudgeAll: async () => {
    // Keep mock for now as per requirements
    console.log('Mock: Auto nudge all triggered locally');
    return { success: true, message: 'Auto nudges sent' };
  },

  toggleAutoNudge: async (enabled) => {
    try {
      return await apiCall('PATCH', '/api/settings/auto-nudge', { enabled });
    } catch (error) {
      console.log('Mock: Auto nudge toggled locally');
    }
    return { success: true, enabled };
  },

  // Prescriptions
  getPrescriptions: async () => {
    try {
      return await apiCall('GET', '/api/prescriptions');
    } catch (error) {
      console.log('Using mock prescriptions data');
    }
    return MOCK_PRESCRIPTIONS;
  },

  reviewPrescription: async (prescriptionId) => {
    try {
      return await apiCall('PATCH', `/api/prescriptions/${prescriptionId}/review`, {});
    } catch (error) {
      console.log('Mock: Prescription reviewed locally');
    }
    return { success: true, status: 'reviewed' };
  },

  // Store Settings
  getStoreProfile: async () => {
    try {
      return await apiCall('GET', '/api/stores/apollo-pharmacy');
    } catch (error) {
      console.log('Using mock store profile');
    }
    return MOCK_STORE_PROFILE;
  },

  updateStoreProfile: async (updates) => {
    try {
      return await apiCall('PUT', '/api/stores/profile', updates);
    } catch (error) {
      console.log('Mock: Store profile updated locally');
    }
    return { success: true, ...updates };
  },

  updateOperatingHours: async (hours) => {
    try {
      return await apiCall('PATCH', '/api/stores/operating-hours', hours);
    } catch (error) {
      console.log('Mock: Operating hours updated locally');
    }
    return { success: true, ...hours };
  },

  updateRefillSettings: async (settings) => {
    try {
      return await apiCall('PATCH', '/api/stores/refill-settings', settings);
    } catch (error) {
      console.log('Mock: Refill settings updated locally');
    }
    return { success: true, ...settings };
  },

  deactivateStore: async () => {
    try {
      return await apiCall('POST', '/api/stores/deactivate', {});
    } catch (error) {
      console.log('Mock: Store deactivated locally');
    }
    return { success: true, message: 'Store deactivated' };
  },

  // Analytics
  getOrdersByType: async () => {
    // Keep mock for now as per requirements
    console.log('Using mock orders by type data');
    return [
      { type: 'prescription', count: 12, revenue: 5400 },
      { type: 'otc', count: 8, revenue: 2800 }
    ];
  },

  getTopMedicines: async () => {
    // Keep mock for now as per requirements
    console.log('Using mock top medicines data');
    return MOCK_INVENTORY.slice(0, 5);
  },

  getNewPatients: async () => {
    // Keep mock for now as per requirements
    console.log('Using mock new patients data');
    return MOCK_PATIENTS.slice(0, 5);
  },

  getRefillConversionRate: async () => {
    // Keep mock for now as per requirements
    console.log('Using mock refill conversion rate');
    return { rate: 78, trend: 'up', previousRate: 72 };
  }
};
