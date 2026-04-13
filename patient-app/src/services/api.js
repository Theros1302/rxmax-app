// RxMax API Service - v4 with comprehensive mock fallback
import fallbackMedicines from '../data/medicines';

const mockStores = {
  'apollo': {
    id: 'apollo-1',
    slug: 'apollo',
    name: 'Apollo Pharmacy - Banjara Hills',
    phone: '+91-40-4455-0000',
    address: '123, Banjara Hills Road No.1, Hyderabad',
    hours: '9:00 AM - 10:00 PM',
    city: 'Hyderabad',
    license: 'AP-2024-001'
  },
  'fortis': {
    id: 'fortis-1',
    slug: 'fortis',
    name: 'Fortis Pharmacy - Downtown',
    phone: '+91-11-4040-4040',
    address: '456, Metro Mall, New Delhi',
    hours: '8:00 AM - 11:00 PM',
    city: 'Delhi',
    license: 'DL-2024-002'
  }
};

const mockMedicines = fallbackMedicines;

const mockPrescriptions = [
  {
    id: 'rx-001',
    doctorName: 'Dr. Rajesh Kumar',
    hospitalName: 'Max Healthcare',
    date: '2024-03-15',
    imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="280"%3E%3Crect fill="%23f5f5f5" width="200" height="280"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3EPrescription Image%3C/text%3E%3C/svg%3E',
    medicines: [
      { id: 1, name: 'Aspirin', dosage: '500mg', quantity: 10, instruction: '1 tablet twice daily' },
      { id: 2, name: 'Paracetamol', dosage: '500mg', quantity: 15, instruction: '1 tablet as needed' }
    ],
    status: 'verified'
  },
  {
    id: 'rx-002',
    doctorName: 'Dr. Priya Sharma',
    hospitalName: 'Fortis Hospital',
    date: '2024-03-10',
    imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="280"%3E%3Crect fill="%23f5f5f5" width="200" height="280"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3EPrescription Image%3C/text%3E%3C/svg%3E',
    medicines: [
      { id: 31, name: 'Metformin 500', dosage: '500mg', quantity: 60, instruction: '1 tablet twice daily' }
    ],
    status: 'verified'
  },
  {
    id: 'rx-003',
    doctorName: 'Dr. Amol Desai',
    hospitalName: 'Apollo Hospital',
    date: '2024-03-08',
    imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="280"%3E%3Crect fill="%23f5f5f5" width="200" height="280"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3EPrescription Image%3C/text%3E%3C/svg%3E',
    medicines: [
      { id: 41, name: 'Atorvastatin 10', dosage: '10mg', quantity: 30, instruction: '1 tablet once daily at night' }
    ],
    status: 'verified'
  },
  {
    id: 'rx-004',
    doctorName: 'Dr. Kavya Reddy',
    hospitalName: 'Care Hospital',
    date: '2024-03-05',
    imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="280"%3E%3Crect fill="%23f5f5f5" width="200" height="280"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3EPrescription Image%3C/text%3E%3C/svg%3E',
    medicines: [
      { id: 21, name: 'Amoxicillin', dosage: '250mg', quantity: 12, instruction: '1 capsule thrice daily' },
      { id: 7, name: 'Paracetamol', dosage: '500mg', quantity: 15, instruction: '1 tablet as needed' }
    ],
    status: 'pending'
  },
  {
    id: 'rx-005',
    doctorName: 'Dr. Suresh Nair',
    hospitalName: 'Manipal Hospital',
    date: '2024-03-01',
    imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="280"%3E%3Crect fill="%23f5f5f5" width="200" height="280"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3EPrescription Image%3C/text%3E%3C/svg%3E',
    medicines: [
      { id: 44, name: 'Lisinopril 10', dosage: '10mg', quantity: 30, instruction: '1 tablet once daily' },
      { id: 51, name: 'Omeprazole 20', dosage: '20mg', quantity: 14, instruction: '1 capsule once daily' }
    ],
    status: 'verified'
  }
];

