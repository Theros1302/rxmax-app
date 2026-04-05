# RxMax API Testing Guide

Quick reference for testing all endpoints with curl commands.

## 1. Patient Registration & Authentication

### Send OTP
```bash
curl -X POST http://localhost:3001/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543215"}'

# Response: {"success":true,"message":"OTP sent (demo: 123456)","phone":"9876543215"}
```

### Verify OTP (New Patient Registration)
```bash
curl -X POST http://localhost:3001/api/auth/patient/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543215","otp":"123456"}'

# Response: {"success":true,"token":"<JWT_TOKEN>","patient":{...}}
# Save the token as $PATIENT_TOKEN
```

### Verify OTP (Existing Patient)
```bash
curl -X POST http://localhost:3001/api/auth/patient/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456"}'

# Response: Returns token for P001 (Rajesh Kumar)
```

## 2. Store Authentication

### Store Login
```bash
curl -X POST http://localhost:3001/api/auth/store/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543200","password":"demo123"}'

# Response: {"success":true,"token":"<JWT_TOKEN>","store":{...}}
# Save the token as $STORE_TOKEN
```

## 3. Patient Endpoints

### Get Patient Profile
```bash
curl -X GET http://localhost:3001/api/patients/profile \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

### Update Patient Profile
```bash
curl -X PUT http://localhost:3001/api/patients/profile \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Updated Name",
    "email":"newemail@example.com",
    "address":"New Address"
  }'
```

### Get Patient Medications
```bash
curl -X GET http://localhost:3001/api/patients/medications \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

### Join Store
```bash
curl -X POST http://localhost:3001/api/patients/join-store/apollo-pharmacy \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

## 4. Orders

### Create Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "medicineId": "MED-001",
        "name": "Amlodipine",
        "dosage": "5mg",
        "quantity": 30,
        "price": 45,
        "subtotal": 1350
      },
      {
        "medicineId": "MED-002",
        "name": "Metformin",
        "dosage": "500mg",
        "quantity": 60,
        "price": 35,
        "subtotal": 2100
      }
    ],
    "deliveryType": "home-delivery",
    "notes": "Please deliver after 6 PM"
  }'
```

### List Orders (Patient)
```bash
curl -X GET http://localhost:3001/api/orders \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

### List Orders (Store) - with Status Filter
```bash
curl -X GET "http://localhost:3001/api/orders?status=placed" \
  -H "Authorization: Bearer $STORE_TOKEN"
```

### Get Single Order
```bash
curl -X GET http://localhost:3001/api/orders/RX-2026-00001 \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

### Update Order Status (Store Only)
```bash
# placed → confirmed
curl -X PUT http://localhost:3001/api/orders/RX-2026-00006/status \
  -H "Authorization: Bearer $STORE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'

# confirmed → preparing
curl -X PUT http://localhost:3001/api/orders/RX-2026-00006/status \
  -H "Authorization: Bearer $STORE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"preparing"}'

# preparing → ready
curl -X PUT http://localhost:3001/api/orders/RX-2026-00006/status \
  -H "Authorization: Bearer $STORE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ready"}'

# ready → delivered
curl -X PUT http://localhost:3001/api/orders/RX-2026-00006/status \
  -H "Authorization: Bearer $STORE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"delivered"}'
```

### Reorder from Previous Order
```bash
curl -X POST http://localhost:3001/api/orders/reorder/RX-2026-00001 \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

## 5. Prescriptions

### Upload Prescription (Base64)
```bash
# For testing, use a simple base64 string
SAMPLE_BASE64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

curl -X POST http://localhost:3001/api/prescriptions/upload-base64 \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"imageBase64\":\"data:image/png;base64,$SAMPLE_BASE64\"}"
```

### List Prescriptions
```bash
curl -X GET http://localhost:3001/api/prescriptions \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

