# RxMax Backend - Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 14+ (`node --version`)
- PostgreSQL 12+ (`psql --version`)
- npm or yarn

### Step 1: Install Dependencies (1 min)
```bash
cd /sessions/amazing-funny-galileo/mnt/Pharmacy\ App/rxmax-app/backend
npm install
```

### Step 2: Configure Environment (1 min)
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=rxmax

# JWT
JWT_SECRET=your-super-secret-key-here

# Optional: AI & Notifications
GEMINI_API_KEY=your_google_api_key
WHATSAPP_API_KEY=your_whatsapp_api_key
```

### Step 3: Create Database (2 min)
```bash
# Create database
psql -U postgres -c "CREATE DATABASE rxmax;"

# Run migrations (seed data included)
psql -U postgres -d rxmax -f migrations/001_initial_schema.sql
```

### Step 4: Start Server (1 min)
```bash
npm start
```

You should see:
```
RxMax API running on port 3000
Environment: production
```

---

## Test It Out

### Health Check
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{"status":"healthy","timestamp":"2026-04-05T..."}
```

### Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"9999999999",
    "password":"rxmaxadmin2026"
  }'
```

Response:
```json
{
  "message":"Admin login successful",
  "token":"eyJhbGciOiJIUzI1NiIs...",
  "admin":{"id":"prashant","name":"Prashant (Platform Owner)","role":"admin"}
}
```

### View Admin Dashboard
```bash
curl http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Common Commands

### Development Mode (with debug logging)
```bash
NODE_ENV=development npm run dev
```

### Run Specific Route Test
```bash
# Test store list
curl "http://localhost:3000/api/admin/stores?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test patient list
curl "http://localhost:3000/api/admin/patients?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test analytics
curl "http://localhost:3000/api/admin/analytics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Test Data

#### Register a Store
```bash
curl -X POST http://localhost:3000/api/auth/store/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Pharmacy",
    "ownerName":"John Doe",
    "phone":"9876543210",
    "email":"test@pharmacy.com",
    "password":"password123",
    "address":"123 Main St",
    "city":"Mumbai",
    "state":"Maharashtra",
    "pincode":"400001"
  }'
```

#### Patient OTP Login
```bash
# Send OTP
curl -X POST http://localhost:3000/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9123456789"}'

# Check console for OTP in development mode
# Then verify it
curl -X POST http://localhost:3000/api/auth/patient/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9123456789","otp":"123456"}'
```

---

## API Endpoint Groups

### Authentication
- `POST /api/auth/store/register` - Register pharmacy
- `POST /api/auth/store/login` - Store login
- `POST /api/auth/patient/send-otp` - Send OTP
- `POST /api/auth/patient/verify-otp` - Verify OTP

### Admin (Requires Admin Login)
- `GET /api/admin/dashboard` - Platform metrics
- `GET /api/admin/stores` - All stores
- `GET /api/admin/patients` - All patients
- `GET /api/admin/orders` - All orders
- `GET /api/admin/analytics` - Comprehensive analytics
- `GET /api/admin/refills` - Refill metrics

### Store Operations (Requires Store Login)
- `GET /api/stores/:slug` - Public profile
- `GET /api/stores/dashboard/summary` - Dashboard
- `GET /api/stores/patients` - Patient list
- `GET /api/stores/inventory` - Inventory
- `POST /api/stores/inventory` - Add inventory
- `POST /api/stores/inventory/bulk` - Bulk upload

### Patient Operations (Requires Patient Login)
- `GET /api/patients/profile` - Profile
- `GET /api/patients/prescriptions` - Prescriptions
- `GET /api/patients/medications` - Medications
- `POST /api/patients/join-store/:slug` - Join store

### Prescriptions
- `POST /api/prescriptions/upload` - Upload with AI
- `POST /api/prescriptions/upload-base64` - Upload (base64)
- `GET /api/prescriptions/:id` - View prescription

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Order detail
- `PUT /api/orders/:id/status` - Update status

### Refills
- `GET /api/refills/upcoming` - Upcoming refills
- `GET /api/refills/patient` - Patient refills
- `POST /api/refills/:id/respond` - Patient response
- `POST /api/refills/:id/nudge` - Send nudge

### Medicines
- `GET /api/medicines/search?q=name` - Search
- `GET /api/medicines/:id` - Medicine detail

---

## Database Verification

Check if tables were created:
```bash
psql -U postgres -d rxmax -c "\dt"
```

You should see:
```
                 List of relations
 Schema |           Name            | Type  | Owner