const mockOrders = [
  {
    id: 'ORD-001',
    date: '2024-03-18',
    medicines: [
      { id: 1, name: 'Aspirin', dosage: '500mg', quantity: 10, price: 45 },
      { id: 7, name: 'Paracetamol', dosage: '500mg', quantity: 15, price: 35 }
    ],
    subtotal: 1275,
    delivery: 50,
    total: 1325,
    status: 'delivered',
    deliveryDate: '2024-03-19',
    deliveryType: 'home',
    deliveryAddress: 'Flat 203, Green Park Apartments, Banjara Hills'
  },
  {
    id: 'ORD-002',
    date: '2024-03-17',
    medicines: [
      { id: 31, name: 'Metformin 500', dosage: '500mg', quantity: 30, price: 120 }
    ],
    subtotal: 3600,
    delivery: 50,
    total: 3650,
    status: 'delivered',
    deliveryDate: '2024-03-18',
    deliveryType: 'home',
    deliveryAddress: 'Flat 203, Green Park Apartments, Banjara Hills'
  },
  {
    id: 'ORD-003',
    date: '2024-03-16',
    medicines: [
      { id: 41, name: 'Atorvastatin 10', dosage: '10mg', quantity: 30, price: 200 }
    ],
    subtotal: 6000,
    delivery: 0,
    total: 6000,
    status: 'delivered',
    deliveryDate: '2024-03-16',
    deliveryType: 'pickup',
    pickupTime: '3:00 PM'
  },
  {
    id: 'ORD-004',
    date: '2024-03-15',
    medicines: [
      { id: 21, name: 'Amoxicillin', dosage: '250mg', quantity: 12, price: 85 },
      { id: 7, name: 'Paracetamol', dosage: '500mg', quantity: 10, price: 35 }
    ],
    subtotal: 1420,
    delivery: 50,
    total: 1470,
    status: 'ready',
    deliveryType: 'home',
    deliveryAddress: 'Flat 203, Green Park Apartments, Banjara Hills'
  },
  {
    id: 'ORD-005',
    date: '2024-03-14',
    medicines: [
      { id: 44, name: 'Lisinopril 10', dosage: '10mg', quantity: 30, price: 175 }
    ],
    subtotal: 5250,
    delivery: 50,
    total: 5300,
    status: 'processing',
    deliveryType: 'home',
    deliveryAddress: 'Flat 203, Green Park Apartments, Banjara Hills'
  },
  {
    id: 'ORD-006',
    date: '2024-03-13',
    medicines: [
      { id: 51, name: 'Omeprazole 20', dosage: '20mg', quantity: 14, price: 95 }
    ],
    subtotal: 1330,
    delivery: 50,
    total: 1380,
    status: 'processing',
    deliveryType: 'home',
    deliveryAddress: 'Flat 203, Green Park Apartments, Banjara Hills'
  },
  {
    id: 'ORD-007',
    date: '2024-03-12',
    medicines: [
      { id: 61, name: 'Cetirizine 10', dosage: '10mg', quantity: 10, price: 65 }
    ],
    subtotal: 650,
    delivery: 0,
    total: 650,
    status: 'delivered',
    deliveryDate: '2024-03-12',
    deliveryType: 'pickup',
    pickupTime: '2:30 PM'
  },
  {
    id: 'ORD-008',
    date: '2024-03-11',
    medicines: [
      { id: 1, name: 'Aspirin', dosage: '500mg', quantity: 20, price: 45 }
    ],
    subtotal: 900,
    delivery: 50,
    total: 950,
    status: 'delivered',
    deliveryDate: '2024-03-12',
    deliveryType: 'home',
    deliveryAddress: 'Flat 203, Green Park Apartments, Banjara Hills'
  },
  {
    id: 'ORD-009',
    date: '2024-03-10',
    medicines: [
      { id: 31, name: 'Metformin 500', dosage: '500mg', quantity: 60, price: 120 }
    ],
    subtotal: 7200,
    delivery: 50,
    total: 7250,
    status: 'delivered',
    deliveryDate: '2024-03-11',
    deliveryType: 'home',
    deliveryAddress: 'Flat 203, Green Park Apartments, Banjara Hills'
  },
  {
    id: 'ORD-010',
    date: '2024-03-09',
    medicines: [
      { id: 41, name: 'Atorvastatin 10', dosage: '10mg', quantity: 30, price: 200 }
    ],
    subtotal: 6000,
    delivery: 50,
    total: 6050,
    status: 'delivered',
    deliveryDate: '2024-03-10',
    deliveryType: 'home',
    deliveryAddress: 'Flat 203, Green Park Apartments, Banjara Hills'
  }
];

