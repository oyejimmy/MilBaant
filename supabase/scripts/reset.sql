-- ============================================================
-- MilBaant Database - Reset Script
-- ============================================================
-- ⚠️  WARNING: THIS WILL DELETE ALL DATA IN YOUR DATABASE! ⚠️
-- 
-- PURPOSE: Drop all tables, functions, and storage buckets
--          to reset the database to a clean state
-- 
-- USE CASE: Development/testing only - DO NOT run in production
-- 
-- HOW TO RUN: Paste this entire file in Supabase SQL Editor
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ═══════════════════════════════════════════════════════';
  RAISE NOTICE '⚠️  WARNING: DATABASE RESET IN PROGRESS';
  RAISE NOTICE '⚠️  ALL DATA WILL BE PERMANENTLY DELETED!';
  RAISE NOTICE '⚠️  ═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ── Drop Storage Policies ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "bill_images_public_read"                ON storage.objects;
DROP POLICY IF EXISTS "bill_images_authenticated_insert"       ON storage.objects;
DROP POLICY IF EXISTS "bill_images_admin_delete"               ON storage.objects;
DROP POLICY IF EXISTS "bill_images_owner_delete"               ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_public_read"        ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_admin_delete"       ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_owner_delete"       ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_read"                    ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_upsert"                   ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update"                   ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete"                   ON storage.objects;

-- ── Drop Storage Buckets ─────────────────────────────────────────────────────

-- NOTE: Direct deletion from `storage.buckets` is blocked by Supabase
-- (storage.protect_delete()) to prevent accidental data loss. Use the
-- Storage API, the Supabase CLI, or the Dashboard to remove buckets.
--
-- Recommended options:
-- 1) Supabase Dashboard: open the project → Storage → select bucket → Delete
--
-- 2) HTTP API (example using the service role key):
--    Replace <PROJECT_URL> and set the service role key in the environment.
--
--    curl -X DELETE \
--      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
--      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
--      "https://<PROJECT_REF>.supabase.co/storage/v1/bucket/bill-images"
--
--    Repeat for 'payment-screenshots' and 'avatars'.
--
-- 3) Supabase CLI (if installed): use the CLI or Storage commands to remove
--    buckets (UI/CLI varies by version). After deleting buckets externally,
--    re-run this reset script to continue dropping tables and policies.

-- If you prefer to skip bucket deletion inside this script, leave as-is and
-- continue; the rest of the reset will run after buckets are removed.

-- ── Drop All RLS Policies ────────────────────────────────────────────────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ── Drop Triggers ────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS cook_requests_set_updated_at ON public.cook_requests;
DROP TRIGGER IF EXISTS daily_menu_set_updated_at ON public.daily_menu;

-- ── Drop Functions ───────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_cook() CASCADE;
DROP FUNCTION IF EXISTS public.can_current_user_add_expenses() CASCADE;
DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, text, boolean, text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- ── Drop Tables ──────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.contribution_payments CASCADE;
DROP TABLE IF EXISTS public.flat_fund_expenses CASCADE;
DROP TABLE IF EXISTS public.flat_fund_allocations CASCADE;
DROP TABLE IF EXISTS public.daily_menu CASCADE;
DROP TABLE IF EXISTS public.cook_requests CASCADE;
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

-- ============================================================
-- Success Message
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Database reset completed successfully!';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  All data has been deleted:';
  RAISE NOTICE '   • All tables dropped';
  RAISE NOTICE '   • All functions dropped';
  RAISE NOTICE '   • All triggers dropped';
  RAISE NOTICE '   • All RLS policies dropped';
  RAISE NOTICE '   • All storage buckets deleted';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Run setup.sql to recreate the database';
  RAISE NOTICE '   2. Or run individual schema files in order';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
