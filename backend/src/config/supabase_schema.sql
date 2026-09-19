-- ==============================================================================
-- ClinicFlow SaaS Database Migration: Supabase PostgreSQL Schema
-- Includes: 14 Multi-Tenant Tables, Foreign Keys, Indexes, RLS Policies & Triggers
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically manage updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 1. CLINICS TABLE (Tenants)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS clinics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address JSONB DEFAULT '{"country": "India"}'::jsonb,
    gst_number TEXT,
    logo_url TEXT,
    working_hours JSONB DEFAULT '{"open": "09:00", "close": "19:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}'::jsonb,
    subscription_tier TEXT NOT NULL DEFAULT 'free_trial',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinics_code ON clinics(code);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status);

-- ==============================================================================
-- 2. ROLES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_clinic_name ON roles(COALESCE(clinic_id, 'SYSTEM_TEMPLATE'), name);
CREATE INDEX IF NOT EXISTS idx_roles_clinic_id ON roles(clinic_id);

-- ==============================================================================
-- 3. USERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    role_name TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    refresh_token TEXT,
    avatar_url TEXT,
    auth_provider TEXT NOT NULL DEFAULT 'email',
    google_id TEXT,
    otp_code TEXT,
    otp_expires_at TIMESTAMPTZ,
    otp_last_requested_at TIMESTAMPTZ,
    otp_attempts INT NOT NULL DEFAULT 0,
    reset_token TEXT,
    reset_token_expires_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_clinic_email UNIQUE (clinic_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- ==============================================================================
-- 4. DEPARTMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    head_doctor_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_departments_clinic_name UNIQUE (clinic_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_clinic_id ON departments(clinic_id);

-- ==============================================================================
-- 5. DOCTORS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
    department_name TEXT DEFAULT 'General Medicine',
    specialization TEXT NOT NULL,
    experience_years INT NOT NULL DEFAULT 5,
    consultation_fee NUMERIC NOT NULL DEFAULT 50,
    available_days JSONB NOT NULL DEFAULT '["Mon", "Tue", "Wed", "Thu", "Fri"]'::jsonb,
    slot_duration_minutes INT NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_doctors_clinic_email UNIQUE (clinic_id, email)
);

CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);