const mockRefills = [
  {
    id: 'ref-1',
    medicineName: 'Metformin 500',
    dosage: '500mg',
    quantity: 60,
    lastRefillDate: '2024-02-18',
    refillDueDate: '2024-03-20',
    daysRemaining: 1,
    price: 120
  },
  {
    id: 'ref-2',
    medicineName: 'Atorvastatin 10',
    dosage: '10mg',
    quantity: 30,
    lastRefillDate: '2024-02-16',
    refillDueDate: '2024-03-22',
    daysRemaining: 3,
    price: 200
  },
  {
    id: 'ref-3',
    medicineName: 'Lisinopril 10',
    dosage: '10mg',
    quantity: 30,
    lastRefillDate: '2024-02-20',
    refillDueDate: '2024-03-25',
    daysRemaining: 6,
    price: 175
  },
  {
    id: 'ref-4',
    medicineName: 'Omeprazole 20',
    dosage: '20mg',
    quantity: 14,
    lastRefillDate: '2024-02-21',
    refillDueDate: '2024-03-28',
    daysRemaining: 9,
    price: 95
  },
  {
    id: 'ref-5',
    medicineName: 'Aspirin',
    dosage: '500mg',
    quantity: 10,
    lastRefillDate: '2024-03-08',
    refillDueDate: '2024-04-10',
    daysRemaining: 22,
    price: 45
  }
];

const mockPatient = {
  id: 'pat-001',
  name: 'Rajesh Kumar',
  phone: '+91 9876543210',
  email: 'rajesh.kumar@email.com',
  address: 'Flat 203, Green Park Apartments, Banjara Hills, Hyderabad - 500034',
  dateOfBirth: '1985-06-15',
  gender: 'Male',
  allergies: ['Penicillin', 'Shellfish'],
  healthConditions: ['Diabetes', 'High Blood Pressure', 'High Cholesterol'],
  familyMembers: [
    { id: 'fam-1', name: 'Anjali Kumar', relation: 'Spouse', phone: '+91 9876543211' },
    { id: 'fam-2', name: 'Arjun Kumar', relation: 'Son', phone: '+91 9876543212' }
  ],
  connectedStore: 'apollo-1'
};

// API Service Class
class ApiService {
  constructor(baseUrl = process.env.REACT_APP_API_URL || 'https://rxmax-app.onrender.com') {
    this.baseUrl = baseUrl;
    this.apiPath = '/api';
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  setToken(token) {
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    localStorage.removeItem('authToken');
  }

  // Helper method for API calls with token and error handling
  async apiCall(method, path, body = null) {
    const headers = {
      'Content-Type': 'application/json'
    };

    const token = this.getToken();
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

    try {
      const response = await fetch(`${this.baseUrl}${this.apiPath}${path}`, options);

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      // Re-throw to let caller handle fallback to mock data
      throw err;
    }
  }

  // Auth
  async sendOtp(phone) {
    try {
      return await this.apiCall('POST', '/auth/patient/send-otp', { phone });
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, message: 'OTP sent successfully', requestId: 'req-' + Date.now() };
    }
  }

