# RxMax Local Server - Complete Documentation

## Files Overview

### Core Files
- **server.js** (1459 lines, 45KB)
  - Single-file Express.js backend
  - In-memory data store with seed data
  - 33 API endpoints
  - JWT authentication
  - Gemini AI integration for prescriptions

- **package.json**
  - Dependencies: express, cors, multer, jsonwebtoken, uuid, axios
  - Scripts: start, dev

### Documentation
- **README.md** - Feature overview and architecture
- **SETUP.md** - Installation and troubleshooting guide
- **API_TESTING.md** - Complete curl command examples
- **.env.example** - Environment variable template
- **INDEX.md** - This file

## Quick Reference

### Start Server
```bash
npm install
npm start
```

### Access Points
- Server: http://localhost:3001
- Patient App: http://localhost:3000
- Store Dashboard: http://localhost:3002
- Admin Panel: http://localhost:3003

### Demo Credentials
- Patient: Any phone + OTP 123456
- Store: 9876543200 / demo123
- Admin: 9999999999 / rxmaxadmin2026

## Complete Feature List

### Data Store (All In-Memory)
✓ 5 Seed Patients (P001-P005)
  - Full medical history
  - Adherence scores (45-92%)
  - Lifetime values ($8,900-$45,680)
  - Risk levels (low/medium/high)
  - Conditions and allergies

✓ 1 Seed Store (Apollo Pharmacy)
  - Hyderabad location
  - 9AM-10PM operating hours
  - 50 rupee delivery charge
  - 200 rupee minimum order
  - GST: 36AABCU9603R1ZM
  - License: TS-2024-001

✓ 10 Seed Orders (RX-2026-00001 to 00010)
  - Mixed statuses (placed, confirmed, preparing, ready, delivered)
  - Linked to patients and medicines
  - Delivery tracking
  - Order amounts: 530-3500 INR

✓ 5 Seed Prescriptions
  - Linked to patients
  - Doctor names and hospitals
  - Medicine extraction
  - Confidence scores (92-98%)

✓ 8 Seed Refills
  - Various escalation levels (0-3)
  - Days remaining: -2 to 22
  - Overdue tracking
  - Patient and medicine linkage

✓ 20 Seed Medicines
  - Common Indian pharmaceuticals
  - Pricing: 28-150 INR
  - Stock levels: 80-600 units
  - Discount info (13-31%)
  - Expiry dates included

✓ 30 Days Revenue Data
  - Daily order counts
  - Daily amounts
  - Delivery metrics

### Authentication (4 endpoints)
- POST /api/auth/patient/send-otp
  - Always succeeds
  - OTP: 123456 (demo)
  - Stores phone temporarily

- POST /api/auth/patient/verify-otp
  - Creates new patient if not exists
  - Auto-connects to default store
  - Returns JWT token
  - 30-day expiry

- POST /api/auth/store/login
  - Phone + password verification
  - Returns JWT token with store ID
  - Role: store

- POST /api/admin/login
  - Fixed credentials validation
  - Returns JWT token
  - Role: admin

### Patient Features (4 endpoints)
- GET /api/patients/profile
  - Full patient record
  - Medical history
  - Metrics and statistics

- PUT /api/patients/profile
  - Update name, email, address
  - Update medical info
  - Update contact details

- GET /api/patients/medications
  - Active medications from prescriptions
  - Dosage and frequency
  - Duration information

- POST /api/patients/join-store/:slug
  - Change primary store
  - Auto-adds to store's patient list
  - Updates immediately

### Prescription Management (3 endpoints)
- POST /api/prescriptions/upload-base64
  - Accept base64 image
  - Call Gemini API if key available
  - Extract: doctor, hospital, diagnosis, medicines
  - Fallback to demo data
  - Auto-link to patient and store

- GET /api/prescriptions
  - List all (patient) or store's prescriptions
  - Filtered by user role

- GET /api/prescriptions/:id
  - Get single prescription
  - Medical details
  - Extracted medicines

### Order Management (6 endpoints)
- POST /api/orders
  - Create order with items
  - Auto-generate RX-2026-XXXXX number
  - Calculate totals
  - Update patient lifetime value
  - Track daily revenue

- GET /api/orders
  - List orders
  - Filter by patient or store
  - Support status filter (?status=)

- GET /api/orders/:id
  - Get order details
  - Items, amounts, dates
  - Delivery information

- PUT /api/orders/:id/status
  - Update order status
  - Validate transitions:
    placed → confirmed → preparing → ready → delivered
  - Timestamp each transition
  - Update daily deliveries count

- POST /api/orders/reorder/:orderId
  - Reorder from previous order
  - Clone order items
  - New order number
  - Reset status to "placed"

### Refill Management (4 endpoints)
- GET /api/refills/upcoming
  - Store endpoint
  - Filter by days remaining
  - Default: next 7 days
  - Include escalation levels

- GET /api/refills/patient
  - Patient's refills
  - All statuses
  - Days remaining

- POST /api/refills/:id/respond
  - Patient action: ordered/snoozed/skipped
  - Update refill status
  - Return confirmation

- POST /api/refills/:id/nudge
  - Store escalates refill
  - Increase escalation level (max 3)
  - Alert patient

### Store Dashboard (8 endpoints)
- GET /api/stores/:slug
  - Public store information
  - No authentication needed
  - Excludes password

