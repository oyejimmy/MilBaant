-- ============================================================
-- COMPLETE DATABASE RESET - MilBaant
-- ⚠️ WARNING: This will DELETE ALL DATA and recreate the schema!
-- ============================================================
-- 
-- This script combines:
--   1. Delete all existing data (01_delete_all_data.sql)
--   2. Recreate complete schema (02_complete_schema.sql)
--
-- Use this when you want to start fresh with a clean database.
-- ============================================================

\echo '⚠️  WARNING: This will permanently delete ALL data!'
\echo '⚠️  Press Ctrl+C now to cancel, or wait 5 seconds to continue...'
\echo ''

-- Uncomment the next line if running in psql to add a delay
-- SELECT pg_sleep(5);

\echo '🗑️  Step 1/2: Deleting all existing data...'
\echo ''

-- ============================================================
-- STEP 1: DELETE ALL DATA
-- ============================================================

-- Drop all RLS policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Drop all storage policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'storage' AND tablename = 'objects') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
END $$;

-- Delete all storage objects
DELETE FROM storage.objects WHERE bucket_id IN ('bill-images', 'payment-screenshots', 'avatars');

-- Delete storage buckets
DELETE FROM storage.buckets WHERE id IN ('bill-images', 'payment-screenshots', 'avatars');

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.can_current_user_add_expenses() CASCADE;

-- Drop all tables
DROP TABLE IF EXISTS public.contribution_payments CASCADE;
DROP TABLE IF EXISTS public.flat_fund_expenses CASCADE;
DROP TABLE IF EXISTS public.flat_fund_allocations CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.daily_menu CASCADE;
DROP TABLE IF EXISTS public.cook_purchases CASCADE;
DROP TABLE IF EXISTS public.cook_advances CASCADE;
DROP TABLE IF EXISTS public.ride_riders CASCADE;
DROP TABLE IF EXISTS public.rides CASCADE;
DROP TABLE IF EXISTS public.debt_settlements CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.expense_participants CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.bed_assignments CASCADE;
DROP TABLE IF EXISTS public.beds CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Optional: Delete all auth users (commented out for safety)
-- Uncomment the next line if you want to delete all user accounts
-- DELETE FROM auth.users;

\echo '✅ All data deleted!'
\echo ''
\echo '🏗️  Step 2/2: Creating fresh schema...'
\echo ''

-- ============================================================
-- STEP 2: CREATE COMPLETE SCHEMA
-- ============================================================

-- Run the complete schema creation
\i 02_complete_schema.sql

\echo ''
\echo '✅ Database reset complete!'
\echo '🎉 Your database is now fresh and ready to use!'
\echo ''
\echo '📝 Next steps:'
\echo '   1. Create your first user (will become admin automatically)'
\echo '   2. Start using the application'
