# RxMax Backend - Enhanced B2B2C Pharmacy Platform

## Overview

This is the production-grade backend for RxMax, a B2B2C (Business-to-Business-to-Consumer) pharmacy platform that connects pharmacy store owners with patients through a sophisticated order management, prescription processing, and refill nudging system.

## Key Features

### Core Functionality
- **Multi-role authentication** (Admin, Store Owner, Patient)
- **Store management** with city, plan, and verification tracking
- **Patient CRM** with risk assessment and loyalty metrics
- **Prescription management** with AI-powered OCR using Google Gemini
- **Order management** with real-time status tracking
- **Refill reminder system** with intelligent escalation logic
- **Inventory management** with expiry tracking and low-stock alerts

### Advanced Features
- **Platform-wide analytics** with revenue, growth trends, and top performers
- **Store-specific dashboards** with detailed metrics and historical trends
- **WhatsApp integration** for notifications and reminders (Gupshup/Wati APIs)
- **Daily stats aggregation** for reporting
- **Cron job automation** for refill escalation, risk assessment, and alerts
- **Bulk inventory management** with CSV import
- **Patient risk assessment** based on adherence and order history
- **Refill revenue tracking** with revenue impact metrics

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **AI/ML:** Google Gemini 2.0 Flash Vision API
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Scheduling:** node-cron
- **Password Hashing:** bcryptjs

## Project Structure

```
backend/
├── src/
│   ├── index.js                    # Main application entry point
│   ├── config/
│   │   └── database.js            # Database connection pool
│   ├── middleware/
│   │   └── auth.js                # JWT authentication & authorization
│   ├── models/
│   │   └── index.js               # Database query helpers
│   ├── routes/
│   │   ├── admin.js               # Admin dashboard & platform analytics
│   │   ├── auth.js                # Authentication (store/patient)
│   │   ├── stores.js              # Store profiles & management
│   │   ├── patients.js            # Patient profiles & family management
│   │   ├── prescriptions.js       # Prescription upload & OCR
│   │   ├── orders.js              # Order creation & management
│   │   ├── refills.js             # Refill reminders & nudging
│   │   └── medicines.js           # Medicine catalog search
│   └── services/
│       ├── prescriptionAI.js      # Google Gemini OCR integration
│       ├── refillEngine.js        # Refill calculation & scheduling
│       ├── whatsapp.js            # WhatsApp notifications (Gupshup/Wati)
│       ├── analytics.js           # Analytics queries
│       └── cronJobs.js            # Scheduled background tasks
├── migrations/
│   └── 001_initial_schema.sql     # Database schema with seed data
├── uploads/                       # User-uploaded prescription images
├── package.json
├── .env.example
└── README.md
```

## Installation

### Prerequisites
- Node.js 14+
- PostgreSQL 12+
- npm or yarn

### Setup Steps

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rxmax

# JWT
JWT_SECRET=your-super-secret-key

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key

# WhatsApp (optional)
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PROVIDER=gupshup

# Admin credentials
ADMIN_PHONE=9999999999
ADMIN_PASSWORD=rxmaxadmin2026
```

3. **Create database and run migrations:**
```bash
psql -U postgres -c "CREATE DATABASE rxmax;"
psql -U postgres -d rxmax -f migrations/001_initial_schema.sql
```

4. **Start the server:**
```bash
npm start          # Production
npm run dev        # Development
```

Server runs on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/store/register` - Register store owner
- `POST /api/auth/store/login` - Store owner login
- `POST /api/auth/patient/send-otp` - Send OTP to patient
- `POST /api/auth/patient/verify-otp` - Verify OTP and create patient

### Admin Dashboard (Requires admin role)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Platform-wide metrics
- `GET /api/admin/stores` - List all stores with pagination
- `GET /api/admin/stores/:id` - Store detail with analytics
- `PUT /api/admin/stores/:id` - Update store (activate, plan, verify)
- `GET /api/admin/patients` - All patients across stores
- `GET /api/admin/orders` - All orders with filters
- `GET /api/admin/analytics` - Comprehensive platform analytics
- `GET /api/admin/analytics/stores` - Store comparison analytics
- `GET /api/admin/analytics/trends` - Trend data by date range
- `GET /api/admin/refills` - Platform-wide refill analytics
- `POST /api/admin/stores/:id/notify` - Send notification to store
- `POST /api/admin/broadcast` - Broadcast to all stores