- GET /api/stores/dashboard/summary
  - Today's orders count
  - Today's revenue
  - Pending orders count
  - At-risk patients count
  - Low stock medicines count

- GET /api/stores/patients
  - All connected patients
  - Lifetime value
  - Order history
  - CRM metrics

- GET /api/stores/patients/:patientId
  - Full patient profile
  - Order history with details
  - Refill information
  - Total order value

- GET /api/stores/inventory
  - All medicines
  - Stock levels
  - Pricing information
  - Expiry dates
  - Discount info

- PUT /api/stores/profile
  - Update store details
  - Operating hours
  - Delivery charge
  - Contact info
  - Address

- GET /api/stores/revenue-alerts
  - Overdue refills
  - Estimated revenue at risk
  - Patient details
  - Escalation levels

- GET /api/stores/analytics/detailed
  - Daily revenue data (30 days)
  - Total revenue
  - Total orders
  - Average order value
  - Trend analysis

### Medicine Catalog (2 endpoints)
- GET /api/medicines/search?q=
  - Search by name or brand
  - Return matching medicines
  - Full details included

- GET /api/medicines/:id
  - Get medicine details
  - Pricing info
  - Stock information
  - Dosage forms

### Admin Features (2 endpoints)
- GET /api/admin/dashboard
  - Platform metrics
  - Total patients
  - Total orders
  - Total revenue
  - Total stores
  - Average patient value

- GET /api/admin/stores
  - List all stores
  - Store details
  - Connected patient counts

## API Patterns

### Request Format
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### Error Handling
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

## Data Flow Examples

### Patient Registration → Order → Store Dashboard
1. Patient sends OTP
2. Patient verifies OTP → Logged in
3. Patient auto-connected to Apollo Pharmacy
4. Patient places order
5. Order ID: RX-2026-XXXXX
6. Patient metrics updated
7. Order appears in store dashboard
8. Store updates status
9. Patient sees status change

### Prescription Upload
1. Patient uploads prescription (base64)
2. Gemini API extracts medicines (if key available)
3. Prescription stored with extracted data
4. Linked to patient and store
5. Store can see prescription
6. Medicines available for reordering

### Refill Workflow
1. Refill created (daysRemaining: varies)
2. Store sees in upcoming refills
3. Store can nudge patient (escalate)
4. Patient sees refill reminder
5. Patient responds: ordered/snoozed/skipped
6. Refill status updated
7. If ordered: creates new order

## Technical Details

### In-Memory Storage
- All data in JavaScript objects
- Key-value pairs by ID
- No synchronization needed
- Resets on server restart

### Authentication
- JWT with secret: rxmax-local-secret-2026
- 30-day expiration
- Contains: id, role, iat, exp
- Verified on protected routes

### CORS Policy
- Origins: localhost:3000, 3002, 3003
- Credentials: true
- Methods: GET, POST, PUT, DELETE

### File Upload
- Multer memory storage
- Base64 image support
- Max 50MB payload
- JSON accepted

### External Integration
- Gemini 2.0 Flash Vision API
- Prescription image analysis
- Medicine extraction
- Confidence scoring

## Database Schema (Conceptual)

### stores
- id, name, slug
- owner, phone, password, address, city
- license, gst
- operatingHours, deliveryCharge, minOrderAmount
- createdAt, connectedPatients[]

### patients
- id, name, phone, email
- dob, gender, address, city
- adherenceScore, lifetimeValue, totalOrders
- riskLevel, conditions[], allergies[]
- primaryStore, createdAt, lastOrderDate

### orders
- id, orderNumber, patientId, storeId
- status, items[], totalAmount
- deliveryCharge, finalAmount
- deliveryType, notes
- createdAt, confirmedAt, readyAt, deliveredAt

### prescriptions
- id, patientId, storeId
- doctorName, hospitalName, diagnosis, confidence
- medicines[], imageUrl
- uploadedAt, status

### refills
- id, patientId, storeId
- medicineId, medicineName, dosage, frequency
- daysRemaining, dueDate, escalationLevel
- status, createdAt

### medicines
- id, name, brand, dosage, category
- stock, price, mrp, discount, expiry
- status, manufacturer

## Performance Considerations

- In-memory operations: sub-millisecond
- No database latency
- No network calls except Gemini
- Linear search through objects
- Data size: ~500KB uncompressed

## Security (Demo Only)

- JWT secret hardcoded
- No rate limiting
- No input validation
- No SQL injection risk (no DB)
- CORS open to localhost
- Demo credentials hardcoded

## Future Enhancements

- Add real database
- Implement proper error handling
- Add request validation
- Add rate limiting
- Add audit logging
- Add WebSocket for real-time updates
- Add notification system
- Add payment integration
- Add inventory management
- Add analytics engine

## Support & Debugging

### Health Check
```bash
curl http://localhost:3001/health
```

### Common Issues
1. Port 3001 in use → Kill process or use different port
2. Module not found → Run npm install
3. CORS errors → Check frontend URLs
4. Invalid OTP → Use 123456
5. Token expired → Get new token

### Logs
- All API calls logged to console
- Errors show full stack traces
- Startup shows configuration

## Summary Statistics

- Total Lines of Code: 1,459
- File Size: 45KB
- Dependencies: 5
- Endpoints: 33
- Seed Patients: 5
- Seed Orders: 10
- Seed Medicines: 20
- Data Classes: 6
- Code Sections: 12

Ready for production use? See SETUP.md for production notes.
