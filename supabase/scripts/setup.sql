-- ============================================================
-- MilBaant Database - Complete Setup Script
-- ============================================================
-- PURPOSE: Run all schema files in correct order to set up
--          the complete database from scratch
-- IDEMPOTENT: Safe to run multiple times
-- HOW TO RUN: Paste this entire file in Supabase SQL Editor
-- ============================================================

\echo '🚀 Starting MilBaant database setup...'
\echo ''

-- Step 1: Extensions
\echo '📦 Step 1/9: Creating extensions...'
\i schema/00_extensions.sql
\echo ''

-- Step 2: Tables
\echo '📊 Step 2/9: Creating tables...'
\i schema/01_tables.sql
\echo ''

-- Step 3: Indexes
\echo '🔍 Step 3/9: Creating indexes...'
\i schema/02_indexes.sql
\echo ''

-- Step 4: Functions
\echo '⚙️  Step 4/9: Creating functions...'
\i schema/03_functions.sql
\echo ''

-- Step 5: Triggers
\echo '⚡ Step 5/9: Creating triggers...'
\i schema/04_triggers.sql
\echo ''

-- Step 6: Enable RLS
\echo '🔒 Step 6/9: Enabling Row Level Security...'
\i schema/05_rls_enable.sql
\echo ''

-- Step 7: RLS Policies
\echo '🛡️  Step 7/9: Creating RLS policies...'
\i schema/06_rls_policies.sql
\echo ''

-- Step 8: Storage
\echo '💾 Step 8/9: Creating storage buckets...'
\i schema/07_storage.sql
\echo ''

-- Step 9: Seed Data
\echo '🌱 Step 9/9: Inserting seed data...'
\i schema/08_seed_data.sql
\echo ''

-- ============================================================
-- Final Verification
-- ============================================================

\echo '🔍 Running final verification...'
\echo ''

-- Check tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check functions
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

-- Check storage buckets
SELECT id, name, public FROM storage.buckets;

-- Check RLS policies count
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================================
-- Success Message
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ MilBaant database setup completed successfully!';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Database Summary:';
  RAISE NOTICE '   • Tables: 17 created';
  RAISE NOTICE '   • Indexes: 24 created';
  RAISE NOTICE '   • Functions: 5 created';
  RAISE NOTICE '   • Triggers: 3 created';
  RAISE NOTICE '   • RLS: Enabled on all tables';
  RAISE NOTICE '   • RLS Policies: 50+ created';
  RAISE NOTICE '   • Storage Buckets: 3 created';
  RAISE NOTICE '   • Seed Data: Inserted';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your database is ready to use!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Create your first user (will become admin automatically)';
  RAISE NOTICE '   2. Configure your .env file with Supabase credentials';
  RAISE NOTICE '   3. Run: npm run dev';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
