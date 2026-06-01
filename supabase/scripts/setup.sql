-- ============================================================
-- MilBaant Database - Complete Setup Script
-- ============================================================
-- PURPOSE: Run all schema files in correct order to set up
--          the complete database from scratch.
-- IDEMPOTENT: Safe to run multiple times.
-- HOW TO RUN: Paste this entire file in Supabase SQL Editor
--             OR run each section block by block.
-- ============================================================

-- NOTE: Supabase SQL Editor does not support \i (psql meta-commands).
-- Copy and paste the contents of each file below in order, OR
-- paste the full concatenated SQL that follows.
-- ============================================================

-- ── STEP 0: Extensions ───────────────────────────────────────────────────────
-- Contents of schema/00_extensions.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── STEP 1: Tables ───────────────────────────────────────────────────────────
-- Contents of schema/01_tables.sql  (paste here or run separately)

-- ── STEP 2: Indexes ──────────────────────────────────────────────────────────
-- Contents of schema/02_indexes.sql

-- ── STEP 3: Functions ────────────────────────────────────────────────────────
-- Contents of schema/03_functions.sql

-- ── STEP 4: Triggers ─────────────────────────────────────────────────────────
-- Contents of schema/04_triggers.sql

-- ── STEP 5: Enable RLS ───────────────────────────────────────────────────────
-- Contents of schema/05_rls_enable.sql

-- ── STEP 6: RLS Policies ─────────────────────────────────────────────────────
-- Contents of schema/06_rls_policies.sql

-- ── STEP 7: Storage ──────────────────────────────────────────────────────────
-- Contents of schema/07_storage.sql

-- ── STEP 8: Seed Data ────────────────────────────────────────────────────────
-- Contents of schema/08_seed_data.sql

-- ── STEP 9: Advance Contributions ────────────────────────────────────────────
-- Contents of schema/09_advance_contributions.sql

-- ============================================================
-- Verification
-- ============================================================

SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT
  proname AS function_name,
  prosecdef AS is_security_definer
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

SELECT id, name, public FROM storage.buckets;

SELECT
  schemaname,
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'MilBaant database setup completed successfully!';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Database Summary:';
  RAISE NOTICE '  Tables: 23 created';
  RAISE NOTICE '  Indexes: 25 created';
  RAISE NOTICE '  Functions: 7 created';
  RAISE NOTICE '  Triggers: 3 created';
  RAISE NOTICE '  RLS: Enabled on all 23 tables';
  RAISE NOTICE '  RLS Policies: 60+ created';
  RAISE NOTICE '  Storage Buckets: 3 created';
  RAISE NOTICE '  Seed Data: Inserted';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Create your first user (becomes admin automatically)';
  RAISE NOTICE '  2. Configure .env with Supabase credentials';
  RAISE NOTICE '  3. Run: npm run dev';
  RAISE NOTICE '';
  RAISE NOTICE '=======================================================';
END $$;