### Stores (Requires store authentication)
- `GET /api/stores/:slug` - Public store profile
- `PUT /api/stores/profile` - Update store profile
- `GET /api/stores/dashboard/summary` - Store dashboard summary
- `GET /api/stores/patients` - List store patients with CRM data
- `GET /api/stores/patients/:patientId` - Patient detail with order history
- `GET /api/stores/patients/:patientId/orders` - Patient order history (paginated)
- `GET /api/stores/inventory` - Store inventory with alerts
- `POST /api/stores/inventory` - Add/update inventory
- `POST /api/stores/inventory/bulk` - Bulk inventory upload
- `GET /api/stores/revenue-alerts` - Upcoming refills with revenue at risk
- `GET /api/stores/analytics/detailed` - Detailed analytics with trends
- `GET /api/stores/reports/daily` - Daily report
- `GET /api/stores/reports/monthly` - Monthly report

### Patients (Requires patient authentication)
- `GET /api/patients/profile` - Patient profile
- `PUT /api/patients/profile` - Update patient profile
- `GET /api/patients/store` - Connected store details
- `POST /api/patients/join-store/:slug` - Join a store
- `GET /api/patients/prescriptions` - List prescriptions
- `GET /api/patients/medications` - Active medications with refill dates
- `GET /api/patients/family` - Family members

### Prescriptions
- `POST /api/prescriptions/upload` - Upload prescription with AI analysis (file)
- `POST /api/prescriptions/upload-base64` - Upload prescription (base64)
- `POST /api/prescriptions/read-ai` - Public AI prescription reading
- `POST /api/prescriptions/:id/items` - Add items manually
- `GET /api/prescriptions/:id` - Get prescription with items
- `PUT /api/prescriptions/:id/verify` - Store owner verifies prescription

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders (patient or store)
- `GET /api/orders/:id` - Order detail with items
- `PUT /api/orders/:id/status` - Update order status (store only)
- `POST /api/orders/reorder/:orderId` - Quick reorder

### Refills
- `GET /api/refills/upcoming` - Upcoming refills (store)
- `GET /api/refills/patient` - Patient's upcoming refills
- `POST /api/refills/:id/respond` - Patient responds to reminder
- `POST /api/refills/:id/nudge` - Store nudges patient

### Medicines
- `GET /api/medicines/search?q=name&limit=20` - Search medicines
- `GET /api/medicines/:id` - Medicine detail with alternatives

### Health
- `GET /api/health` - Health check

## Authentication

The API uses JWT tokens in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens include user role and ID, used for authorization checks. Tokens expire in 30 days.

## Database Schema

### Core Tables
- **stores** - Pharmacy store information and settings
- **patients** - Patient information and health profile
- **store_patients** - Patient-store relationship with CRM metrics
- **medicines** - Drug database with alternatives
- **store_inventory** - Store-specific inventory with pricing
- **prescriptions** - Uploaded prescriptions with OCR results
- **prescription_items** - Individual medicines from prescriptions
- **orders** - Customer orders with status tracking
- **order_items** - Individual items in orders
- **refill_reminders** - Refill nudging system with escalation
- **notifications** - Notification log for tracking delivery
- **store_daily_stats** - Daily aggregated metrics
- **otp_codes** - OTP verification for patient login

## AI Prescription Processing

The system uses Google Gemini 2.0 Flash Vision API to extract medicine details from prescription images.

### Extracted Data
- Doctor name
- Hospital/Clinic name
- Diagnosis/Condition
- Prescription date
- Each medicine:
  - Brand name (as written)
  - Dosage
  - Frequency (e.g., "1-0-1", "twice daily")
  - Duration in days
  - Quantity
  - Instructions (e.g., "after food")