--------+---------------------------+-------+----------
 public | medicines                 | table | postgres
 public | notifications             | table | postgres
 public | order_items               | table | postgres
 public | orders                    | table | postgres
 ... (13 tables total)
```

View seed medicines:
```bash
psql -U postgres -d rxmax -c "SELECT name, generic_name, mrp FROM medicines LIMIT 5;"
```

---

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** PostgreSQL not running or wrong credentials
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Check connection
psql -U postgres
```

### Port 3000 Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution:** Change port in `.env`
```
PORT=3001
```

### Missing Dependencies
```
Error: Cannot find module 'express'
```
**Solution:** Install dependencies
```bash
npm install
```

### Database Not Found
```
Error: database "rxmax" does not exist
```
**Solution:** Create database
```bash
psql -U postgres -c "CREATE DATABASE rxmax;"
```

### JWT Token Expired
```
{"error":"Invalid or expired token"}
```
**Solution:** Tokens expire in 30 days. Re-login to get new token.

---

## Environment Variables Reference

```bash
# Server
NODE_ENV=production                    # production or development
PORT=3000                              # Server port

# Database
DB_USER=postgres                       # PostgreSQL username
DB_PASSWORD=postgres                   # PostgreSQL password
DB_HOST=localhost                      # Database host
DB_PORT=5432                           # Database port
DB_NAME=rxmax                          # Database name
DATABASE_URL=                          # Full connection string (Railway)

# Security
JWT_SECRET=your-secret-key            # JWT signing secret

# File uploads
UPLOAD_DIR=uploads                    # Upload directory
MAX_FILE_SIZE=10485760                # Max 10MB

# AI Services
GEMINI_API_KEY=                       # Google Gemini API key (optional)

# WhatsApp
WHATSAPP_API_KEY=                     # WhatsApp API key (optional)
WHATSAPP_PROVIDER=gupshup             # gupshup or wati
WHATSAPP_TEMPLATE_ENABLED=false       # Enable templates

# Admin Credentials
ADMIN_PHONE=9999999999                # Admin phone
ADMIN_PASSWORD=rxmaxadmin2026         # Admin password
```

---

## Next Steps

1. **Explore Admin Dashboard**
   - Login as admin (phone: 9999999999, password: rxmaxadmin2026)
   - View platform metrics, stores, patients, analytics

2. **Create Test Store**
   - Register a new pharmacy store
   - Update store profile and settings

3. **Add Inventory**
   - Add medicines to store inventory
   - Test bulk upload feature

4. **Test Prescriptions**
   - Upload a prescription image
   - See AI extraction results
   - Manually add medicines if needed

5. **Create Orders**
   - Create orders as patient
   - Update order status as store
   - View order history

6. **Explore Analytics**
   - View store-specific analytics
   - Check platform analytics
   - Generate reports

---

## Documentation

- **README.md** - Complete API documentation
- **IMPLEMENTATION_SUMMARY.md** - Feature overview
- **QUICKSTART.md** - This file

---

## Support

For questions or issues:
1. Check error message in terminal
2. Review relevant route file in `src/routes/`
3. Check database schema in `migrations/001_initial_schema.sql`
4. Review README.md for API details

---

**Ready to go!** Your RxMax backend is now running.
