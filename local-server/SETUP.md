# RxMax Local Server - Setup Guide

## Installation & Running

### Prerequisites
- Node.js 14+ installed
- npm package manager

### Step 1: Install Dependencies
```bash
cd /sessions/amazing-funny-galileo/mnt/Pharmacy\ App/rxmax-app/local-server/
npm install
```

Expected output:
```
added 50 packages, and audited 51 packages in 2s
```

### Step 2: Run the Server
```bash
npm start
```

Expected output:
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

## Optional: Enable Gemini AI for Prescription Analysis

### With API Key:
```bash
export GEMINI_API_KEY=your_actual_key
npm start
```

### Without API Key:
Server automatically returns demo prescription data. Prescription uploads will work but return hardcoded medicine extraction.

## What's Running

### Server Configuration
- Host: localhost
- Port: 3001
- Database: In-memory (resets on restart)
- CORS: Enabled for ports 3000, 3002, 3003

### Seed Data Included
- **Patients**: 5 demo patients with medical history
- **Store**: Apollo Pharmacy (Hyderabad)
- **Orders**: 10 orders with mixed statuses
- **Prescriptions**: 5 prescriptions with extracted medicines
- **Medicines**: 20 common Indian pharmaceuticals
- **Refills**: 8 refills with various escalation levels
- **Revenue**: 30 days of daily metrics

## Testing

### Quick Test: Check Server Health
```bash
curl http://localhost:3001/health
```

Response:
```json
{"status":"ok","timestamp":"2026-04-05T..."}
```

### Test Patient Registration
```bash
curl -X POST http://localhost:3001/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543215"}'

# Then verify with OTP "123456"
curl -X POST http://localhost:3001/api/auth/patient/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543215","otp":"123456"}'
```

### Test Store Login
```bash
curl -X POST http://localhost:3001/api/auth/store/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543200","password":"demo123"}'
```

## File Structure

```
/local-server/
├── package.json          # Dependencies: express, cors, multer, jsonwebtoken, uuid
├── server.js             # Single-file Express server (1459 lines)
├── README.md             # Feature overview and quick start
├── API_TESTING.md        # Comprehensive curl command examples
├── SETUP.md              # This file
└── .env.example          # Environment variables template
```

## API Overview (33 endpoints)

### Auth (4 routes)
- Send OTP, Verify OTP, Store Login, Admin Login

### Patients (4 routes)
- Profile CRUD, Medications, Join Store

### Prescriptions (3 routes)
- Upload with AI analysis, List, Get Details

### Orders (6 routes)
- Create, List, Get, Update Status, Reorder

### Refills (4 routes)
- Upcoming (store), Patient list, Respond, Nudge

### Store Dashboard (8 routes)
- Store info, Dashboard summary, Patients CRM, Inventory, Analytics, Revenue alerts

### Medicines (2 routes)
- Search, Get Details

### Admin (2 routes)
- Dashboard, List Stores

## Key Features

### Patient Flow
1. Send OTP (always succeeds, OTP: 123456)
2. Verify OTP → Auto-register if new patient
3. Auto-connected to Apollo Pharmacy
4. Patient appears in store dashboard immediately

### Order Flow
1. Patient places order
2. Order number: RX-2026-XXXXX (auto-incremented)
3. Status transitions: placed → confirmed → preparing → ready → delivered
4. Patient lifetime value and order count updated automatically
5. Daily revenue tracking

### Prescription Upload
1. Patient uploads base64 image
2. If Gemini key available: AI extracts medicines
3. If no key: Demo data returned
4. Linked to patient and store automatically

### Refill Management
1. 8 seed refills with varying escalation levels
2. Store sees upcoming refills (default: next 7 days)
3. Store can nudge patients to escalate urgency
4. Patient can respond: ordered/snoozed/skipped
5. Overdue refills tracked

## JWT Authentication

### Token Format
```json
{
  "id": "P001" or "store-1" or "admin-1",
  "role": "patient" or "store" or "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Expiry
- 30 days

### Secret
- rxmax-local-secret-2026 (for local use only)

## Data Persistence

### During Session
- All data persists in memory
- New patients, orders, prescriptions automatically saved
- Patient metrics (lifetime value, adherence) updated in real-time

### On Restart
- All data resets to seed values
- Only seeded patients and orders are present
- No persistent database (use real DB for production)

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3005 npm start
```

### CORS Errors
- Ensure front-end apps are on localhost:3000, 3002, 3003
- Check Authorization header format: `Bearer <token>`

### Prescription Upload Issues
- Base64 string must start with `data:image/` prefix
- File size limit: 50MB
- Without Gemini key: Returns demo data

### Invalid OTP
- Always use: `123456`
- Phone number can be any valid format

## Production Notes

This is a DEMO server for local development:
- No database persistence
- No authentication audit logging
- Hardcoded seed data
- JWT secret hardcoded
- No rate limiting or request validation
- CORS open to localhost only

For production:
1. Add database (PostgreSQL, MongoDB)
2. Implement proper error handling
3. Add request validation and rate limiting
4. Use secure secret management
5. Add audit logging
6. Implement file virus scanning for prescriptions
7. Use proper Gemini API key management
8. Add input sanitization

## Support

### View Logs
- All API calls logged to console
- Errors show stack traces
- Server startup shows configuration

### Debug Mode
Run with Node debug:
```bash
node --inspect server.js
```

Then visit: chrome://inspect

## Quick Links

- Server: http://localhost:3001
- Health: http://localhost:3001/health
- Patient App: http://localhost:3000
- Store Dashboard: http://localhost:3002
- Admin Panel: http://localhost:3003

## Demo Users

### Patient Registration
- Any phone number
- OTP: 123456

### Store
- Phone: 9876543200
- Password: demo123

### Admin
- Phone: 9999999999
- Password: rxmaxadmin2026
