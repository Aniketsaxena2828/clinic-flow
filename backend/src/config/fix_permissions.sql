-- ==============================================================================
-- ClinicFlow SaaS: Supabase Table Grants & Permissions Fix
-- Run this in Supabase Dashboard -> SQL Editor
-- Resolves: "permission denied for table clinics"
-- ==============================================================================

-- 1. Grant schema access
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant table privileges on all 14 tables to service_role (backend server operations)
GRANT ALL ON TABLE
    clinics,
    roles,
    users,
    departments,
    doctors,
    patients,
    appointments,
    prescriptions,
    bills,
    lab_orders,
    pharmacy_items,
    staff,
    notifications,
    audit_logs
TO service_role;

-- 3. Grant table privileges to authenticated users and anon (enforced by RLS)
GRANT ALL ON TABLE
    clinics,
    roles,
    users,
    departments,
    doctors,
    patients,
    appointments,
    prescriptions,
    bills,
    lab_orders,
    pharmacy_items,
    staff,
    notifications,
    audit_logs
TO authenticated;

GRANT SELECT ON TABLE clinics, roles TO anon;
GRANT SELECT, INSERT ON TABLE users TO anon;

-- 4. Grant sequence and routine permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 5. Set default privileges for all future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 6. Ensure Clinics table policies are complete
DROP POLICY IF EXISTS service_role_all_clinics ON clinics;
CREATE POLICY service_role_all_clinics ON clinics FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_read_clinics ON clinics;
CREATE POLICY anon_read_clinics ON clinics FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS authenticated_read_clinics ON clinics;
CREATE POLICY authenticated_read_clinics ON clinics FOR SELECT TO authenticated USING (true);