  async verifyOtp(phone, otp, requestId) {
    try {
      const result = await this.apiCall('POST', '/auth/patient/verify-otp', { phone, otp });
      if (result.token) {
        this.setToken(result.token);
      }
      return result;
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 800));
      if (otp === '123456') {
        const token = 'mock-jwt-token-' + Date.now();
        this.setToken(token);
        return {
          success: true,
          token,
          patient: mockPatient
        };
      }
      throw new Error('Invalid OTP');
    }
  }

  // Prescriptions - AI Reading
  async uploadPrescription(imageData, doctorName, hospitalName) {
    // First, try server with Gemini backend
    let base64Clean = imageData;
    let mimeType = 'image/jpeg';
    if (imageData.startsWith('data:')) {
      const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/s);
      if (match) {
        mimeType = match[1];
        base64Clean = match[2];
      }
    }

    try {
      // Use public /read-ai endpoint (no auth required)
      const response = await fetch(`${this.baseUrl}${this.apiPath}/prescriptions/read-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Clean,
          mimeType,
          doctorName,
          hospitalName
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.medicines && result.medicines.length > 0) {
          mockPrescriptions.push(result);
          return result;
        }
      }
    } catch (err) {
      console.log('Server unavailable for prescription read-ai, trying Gemini directly:', err.message);
    }

    // Fallback: Try Gemini directly
    const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;

    if (geminiKey && imageData) {
      try {
        const prompt = `You are an expert pharmacist AI in India. Read this prescription image and extract ALL medicines.

For EACH medicine provide:
1. medicine_name: BRAND NAME as written (e.g., "Zocon 200", "Dolo 650")
2. dosage: Strength as written
3. frequency: How often (e.g., "twice daily")
4. duration_days: Days prescribed (estimate 7 if unclear)
5. quantity: Total quantity
6. instructions: Special instructions (e.g., "after food")

Also extract: doctor_name, hospital_name, diagnosis, prescription_date (YYYY-MM-DD).

Respond ONLY with valid JSON:
{"doctor_name":"Dr. Name","hospital_name":"Hospital","diagnosis":"Condition","prescription_date":"YYYY-MM-DD","confidence":0.85,"medicines":[{"medicine_name":"Brand Name","dosage":"500mg","frequency":"twice daily","duration_days":7,"quantity":14,"instructions":"after food"}]}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64Clean } }
                ]
              }]
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

          let jsonStr = text;
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) jsonStr = jsonMatch[1].trim();

          const extracted = JSON.parse(jsonStr);
          const medicines = (extracted.medicines || []).map((m, idx) => ({
            id: idx + 1,
            name: m.medicine_name,
            dosage: m.dosage,
            quantity: m.quantity || 10,
            instruction: m.instructions || m.frequency
          }));

          const newPrescription = {
            id: 'rx-' + Date.now(),
            doctorName: extracted.doctor_name || doctorName,
            hospitalName: extracted.hospital_name || hospitalName,
            date: new Date().toISOString().split('T')[0],
            imageUrl: imageData,
            medicines,
            status: 'pending',
            aiProcessed: true,
            confidence: extracted.confidence,
            diagnosis: extracted.diagnosis
          };
          mockPrescriptions.push(newPrescription);
          return newPrescription;
        }
      } catch (err) {
        console.log('Gemini AI error:', err.message);
      }
    }

    // Ultimate fallback: demo data without AI
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newPrescription = {
      id: 'rx-' + Date.now(),
      doctorName,
      hospitalName,
      date: new Date().toISOString().split('T')[0],
      imageUrl: imageData,
      medicines: mockMedicines.slice(0, 3).map((m, idx) => ({
        id: idx + 1,
        name: m.name,
        dosage: m.dosage,
        quantity: m.quantity || 10,
        instruction: 'As per doctor\'s advice'
      })),
      status: 'pending',
      aiProcessed: false
    };
    mockPrescriptions.push(newPrescription);
    return newPrescription;
  }

  async listPrescriptions() {
    try {
      return await this.apiCall('GET', '/prescriptions');
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 400));
      return mockPrescriptions;
    }
  }

  async getPrescription(id) {
    try {
      return await this.apiCall('GET', `/prescriptions/${id}`);
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockPrescriptions.find(p => p.id === id);
    }
  }

  // Orders
  async createOrder(medicines, deliveryType, deliveryAddress) {
    const orderData = {
      items: medicines.map(m => ({
        medicineId: m.id,
        name: m.name,
        quantity: m.quantity,
        price: m.price
      })),
      deliveryType,
      deliveryAddress,
      storeId: 'store-1'
    };

    try {
      return await this.apiCall('POST', '/orders', orderData);
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 800));
      const subtotal = medicines.reduce((sum, m) => sum + (m.price * m.quantity), 0);
      const delivery = deliveryType === 'pickup' ? 0 : 50;
      const newOrder = {
        id: 'ORD-' + (mockOrders.length + 1).toString().padStart(3, '0'),
        date: new Date().toISOString().split('T')[0],
        medicines,
        subtotal,
        delivery,
        total: subtotal + delivery,
        status: 'processing',
        deliveryType,
        deliveryAddress
      };
      mockOrders.push(newOrder);
      return newOrder;
    }
  }

  async listOrders() {
    try {
      return await this.apiCall('GET', '/orders');
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 400));
      return mockOrders;
    }
  }

  async getOrder(id) {
    try {
      return await this.apiCall('GET', `/orders/${id}`);
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockOrders.find(o => o.id === id);
    }
  }

  async reorder(orderId) {
    try {
      return await this.apiCall('POST', `/orders/reorder/${orderId}`);
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      const order = await this.getOrder(orderId);
      if (order) {
        return this.createOrder(order.medicines, order.deliveryType, order.deliveryAddress || '');
      }
    }
  }

  // Refills
  async getUpcomingRefills() {
    try {
      return await this.apiCall('GET', '/refills/patient');
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 400));
      return mockRefills;
    }
  }

  async respondToRefill(refillId, action) {
    try {
      return await this.apiCall('POST', `/refills/${refillId}/respond`, { action });
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 500));
      if (action === 'reorder') {
        const refill = mockRefills.find(r => r.id === refillId);
        if (refill) {
          return this.createOrder(
            [{ id: refill.id, name: refill.medicineName, dosage: refill.dosage, quantity: refill.quantity, price: refill.price }],
            'home',
            'Flat 203, Green Park Apartments, Banjara Hills'
          );
        }
      }
      return { success: true };
    }
  }

  // Medicines - Search
  async searchMedicines(query) {
    if (!query || query.trim().length < 2) return [];

    try {
      const response = await this.apiCall('GET', `/medicines/search?q=${encodeURIComponent(query)}`);
      return response.medicines || response || [];
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 200));

      const results = mockMedicines.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.dosage.toLowerCase().includes(query.toLowerCase()) ||
        m.category.toLowerCase().includes(query.toLowerCase())
      );

      return results.slice(0, 20);
    }
  }

  async getMedicine(id) {
    try {
      return await this.apiCall('GET', `/medicines/${id}`);
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockMedicines.find(m => m.id === id);
    }
  }

  // Patient
  async getPatientProfile() {
    try {
      return await this.apiCall('GET', '/patients/profile');
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockPatient;
    }
  }

  async updatePatientProfile(updates) {
    try {
      const result = await this.apiCall('PUT', '/patients/profile', updates);
      Object.assign(mockPatient, updates);
      return result;
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 500));
      Object.assign(mockPatient, updates);
      return mockPatient;
    }
  }

  async getPatientMedications() {
    try {
      return await this.apiCall('GET', '/patients/medications');
    } catch (err) {
      console.log('Server unavailable, using mock data:', err.message);
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockPrescriptions.flatMap(p => p.medicines);
    }
  }

  // Store
  async getStoreBySlug(slug) {
    try {
      // Try finding store by slug first
      return await this.apiCall('GET', `/stores/${slug}`);
    } catch (err) {
      // If slug lookup failed, try by store ID
      try {
        return await this.apiCall('GET', `/stores/by-id/${slug}`);
      } catch (err2) {
        console.log('Server unavailable, using mock data:', err.message);
        await new Promise(resolve => setTimeout(resolve, 300));
        // Check mock stores by slug, then by ID, then fallback
        if (mockStores[slug]) return mockStores[slug];
        // Search mock stores by ID
        var storeKeys = Object.keys(mockStores);
        for (var i = 0; i < storeKeys.length; i++) {
          if (mockStores[storeKeys[i]].id === slug) return mockStores[storeKeys[i]];
        }
        // Return a generic store entry for unknown slugs/IDs
        return {
          id: slug,
          slug: slug,
          name: 'Pharmacy - ' + slug,
          phone: '',
          address: '',
          hours: '9:00 AM - 9:00 PM',
          city: '',
          license: ''
        };
      }
    }
  }

  // Logout
  logout() {
    this.clearToken();
  }
}

const api = new ApiService();

export default api;
