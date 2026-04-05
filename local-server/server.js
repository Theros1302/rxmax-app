const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'rxmax-local-secret-2026';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

// ========== IN-MEMORY DATA STORE ==========

const dataStore = {
  stores: {
    'store-1': {
      id: 'store-1',
      name: 'Apollo Pharmacy',
      slug: 'apollo-pharmacy',
      owner: 'Ramesh Sharma',
      phone: '9876543200',
      password: 'demo123',
      address: 'Banjara Hills, Hyderabad',
      city: 'Hyderabad',
      license: 'TS-2024-001',
      gst: '36AABCU9603R1ZM',
      operatingHours: '9AM-10PM',
      deliveryCharge: 50,
      minOrderAmount: 200,
      createdAt: new Date('2024-01-15').toISOString(),
      connectedPatients: ['P001', 'P002', 'P003', 'P004', 'P005']
    }
  },
  patients: {
    'P001': {
      id: 'P001',
      name: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh@example.com',
      dob: '1975-05-20',
      gender: 'M',
      address: 'Jubilee Hills, Hyderabad',
      city: 'Hyderabad',
      adherenceScore: 92,
      lifetimeValue: 45680,
      totalOrders: 12,
      riskLevel: 'low',
      conditions: ['Diabetes', 'Hypertension'],
      allergies: ['Penicillin'],
      primaryStore: 'store-1',
      createdAt: new Date('2024-06-01').toISOString(),
      lastOrderDate: new Date('2026-04-01').toISOString()
    },
    'P002': {
      id: 'P002',
      name: 'Priya Sharma',
      phone: '9876543211',
      email: 'priya@example.com',
      dob: '1985-08-15',
      gender: 'F',
      address: 'Hitech City, Hyderabad',
      city: 'Hyderabad',
      adherenceScore: 78,
      lifetimeValue: 23450,
      totalOrders: 8,
      riskLevel: 'medium',
      conditions: ['Thyroid'],
      allergies: [],
      primaryStore: 'store-1',
      createdAt: new Date('2024-07-10').toISOString(),
      lastOrderDate: new Date('2026-03-28').toISOString()
    },
    'P003': {
      id: 'P003',
      name: 'Amit Patel',
      phone: '9876543212',
      email: 'amit@example.com',
      dob: '1990-02-10',
      gender: 'M',
      address: 'Indiranagar, Hyderabad',
      city: 'Hyderabad',
      adherenceScore: 45,
      lifetimeValue: 8900,
      totalOrders: 3,
      riskLevel: 'high',
      conditions: ['Asthma', 'Diabetes'],
      allergies: ['Sulfa drugs'],
      primaryStore: 'store-1',
      createdAt: new Date('2024-11-05').toISOString(),
      lastOrderDate: new Date('2026-02-15').toISOString()
    },
    'P004': {
      id: 'P004',
      name: 'Sunita Devi',
      phone: '9876543213',
      email: 'sunita@example.com',
      dob: '1970-12-25',
      gender: 'F',
      address: 'Kondapur, Hyderabad',
      city: 'Hyderabad',
      adherenceScore: 88,
      lifetimeValue: 34200,
      totalOrders: 10,
      riskLevel: 'low',
      conditions: ['Cholesterol'],
      allergies: [],
      primaryStore: 'store-1',
      createdAt: new Date('2024-05-20').toISOString(),
      lastOrderDate: new Date('2026-03-25').toISOString()
    },
    'P005': {
      id: 'P005',
      name: 'Vikram Singh',
      phone: '9876543214',
      email: 'vikram@example.com',
      dob: '1968-09-08',
      gender: 'M',
      address: 'Begumpet, Hyderabad',
      city: 'Hyderabad',
      adherenceScore: 62,
      lifetimeValue: 15600,
      totalOrders: 5,
      riskLevel: 'medium',
      conditions: ['Cardiac'],
      allergies: ['NSAIDs'],
      primaryStore: 'store-1',
      createdAt: new Date('2024-08-30').toISOString(),
      lastOrderDate: new Date('2026-03-20').toISOString()
    }
  },
  orders: {
    'RX-2026-00001': {
      id: 'RX-2026-00001',
      orderNumber: 'RX-2026-00001',
      patientId: 'P001',
      storeId: 'store-1',
      status: 'delivered',
      items: [
        { medicineId: 'MED-001', name: 'Amlodipine', dosage: '5mg', quantity: 30, price: 45, subtotal: 1350 },
        { medicineId: 'MED-002', name: 'Metformin', dosage: '500mg', quantity: 60, price: 35, subtotal: 2100 }
      ],
      totalAmount: 3450,
      deliveryCharge: 50,
      finalAmount: 3500,
      deliveryType: 'home-delivery',
      notes: 'Please deliver after 6 PM',
      createdAt: new Date('2026-03-15').toISOString(),
      confirmedAt: new Date('2026-03-15T10:30:00').toISOString(),
      deliveredAt: new Date('2026-03-16T18:00:00').toISOString()
    },
    'RX-2026-00002': {
      id: 'RX-2026-00002',
      orderNumber: 'RX-2026-00002',
      patientId: 'P001',
      storeId: 'store-1',
      status: 'delivered',
      items: [
        { medicineId: 'MED-003', name: 'Atorvastatin', dosage: '10mg', quantity: 30, price: 65, subtotal: 1950 }
      ],
      totalAmount: 1950,
      deliveryCharge: 50,
      finalAmount: 2000,
      deliveryType: 'home-delivery',
      createdAt: new Date('2026-03-22').toISOString(),
      confirmedAt: new Date('2026-03-22T09:15:00').toISOString(),
      deliveredAt: new Date('2026-03-23T17:30:00').toISOString()
    },
    'RX-2026-00003': {
      id: 'RX-2026-00003',
      orderNumber: 'RX-2026-00003',
      patientId: 'P002',
      storeId: 'store-1',
      status: 'ready',
      items: [
        { medicineId: 'MED-004', name: 'Levothyroxine', dosage: '50mcg', quantity: 30, price: 55, subtotal: 1650 }
      ],
      totalAmount: 1650,
      deliveryCharge: 50,
      finalAmount: 1700,
      deliveryType: 'home-delivery',
      createdAt: new Date('2026-04-02').toISOString(),
      confirmedAt: new Date('2026-04-02T10:00:00').toISOString()
    },
    'RX-2026-00004': {
      id: 'RX-2026-00004',
      orderNumber: 'RX-2026-00004',
      patientId: 'P002',
      storeId: 'store-1',
      status: 'delivered',
      items: [
        { medicineId: 'MED-005', name: 'Pantoprazole', dosage: '40mg', quantity: 30, price: 48, subtotal: 1440 }
      ],
      totalAmount: 1440,
      deliveryCharge: 50,
      finalAmount: 1490,
      deliveryType: 'home-delivery',
      createdAt: new Date('2026-03-18').toISOString(),
      confirmedAt: new Date('2026-03-18T11:20:00').toISOString(),
      deliveredAt: new Date('2026-03-19T16:45:00').toISOString()
    },
    'RX-2026-00005': {
      id: 'RX-2026-00005',
      orderNumber: 'RX-2026-00005',
      patientId: 'P003',
      storeId: 'store-1',
      status: 'confirmed',
      items: [
        { medicineId: 'MED-006', name: 'Salbutamol Inhaler', dosage: '100mcg', quantity: 3, price: 150, subtotal: 450 },
        { medicineId: 'MED-002', name: 'Metformin', dosage: '500mg', quantity: 30, price: 35, subtotal: 1050 }
      ],
      totalAmount: 1500,
      deliveryCharge: 50,
      finalAmount: 1550,
      deliveryType: 'home-delivery',
      createdAt: new Date('2026-04-03').toISOString(),
      confirmedAt: new Date('2026-04-03T14:30:00').toISOString()
    },
    'RX-2026-00006': {
      id: 'RX-2026-00006',
      orderNumber: 'RX-2026-00006',
      patientId: 'P003',
      storeId: 'store-1',
      status: 'placed',
      items: [
        { medicineId: 'MED-007', name: 'Dolo 650', dosage: '650mg', quantity: 15, price: 32, subtotal: 480 }
      ],
      totalAmount: 480,
      deliveryCharge: 50,
      finalAmount: 530,
      deliveryType: 'home-delivery',
      createdAt: new Date('2026-04-04').toISOString()
    },
    'RX-2026-00007': {
      id: 'RX-2026-00007',
      orderNumber: 'RX-2026-00007',
      patientId: 'P004',
      storeId: 'store-1',
      status: 'delivered',
      items: [
        { medicineId: 'MED-008', name: 'Rosuvastatin', dosage: '20mg', quantity: 30, price: 75, subtotal: 2250 }
      ],
      totalAmount: 2250,
      deliveryCharge: 50,
      finalAmount: 2300,
      deliveryType: 'home-delivery',
      createdAt: new Date('2026-03-25').toISOString(),
      confirmedAt: new Date('2026-03-25T08:45:00').toISOString(),
      deliveredAt: new Date('2026-03-26T15:20:00').toISOString()
    },
    'RX-2026-00008': {
      id: 'RX-2026-00008',
      orderNumber: 'RX-2026-00008',
      patientId: 'P004',
      storeId: 'store-1',
      status: 'preparing',
      items: [
        { medicineId: 'MED-009', name: 'Telmisartan', dosage: '40mg', quantity: 30, price: 55, subtotal: 1650 }
      ],
      totalAmount: 1650,
      deliveryCharge: 50,
      finalAmount: 1700,
      deliveryType: 'home-delivery',
      createdAt: new Date('2026-04-01').toISOString(),
      confirmedAt: new Date('2026-04-01T09:30:00').toISOString()
    },
    'RX-2026-00009': {
      id: 'RX-2026-00009',
      orderNumber: 'RX-2026-00009',
      patientId: 'P005',
      storeId: 'store-1',
      status: 'delivered',
      items: [
        { medicineId: 'MED-010', name: 'Aspirin', dosage: '75mg', quantity: 30, price: 28, subtotal: 840 }
      ],
      totalAmount: 840,
      deliveryCharge: 50,
      finalAmount: 890,
      deliveryType: 'home-delivery',
      createdAt: new Date('2026-03-20').toISOString(),
      confirmedAt: new Date('2026-03-20T10:15:00').toISOString(),
      deliveredAt: new Date('2026-03-21T14:30:00').toISOString()
    },
    'RX-2026-00010': {
      id: 'RX-2026-00010',
      orderNumber: 'RX-2026-00010',
      patientId: 'P005',
      storeId: 'store-1',
      status: 'delivered',
      items: [
        { medicineId: 'MED-003', name: 'Atorvastatin', dosage: '10mg', quantity: 30, price: 65, subtotal: 1950 }
      ],
      totalAmount: 1950,
      deliveryCharge: 50,
      finalAmount: 2000,
      deliveryType: 'home-delivery',
      createdAt: new Date('2026-03-28').toISOString(),
      confirmedAt: new Date('2026-03-28T11:00:00').toISOString(),
      deliveredAt: new Date('2026-03-29T16:15:00').toISOString()
    }
  },
  prescriptions: {
    'PRESC-001': {
      id: 'PRESC-001',
      patientId: 'P001',
      storeId: 'store-1',
      doctorName: 'Dr. Suresh Malhotra',
      hospitalName: 'Apollo Hospital',
      diagnosis: 'Diabetes Type 2, Hypertension',
      confidence: 0.95,
      medicines: [
        { medicine_name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration_days: 30, quantity: 60, instructions: 'Take with meals' },
        { medicine_name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration_days: 30, quantity: 30, instructions: 'Take in morning' }
      ],
      imageUrl: null,
      uploadedAt: new Date('2026-03-15').toISOString(),
      status: 'processed'
    },
    'PRESC-002': {
      id: 'PRESC-002',
      patientId: 'P002',
      storeId: 'store-1',
      doctorName: 'Dr. Anita Kapoor',
      hospitalName: 'Max Healthcare',
      diagnosis: 'Hypothyroidism',
      confidence: 0.98,
      medicines: [
        { medicine_name: 'Levothyroxine', dosage: '50mcg', frequency: 'Once daily', duration_days: 30, quantity: 30, instructions: 'Take on empty stomach' }
      ],
      imageUrl: null,
      uploadedAt: new Date('2026-03-20').toISOString(),
      status: 'processed'
    },
    'PRESC-003': {
      id: 'PRESC-003',
      patientId: 'P003',
      storeId: 'store-1',
      doctorName: 'Dr. Vikram Desai',
      hospitalName: 'Fortis Hospital',
      diagnosis: 'Asthma, Diabetes',
      confidence: 0.92,
      medicines: [
        { medicine_name: 'Salbutamol', dosage: '100mcg', frequency: 'As needed', duration_days: 30, quantity: 3, instructions: 'Use inhaler as required' },
        { medicine_name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration_days: 30, quantity: 60, instructions: 'With meals' }
      ],
      imageUrl: null,
      uploadedAt: new Date('2026-03-25').toISOString(),
      status: 'processed'
    },
    'PRESC-004': {
      id: 'PRESC-004',
      patientId: 'P004',
      storeId: 'store-1',
      doctorName: 'Dr. Harish Patel',
      hospitalName: 'Sunshine Hospital',
      diagnosis: 'High Cholesterol',
      confidence: 0.96,
      medicines: [
        { medicine_name: 'Rosuvastatin', dosage: '20mg', frequency: 'Once daily', duration_days: 30, quantity: 30, instructions: 'Take at night' }
      ],
      imageUrl: null,
      uploadedAt: new Date('2026-03-30').toISOString(),
      status: 'processed'
    },
    'PRESC-005': {
      id: 'PRESC-005',
      patientId: 'P005',
      storeId: 'store-1',
      doctorName: 'Dr. Rajesh Gupta',
      hospitalName: 'Yashoda Hospital',
      diagnosis: 'Cardiac issues, Hypertension',
      confidence: 0.94,
      medicines: [
        { medicine_name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration_days: 30, quantity: 30, instructions: 'Take with meals' },
        { medicine_name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily', duration_days: 30, quantity: 30, instructions: 'Take at night' }
      ],
      imageUrl: null,
      uploadedAt: new Date('2026-04-01').toISOString(),
      status: 'processed'
    }
  },
  refills: {
    'REFILL-001': {
      id: 'REFILL-001',
      patientId: 'P001',
      storeId: 'store-1',
      medicineId: 'MED-001',
      medicineName: 'Amlodipine',
      dosage: '5mg',
      frequency: 'Once daily',
      daysRemaining: 5,
      dueDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      escalationLevel: 1,
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    'REFILL-002': {
      id: 'REFILL-002',
      patientId: 'P001',
      storeId: 'store-1',
      medicineId: 'MED-002',
      medicineName: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      daysRemaining: 8,
      dueDate: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      escalationLevel: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    'REFILL-003': {
      id: 'REFILL-003',
      patientId: 'P002',
      storeId: 'store-1',
      medicineId: 'MED-004',
      medicineName: 'Levothyroxine',
      dosage: '50mcg',
      frequency: 'Once daily',
      daysRemaining: -2,
      dueDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      escalationLevel: 3,
      status: 'overdue',
      createdAt: new Date().toISOString()
    },
    'REFILL-004': {
      id: 'REFILL-004',
      patientId: 'P003',
      storeId: 'store-1',
      medicineId: 'MED-006',
      medicineName: 'Salbutamol Inhaler',
      dosage: '100mcg',
      frequency: 'As needed',
      daysRemaining: 15,
      dueDate: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      escalationLevel: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    'REFILL-005': {
      id: 'REFILL-005',
      patientId: 'P003',
      storeId: 'store-1',
      medicineId: 'MED-002',
      medicineName: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      daysRemaining: 2,
      dueDate: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      escalationLevel: 2,
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    'REFILL-006': {
      id: 'REFILL-006',
      patientId: 'P004',
      storeId: 'store-1',
      medicineId: 'MED-008',
      medicineName: 'Rosuvastatin',
      dosage: '20mg',
      frequency: 'Once daily',
      daysRemaining: 10,
      dueDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      escalationLevel: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    'REFILL-007': {
      id: 'REFILL-007',
      patientId: 'P005',
      storeId: 'store-1',
      medicineId: 'MED-010',
      medicineName: 'Aspirin',
      dosage: '75mg',
      frequency: 'Once daily',
      daysRemaining: 12,
      dueDate: new Date(new Date().getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      escalationLevel: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    'REFILL-008': {
      id: 'REFILL-008',
      patientId: 'P005',
      storeId: 'store-1',
      medicineId: 'MED-003',
      medicineName: 'Atorvastatin',
      dosage: '10mg',
      frequency: 'Once daily',
      daysRemaining: 22,
      dueDate: new Date(new Date().getTime() + 22 * 24 * 60 * 60 * 1000).toISOString(),
      escalationLevel: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  },
  medicines: {
    'MED-001': {
      id: 'MED-001',
      name: 'Amlodipine',
      brand: 'Amlong',
      dosage: '5mg',
      category: 'Cardiac',
      stock: 250,
      price: 45,
      mrp: 52,
      discount: 13,
      expiry: '2026-12-31',
      status: 'active',
      manufacturer: 'Torrent Pharmaceuticals'
    },
    'MED-002': {
      id: 'MED-002',
      name: 'Metformin',
      brand: 'Glycomet',
      dosage: '500mg',
      category: 'Diabetes',
      stock: 480,
      price: 35,
      mrp: 42,
      discount: 17,
      expiry: '2026-11-30',
      status: 'active',
      manufacturer: 'USV Limited'
    },
    'MED-003': {
      id: 'MED-003',
      name: 'Atorvastatin',
      brand: 'Atorlip',
      dosage: '10mg',
      category: 'Cardiac',
      stock: 200,
      price: 65,
      mrp: 78,
      discount: 17,
      expiry: '2026-10-31',
      status: 'active',
      manufacturer: 'Dr. Reddy\'s Laboratories'
    },
    'MED-004': {
      id: 'MED-004',
      name: 'Levothyroxine',
      brand: 'ThyroxL',
      dosage: '50mcg',
      category: 'Thyroid',
      stock: 150,
      price: 55,
      mrp: 65,
      discount: 15,
      expiry: '2026-09-30',
      status: 'active',
      manufacturer: 'Abbott'
    },
    'MED-005': {
      id: 'MED-005',
      name: 'Pantoprazole',
      brand: 'Pantop',
      dosage: '40mg',
      category: 'GI',
      stock: 300,
      price: 48,
      mrp: 58,
      discount: 17,
      expiry: '2026-12-15',
      status: 'active',
      manufacturer: 'Alkem Laboratories'
    },
    'MED-006': {
      id: 'MED-006',
      name: 'Salbutamol Inhaler',
      brand: 'Asthalin',
      dosage: '100mcg',
      category: 'Respiratory',
      stock: 80,
      price: 150,
      mrp: 175,
      discount: 14,
      expiry: '2026-08-31',
      status: 'active',
      manufacturer: 'Cipla'
    },
    'MED-007': {
      id: 'MED-007',
      name: 'Dolo 650',
      brand: 'Dolo',
      dosage: '650mg',
      category: 'Pain Relief',
      stock: 600,
      price: 32,
      mrp: 40,
      discount: 20,
      expiry: '2026-11-30',
      status: 'active',
      manufacturer: 'Micro Labs'
    },
    'MED-008': {
      id: 'MED-008',
      name: 'Rosuvastatin',
      brand: 'Rosuvas',
      dosage: '20mg',
      category: 'Cardiac',
      stock: 180,
      price: 75,
      mrp: 90,
      discount: 17,
      expiry: '2026-10-15',
      status: 'active',
      manufacturer: 'Cipla'
    },
    'MED-009': {
      id: 'MED-009',
      name: 'Telmisartan',
      brand: 'Telma',
      dosage: '40mg',
      category: 'Cardiac',
      stock: 220,
      price: 55,
      mrp: 68,
      discount: 19,
      expiry: '2026-09-30',
      status: 'active',
      manufacturer: 'Lupin Limited'
    },
    'MED-010': {
      id: 'MED-010',
      name: 'Aspirin',
      brand: 'Aspirin',
      dosage: '75mg',
      category: 'Cardiac',
      stock: 500,
      price: 28,
      mrp: 35,
      discount: 20,
      expiry: '2026-12-31',
      status: 'active',
      manufacturer: 'Bayer'
    },
    'MED-011': {
      id: 'MED-011',
      name: 'Lisinopril',
      brand: 'Lisinopril',
      dosage: '10mg',
      category: 'Cardiac',
      stock: 160,
      price: 42,
      mrp: 52,
      discount: 19,
      expiry: '2026-10-31',
      status: 'active',
      manufacturer: 'Cipla'
    },
    'MED-012': {
      id: 'MED-012',
      name: 'Omeprazole',
      brand: 'Omez',
      dosage: '20mg',
      category: 'GI',
      stock: 280,
      price: 42,
      mrp: 50,
      discount: 16,
      expiry: '2026-11-30',
      status: 'active',
      manufacturer: 'Dr. Reddy\'s Laboratories'
    },
    'MED-013': {
      id: 'MED-013',
      name: 'Cetirizine',
      brand: 'Cetrizine',
      dosage: '10mg',
      category: 'Allergy',
      stock: 350,
      price: 38,
      mrp: 48,
      discount: 21,
      expiry: '2026-12-31',
      status: 'active',
      manufacturer: 'Cipla'
    },
    'MED-014': {
      id: 'MED-014',
      name: 'Sertraline',
      brand: 'Serlin',
      dosage: '50mg',
      category: 'Mental Health',
      stock: 120,
      price: 65,
      mrp: 80,
      discount: 19,
      expiry: '2026-09-30',
      status: 'active',
      manufacturer: 'Torrent Pharmaceuticals'
    },
    'MED-015': {
      id: 'MED-015',
      name: 'Calcium Carbonate',
      brand: 'Calcius',
      dosage: '500mg',
      category: 'Supplements',
      stock: 400,
      price: 48,
      mrp: 60,
      discount: 20,
      expiry: '2027-01-31',
      status: 'active',
      manufacturer: 'Abbott'
    },
    'MED-016': {
      id: 'MED-016',
      name: 'Vitamin D3',
      brand: 'Vitamin D3',
      dosage: '1000IU',
      category: 'Supplements',
      stock: 320,
      price: 35,
      mrp: 45,
      discount: 22,
      expiry: '2026-12-31',
      status: 'active',
      manufacturer: 'Cipla'
    },
    'MED-017': {
      id: 'MED-017',
      name: 'Azithromycin',
      brand: 'Zithromax',
      dosage: '500mg',
      category: 'Antibiotic',
      stock: 90,
      price: 72,
      mrp: 90,
      discount: 20,
      expiry: '2026-08-31',
      status: 'active',
      manufacturer: 'Pfizer'
    },
    'MED-018': {
      id: 'MED-018',
      name: 'Ibuprofen',
      brand: 'Brufen',
      dosage: '400mg',
      category: 'Pain Relief',
      stock: 520,
      price: 38,
      mrp: 50,
      discount: 24,
      expiry: '2026-12-31',
      status: 'active',
      manufacturer: 'Abbott'
    },
    'MED-019': {
      id: 'MED-019',
      name: 'Ranitidine',
      brand: 'Rantac',
      dosage: '150mg',
      category: 'GI',
      stock: 240,
      price: 45,
      mrp: 58,
      discount: 22,
      expiry: '2026-10-31',
      status: 'active',
      manufacturer: 'Cipla'
    },
    'MED-020': {
      id: 'MED-020',
      name: 'Multivitamin',
      brand: 'Revital',
      dosage: 'Tablet',
      category: 'Supplements',
      stock: 450,
      price: 52,
      mrp: 75,
      discount: 31,
      expiry: '2026-12-31',
      status: 'active',
      manufacturer: 'Cipla'
    }
  },
  dailyRevenue: generateDailyRevenue(),
  otpStore: {},
  nextOrderNumber: 11
};

// Helper to generate 30 days of revenue data
function generateDailyRevenue() {
  const revenue = {};
  const today = new Date('2026-04-05');
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    revenue[dateStr] = {
      date: dateStr,
      orders: Math.floor(Math.random() * 8) + 2,
      amount: Math.floor(Math.random() * 15000) + 5000,
      deliveries: Math.floor(Math.random() * 5) + 1
    };
  }
  return revenue;
}

// ========== UTILITY FUNCTIONS ==========

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' });
};

const getNextOrderNumber = () => {
  const num = String(dataStore.nextOrderNumber).padStart(5, '0');
  dataStore.nextOrderNumber++;
  return `RX-2026-${num}`;
};

// ========== ROUTES ==========

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== AUTH ROUTES ==========

// Patient OTP Send
app.post('/api/auth/patient/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  dataStore.otpStore[phone] = '123456';
  res.json({ success: true, message: 'OTP sent (demo: 123456)', phone });
});

// Patient OTP Verify
app.post('/api/auth/patient/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  if (dataStore.otpStore[phone] !== otp && otp !== '123456') {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  let patient = Object.values(dataStore.patients).find(p => p.phone === phone);

  if (!patient) {
    const patientId = `P${String(Object.keys(dataStore.patients).length + 1).padStart(3, '0')}`;
    patient = {
      id: patientId,
      name: 'New Patient',
      phone,
      email: '',
      dob: '',
      gender: '',
      address: '',
      city: '',
      adherenceScore: 0,
      lifetimeValue: 0,
      totalOrders: 0,
      riskLevel: 'unknown',
      conditions: [],
      allergies: [],
      primaryStore: 'store-1',
      createdAt: new Date().toISOString()
    };
    dataStore.patients[patientId] = patient;
    dataStore.stores['store-1'].connectedPatients.push(patientId);
  }

  delete dataStore.otpStore[phone];
  const token = generateToken(patient.id, 'patient');
  res.json({ success: true, token, patient });
});

// Store Login
app.post('/api/auth/store/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password required' });

  const store = Object.values(dataStore.stores).find(s => s.phone === phone);
  if (!store || store.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(store.id, 'store');
  res.json({ success: true, token, store });
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { phone, password } = req.body;
  if (phone === '9999999999' && password === 'rxmaxadmin2026') {
    const token = generateToken('admin-1', 'admin');
    return res.json({ success: true, token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// ========== PATIENT ROUTES ==========

// Get Patient Profile
app.get('/api/patients/profile', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Unauthorized' });
  const patient = dataStore.patients[req.user.id];
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// Update Patient Profile
app.put('/api/patients/profile', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Unauthorized' });
  const patient = dataStore.patients[req.user.id];
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  Object.assign(patient, req.body);
  res.json(patient);
});

// Get Patient Medications
app.get('/api/patients/medications', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Unauthorized' });

  const patientPrescriptions = Object.values(dataStore.prescriptions).filter(p => p.patientId === req.user.id);
  const medications = [];
  patientPrescriptions.forEach(presc => {
    presc.medicines.forEach(med => {
      medications.push({ ...med, prescriptionId: presc.id });
    });
  });

  res.json(medications);
});

// Join Store
app.post('/api/patients/join-store/:slug', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Unauthorized' });
  const patient = dataStore.patients[req.user.id];
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const store = Object.values(dataStore.stores).find(s => s.slug === req.params.slug);
  if (!store) return res.status(404).json({ error: 'Store not found' });

  patient.primaryStore = store.id;
  if (!store.connectedPatients.includes(patient.id)) {
    store.connectedPatients.push(patient.id);
  }
  res.json({ success: true, patient });
});

// ========== PRESCRIPTION ROUTES ==========

// Upload Prescription (Base64 + Gemini AI)
app.post('/api/prescriptions/upload-base64', authenticateToken, async (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Unauthorized' });
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Image required' });

  const patient = dataStore.patients[req.user.id];
  const prescriptionId = `PRESC-${Date.now()}`;

  let result = {
    doctor_name: '',
    hospital_name: '',
    diagnosis: '',
    confidence: 0,
    medicines: []
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [
              {
                text: 'Extract all medicines from this Indian prescription. Return JSON with doctor_name, hospital_name, diagnosis, confidence (0-1), and medicines array with medicine_name (brand), dosage, frequency, duration_days, quantity, instructions.'
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
                }
              }
            ]
          }]
        }
      );

      const textContent = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textContent) {
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (error) {
      console.log('Gemini API error, using demo data:', error.message);
    }
  }

  const prescription = {
    id: prescriptionId,
    patientId: req.user.id,
    storeId: patient.primaryStore,
    doctorName: result.doctor_name || 'Dr. Unknown',
    hospitalName: result.hospital_name || 'Hospital',
    diagnosis: result.diagnosis || '',
    confidence: result.confidence || 0.85,
    medicines: result.medicines || [],
    imageUrl: `data:image/jpeg;base64,${imageBase64.substring(0, 50)}...`,
    uploadedAt: new Date().toISOString(),
    status: 'processed'
  };

  dataStore.prescriptions[prescriptionId] = prescription;
  res.json(prescription);
});

// List Prescriptions
app.get('/api/prescriptions', authenticateToken, (req, res) => {
  let prescriptions = Object.values(dataStore.prescriptions);

  if (req.user.role === 'patient') {
    prescriptions = prescriptions.filter(p => p.patientId === req.user.id);
  } else if (req.user.role === 'store') {
    prescriptions = prescriptions.filter(p => p.storeId === req.user.id);
  }

  res.json(prescriptions);
});

// Get Single Prescription
app.get('/api/prescriptions/:id', authenticateToken, (req, res) => {
  const prescription = dataStore.prescriptions[req.params.id];
  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
  if (req.user.role === 'patient' && prescription.patientId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  res.json(prescription);
});

// ========== ORDER ROUTES ==========

// Create Order
app.post('/api/orders', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Unauthorized' });
  const { items, deliveryType = 'home-delivery', notes = '' } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'Items required' });

  const patient = dataStore.patients[req.user.id];
  const orderNumber = getNextOrderNumber();
  const totalAmount = items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
  const store = dataStore.stores[patient.primaryStore];

  const order = {
    id: orderNumber,
    orderNumber,
    patientId: req.user.id,
    storeId: patient.primaryStore,
    status: 'placed',
    items,
    totalAmount,
    deliveryCharge: store.deliveryCharge,
    finalAmount: totalAmount + store.deliveryCharge,
    deliveryType,
    notes,
    createdAt: new Date().toISOString()
  };

  dataStore.orders[orderNumber] = order;

  patient.lifetimeValue += order.finalAmount;
  patient.totalOrders += 1;
  patient.lastOrderDate = new Date().toISOString();

  // Add to daily revenue
  const today = new Date().toISOString().split('T')[0];
  if (!dataStore.dailyRevenue[today]) {
    dataStore.dailyRevenue[today] = { date: today, orders: 0, amount: 0, deliveries: 0 };
  }
  dataStore.dailyRevenue[today].orders += 1;
  dataStore.dailyRevenue[today].amount += order.finalAmount;

  res.json(order);
});