### Confidence Scoring
- `confidence` (0-1.0) - Overall OCR confidence
- `handwriting_confidence` (0-1.0) - Handwriting readability

### Demo Mode
If `GEMINI_API_KEY` is not set, the system runs in demo mode with sample data.

## WhatsApp Integration

Supports Gupshup and Wati APIs for WhatsApp notifications.

### Configured via Environment
```env
WHATSAPP_API_KEY=your_api_key
WHATSAPP_PROVIDER=gupshup  # or 'wati'
```

### Templates
- `REFILL_REMINDER` - Medicine refill reminder
- `ORDER_CONFIRMATION` - Order placed confirmation
- `ORDER_READY` - Order ready for pickup
- `ORDER_DELIVERED` - Order delivered

### Mock Mode
If `WHATSAPP_API_KEY` is not set, messages are logged to console instead of sent.

## Cron Jobs

Automated background tasks run in production:

1. **Refill Escalation** (Daily at 9 AM)
   - Escalates overdue refill reminders based on escalation levels
   - Levels: pending → first → follow-up → urgent → store alert → lapsed

2. **Daily Stats Aggregation** (Daily at 11 PM)
   - Aggregates orders, revenue, refill metrics by store
   - Calculates low-stock and expiry alerts

3. **Weekly Risk Assessment** (Every Monday at 2 AM)
   - Updates patient risk levels based on adherence and order history
   - Categories: normal, at_risk, lapsed

4. **Inventory Expiry Alerts** (Daily at 8 AM)
   - Identifies items expiring within 30 days
   - Creates in-app notifications for store owners

## Error Handling

The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Server Error

All error responses include a descriptive `error` message.

## Validation

The API validates:
- Required fields in request bodies
- Data types and formats
- User authorization and role permissions
- Store existence and patient connections
- Inventory availability
- OTP expiration and usage
- File types and sizes (for uploads)

## Performance Optimizations

- Database connection pooling (20 connections max)
- Indexed queries on frequently filtered fields (city, status, dates)
- Pagination support on list endpoints (limit/offset)
- Denormalized data in `refill_reminders` for fast queries
- Daily stats aggregation to avoid expensive real-time calculations

## Security Features

- JWT-based authentication with 30-day expiration
- Bcryptjs for password hashing (10 salt rounds)
- Role-based access control (RBAC) on all protected endpoints
- Request validation and sanitization
- CORS enabled for frontend communication
- Environment variable separation for sensitive credentials
- Multer file upload validation (MIME type, size limits)

## Development

### Running in Development Mode
```bash
NODE_ENV=development npm run dev
```

Development mode includes:
- Debug OTP logging in console
- Demo mode for AI if API key not set
- Cron jobs disabled (enable manually if needed)

### Testing Credentials
```
Admin:
  Phone: 9999999999
  Password: rxmaxadmin2026

Test Store:
  Phone: 8888888888
  Password: teststore123

Test Patient:
  Use any phone number to generate OTP
```

## Deployment

### Prerequisites
- PostgreSQL 12+ database
- Node.js 14+ runtime
- Environment variables configured

### Build & Run
```bash
npm install
node src/index.js
```

### Environment Configuration
Set all required `.env` variables in production:
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=<strong-random-key>
GEMINI_API_KEY=<your-api-key>
WHATSAPP_API_KEY=<optional>
```

### Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## API Rate Limiting

Currently no rate limiting. For production, consider:
- Express rate limit middleware
- API gateway rate limiting
- Database connection pooling optimization

## Monitoring & Logging

Logs are written to console. For production:
- Use structured logging (Winston, Pino)
- Send logs to centralized service (ELK, DataDog)
- Monitor database performance
- Track API response times

## Contributing

- Follow Express.js best practices
- Use parameterized queries to prevent SQL injection
- Add validation for all user inputs
- Test authentication on protected routes
- Document new endpoints in this README

## Support

For issues or questions, contact the development team.

---

**Last Updated:** 2026-04-05
**Version:** 2.0.0 - Enhanced Backend
