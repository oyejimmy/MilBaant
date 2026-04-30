-- ============================================================
-- MilBaant — Comprehensive CORS / RLS Fix
-- Safe to run multiple times (all statements are idempotent).
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. profiles — fix admin self-update policy gap
--
--    Problem: profiles_self_update has USING (auth.uid() = id AND NOT is_admin())
--    so when an admin updates their OWN profile, neither policy matches → 403/CORS.
--    Fix: drop the NOT is_admin() restriction from profiles_self_update so it
--    covers all users (admins already have profiles_admin_update for full access,
--    but having both permissive policies is fine — Supabase ORs them).
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING     (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- 2. daily_menu — allow any authenticated user to update notes
--
--    Problem: old policy only allowed creator or admin → 403 for regular users.
--    The migration 20260430_daily_menu_fix.sql may already have run, so we use
--    DROP IF EXISTS guards before every CREATE to avoid "already exists" errors.
-- ────────────────────────────────────────────────────────────

-- Remove all old daily_menu update policies (covers both old and new names)
DROP POLICY IF EXISTS "daily_menu_update_authenticated"    ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_creator_or_admin" ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_cook"             ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_notes_any_user"   ON public.daily_menu;

-- Policy 1: creator or admin can update any column
CREATE POLICY "daily_menu_update_creator_or_admin" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING     (auth.uid() = created_by OR public.is_admin())
  WITH CHECK (auth.uid() = created_by OR public.is_admin());

-- Policy 2: cook role can update any column
CREATE POLICY "daily_menu_update_cook" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'cook'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'cook'
    )
  );

-- Policy 3: any authenticated user can update (for notes / breakfast preferences)
CREATE POLICY "daily_menu_update_notes_any_user" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING     (true)
  WITH CHECK (true);

-- Ensure INSERT policy exists (idempotent)
DROP POLICY IF EXISTS "daily_menu_insert_authenticated" ON public.daily_menu;
CREATE POLICY "daily_menu_insert_authenticated" ON public.daily_menu
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- ────────────────────────────────────────────────────────────
-- 3. cook_requests — add updated_at trigger so client doesn't need to send it
--
--    Problem: useCookRequests.ts was sending updated_at from the client while
--    a DB trigger also tried to set it → constraint conflict → CORS error.
--    The TypeScript fix (removing updated_at from the payload) is already applied.
--    This trigger ensures updated_at is always set server-side.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cook_requests_set_updated_at ON public.cook_requests;
CREATE TRIGGER cook_requests_set_updated_at
  BEFORE UPDATE ON public.cook_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS daily_menu_set_updated_at ON public.daily_menu;
CREATE TRIGGER daily_menu_set_updated_at
  BEFORE UPDATE ON public.daily_menu
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 4. flat_fund_allocations — add TO authenticated role binding
--
--    Problem: SELECT and INSERT policies had no TO clause → applied to anon
--    role too, causing unpredictable policy path for authenticated users.
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "flat_fund_alloc_select" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_select" ON public.flat_fund_allocations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "flat_fund_alloc_insert" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_insert" ON public.flat_fund_allocations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "flat_fund_alloc_delete" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_delete" ON public.flat_fund_allocations
  FOR DELETE TO authenticated USING (auth.uid() = allocated_by OR public.is_admin());

-- ────────────────────────────────────────────────────────────
-- 5. flat_fund_expenses — add TO authenticated role binding
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "flat_fund_exp_select" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_select" ON public.flat_fund_expenses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "flat_fund_exp_insert" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_insert" ON public.flat_fund_expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "flat_fund_exp_delete" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_delete" ON public.flat_fund_expenses
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ────────────────────────────────────────────────────────────
-- 6. contribution_payments — add TO authenticated role binding
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "contrib_payments_select" ON public.contribution_payments;
CREATE POLICY "contrib_payments_select" ON public.contribution_payments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "contrib_payments_insert" ON public.contribution_payments;
CREATE POLICY "contrib_payments_insert" ON public.contribution_payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "contrib_payments_delete" ON public.contribution_payments;
CREATE POLICY "contrib_payments_delete" ON public.contribution_payments
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ────────────────────────────────────────────────────────────
-- 7. admin_update_profile RPC — ensure it exists
--
--    Problem: databases set up from old schema.sql may not have this function.
--    This is idempotent — safe to run even if it already exists.
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, text, boolean, text, boolean);

CREATE OR REPLACE FUNCTION public.admin_update_profile(
  target_user_id  uuid,
  p_role          text    DEFAULT NULL,
  p_can_add_exp   boolean DEFAULT NULL,
  p_full_name     text    DEFAULT NULL,
  p_is_active     boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  IF p_role IS NOT NULL AND p_role NOT IN ('admin', 'user', 'cook') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  UPDATE public.profiles
  SET
    role             = COALESCE(p_role,        role),
    can_add_expenses = COALESCE(p_can_add_exp, can_add_expenses),
    full_name        = COALESCE(p_full_name,   full_name),
    is_active        = COALESCE(p_is_active,   is_active)
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, boolean, text, boolean)
  TO authenticated;

-- ────────────────────────────────────────────────────────────
-- 8. avatars storage — ensure UPDATE policy exists
--
--    Problem: databases initialised before the avatars_owner_update policy
--    was added will block avatar replace/update with a CORS error.
-- ────────────────────────────────────────────────────────────

-- Ensure the avatars bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_upsert"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete"  ON storage.objects;

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_upsert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING     (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING     (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ────────────────────────────────────────────────────────────
-- Verification — run these SELECTs to confirm everything applied
-- ────────────────────────────────────────────────────────────

-- Check daily_menu policies (should see 4 rows)
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'daily_menu' ORDER BY policyname;

-- Check profiles policies (should see profiles_self_update without NOT is_admin())
SELECT policyname, qual FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'profiles_self_update';

-- Check flat_fund / contribution policies have rolename = 'authenticated'
SELECT tablename, policyname, roles FROM pg_policies
WHERE tablename IN ('flat_fund_allocations','flat_fund_expenses','contribution_payments')
ORDER BY tablename, policyname;

-- Check admin_update_profile function exists
SELECT proname, prosecdef FROM pg_proc
WHERE proname = 'admin_update_profile';

-- Check avatars storage policies
SELECT policyname FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE 'avatars%';

DO $$
BEGIN
  RAISE NOTICE '✅ CORS / RLS fixes applied successfully!';
  RAISE NOTICE '   1. profiles_self_update — admin self-update gap fixed';
  RAISE NOTICE '   2. daily_menu — 3 update policies recreated (creator/admin, cook, any-user)';
  RAISE NOTICE '   3. cook_requests — set_updated_at trigger ensured';
  RAISE NOTICE '   4. flat_fund_allocations — TO authenticated added';
  RAISE NOTICE '   5. flat_fund_expenses — TO authenticated added';
  RAISE NOTICE '   6. contribution_payments — TO authenticated added';
  RAISE NOTICE '   7. admin_update_profile RPC — ensured present';
  RAISE NOTICE '   8. avatars storage UPDATE policy — ensured present';
END $$;
