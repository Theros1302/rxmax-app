-- RxMax - Database Schema
-- PostgreSQL Initial Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. STORES (Pharmacy Store Owners)
-- ============================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,  -- URL-friendly store identifier
    owner_name VARCHAR(150) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,

    -- Branding
    logo_url TEXT,
    tagline VARCHAR(300),
    primary_color VARCHAR(7) DEFAULT '#1B4F72',

    -- Location
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),

    -- Business settings
    license_number VARCHAR(50),
    gst_number VARCHAR(20),
    delivery_radius_km DECIMAL(5, 2) DEFAULT 5.00,
    delivery_charge DECIMAL(8, 2) DEFAULT 0.00,
    min_order_amount DECIMAL(8, 2) DEFAULT 0.00,
    is_delivery_enabled BOOLEAN DEFAULT true,
    is_pickup_enabled BOOLEAN DEFAULT true,

    -- Operating hours (JSON: {"mon": {"open": "09:00", "close": "21:00"}, ...})
    operating_hours JSONB DEFAULT '{}',

    -- Subscription
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
    plan_expires_at TIMESTAMP WITH TIME ZONE,
    max_patients INTEGER DEFAULT 50,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stores_city ON stores(city);
CREATE INDEX idx_stores_pincode ON stores(pincode);
CREATE INDEX idx_stores_slug ON stores(slug);

-- ============================================
-- 2. PATIENTS
-- ============================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(150),
    email VARCHAR(255),
    password_hash VARCHAR(255),

    -- Health profile
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    blood_group VARCHAR(5),
    allergies TEXT[],               -- Array of known allergies
    conditions TEXT[],              -- Array of chronic conditions (diabetes, hypertension, etc.)

    -- Address
    address TEXT,
    city VARCHAR(100),
    pincode VARCHAR(6),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_patients_phone ON patients(phone);

-- ============================================
-- 3. STORE-PATIENT RELATIONSHIP (Single Store Loyalty)
-- ============================================
CREATE TABLE store_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- CRM data
    loyalty_points INTEGER DEFAULT 0,
    lifetime_value DECIMAL(12, 2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    adherence_score DECIMAL(5, 2) DEFAULT 0.00,  -- 0-100 medication adherence
    risk_level VARCHAR(20) DEFAULT 'normal' CHECK (risk_level IN ('normal', 'at_risk', 'lapsed')),
    last_order_at TIMESTAMP WITH TIME ZONE,

    -- Family link (optional: who referred / family head)
    family_group_id UUID,
    relationship VARCHAR(50),  -- self, spouse, parent, child

    -- Tags for segmentation
    tags TEXT[],  -- e.g., ['diabetic', 'cardiac', 'high-value']

    notes TEXT,  -- Store owner's private notes about patient

    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,

    UNIQUE(store_id, patient_id)
);

CREATE INDEX idx_store_patients_store ON store_patients(store_id);
CREATE INDEX idx_store_patients_patient ON store_patients(patient_id);
CREATE INDEX idx_store_patients_risk ON store_patients(store_id, risk_level);

-- ============================================
-- 4. MEDICINES / DRUG DATABASE
-- ============================================
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(300) NOT NULL,
    generic_name VARCHAR(300),
    manufacturer VARCHAR(200),
    category VARCHAR(100),          -- tablet, capsule, syrup, injection, etc.
    composition TEXT,               -- Active ingredients

    -- Dosage info
    strength VARCHAR(50),           -- e.g., "500mg", "10ml"
    pack_size INTEGER,              -- Number of units in one pack

    -- Pricing
    mrp DECIMAL(10, 2),

    -- Flags
    is_prescription_required BOOLEAN DEFAULT false,
    is_chronic BOOLEAN DEFAULT false,  -- Typically used for chronic conditions
    is_controlled BOOLEAN DEFAULT false,

    -- Alternatives
    alternative_ids UUID[],         -- Generic alternatives

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_medicines_name ON medicines USING gin(to_tsvector('english', name));
CREATE INDEX idx_medicines_generic ON medicines USING gin(to_tsvector('english', generic_name));

-- ============================================
-- 5. STORE INVENTORY
-- ============================================
CREATE TABLE store_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id),

    -- Stock
    quantity_in_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,  -- Alert when stock falls below this

    -- Pricing (store-specific, can differ from MRP)
    selling_price DECIMAL(10, 2),
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,

    -- Expiry tracking
    batch_number VARCHAR(50),
    expiry_date DATE,

    -- Status
    is_available BOOLEAN DEFAULT true,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(store_id, medicine_id, batch_number)
);

CREATE INDEX idx_inventory_store ON store_inventory(store_id);
CREATE INDEX idx_inventory_expiry ON store_inventory(expiry_date);
CREATE INDEX idx_inventory_low_stock ON store_inventory(store_id, quantity_in_stock) WHERE quantity_in_stock <= 10;

