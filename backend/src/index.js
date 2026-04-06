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
    const { image_data } = req.body;
    if (!image_data) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    let base64Clean = image_data;
    let mimeType = 'image/jpeg';
    if (image_data.startsWith('data:')) {
      const match = image_data.match(/^data:(image\/\w+);base64,(.+)$/s);
      if (match) {
        mimeType = match[1];
        base64Clean = match[2];
      }
    }
    const result = await readPrescriptionFromBase64(base64Clean, mimeType);
    res.json({
      success: true,
      prescription: {
        doctor_name: result.doctor_name,
        hospital_name: result.hospital_name,
        diagnosis: result.diagnosis,
        prescription_date: result.prescription_date,
        ocr_confidence: result.confidence,
        handwriting_confidence: result.handwriting_confidence,
        ai_processed: result.ai_processed || true,
        demo_mode: result.demo_mode || false,
      },
      medicines: (result.medicines || []).map((m, idx) => ({
        id: idx + 1,
        name: m.medicine_name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration_days: m.duration_days,
        quantity: m.quantity,
        instruction: m.instructions || m.frequency,
      })),
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
    if (err.code === 'FILE_TOO_LARGE') return res.status(413).json({ error: 'File too large' });
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files' });
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
  console.log(\`RxMax API running on port \${PORT}\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);

  // Run database migrations on startup
  try {
    await runMigrations();
    console.log('Database ready!');
  } catch (err) {
    console.error('Migration warning:', err.message);
  }

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
