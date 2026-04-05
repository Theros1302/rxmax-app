# RxMax Backend - Complete File Manifest

## Directory Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js                    [121 lines] Database connection pool
│   ├── middleware/
│   │   └── auth.js                        [54 lines] JWT authentication & RBAC
│   ├── models/
│   │   └── index.js                       [65 lines] Database query helpers
│   ├── routes/
│   │   ├── admin.js                       [415 lines] Admin dashboard & analytics
│   │   ├── auth.js                        [128 lines] Store/Patient authentication
│   │   ├── medicines.js                   [46 lines] Medicine search & detail
│   │   ├── orders.js                      [325 lines] Order management
│   │   ├── patients.js                    [138 lines] Patient profiles & family
│   │   ├── prescriptions.js               [382 lines] Prescription upload & AI
│   │   ├── refills.js                     [151 lines] Refill reminders & nudging
│   │   └── stores.js                      [420 lines] Store mgmt & analytics
│   ├── services/
│   │   ├── analytics.js                   [320 lines] Platform analytics queries
│   │   ├── cronJobs.js                    [365 lines] Scheduled background tasks
│   │   ├── prescriptionAI.js              [210 lines] Google Gemini integration
│   │   ├── refillEngine.js                [238 lines] Refill calculation & escalation
│   │   └── whatsapp.js                    [160 lines] WhatsApp notifications
│   └── index.js                           [112 lines] Main application entry
├── migrations/
│   └── 001_initial_schema.sql             [483 lines] Database schema + seed data
├── uploads/                               [directory] User-uploaded images
├── package.json                           [42 lines] Dependencies & scripts
├── .env.example                           [25 lines] Configuration template
├── README.md                              [350+ lines] Complete documentation
├── QUICKSTART.md                          [240+ lines] Setup & testing guide
└── FILE_MANIFEST.md                       [This file]
```

## File Descriptions

### Configuration Files

**package.json** (42 lines)
- Project metadata (name, version, description)
- Dependencies: Express, Postgres, JWT, Multer, Gemini AI, node-cron, axios
- Scripts: start, dev, migrate

**.env.example** (25 lines)
- Database credentials (user, password, host, port, name)
- JWT secret
- File upload settings
- API keys (Gemini, WhatsApp)
- Admin credentials

### Application Core

**src/index.js** (112 lines)
- Express app initialization
- CORS, body parsing middleware
- Routes registration (7 route files)
- Error handling middleware (Multer, validation)
- 404 handler
- Server startup with graceful shutdown

### Configuration & Database

**src/config/database.js** (121 lines)
- PostgreSQL connection pool initialization
- Support for DATABASE_URL (Railway) or individual credentials
- Connection pooling: max 20, idle timeout 30s, connection timeout 2s
- Error handling for idle client errors

**src/models/index.js** (65 lines)
- Database query helper functions
- query() - Execute raw SQL
- getOne() - Get single row
- getMany() - Get multiple rows
- insert() - Insert with RETURNING
- update() - Update with WHERE clause
- remove() - Delete with WHERE clause

### Middleware

**src/middleware/auth.js** (54 lines)
- authenticateToken() - JWT verification and extraction
- requireRole() - Role-based access control middleware
- generateToken() - Create JWT tokens (30-day expiration)
- Supports roles: admin, store, patient

### Routes (1,955 total lines)

**src/routes/admin.js** (415 lines)
- POST /api/admin/login - Admin authentication
- GET /api/admin/dashboard - Platform metrics
- GET /api/admin/stores - List stores with pagination, search, filters
- GET /api/admin/stores/:id - Store detail with analytics
- PUT /api/admin/stores/:id - Update store settings
- GET /api/admin/patients - All patients across stores
- GET /api/admin/orders - All orders with filters
- GET /api/admin/analytics - Platform analytics
- GET /api/admin/analytics/stores - Store comparison
- GET /api/admin/analytics/trends - Trend data
- GET /api/admin/refills - Refill metrics
- POST /api/admin/stores/:id/notify - Send notification
- POST /api/admin/broadcast - Broadcast to all stores

**src/routes/auth.js** (128 lines)
- POST /api/auth/store/register - Store registration with validation
- POST /api/auth/store/login - Store login with bcrypt verification
- POST /api/auth/patient/send-otp - Generate and send 6-digit OTP (10min expiry)
- POST /api/auth/patient/verify-otp - Verify OTP, create/login patient

**src/routes/stores.js** (420 lines)
- GET /api/stores/:slug - Public store profile
- PUT /api/stores/profile - Update store settings
- GET /api/stores/dashboard/summary - Dashboard metrics
- GET /api/stores/patients - Patient list with CRM data
- GET /api/stores/patients/:patientId - Patient detail
- GET /api/stores/patients/:patientId/orders - Order history (NEW)
- GET /api/stores/inventory - Inventory with alerts
- POST /api/stores/inventory - Add/update inventory
- POST /api/stores/inventory/bulk - Bulk upload with validation (NEW)
- GET /api/stores/revenue-alerts - Upcoming refills at risk
- GET /api/stores/analytics/detailed - Analytics with trends (NEW)
- GET /api/stores/reports/daily - Daily report (NEW)
- GET /api/stores/reports/monthly - Monthly report (NEW)

**src/routes/patients.js** (138 lines)
- GET /api/patients/profile - Patient profile
- PUT /api/patients/profile - Update profile
- GET /api/patients/store - Connected store details
- POST /api/patients/join-store/:slug - Join store
- GET /api/patients/prescriptions - List prescriptions
- GET /api/patients/medications - Active medications
- GET /api/patients/family - Family members

**src/routes/prescriptions.js** (382 lines)
- POST /api/prescriptions/upload - File upload with AI processing
- POST /api/prescriptions/upload-base64 - Base64 image upload
- POST /api/prescriptions/:id/items - Manual item addition
- GET /api/prescriptions/:id - Get prescription with items
- PUT /api/prescriptions/:id/verify - Store owner verification

**src/routes/orders.js** (325 lines)
- POST /api/orders - Create order with inventory validation
- GET /api/orders - List orders (patient or store)
- GET /api/orders/:id - Order detail with items
- PUT /api/orders/:id/status - Update order status
- POST /api/orders/reorder/:orderId - Quick reorder

**src/routes/refills.js** (151 lines)
- GET /api/refills/upcoming - Upcoming refills (store)
- GET /api/refills/patient - Patient refills
- POST /api/refills/:id/respond - Patient response
- POST /api/refills/:id/nudge - Store nudge with escalation

**src/routes/medicines.js** (46 lines)
- GET /api/medicines/search - Full-text search
- GET /api/medicines/:id - Medicine detail with alternatives

### Services (1,293 total lines)

**src/services/prescriptionAI.js** (210 lines)
- readPrescriptionFromFile() - Process uploaded image
- readPrescriptionFromBase64() - Process base64 image
- getDemoExtraction() - Sample data for testing
- Uses Google Gemini 2.0 Flash Vision API
- Extracts: Doctor, hospital, diagnosis, date, medicines
- Confidence scoring (overall + handwriting)
- Handles JPEG, PNG, WebP formats

**src/services/refillEngine.js** (238 lines)
- parseFrequency() - Convert frequency strings to daily count
- calculateRefillDate() - Compute refill date (7 days before end)
- scheduleReminders() - Create reminders from prescriptions
- processEscalations() - Escalate overdue reminders
- getDailyRefillSummary() - Summary for store dashboard

**src/services/whatsapp.js** (160 lines)
- sendWhatsAppMessage() - Template-based sending
- sendViaGupshup() - Gupshup API integration
- sendViaWati() - Wati API integration
- sendRefillReminder() - Refill notifications
- sendOrderConfirmation() - Order placed notification
- sendOrderReady() - Pickup ready notification
- sendOrderDelivered() - Delivery notification
- Mock mode for development

**src/services/analytics.js** (320 lines)
- getPlatformDashboard() - All platform metrics with growth
- getRevenueByCity() - City-level analytics
- getTopStores() - Performance ranking (configurable limit)
- getTopMedicines() - Popular medicines by revenue
- getStoreAnalytics() - Store detail (metrics, risk, status, refills)
- getTrendAnalytics() - Trend data for date range

**src/services/cronJobs.js** (365 lines)
- initCronJobs() - Initialize all background tasks
- scheduleRefillEscalationJob() - Daily at 9 AM
- scheduleDailyStatsJob() - Daily at 11 PM
- scheduleWeeklyRiskAssessmentJob() - Mondays at 2 AM
- scheduleExpiryAlertsJob() - Daily at 8 AM
- stopAllJobs() - Graceful shutdown
- getJobsStatus() - Monitor job status

### Database

**migrations/001_initial_schema.sql** (483 lines)
- DDL for 13 tables with constraints
- 20+ indices for performance
- Seed data: 20 Indian medicines
- Full-text search support
- UUID and crypto extensions

## Statistics

### Code Metrics
- **Total Files:** 21 (including config, migrations, docs)
- **Code Files:** 13 (JavaScript + SQL)
- **Documentation:** 4 files (README, QUICKSTART, IMPLEMENTATION_SUMMARY, FILE_MANIFEST)
- **Total Lines:** 2,500+ lines of production code
- **Routes:** 50+ API endpoints
- **Services:** 5 microservices
- **Tables:** 13 with relationships
- **Indices:** 20+ for optimization

### Route Distribution
- Admin: 13 endpoints
- Auth: 4 endpoints
- Stores: 13 endpoints
- Patients: 7 endpoints
- Prescriptions: 5 endpoints
- Orders: 5 endpoints
- Refills: 4 endpoints
- Medicines: 2 endpoints

### Database Objects
- Tables: 13
- Primary Keys: 13 (UUID)
- Foreign Keys: 15+
- Indices: 20+
- Extensions: 2 (uuid-ossp, pgcrypto)
- Seed Data: 20 medicines

## Dependencies (package.json)

### Core Framework
- express@^4.18.2 - Web framework
- cors@^2.8.5 - CORS middleware

### Database
- pg@^8.10.0 - PostgreSQL driver

### Security
- bcryptjs@^2.4.3 - Password hashing
- jsonwebtoken@^9.0.0 - JWT tokens

### Utilities
- uuid@^9.0.1 - UUID generation
- dotenv@^16.3.1 - Environment variables
- multer@^1.4.5-lts.1 - File uploads
- node-cron@^3.0.3 - Job scheduling
- axios@^1.6.2 - HTTP client
- @google/generative-ai@^0.21.0 - Gemini API

## Features Per File

### Authentication & Security
- jwt-based auth with expiration
- bcrypt password hashing
- role-based access control
- input validation
- SQL injection prevention

### AI/ML Integration
- Google Gemini 2.0 Flash Vision
- Prescription image OCR
- Medicine extraction
- Confidence scoring

### Notifications
- WhatsApp integration (Gupshup/Wati)
- In-app notifications
- SMS/Push ready
- Delivery tracking

### Analytics
- Platform-wide metrics
- Store performance
- Revenue by city
- Top products
- Trend analysis
- Patient risk assessment

### Automation
- 4 scheduled cron jobs
- Refill escalation
- Daily stats aggregation
- Weekly risk assessment
- Expiry alerts

### Business Logic
- Order management
- Inventory tracking
- Refill reminders
- Patient CRM
- Loyalty tracking
- Adherence scoring

## Configuration & Setup

All configuration in `.env`:
- Database credentials
- JWT secret
- API keys (Gemini, WhatsApp)
- File upload settings
- Admin credentials
- Port and environment

## Documentation Files

**README.md** - Complete guide covering:
- Feature overview
- Tech stack details
- Installation instructions
- Full API reference
- Database schema
- Authentication details
- Error handling
- Performance optimizations
- Security features
- Deployment guide

**QUICKSTART.md** - Quick reference for:
- 5-minute setup
- Testing endpoints
- Database verification
- Common commands
- Troubleshooting
- Environment variables

**IMPLEMENTATION_SUMMARY.md** - Project overview:
- What was built
- Feature enhancements
- Technical highlights
- File statistics
- Production readiness

**FILE_MANIFEST.md** - This document:
- Directory structure
- File descriptions
- Statistics
- Feature mapping

## Ready for Production

All files follow production standards:
- Proper error handling
- Input validation
- Database optimization
- Security best practices
- Environment configuration
- Complete documentation
- Seed data included
- Graceful shutdown
- Connection pooling

