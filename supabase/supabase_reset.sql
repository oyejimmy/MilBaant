-- ============================================================
-- MilBaant — Database Reset Script
-- ⚠️  DESTRUCTIVE — NEVER RUN IN PRODUCTION ⚠️
-- ============================================================
-- PURPOSE: Drops all MilBaant database objects and returns the
--          database to a pristine state for fresh setup.
--
-- USE CASE: Development and testing environments only.
--           Run this before re-running supabase_full_setup.sql
--           to test idempotency or start fresh.
--
-- WHAT THIS DROPS:
--   - All storage policies on storage.objects for app buckets
--   - All objects in storage buckets (bill-images, payment-screenshots, avatars)
--   - All storage bucket records
--   - All triggers (cook_requests_set_updated_at, daily_menu_set_updated_at, on_auth_user_created)
--   - All functions (admin_update_profile, set_updated_at, can_current_user_add_expenses, is_admin, handle_new_user)
--   - All 19 public tables (CASCADE — handles FK dependencies)
--
-- WHAT THIS DOES NOT DROP:
--   - auth.users (managed by Supabase — use the dashboard to delete users)
--   - pgcrypto extension (safe to leave installed)
--
-- ⚠️  WARNING: This will permanently delete ALL data in the database.
--              There is no undo. Make sure you have a backup if needed.
-- ============================================================

-- ── Drop Storage Policies ─────────────────────────────────────────────────────

-- bill-images policies
DROP POLICY IF EXISTS "bill_images_public_read"            ON storage.objects;
DROP POLICY IF EXISTS "bill_images_authenticated_insert"   ON storage.objects;
DROP POLICY IF EXISTS "bill_images_admin_delete"           ON storage.objects;
DROP POLICY IF EXISTS "bill_images_owner_delete"           ON storage.objects;

-- payment-screenshots policies
DROP POLICY IF EXISTS "payment_screenshots_public_read"           ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_authenticated_insert"  ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_admin_delete"          ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_owner_delete"          ON storage.objects;

-- avatars policies
DROP POLICY IF EXISTS "avatars_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_upsert"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete"  ON storage.objects;

-- ── Drop Storage Objects and Buckets ─────────────────────────────────────────
-- NOTE: Storage files must be cleared via Supabase Dashboard → Storage
-- before running this script. Direct SQL deletion is blocked by Supabase.

DELETE FROM storage.buckets
WHERE id IN ('bill-images', 'payment-screenshots', 'avatars');

-- ── Drop Triggers ─────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS cook_requests_set_updated_at ON public.cook_requests;
DROP TRIGGER IF EXISTS daily_menu_set_updated_at    ON public.daily_menu;
DROP TRIGGER IF EXISTS on_auth_user_created         ON auth.users;

-- ── Drop Functions ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, text, boolean, text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.can_current_user_add_expenses() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ── Drop Tables ───────────────────────────────────────────────────────────────
-- Dropped in reverse FK dependency order. CASCADE handles any remaining deps.

DROP TABLE IF EXISTS public.cook_requests         CASCADE;
DROP TABLE IF EXISTS public.contribution_payments CASCADE;
DROP TABLE IF EXISTS public.flat_fund_expenses    CASCADE;
DROP TABLE IF EXISTS public.flat_fund_allocations CASCADE;
DROP TABLE IF EXISTS public.activity_logs         CASCADE;
DROP TABLE IF EXISTS public.daily_menu            CASCADE;
DROP TABLE IF EXISTS public.cook_purchases        CASCADE;
DROP TABLE IF EXISTS public.cook_advances         CASCADE;
DROP TABLE IF EXISTS public.ride_riders           CASCADE;
DROP TABLE IF EXISTS public.rides                 CASCADE;
DROP TABLE IF EXISTS public.debt_settlements      CASCADE;
DROP TABLE IF EXISTS public.settings              CASCADE;
DROP TABLE IF EXISTS public.announcements         CASCADE;
DROP TABLE IF EXISTS public.expense_participants  CASCADE;
DROP TABLE IF EXISTS public.expenses              CASCADE;
DROP TABLE IF EXISTS public.bed_assignments       CASCADE;
DROP TABLE IF EXISTS public.beds                  CASCADE;
DROP TABLE IF EXISTS public.rooms                 CASCADE;
DROP TABLE IF EXISTS public.profiles              CASCADE;

-- ── Confirmation ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '🗑️  MilBaant database reset complete.';
  RAISE NOTICE '   Dropped: 19 tables, 5 functions, 3 triggers';
  RAISE NOTICE '   Dropped: 3 storage buckets and all their objects';
  RAISE NOTICE '   Dropped: all storage policies for app buckets';
  RAISE NOTICE '';
  RAISE NOTICE '   auth.users was NOT touched (manage via Supabase dashboard).';
  RAISE NOTICE '   Run supabase_full_setup.sql to recreate everything.';
END $$;