-- ============================================
-- 6. PRESCRIPTIONS
-- ============================================
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id),  -- Which store it was uploaded to

    -- Original image
    image_url TEXT NOT NULL,

    -- OCR extracted data
    doctor_name VARCHAR(200),
    hospital_name VARCHAR(200),
    prescription_date DATE,
    diagnosis TEXT,

    -- OCR confidence
    ocr_status VARCHAR(20) DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'verified')),
    ocr_confidence DECIMAL(5, 2),  -- Overall confidence score 0-100
    ocr_raw_text TEXT,

    -- Verification
    verified_by UUID REFERENCES stores(id),  -- Store owner who verified
    verified_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_store ON prescriptions(store_id);

-- ============================================
-- 7. PRESCRIPTION ITEMS (Individual medicines in a prescription)
-- ============================================
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),  -- Matched from drug DB

    -- Extracted from prescription
    medicine_name_raw VARCHAR(300),    -- Raw OCR text
    dosage VARCHAR(100),              -- e.g., "500mg"
    frequency VARCHAR(100),           -- e.g., "1-0-1" or "twice daily"
    duration_days INTEGER,            -- How many days
    quantity INTEGER,                 -- Total quantity prescribed
    instructions TEXT,                -- e.g., "after food"

    -- Refill calculation
    start_date DATE,
    estimated_end_date DATE,          -- Calculated: start_date + duration_days
    next_refill_date DATE,            -- When patient should reorder (few days before end)

    -- Status
    is_active BOOLEAN DEFAULT true,   -- Still being taken
    is_chronic BOOLEAN DEFAULT false,  -- Ongoing medication

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prescription_items_rx ON prescription_items(prescription_id);
CREATE INDEX idx_prescription_items_refill ON prescription_items(next_refill_date) WHERE is_active = true;
CREATE INDEX idx_prescription_items_medicine ON prescription_items(medicine_id);

-- ============================================
-- 8. ORDERS
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,  -- Human-readable: RX-2026-00001
    store_id UUID NOT NULL REFERENCES stores(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    prescription_id UUID REFERENCES prescriptions(id),

    -- Order type
    order_type VARCHAR(20) DEFAULT 'regular' CHECK (order_type IN ('regular', 'refill', 'prescription')),

    -- Amounts
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    delivery_charge DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    -- Delivery
    delivery_type VARCHAR(20) DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'pickup')),
    delivery_address TEXT,
    delivery_notes TEXT,
    estimated_delivery_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,

    -- Status tracking
    status VARCHAR(30) DEFAULT 'placed' CHECK (status IN (
        'placed', 'confirmed', 'preparing', 'ready',
        'out_for_delivery', 'delivered', 'picked_up',
        'cancelled', 'rejected'
    )),

    -- Payment
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cod', 'failed', 'refunded')),
    payment_method VARCHAR(30),
    payment_id VARCHAR(100),

    -- Timestamps
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_patient ON orders(patient_id);
CREATE INDEX idx_orders_status ON orders(store_id, status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- 9. ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    prescription_item_id UUID REFERENCES prescription_items(id),

    medicine_name VARCHAR(300) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    total_price DECIMAL(10, 2) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- 10. REFILL REMINDERS (The Nudging System)
-- ============================================
CREATE TABLE refill_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    prescription_item_id UUID NOT NULL REFERENCES prescription_items(id),

    -- Medicine info (denormalized for quick access)
    medicine_name VARCHAR(300) NOT NULL,

    -- Timing
    refill_due_date DATE NOT NULL,

    -- Escalation tracking
    escalation_level INTEGER DEFAULT 0,
    -- 0 = not yet sent
    -- 1 = first reminder sent (3 days before due)
    -- 2 = follow-up sent (48hrs after first, no response)
    -- 3 = urgent reminder (5 days overdue)
    -- 4 = store owner alerted for personal outreach
    -- 5 = lapsed (30+ days, gentle check-in)

    -- Channel tracking
    push_sent_at TIMESTAMP WITH TIME ZONE,
    whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
    sms_sent_at TIMESTAMP WITH TIME ZONE,
    store_notified_at TIMESTAMP WITH TIME ZONE,

    -- Response
    patient_response VARCHAR(30) CHECK (patient_response IN (
        'ordered', 'snoozed', 'skipped', 'no_response', 'stopped_medication'
    )),
    responded_at TIMESTAMP WITH TIME ZONE,
    resulting_order_id UUID REFERENCES orders(id),

    -- Revenue impact
    estimated_order_value DECIMAL(10, 2),

    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'responded', 'expired', 'cancelled')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reminders_due ON refill_reminders(refill_due_date) WHERE status = 'scheduled';
