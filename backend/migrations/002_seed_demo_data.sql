-- RxMax - Demo Seed Data
-- Run after 001_initial_schema.sql

-- ============================================
-- 1. SEED: Default Store Owner (Apollo Pharmacy)
-- Password: demo123 (bcrypt hash)
-- ============================================
INSERT INTO stores (id, name, slug, owner_name, phone, email, password_hash, tagline, address, city, state, pincode, license_number, gst_number, delivery_radius_km, delivery_charge, min_order_amount, is_delivery_enabled, is_pickup_enabled, operating_hours, plan, is_active, is_verified)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Apollo Pharmacy',
    'apollo-pharmacy',
    'Ramesh Sharma',
    '9876543200',
    'ramesh@apollopharmacy.in',
    '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkHzU/6P4S7Vm5rFd3x4RKQIK9V2C',
    'Your Trusted Neighbourhood Pharmacy',
    'Shop 12, Banjara Hills Main Road, Hyderabad',
    'Hyderabad',
    'Telangana',
    '500034',
    'TS-DRUG-2024-001',
    '36AABCU9603R1ZM',
    5.0,
    50.00,
    200.00,
    true,
    true,
    '{"monday":{"open":"09:00","close":"22:00"},"tuesday":{"open":"09:00","close":"22:00"},"wednesday":{"open":"09:00","close":"22:00"},"thursday":{"open":"09:00","close":"22:00"},"friday":{"open":"09:00","close":"22:00"},"saturday":{"open":"09:00","close":"22:00"},"sunday":{"open":"10:00","close":"21:00"}}',
    'pro',
    true,
    true
) ON CONFLICT (phone) DO NOTHING;

-- ============================================
-- 2. SEED: Sample Patients
-- ============================================
INSERT INTO patients (id, phone, name, email, date_of_birth, gender, blood_group, allergies, conditions, address, city, pincode, is_active) VALUES
('p001-0000-0000-0000-000000000001', '9876543210', 'Rajesh Kumar', 'rajesh.kumar@email.com', '1975-06-15', 'male', 'B+', ARRAY['Penicillin', 'Shellfish'], ARRAY['Diabetes', 'Hypertension'], 'Flat 203, Green Park Apartments, Banjara Hills', 'Hyderabad', '500034', true),
('p002-0000-0000-0000-000000000002', '9876543211', 'Priya Sharma', 'priya.sharma@email.com', '1988-03-22', 'female', 'O+', ARRAY[]::TEXT[], ARRAY['Thyroid'], 'House 45, Jubilee Hills', 'Hyderabad', '500033', true),
('p003-0000-0000-0000-000000000003', '9876543212', 'Amit Patel', 'amit.patel@email.com', '1965-11-08', 'male', 'A+', ARRAY['Sulfa drugs'], ARRAY['Asthma', 'Diabetes'], '12B, Madhapur Colony', 'Hyderabad', '500081', true),
('p004-0000-0000-0000-000000000004', '9876543213', 'Sunita Devi', 'sunita.devi@email.com', '1970-07-30', 'female', 'AB+', ARRAY[]::TEXT[], ARRAY['Cholesterol', 'Vitamin D Deficiency'], 'Plot 89, Kukatpally', 'Hyderabad', '500072', true),
('p005-0000-0000-0000-000000000005', '9876543214', 'Vikram Singh', 'vikram.singh@email.com', '1982-01-14', 'male', 'B-', ARRAY['Aspirin'], ARRAY['Cardiac', 'Hypertension'], 'Flat 67, Kondapur', 'Hyderabad', '500084', true)
ON CONFLICT (phone) DO NOTHING;

