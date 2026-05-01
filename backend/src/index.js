const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
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
const { authenticateToken } = require('./middleware/auth');
const { getOne } = require('./models');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// =============== Security middleware ===============

// Trust Render's proxy so rate-limit + secure cookies work correctly
app.set('trust proxy', 1);

// Helmet — sane security headers (CSP, X-Frame-Options, HSTS, etc.)
app.use(helmet({
  contentSecurityPolicy: false,  // CSP fights with the React apps; tune later
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — explicit allowlist instead of "any origin". Wildcard subdomains via regex.
const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.pages\.dev$/,
  /^https:\/\/(.*\.)?rxmax\.online$/,
  /^https:\/\/.*\.onrender\.com$/,
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow no-origin requests (curl, server-to-server, mobile webviews)
    if (!origin) return callback(null, true);
    if (allowedOriginPatterns.some(re => re.test(origin))) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// Structured request log via morgan. In production: shorter format, no PII.
app.use(morgan(isProd ? 'combined' : 'dev'));

// Body parsing with sane per-route limits applied below; default low.
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

// Larger limit only on prescription-upload endpoints (images can be 5-10MB)
app.use('/api/prescriptions', express.json({ limit: '15mb' }));
app.use('/api/prescriptions', express.urlencoded({ extended: true, limit: '15mb' }));

// =============== Rate limiting ===============
// Aggressive limits on auth endpoints (block credential stuffing / OTP spray).
// Looser limits on everything else.
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// =============== Authenticated /uploads ===============
// Previously: app.use('/uploads', express.static('uploads'))  — public!
// New: only the patient who uploaded the Rx OR the linked store can view it.
app.get('/uploads/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    const filepath = path.join(__dirname, '..', 'uploads', filename);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Not found' });

    // Look up the prescription this file is attached to
    const rx = await getOne(
      'SELECT patient_id, store_id FROM prescriptions WHERE image_url LIKE $1',
      [`%${filename}%`],
    );
    if (rx) {
      const isOwner = req.user.role === 'patient' && rx.patient_id === req.user.id;
      const isStore = req.user.role === 'store' && rx.store_id === req.user.id;
      const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
      if (!isOwner && !isStore && !isAdmin) {
        return res.status(403).json({ error: 'Not authorized to view this file' });
      }
    }
    return res.sendFile(filepath);
  } catch (err) {
    console.error('Upload access error:', err.message);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// =============== Health ===============
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date(), env: process.env.NODE_ENV || 'development' });
});

// =============== Public AI prescription reading ===============
// (No auth — used during patient onboarding before they have an account)
app.post('/api/prescriptions/read-ai', async (req, res) => {
  try {
    const { image_data, image, mimeType: reqMimeType, doctorName, hospitalName } = req.body;
    const imageInput = image_data || image;
    if (!imageInput) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

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
      instruction: m.instructions || m.frequency || "As per doctor's advice",
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
    console.error('AI prescription read error:', error.message);
    res.status(500).json({ error: 'Failed to read prescription' });
  }
});

// =============== Routes ===============
app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/refills', refillsRoutes);
app.use('/api/medicines', medicinesRoutes);
app.use('/api/admin', adminRoutes);

// =============== Error handling ===============
app.use((err, req, res, next) => {
  // CORS rejections
  if (err && /CORS blocked/.test(String(err.message))) {
    return res.status(403).json({ error: 'CORS not allowed for this origin' });
  }
  // Multer errors
  if (err && err.name === 'MulterError') {
    if (err.code === 'FILE_TOO_LARGE') return res.status(413).json({ error: 'File too large' });
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files' });
    return res.status(400).json({ error: err.message });
  }
  // Body too large
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  console.error('Unhandled error:', err.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// =============== Startup ===============
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
  console.log(`RxMax API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    await runMigrations();
    console.log('Database ready.');
  } catch (err) {
    console.error('Migration warning:', err.message);
  }

  if (isProd) initCronJobs();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