### Get Single Prescription
```bash
curl -X GET http://localhost:3001/api/prescriptions/PRESC-001 \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

## 6. Refills

### Get Upcoming Refills (Store)
```bash
curl -X GET "http://localhost:3001/api/refills/upcoming?days=7" \
  -H "Authorization: Bearer $STORE_TOKEN"
```

### Get Patient Refills
```bash
curl -X GET http://localhost:3001/api/refills/patient \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

### Patient Responds to Refill
```bash
curl -X POST http://localhost:3001/api/refills/REFILL-001/respond \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"response":"ordered"}'
```

### Store Nudges Patient
```bash
curl -X POST http://localhost:3001/api/refills/REFILL-003/nudge \
  -H "Authorization: Bearer $STORE_TOKEN"
```

## 7. Store Dashboard

### Get Store Info (Public)
```bash
curl -X GET http://localhost:3001/api/stores/apollo-pharmacy
```

### Dashboard Summary
```bash
curl -X GET http://localhost:3001/api/stores/dashboard/summary \
  -H "Authorization: Bearer $STORE_TOKEN"
```

### List Connected Patients
```bash
curl -X GET http://localhost:3001/api/stores/patients \
  -H "Authorization: Bearer $STORE_TOKEN"
```

### Get Single Patient Details
```bash
curl -X GET http://localhost:3001/api/stores/patients/P001 \
  -H "Authorization: Bearer $STORE_TOKEN"
```

### Get Store Inventory
```bash
curl -X GET http://localhost:3001/api/stores/inventory \
  -H "Authorization: Bearer $STORE_TOKEN"
```

### Update Store Profile
```bash
curl -X PUT http://localhost:3001/api/stores/profile \
  -H "Authorization: Bearer $STORE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operatingHours": "8AM-11PM",
    "deliveryCharge": 75
  }'
```

### Revenue Alerts
```bash
curl -X GET http://localhost:3001/api/stores/revenue-alerts \
  -H "Authorization: Bearer $STORE_TOKEN"
```

### Detailed Analytics
```bash
curl -X GET http://localhost:3001/api/stores/analytics/detailed \
  -H "Authorization: Bearer $STORE_TOKEN"
```

## 8. Medicines

### Search Medicines
```bash
curl -X GET "http://localhost:3001/api/medicines/search?q=amlodipine"
```

### Get Medicine Details
```bash
curl -X GET http://localhost:3001/api/medicines/MED-001
```

## 9. Admin

### Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","password":"rxmaxadmin2026"}'

# Save the token as $ADMIN_TOKEN
```

### Admin Dashboard
```bash
curl -X GET http://localhost:3001/api/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### List All Stores
```bash
curl -X GET http://localhost:3001/api/admin/stores \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Sample Workflow: Complete Flow

### 1. Register New Patient
```bash
# Step 1: Send OTP
curl -X POST http://localhost:3001/api/auth/patient/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999888877"}'

# Step 2: Verify OTP
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/patient/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999888877","otp":"123456"}')
PATIENT_TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
```

### 2. Store Agent Logs In
```bash
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/store/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543200","password":"demo123"}')
STORE_TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
```

### 3. Patient Places Order
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "medicineId": "MED-001",
      "name": "Amlodipine",
      "quantity": 30,
      "price": 45,
      "subtotal": 1350
    }],
    "deliveryType": "home-delivery"
  }'
```

### 4. Store Updates Order Status
```bash
# Get order number from step 3
curl -X PUT http://localhost:3001/api/orders/RX-2026-00011/status \
  -H "Authorization: Bearer $STORE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'
```

### 5. Patient Sees Updated Order
```bash
curl -X GET http://localhost:3001/api/orders/RX-2026-00011 \
  -H "Authorization: Bearer $PATIENT_TOKEN"
```

## Notes

- All timestamps are in ISO 8601 format
- IDs use prefixes: P (patient), MED (medicine), PRESC (prescription), REFILL (refill), RX (order)
- Dates in seed data are relative to 2026-04-05
- Store and patient tokens are valid for 30 days
- All POST/PUT requests must include Content-Type: application/json