-- ============================================
-- 3. SEED: Connect Patients to Store (CRM)
-- ============================================
INSERT INTO store_patients (id, store_id, patient_id, loyalty_points, lifetime_value, total_orders, adherence_score, risk_level, last_order_at, tags, is_active) VALUES
('sp001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p001-0000-0000-0000-000000000001', 250, 45680.00, 28, 92, 'normal', NOW() - INTERVAL '2 days', ARRAY['diabetic', 'hypertension', 'high-value'], true),
('sp002-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p002-0000-0000-0000-000000000002', 120, 23450.00, 15, 78, 'normal', NOW() - INTERVAL '5 days', ARRAY['thyroid'], true),
('sp003-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p003-0000-0000-0000-000000000003', 50, 8900.00, 8, 45, 'at_risk', NOW() - INTERVAL '25 days', ARRAY['diabetic', 'asthma', 'low-adherence'], true),
('sp004-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p004-0000-0000-0000-000000000004', 180, 34200.00, 22, 88, 'normal', NOW() - INTERVAL '3 days', ARRAY['cholesterol'], true),
('sp005-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p005-0000-0000-0000-000000000005', 80, 15600.00, 12, 62, 'at_risk', NOW() - INTERVAL '15 days', ARRAY['cardiac', 'hypertension'], true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. SEED: Store Inventory (20 medicines in stock)
-- ============================================
INSERT INTO store_inventory (id, store_id, medicine_id, quantity_in_stock, reorder_level, selling_price, discount_percent, batch_number, expiry_date, is_available)
SELECT
    uuid_generate_v4(),
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    m.id,
    CASE WHEN random() > 0.3 THEN (random() * 200 + 20)::int ELSE (random() * 10 + 1)::int END,
    15,
    m.mrp * (1 - (random() * 0.15)),
    (random() * 15)::int,
    'BATCH-' || (random() * 9000 + 1000)::int,
    NOW() + INTERVAL '1 year' * (random() * 2 + 0.1),
    true
FROM medicines m
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. SEED: Sample Orders
-- ============================================
INSERT INTO orders (id, order_number, store_id, patient_id, order_type, subtotal, discount_amount, delivery_charge, total_amount, delivery_type, delivery_address, status, payment_status, payment_method, created_at) VALUES
('ord001-0000-0000-0000-000000000001', 'RX-2026-00001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p001-0000-0000-0000-000000000001', 'regular', 420.00, 0, 50.00, 470.00, 'delivery', 'Flat 203, Green Park Apartments, Banjara Hills', 'delivered', 'paid', 'cod', NOW() - INTERVAL '2 days'),
('ord002-0000-0000-0000-000000000002', 'RX-2026-00002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p002-0000-0000-0000-000000000002', 'refill', 270.00, 0, 0, 270.00, 'pickup', NULL, 'delivered', 'paid', 'upi', NOW() - INTERVAL '5 days'),
('ord003-0000-0000-0000-000000000003', 'RX-2026-00003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p001-0000-0000-0000-000000000001', 'prescription', 890.00, 50.00, 50.00, 890.00, 'delivery', 'Flat 203, Green Park Apartments, Banjara Hills', 'ready', 'pending', 'cod', NOW() - INTERVAL '1 day'),
('ord004-0000-0000-0000-000000000004', 'RX-2026-00004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p003-0000-0000-0000-000000000003', 'regular', 350.00, 0, 50.00, 400.00, 'delivery', '12B, Madhapur Colony', 'preparing', 'pending', 'cod', NOW() - INTERVAL '4 hours'),
('ord005-0000-0000-0000-000000000005', 'RX-2026-00005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p004-0000-0000-0000-000000000004', 'refill', 540.00, 0, 0, 540.00, 'pickup', NULL, 'confirmed', 'pending', 'upi', NOW() - INTERVAL '2 hours'),
('ord006-0000-0000-0000-000000000006', 'RX-2026-00006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p005-0000-0000-0000-000000000005', 'regular', 180.00, 0, 50.00, 230.00, 'delivery', 'Flat 67, Kondapur', 'placed', 'pending', 'cod', NOW() - INTERVAL '30 minutes'),
('ord007-0000-0000-0000-000000000007', 'RX-2026-00007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p001-0000-0000-0000-000000000001', 'refill', 650.00, 30.00, 0, 620.00, 'pickup', NULL, 'delivered', 'paid', 'cod', NOW() - INTERVAL '10 days'),
('ord008-0000-0000-0000-000000000008', 'RX-2026-00008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p002-0000-0000-0000-000000000002', 'prescription', 320.00, 0, 50.00, 370.00, 'delivery', 'House 45, Jubilee Hills', 'delivered', 'paid', 'upi', NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. SEED: Order Items
-- ============================================
INSERT INTO order_items (id, order_id, medicine_id, medicine_name, quantity, unit_price, total_price)
SELECT uuid_generate_v4(), 'ord001-0000-0000-0000-000000000001', id, 'Amlodipine 5mg', 2, 45.00, 90.00 FROM medicines WHERE name = 'Amlodipine 5mg' LIMIT 1;
INSERT INTO order_items (id, order_id, medicine_id, medicine_name, quantity, unit_price, total_price)
SELECT uuid_generate_v4(), 'ord001-0000-0000-0000-000000000001', id, 'Metformin 500mg', 2, 85.00, 170.00 FROM medicines WHERE name = 'Metformin 500mg' LIMIT 1;
INSERT INTO order_items (id, order_id, medicine_id, medicine_name, quantity, unit_price, total_price)
SELECT uuid_generate_v4(), 'ord003-0000-0000-0000-000000000003', id, 'Atorvastatin 10mg', 3, 120.00, 360.00 FROM medicines WHERE name = 'Atorvastatin 10mg' LIMIT 1;
INSERT INTO order_items (id, order_id, medicine_id, medicine_name, quantity, unit_price, total_price)
SELECT uuid_generate_v4(), 'ord004-0000-0000-0000-000000000004', id, 'Dolo 650', 2, 30.00, 60.00 FROM medicines WHERE name = 'Dolo 650' LIMIT 1;
INSERT INTO order_items (id, order_id, medicine_id, medicine_name, quantity, unit_price, total_price)
SELECT uuid_generate_v4(), 'ord006-0000-0000-0000-000000000006', id, 'Paracetamol 500mg', 3, 15.00, 45.00 FROM medicines WHERE name = 'Paracetamol 500mg' LIMIT 1;

-- ============================================
-- 7. SEED: Daily Revenue Stats (last 30 days)
-- ============================================
INSERT INTO store_daily_stats (id, store_id, date, total_orders, total_revenue, refill_orders, new_patients, active_patients, reminders_sent, reminders_converted, revenue_recovered)
SELECT
    uuid_generate_v4(),
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    d::date,
    (random() * 12 + 5)::int,
    (random() * 5000 + 6000)::numeric(10,2),
    (random() * 5 + 2)::int,
    (random() * 3)::int,
    (random() * 20 + 10)::int,
    (random() * 8 + 2)::int,
    (random() * 5 + 1)::int,
    (random() * 2000 + 500)::numeric(10,2)
FROM generate_series(NOW() - INTERVAL '30 days', NOW(), INTERVAL '1 day') AS d
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. SEED: Refill Reminders
-- ============================================
INSERT INTO refill_reminders (id, store_id, patient_id, medicine_name, refill_due_date, escalation_level, estimated_order_value, status, reminder_sent) VALUES
('rf001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p001-0000-0000-0000-000000000001', 'Amlodipine 5mg', NOW() + INTERVAL '1 day', 1, 240.00, 'sent', true),
('rf002-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p001-0000-0000-0000-000000000001', 'Metformin 500mg', NOW() + INTERVAL '3 days', 0, 180.00, 'scheduled', false),
('rf003-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p002-0000-0000-0000-000000000002', 'Thyronorm 50mcg', NOW() - INTERVAL '2 days', 3, 135.00, 'sent', true),
('rf004-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p003-0000-0000-0000-000000000003', 'Paracetamol 500mg', NOW() + INTERVAL '7 days', 0, 45.00, 'scheduled', false),
('rf005-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p004-0000-0000-0000-000000000004', 'Atorvastatin 10mg', NOW() + INTERVAL '5 days', 0, 360.00, 'scheduled', false),
('rf006-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p005-0000-0000-0000-000000000005', 'Telmisartan 40mg', NOW() - INTERVAL '5 days', 3, 285.00, 'sent', true),
('rf007-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p003-0000-0000-0000-000000000003', 'Azithromycin 500mg', NOW() + INTERVAL '15 days', 0, 225.00, 'scheduled', false),
('rf008-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'p004-0000-0000-0000-000000000004', 'Rosuvastatin 10mg', NOW() + INTERVAL '10 days', 0, 450.00, 'scheduled', false)
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. SEED: Admin User
-- Password: rxmaxadmin2026 (bcrypt hash)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'superadmin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO admin_users (id, name, phone, email, password_hash, role)
VALUES (
    'admin-0000-0000-0000-000000000001',
    'RxMax Admin',
    '9999999999',
    'admin@rxmax.in',
    '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkHzU/6P4S7Vm5rFd3x4RKQIK9V2C',
    'superadmin'
) ON CONFLICT (phone) DO NOTHING;