-- ==============================================================================
-- 6. PATIENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    gender TEXT NOT NULL,
    age INT,
    date_of_birth TIMESTAMPTZ,
    blood_group TEXT,
    address JSONB,
    emergency_contact JSONB,
    medical_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
    documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_patients_clinic_patient_id UNIQUE (clinic_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(clinic_id, phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(clinic_id, name);

-- ==============================================================================
-- 7. APPOINTMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    doctor_specialization TEXT DEFAULT 'General Medicine',
    token_number INT NOT NULL,
    date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'In-person',
    status TEXT NOT NULL DEFAULT 'Scheduled',
    reason_for_visit TEXT,
    notes TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    booked_at TIMESTAMPTZ,
    checked_in_at TIMESTAMPTZ,
    consultation_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_appointments_clinic_appointment_id UNIQUE (clinic_id, appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(clinic_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(clinic_id, doctor_id, date);

-- ==============================================================================
-- MIGRATION: Add lifecycle timestamp columns to existing appointments tables
-- Safe to re-run: ALTER TABLE ... ADD COLUMN IF NOT EXISTS is idempotent
-- ==============================================================================
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_started_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- ==============================================================================
-- 8. PRESCRIPTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    doctor_specialization TEXT,
    diagnosis TEXT NOT NULL,
    symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    vitals JSONB DEFAULT '{}'::jsonb,
    medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
    advice TEXT,
    follow_up_date TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(clinic_id, patient_id);

-- ==============================================================================
-- 9. BILLS (INVOICES) TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    doctor_id TEXT,
    doctor_name TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    gst_rate NUMERIC NOT NULL DEFAULT 0,
    gst_amount NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    balance_due NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'Pending',
    payments JSONB NOT NULL DEFAULT '[]'::jsonb,
    due_date TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bills_clinic_invoice UNIQUE (clinic_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_bills_clinic_id ON bills(clinic_id);
CREATE INDEX IF NOT EXISTS idx_bills_invoice_num ON bills(invoice_number);
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON bills(clinic_id, payment_status);

-- ==============================================================================
-- 10. LAB ORDERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS lab_orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    doctor_id TEXT,
    doctor_name TEXT,
    test_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General Pathology',
    price NUMERIC NOT NULL DEFAULT 0,
    sample_collected_at TEXT,
    report_url TEXT,
    status TEXT NOT NULL DEFAULT 'Ordered',
    results JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_lab_orders_clinic_order UNIQUE (clinic_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_clinic_id ON lab_orders(clinic_id);

-- ==============================================================================
-- 11. PHARMACY ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS pharmacy_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General Medicine',
    unit TEXT NOT NULL DEFAULT 'Strip',
    batch_number TEXT NOT NULL,
    mfg_date TEXT,
    expiry_date TEXT NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 20,
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    mrp NUMERIC,
    supplier TEXT,
    supplier_contact TEXT,
    status TEXT NOT NULL DEFAULT 'In Stock',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_clinic_id ON pharmacy_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_status ON pharmacy_items(clinic_id, status);

-- ==============================================================================
-- 12. STAFF TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    role_name TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'General Medicine',
    designation TEXT NOT NULL DEFAULT 'Medical Officer',
    status TEXT NOT NULL DEFAULT 'Active',
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_clinic_id ON staff(clinic_id);

-- ==============================================================================
-- 13. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id TEXT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_clinic_id ON notifications(clinic_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(clinic_id, user_id);

-- ==============================================================================
-- 14. AUDIT LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id TEXT,
    user_email TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_id ON audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(clinic_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(clinic_id, resource);

-- ==============================================================================
-- ATTACH UPDATED_AT TRIGGERS TO TABLES
-- ==============================================================================
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
            'clinics', 'roles', 'users', 'departments', 'doctors', 'patients',
            'appointments', 'prescriptions', 'bills', 'lab_orders', 'pharmacy_items',
            'staff', 'notifications'
          )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_timestamp_%I ON %I;', tbl, tbl);
        EXECUTE format('CREATE TRIGGER trg_update_timestamp_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all 14 tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow Supabase Service Role (backend server) full administrative bypass access
CREATE POLICY service_role_all_clinics ON clinics FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_roles ON roles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_users ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_departments ON departments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_doctors ON doctors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_patients ON patients FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_appointments ON appointments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_prescriptions ON prescriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_bills ON bills FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_lab_orders ON lab_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_pharmacy_items ON pharmacy_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_staff ON staff FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_notifications ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_audit_logs ON audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tenant Isolation Policies based on PostgreSQL session setting app.current_clinic_id or JWT claims
CREATE POLICY tenant_isolation_roles ON roles FOR ALL USING (
    is_system = true OR clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_users ON users FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_departments ON departments FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_doctors ON doctors FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_patients ON patients FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_appointments ON appointments FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_prescriptions ON prescriptions FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_bills ON bills FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_lab_orders ON lab_orders FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_pharmacy_items ON pharmacy_items FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_staff ON staff FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_notifications ON notifications FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

CREATE POLICY tenant_isolation_audit_logs ON audit_logs FOR ALL USING (
    clinic_id = COALESCE(
        NULLIF(current_setting('app.current_clinic_id', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'clinic_id')
    )
);

-- ==============================================================================
-- TABLE PRIVILEGES (GRANTS)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- Allow anon and authenticated to read clinics for code lookup & tenant verification
CREATE POLICY anon_read_clinics ON clinics FOR SELECT TO anon USING (true);
CREATE POLICY authenticated_read_clinics ON clinics FOR SELECT TO authenticated USING (true);

