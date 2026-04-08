const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const storesRoutes = require('./routes/stores');
const patientsRoutes = require('./routes/patients');
const prescriptionsRoutes = require('./routes/prescriptions');
const ordersRoutes = require('./routes/orders');
const refillsRoutes = require('./routes/refills');
const medicinesRoutes = require('./routes/medicines');
const adminRoutes = require('./routes/admin');

// Services
const { initCronJobs } = require('./services/cronJobs');
const { readPrescriptionFromBase64 } = require('./services/prescriptionAI');
const { runMigrations } = require('./config/migrate');

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins for now (restrict in production)
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Public AI prescription reading endpoint (no auth needed for demo)
app.post('/api/prescriptions/read-ai', async (req, res) => {
  try {
    const { image_data, image, mimeType: reqMimeType, doctorName, hospitalName } = req.body;
    const imageInput = image_data || image;
    if (!imageInput) {
      return res.status(400).json({ error: 'No image data provided. Send base64 image in "image" or "image_data" field.' });
    }

    // Strip data URL prefix
    let base64Clean = imageInput;
    let mimeType = reqMimeType || 'image/jpeg';
    if (imageInput.startsWith('data:')) {
      const match = imageInput.match(/^data:(image\/\w+);base64,(.+)$/s);
      if (match) {
        mimeType = match[1];
        base64Clean = match[2];
      }
    }

    const result = await readPrescriptionFromBase64(base64Clean, mimeType);
    const medicines = (result.medicines || []).map((m, idx) => ({
      id: idx + 1,
      name: m.medicine_name,
      dosage: m.dosage,
      quantity: m.quantity || 10,
      frequency: m.frequency,
      duration_days: m.duration_days,
      instruction: m.instructions || m.frequency || 'As per doctor\'s advice',
    }));
    res.json({
      id: 'rx-' + Date.now(),
      doctorName: result.doctor_name || doctorName || '',
      hospitalName: result.hospital_name || hospitalName || '',
      date: new Date().toISOString().split('T')[0],
      medicines,
      status: 'pending',
      aiProcessed: true,
      confidence: result.confidence,
      diagnosis: result.diagnosis,
      demo_mode: result.demo_mode || false,
    });
  } catch (error) {
    console.error('AI prescription read error:', error);
    res.status(500).json({ error: 'Failed to read prescription' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/refills', refillsRoutes);
app.use('/api/medicines', medicinesRoutes);
app.use('/api/admin', adminRoutes);

// Compatibility routes (without /api prefix) for admin panel
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/stores', storesRoutes);
app.use('/patients', patientsRoutes);
app.use('/prescriptions', prescriptionsRoutes);
app.use('/orders', ordersRoutes);
app.use('/refills', refillsRoutes);
app.use('/medicines', medicinesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({ error: 'File too large' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
  console.log(`RxMax API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Run database migrations on startup
  try {
    await runMigrations();
    console.log('Database ready!');
  } catch (err) {
    console.error('Migration warning:', err.message);
  }

  // Initialize cron jobs if in production
  if (process.env.NODE_ENV === 'production') {
    initCronJobs();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const storesRoutes = require('./routes/stores');
const patientsRoutes = require('./routes/patients');
const prescriptionsRoutes = require('./routes/prescriptions');
const ordersRoutes = require('./routes/orders');
const refillsRoutes = require('./routes/refills');
const medicinesRoutes = require('./routes/medicines');
const adminRoutes = require('./routes/admin');

// Services
const { initCronJobs } = require('./services/cronJobs');
const { readPrescriptionFromBase64 } = require('./services/prescriptionAI');
const { runMigrations } = require('./config/migrate');

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins for now (restrict in production)
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Public AI prescription reading endpoint (no auth needed for demo)
app.post('/api/prescriptions/read-ai', async (req, res) => {
  try {
    const { image_data, image, mimeType: reqMimeType, doctorName, hospitalName } = req.body;
    const imageInput = image_data || image;
    if (!imageInput) {
      return res.status(400).json({ error: 'No image data provided. Send base64 image in "image" or "image_data" field.' });
    }

    // Strip data URL prefix
    let base64Clean = imageInput;
    let mimeType = reqMimeType || 'image/jpeg';
    if (imageInput.startsWith('data:')) {
      const match = imageInput.match(/^data:(image\/\w+);base64,(.+)$/s);
      if (match) {
        mimeType = match[1];
        base64Clean = match[2];
      }
    }

    const result = await readPrescriptionFromBase64(base64Clean, mimeType);
    const medicines = (result.medicines || []).map((m, idx) => ({
      id: idx + 1,
      name: m.medicine_name,
      dosage: m.dosage,
      quantity: m.quantity || 10,
      frequency: m.frequency,
      duration_days: m.duration_days,
      instruction: m.instructions || m.frequency || 'As per doctor\'s advice',
    }));
    res.json({
      id: 'rx-' + Date.now(),
      doctorName: result.doctor_name || doctorName || '',
      hospitalName: result.hospital_name || hospitalName || '',
      date: new Date().toISOString().split('T')[0],
      medicines,
      status: 'pending',
      aiProcessed: true,
      confidence: result.confidence,
      diagnosis: result.diagnosis,
      demo_mode: result.demo_mode || false,
    });
  } catch (error) {
    console.error('AI prescription read error:', error);
    res.status(500).json({ error: 'Failed to read prescription' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/refills', refillsRoutes);
app.use('/api/medicines', medicinesRoutes);
app.use('/api/admin', adminRoutes);

// Compatibility routes (without /api prefix) for admin panel
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/stores', storesRoutes);
app.use('/patients', patientsRoutes);
app.use('/prescriptions', prescriptionsRoutes);
app.use('/orders', ordersRoutes);
app.use('/refills', refillsRoutes);
app.use('/medicines', medicinesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({ error: 'File too large' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
  console.log(`RxMax API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Run database migrations on startup
  try {
    await runMigrations();
    console.log('Database ready!');
  } catch (err) {
    console.error('Migration warning:', err.message);
  }

  // Initialize cron jobs if in production
  if (process.env.NODE_ENV === 'production') {
    initCronJobs();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
const storesRoutes = require('./routes/stores');
const patientsRoutes = require('./routes/patients');
const prescriptionsRoutes = require('./routes/prescriptions');
const ordersRoutes = require('./routes/orders');
const refillsRoutes = require('./routes/refills');
const medicinesRoutes = require('./routes/medicines');
const adminRoutes = require('./routes/admin');

// Services
const { initCronJobs } = require('./services/cronJobs');
const { readPrescriptionFromBase64 } = require('./services/prescriptionAI');
const { runMigrations } = require('./config/migrate');

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins for now (restrict in production)
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Public AI prescription reading endpoint (no auth needed for demo)
app.post('/api/prescriptions/read-ai', async (req, res) => {
  try {
    const { image_data, image, mimeType: reqMimeType, doctorName, hospitalName } = req.body;
    const imageInput = image_data || image;
    if (!imageInput) {
      return res.status(400).json({ error: 'No image data provided. Send base64 image in "image" or "image_data" field.' });
    }

    // Strip data URL prefix
    let base64Clean = imageInput;
    let mimeType = reqMimeType || 'image/jpeg';
    if (imageInput.startsWith('data:')) {
      const match = imageInput.match(/^data:(image\/\w+);base64,(.+)$/s);
      if (match) {
        mimeType = match[1];
        base64Clean = match[2];
      }
    }

    const result = await readPrescriptionFromBase64(base64Clean, mimeType);
    const medicines = (result.medicines || []).map((m, idx) => ({
      id: idx + 1,
      name: m.medicine_name,
      dosage: m.dosage,
      quantity: m.quantity || 10,
      frequency: m.frequency,
      duration_days: m.duration_days,
      instruction: m.instructions || m.frequency || 'As per doctor\'s advice',
    }));
    res.json({
      id: 'rx-' + Date.now(),
      doctorName: result.doctor_name || doctorName || '',
      hospitalName: result.hospital_name || hospitalName || '',
      date: new Date().toISOString().split('T')[0],
      medicines,
      status: 'pending',
      aiProcessed: true,
      confidence: result.confidence,
      diagnosis: result.diagnosis,
      demo_mode: result.demo_mode || false,
    });
  } catch (error) {
    console.error('AI prescription read error:', error);
    res.status(500).json({ error: 'Failed to read prescription' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/refills', refillsRoutes);
app.use('/api/medicines', medicinesRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({ error: 'File too large' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
  console.log(`RxMax API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Run database migrations on startup
  try {
    await runMigrations();
    console.log('Database ready!');
  } catch (err) {
    console.error('Migration warning:', err.message);
  }

  // Initialize cron jobs if in production
  if (process.env.NODE_ENV === 'production') {
    initCronJobs();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