// List Orders
app.get('/api/orders', authenticateToken, (req, res) => {
  let orders = Object.values(dataStore.orders);
  const { status } = req.query;

  if (req.user.role === 'patient') {
    orders = orders.filter(o => o.patientId === req.user.id);
  } else if (req.user.role === 'store') {
    orders = orders.filter(o => o.storeId === req.user.id);
  }

  if (status) {
    orders = orders.filter(o => o.status === status);
  }

  res.json(orders);
});

// Get Single Order
app.get('/api/orders/:id', authenticateToken, (req, res) => {
  const order = dataStore.orders[req.params.id];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (req.user.role === 'patient' && order.patientId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (req.user.role === 'store' && order.storeId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  res.json(order);
});

// Update Order Status
app.put('/api/orders/:id/status', authenticateToken, (req, res) => {
  if (req.user.role !== 'store') return res.status(403).json({ error: 'Only stores can update status' });
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status required' });

  const order = dataStore.orders[req.params.id];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.storeId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  const validTransitions = {
    'placed': ['confirmed'],
    'confirmed': ['preparing'],
    'preparing': ['ready'],
    'ready': ['delivered'],
    'delivered': []
  };

  if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
    return res.status(400).json({ error: 'Invalid status transition' });
  }

  order.status = status;
  const timestamp = new Date().toISOString();

  if (status === 'confirmed') order.confirmedAt = timestamp;
  if (status === 'ready') order.readyAt = timestamp;
  if (status === 'delivered') {
    order.deliveredAt = timestamp;
    const today = new Date().toISOString().split('T')[0];
    if (dataStore.dailyRevenue[today]) {
      dataStore.dailyRevenue[today].deliveries += 1;
    }
  }

  res.json(order);
});

// Reorder
app.post('/api/orders/reorder/:orderId', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Unauthorized' });
  const previousOrder = dataStore.orders[req.params.orderId];
  if (!previousOrder) return res.status(404).json({ error: 'Order not found' });
  if (previousOrder.patientId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  const newOrderNumber = getNextOrderNumber();
  const newOrder = {
    ...previousOrder,
    id: newOrderNumber,
    orderNumber: newOrderNumber,
    status: 'placed',
    createdAt: new Date().toISOString()
  };

  delete newOrder.confirmedAt;
  delete newOrder.readyAt;
  delete newOrder.deliveredAt;

  dataStore.orders[newOrderNumber] = newOrder;

  const patient = dataStore.patients[req.user.id];
  patient.lifetimeValue += newOrder.finalAmount;
  patient.totalOrders += 1;

  res.json(newOrder);
});

// ========== REFILL ROUTES ==========

// Get Upcoming Refills (Store)
app.get('/api/refills/upcoming', authenticateToken, (req, res) => {
  if (req.user.role !== 'store') return res.status(403).json({ error: 'Unauthorized' });
  let { days = 7 } = req.query;
  days = parseInt(days);

  let refills = Object.values(dataStore.refills)
    .filter(r => r.storeId === req.user.id)
    .filter(r => r.daysRemaining <= days && r.daysRemaining >= -7);

  res.json(refills);
});

// Get Patient Refills
app.get('/api/refills/patient', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Unauthorized' });
  const refills = Object.values(dataStore.refills).filter(r => r.patientId === req.user.id);
  res.json(refills);
});

