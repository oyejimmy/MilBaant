-- ============================================================
-- MilBaant — Delete All Data Script
-- ⚠️  DESTRUCTIVE — NEVER RUN IN PRODUCTION ⚠️
-- ============================================================
-- PURPOSE: Wipes ALL rows from every table and clears auth users.
--          Schema, functions, triggers, and buckets are preserved.
--
-- USE CASE: Reset to a clean slate for fresh demo/test data
--           without needing to rebuild the entire schema.
--
-- WHAT THIS CLEARS:
--   - All rows in all 19 public tables (CASCADE order)
--   - All files in storage buckets (bill-images, payment-screenshots, avatars)
--   - All auth.users (via auth.users delete — cascades to profiles)
--
-- WHAT THIS KEEPS:
--   - All tables, columns, constraints, indexes
--   - All functions, triggers, RLS policies
--   - Storage buckets themselves (just empties them)
--
-- ⚠️  WARNING: Permanent. No undo. Backup first if needed.
-- ============================================================

-- ── 1. Truncate All App Tables ────────────────────────────────────────────────
-- NOTE: Storage files (bill-images, payment-screenshots, avatars) must be
-- cleared separately via the Supabase Dashboard → Storage, or via the JS
-- Storage API. Direct SQL deletion is blocked by Supabase's storage guard.
-- Order: child tables first, then parents. RESTART IDENTITY resets sequences.
-- CASCADE handles any FK references not covered by the explicit order.

TRUNCATE TABLE
  public.cook_requests,
  public.contribution_payments,
  public.flat_fund_expenses,
  public.flat_fund_allocations,
  public.activity_logs,
  public.daily_menu,
  public.cook_purchases,
  public.cook_advances,
  public.ride_riders,
  public.rides,
  public.debt_settlements,
  public.settings,
  public.announcements,
  public.expense_participants,
  public.expenses,
  public.bed_assignments,
  public.beds,
  public.rooms,
  public.profiles
RESTART IDENTITY CASCADE;

-- ── 2. Delete All Auth Users ──────────────────────────────────────────────────
-- Deleting from auth.users cascades to profiles via the FK + trigger.
-- This removes all Supabase Auth accounts so you can re-register from scratch.

DELETE FROM auth.users;

-- ── Confirmation ──────────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '✅  MilBaant data wipe complete.';
  RAISE NOTICE '   Cleared: all rows in 19 public tables';
  RAISE NOTICE '   Cleared: all auth.users';
  RAISE NOTICE '';
  RAISE NOTICE '   Schema, functions, triggers, and RLS policies are intact.';
  RAISE NOTICE '   Storage files must be cleared via Supabase Dashboard → Storage.';
  RAISE NOTICE '   You can now register fresh users and seed new data.';
END $$;
