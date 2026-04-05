# RxMax Local Server

A lightweight Express.js backend server that acts as a shared data layer between the RxMax Patient App and Store Dashboard.

## Quick Start

### 1. Install Dependencies
```bash
cd /sessions/amazing-funny-galileo/mnt/Pharmacy\ App/rxmax-app/local-server/
npm install
```

### 2. Start the Server
```bash
npm start
```

You'll see:
```
🚀 RxMax Local Server running on http://localhost:3001
📱 Patient App: http://localhost:3000
🏪 Store Dashboard: http://localhost:3002
🔑 Admin Panel: http://localhost:3003

=== DEMO CREDENTIALS ===
Store Login: 9876543200 / demo123
Admin Login: 9999999999 / rxmaxadmin2026
Patient OTP: 123456 (for any phone)
```

## Features

### In-Memory Data Store
- 5 seed patients (P001-P005) with full medical history
- 1 seed store (Apollo Pharmacy) with complete details
- 10 seed orders with mixed statuses
- 5 seed prescriptions linked to patients
- 8 seed refills with various escalation levels
- 20 common Indian medicines with pricing and stock
- 30 days of daily revenue data

### API Endpoints

#### Authentication
- `POST /api/auth/patient/send-otp` - Send OTP (always succeeds)
- `POST /api/auth/patient/verify-otp` - Verify OTP (use "123456")
- `POST /api/auth/store/login` - Store login
- `POST /api/admin/login` - Admin login

#### Patient Features
- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update profile
- `GET /api/patients/medications` - Active medications
- `POST /api/patients/join-store/:slug` - Connect to store

#### Prescriptions
- `POST /api/prescriptions/upload-base64` - Upload & analyze prescription (uses Gemini API if key provided)
- `GET /api/prescriptions` - List prescriptions
- `GET /api/prescriptions/:id` - Get prescription details

#### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders (filtered by role)
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (store only)
- `POST /api/orders/reorder/:orderId` - Reorder from previous order

#### Refills
- `GET /api/refills/upcoming` - Upcoming refills (store)
- `GET /api/refills/patient` - Patient's refills
- `POST /api/refills/:id/respond` - Patient responds (ordered/snoozed/skipped)
- `POST /api/refills/:id/nudge` - Store nudges patient

#### Store Dashboard
- `GET /api/stores/:slug` - Get store info
- `GET /api/stores/dashboard/summary` - Dashboard metrics
- `GET /api/stores/patients` - Connected patients with CRM data
- `GET /api/stores/patients/:patientId` - Single patient details
- `GET /api/stores/inventory` - Store inventory
- `PUT /api/stores/profile` - Update store profile
- `GET /api/stores/revenue-alerts` - Revenue at risk
- `GET /api/stores/analytics/detailed` - Detailed analytics

#### Medicines
- `GET /api/medicines/search?q=` - Search medicines
- `GET /api/medicines/:id` - Get medicine details

#### Admin
- `GET /api/admin/dashboard` - Platform metrics
- `GET /api/admin/stores` - List all stores

## Authentication

All endpoints (except public store info and medicine search) require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

Tokens contain user ID and role (patient/store/admin) and expire in 30 days.

## Gemini AI Integration

For prescription analysis, set the Gemini API key:

```bash
export GEMINI_API_KEY=your_gemini_api_key
npm start
```

If no key is provided, the server returns demo prescription data with extracted medicines.

## CORS Configuration

Enabled for:
- http://localhost:3000 (Patient App)
- http://localhost:3002 (Store Dashboard)
- http://localhost:3003 (Admin Panel)

## Data Persistence

All data persists during the server session. Data resets when server restarts.

## Seed Data Highlights

### Patients
- P001: Rajesh Kumar - High adherence (92%), High lifetime value (45,680)
- P002: Priya Sharma - Medium adherence (78%), Thyroid condition
- P003: Amit Patel - Low adherence (45%), High risk patient
- P004: Sunita Devi - High adherence (88%), Low risk
- P005: Vikram Singh - Medium adherence (62%), Cardiac issues

### Store
- **Apollo Pharmacy** (Hyderabad)
- Operating Hours: 9AM-10PM
- Delivery Charge: 50
- Min Order: 200

## Key Flows

### Patient Registration
1. Send OTP (always succeeds)
2. Verify OTP with "123456"
3. New patient created and auto-connected to Apollo Pharmacy
4. Appears immediately in store dashboard

### Order Flow
1. Patient places order
2. Order created with RX-2026-XXXXX format
3. Patient's lifetime value updated
4. Order visible in store dashboard
5. Store updates status: placed → confirmed → preparing → ready → delivered

### Prescription Upload
1. Patient uploads prescription (base64 image)
2. If Gemini API key provided: AI extracts medicines
3. Fallback to demo data if no API key
4. Prescription stored and linked to patient and store

### Refill Management
1. Refills tracked by daysRemaining
2. Store can see upcoming refills (default: next 7 days)
3. Store can nudge patient to escalate
4. Patient can respond: ordered/snoozed/skipped

## Testing

### Test Patient Login Flow
```bash
curl -X POST http://localhost:3001/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999"}'

curl -X POST http://localhost:3001/api/auth/patient/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","otp":"123456"}'
```

### Test Store Login
```bash
curl -X POST http://localhost:3001/api/auth/store/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543200","password":"demo123"}'
```

### Test Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","password":"rxmaxadmin2026"}'
```

## Architecture

- **Framework**: Express.js
- **Database**: In-memory (JavaScript objects)
- **Authentication**: JWT (jsonwebtoken)
- **CORS**: Enabled for localhost ports
- **File Upload**: Multer (base64 image handling)
- **External AI**: Gemini 2.0 Flash Vision API (optional)

## Notes

- Server runs on port 3001
- No database setup required
- All data in memory (resets on server restart)
- Supports up to 50MB payloads
- Demo credentials provided for easy testing