// Respond to Refill
app.post('/api/refills/:id/respond', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ error: 'Unauthorized' });
  const { response } = req.body; // ordered, snoozed, skipped
  const refill = dataStore.refills[req.params.id];
  if (!refill) return res.status(404).json({ error: 'Refill not found' });
  if (refill.patientId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  refill.status = response;
  res.json(refill);
});

// Nudge Patient for Refill
app.post('/api/refills/:id/nudge', authenticateToken, (req, res) => {
  if (req.user.role !== 'store') return res.status(403).json({ error: 'Unauthorized' });
  const refill = dataStore.refills[req.params.id];
  if (!refill) return res.status(404).json({ error: 'Refill not found' });
  if (refill.storeId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  refill.escalationLevel = Math.min(3, refill.escalationLevel + 1);
  res.json(refill);
});

// ========== STORE ROUTES ==========

// Get Store Info
app.get('/api/stores/:slug', (req, res) => {
  const store = Object.values(dataStore.stores).find(s => s.slug === req.params.slug);
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const publicStore = { ...store };
  delete publicStore.password;
  res.json(publicStore);
});

// Store Dashboard Summary
app.get('/api/stores/dashboard/summary', authenticateToken, (req, res) => {
  if (req.user.role !== 'store') return res.status(403).json({ error: 'Unauthorized' });
  const store = dataStore.stores[req.user.id];
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const today = new Date().toISOString().split('T')[0];
  const todayData = dataStore.dailyRevenue[today] || { orders: 0, amount: 0, deliveries: 0 };

  const pendingOrders = Object.values(dataStore.orders)
    .filter(o => o.storeId === req.user.id && ['placed', 'confirmed', 'preparing'].includes(o.status)).length;

  const atRiskRefills = Object.values(dataStore.refills)
    .filter(r => r.storeId === req.user.id && r.daysRemaining <= 2).length;

  const lowStockMeds = Object.values(dataStore.medicines).filter(m => m.stock < 100).length;

  res.json({
    todayOrders: todayData.orders,
    todayRevenue: todayData.amount,
    pendingOrders,
    atRiskPatients: atRiskRefills,
    lowStockMedicines: lowStockMeds,
    totalConnectedPatients: store.connectedPatients.length
  });
});

// List Patients for Store
app.get('/api/stores/patients', authenticateToken, (req, res) => {
  if (req.user.role !== 'store') return res.status(403).json({ error: 'Unauthorized' });
  const store = dataStore.stores[req.user.id];
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const storePatients = store.connectedPatients.map(pId => {
    const patient = dataStore.patients[pId];
    return {
      ...patient,
      totalOrderValue: Object.values(dataStore.orders)
        .filter(o => o.patientId === pId && o.storeId === req.user.id)
        .reduce((sum, o) => sum + o.finalAmount, 0)
    };
  });

  res.json(storePatients);
});

// Get Single Patient Detail
app.get('/api/stores/patients/:patientId', authenticateToken, (req, res) => {
  if (req.user.role !== 'store') return res.status(403).json({ error: 'Unauthorized' });
  const patient = dataStore.patients[req.params.patientId];
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const orders = Object.values(dataStore.orders).filter(o => o.patientId === req.params.patientId && o.storeId === req.user.id);
  const refills = Object.values(dataStore.refills).filter(r => r.patientId === req.params.patientId && r.storeId === req.user.id);

  res.json({
    patient,
    orders,
    refills,
    totalOrderValue: orders.reduce((sum, o) => sum + o.finalAmount, 0)
  });
});

// Get Store Inventory
app.get('/api/stores/inventory', authenticateToken, (req, res) => {
  if (req.user.role !== 'store') return res.status(403).json({ error: 'Unauthorized' });
  res.json(Object.values(dataStore.medicines));
});

// Update Store Profile
app.put('/api/stores/profile', authenticateToken, (req, res) => {
  if (req.user.role !== 'store') return res.status(403).json({ error: 'Unauthorized' });
  const store = dataStore.stores[req.user.id];
  if (!store) return res.status(404).json({ error: 'Store not found' });

  Object.assign(store, req.body);
  res.json(store);
});

// Revenue at Risk
app.get('/api/stores/revenue-alerts', authenticateToken, (req, res) => {
  if (req.user.role !== 'store') return res.status(403).json({ error: 'Unauthorized' });

  const overdueRefills = Object.values(dataStore.refills)
    .filter(r => r.storeId === req.user.id && r.daysRemaining < 0);

  const totalAtRisk = overdueRefills.reduce((sum, r) => {
    const patient = dataStore.patients[r.patientId];
    return sum + (patient?.lifetimeValue || 0) * 0.02;
  }, 0);

  res.json({
    overdueRefillsCount: overdueRefills.length,
    estimatedRevenueAtRisk: Math.round(totalAtRisk),
    refills: overdueRefills
  });
});

// Detailed Analytics
app.get('/api/stores/analytics/detailed', authenticateToken, (req, res) => {
  if (req.user.role !== 'store') return res.status(403).json({ error: 'Unauthorized' });

  const storeOrders = Object.values(dataStore.orders).filter(o => o.storeId === req.user.id);

  const dailyData = Object.values(dataStore.dailyRevenue).map(day => ({
    ...day,
    storeOrders: storeOrders.filter(o => o.createdAt.startsWith(day.date)).length
  }));

  res.json({
    dailyRevenue: dailyData,
    totalRevenue: storeOrders.reduce((sum, o) => sum + o.finalAmount, 0),
    totalOrders: storeOrders.length,
    averageOrderValue: storeOrders.length > 0 ? Math.round(storeOrders.reduce((sum, o) => sum + o.finalAmount, 0) / storeOrders.length) : 0
  });
});

// ========== MEDICINE ROUTES ==========

// Search Medicines
app.get('/api/medicines/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json(Object.values(dataStore.medicines));

  const results = Object.values(dataStore.medicines).filter(m =>
    m.name.toLowerCase().includes(q.toLowerCase()) ||
    m.brand.toLowerCase().includes(q.toLowerCase())
  );

  res.json(results);
});

