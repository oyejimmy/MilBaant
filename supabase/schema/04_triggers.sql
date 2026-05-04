-- ============================================================
-- MilBaant Database Schema - Triggers
-- ============================================================
-- PURPOSE: Define database triggers
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ── User Management Triggers ─────────────────────────────────────────────────

-- Trigger on new auth.users row — creates a matching profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Auto-Update Timestamp Triggers ───────────────────────────────────────────

-- Trigger to auto-update updated_at on cook_requests
DROP TRIGGER IF EXISTS cook_requests_set_updated_at ON public.cook_requests;
CREATE TRIGGER cook_requests_set_updated_at
  BEFORE UPDATE ON public.cook_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger to auto-update updated_at on daily_menu
DROP TRIGGER IF EXISTS daily_menu_set_updated_at ON public.daily_menu;
CREATE TRIGGER daily_menu_set_updated_at
  BEFORE UPDATE ON public.daily_menu
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers created successfully';
  RAISE NOTICE '📊 Total triggers: 3';
END $$;