CREATE INDEX idx_reminders_store ON refill_reminders(store_id, status);
CREATE INDEX idx_reminders_patient ON refill_reminders(patient_id, status);
CREATE INDEX idx_reminders_escalation ON refill_reminders(escalation_level, status);

-- ============================================
-- 11. NOTIFICATIONS LOG
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_type VARCHAR(10) NOT NULL CHECK (recipient_type IN ('patient', 'store')),
    recipient_id UUID NOT NULL,

    -- Content
    title VARCHAR(300) NOT NULL,
    body TEXT NOT NULL,

    -- Channel
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('push', 'whatsapp', 'sms', 'in_app', 'email')),

    -- Reference
    reference_type VARCHAR(30),  -- 'refill_reminder', 'order_update', 'low_stock', etc.
    reference_id UUID,

    -- Delivery tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- WhatsApp specific
    whatsapp_message_id VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status, created_at);

-- ============================================
-- 12. STORE ANALYTICS (Daily Aggregates)
-- ============================================
CREATE TABLE store_daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id),
    date DATE NOT NULL,

    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0.00,
    refill_orders INTEGER DEFAULT 0,
    new_patients INTEGER DEFAULT 0,
    active_patients INTEGER DEFAULT 0,

    -- Nudge effectiveness
    reminders_sent INTEGER DEFAULT 0,
    reminders_converted INTEGER DEFAULT 0,
    revenue_recovered DECIMAL(12, 2) DEFAULT 0.00,

    -- Inventory
    low_stock_items INTEGER DEFAULT 0,
    expiring_items INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(store_id, date)
);

CREATE INDEX idx_daily_stats_store_date ON store_daily_stats(store_id, date DESC);

-- ============================================
-- 13. OTP VERIFICATION
-- ============================================
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) DEFAULT 'login' CHECK (purpose IN ('login', 'signup', 'reset')),
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_codes(phone, is_used, expires_at);

-- ============================================
-- SEED DATA: Sample Medicines
-- ============================================
INSERT INTO medicines (name, generic_name, manufacturer, category, strength, pack_size, mrp, is_prescription_required, is_chronic) VALUES
('Metformin 500mg', 'Metformin Hydrochloride', 'USV Limited', 'tablet', '500mg', 60, 85.00, true, true),
('Amlodipine 5mg', 'Amlodipine Besylate', 'Cipla', 'tablet', '5mg', 30, 45.00, true, true),
('Atorvastatin 10mg', 'Atorvastatin Calcium', 'Sun Pharma', 'tablet', '10mg', 30, 120.00, true, true),
('Thyronorm 50mcg', 'Levothyroxine Sodium', 'Abbott', 'tablet', '50mcg', 120, 135.00, true, true),
('Telmisartan 40mg', 'Telmisartan', 'Glenmark', 'tablet', '40mg', 30, 95.00, true, true),
('Pantoprazole 40mg', 'Pantoprazole Sodium', 'Alkem', 'tablet', '40mg', 15, 65.00, true, false),
('Azithromycin 500mg', 'Azithromycin', 'Cipla', 'tablet', '500mg', 3, 75.00, true, false),
('Paracetamol 500mg', 'Paracetamol', 'GSK', 'tablet', '500mg', 10, 15.00, false, false),
('Cetirizine 10mg', 'Cetirizine Hydrochloride', 'Mankind', 'tablet', '10mg', 10, 25.00, false, false),
('Amoxicillin 500mg', 'Amoxicillin Trihydrate', 'Cipla', 'capsule', '500mg', 10, 55.00, true, false),
('Glimepiride 2mg', 'Glimepiride', 'Sanofi', 'tablet', '2mg', 30, 95.00, true, true),
('Losartan 50mg', 'Losartan Potassium', 'Torrent', 'tablet', '50mg', 30, 80.00, true, true),
('Montelukast 10mg', 'Montelukast Sodium', 'Sun Pharma', 'tablet', '10mg', 15, 140.00, true, true),
('Rosuvastatin 10mg', 'Rosuvastatin Calcium', 'Cadila', 'tablet', '10mg', 30, 150.00, true, true),
('Insulin Glargine', 'Insulin Glargine', 'Sanofi', 'injection', '100IU/ml', 1, 850.00, true, true),
('Dolo 650', 'Paracetamol', 'Micro Labs', 'tablet', '650mg', 15, 30.00, false, false),
('Crocin Advance', 'Paracetamol', 'GSK', 'tablet', '500mg', 20, 35.00, false, false),
('ORS Sachets', 'Oral Rehydration Salt', 'WHO Standard', 'sachet', '21.8g', 10, 40.00, false, false),
('Vitamin D3 60K', 'Cholecalciferol', 'Abbott', 'capsule', '60000IU', 4, 120.00, false, false),
('B-Complex Forte', 'Vitamin B Complex', 'Abbott', 'tablet', '-', 30, 35.00, false, false);