// Get Medicine Detail
app.get('/api/medicines/:id', (req, res) => {
  const medicine = dataStore.medicines[req.params.id];
  if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
  res.json(medicine);
});

// ========== ADMIN ROUTES ==========

// Admin Dashboard
app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

  const totalPatients = Object.keys(dataStore.patients).length;
  const totalOrders = Object.keys(dataStore.orders).length;
  const totalRevenue = Object.values(dataStore.orders).reduce((sum, o) => sum + o.finalAmount, 0);
  const totalStores = Object.keys(dataStore.stores).length;

  res.json({
    totalPatients,
    totalOrders,
    totalRevenue,
    totalStores,
    averagePatientValue: totalPatients > 0 ? Math.round(totalRevenue / totalPatients) : 0
  });
});

// List All Stores (Admin)
app.get('/api/admin/stores', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const stores = Object.values(dataStore.stores).map(s => {
    const publicStore = { ...s };
    delete publicStore.password;
    return publicStore;
  });
  res.json(stores);
});

// ========== ERROR HANDLING ==========

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log('\n');
  console.log('🚀 RxMax Local Server running on http://localhost:3001');
  console.log('📱 Patient App: http://localhost:3000');
  console.log('🏪 Store Dashboard: http://localhost:3002');
  console.log('🔑 Admin Panel: http://localhost:3003');
  console.log('\n');
  console.log('=== DEMO CREDENTIALS ===');
  console.log('Store Login: 9876543200 / demo123');
  console.log('Admin Login: 9999999999 / rxmaxadmin2026');
  console.log('Patient OTP: 123456 (for any phone)');
  console.log('\n');
});
