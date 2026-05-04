-- ============================================================
-- MilBaant Database Schema - Functions
-- ============================================================
-- PURPOSE: Define stored procedures and helper functions
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ── User Management Functions ────────────────────────────────────────────────

-- Triggered on new auth.users row — inserts a matching profile.
-- First user ever registered becomes admin automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_profiles integer;
BEGIN
  SELECT count(*) INTO existing_profiles FROM public.profiles;

  INSERT INTO public.profiles (id, full_name, role, can_add_expenses, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN existing_profiles = 0 THEN 'admin' ELSE 'user' END,
    CASE WHEN existing_profiles = 0 THEN true    ELSE false  END,
    true
  );

  RETURN NEW;
END;
$$;

-- ── Authorization Helper Functions ───────────────────────────────────────────

-- Returns true if the currently authenticated user has role = 'admin'.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Returns true if the currently authenticated user has role = 'cook'.
CREATE OR REPLACE FUNCTION public.is_cook()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'cook'
  );
$$;

-- Returns true if the current user can add expenses (admin or explicit permission).
CREATE OR REPLACE FUNCTION public.can_current_user_add_expenses()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR can_add_expenses = true)
  );
$$;

-- ── Admin Functions ──────────────────────────────────────────────────────────

-- Admin function to update user profiles (bypasses RLS via SECURITY DEFINER)
-- This prevents CORS errors when admins update user roles/permissions
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
  -- Only admins may call this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Validate role value if provided
  IF p_role IS NOT NULL AND p_role NOT IN ('user', 'admin', 'cook') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE public.profiles
  SET
    role             = COALESCE(p_role,        role),
    can_add_expenses = COALESCE(p_can_add_exp, can_add_expenses),
    full_name        = COALESCE(p_full_name,   full_name),
    is_active        = COALESCE(p_is_active,   is_active)
  WHERE id = target_user_id;
END;
$$;

-- Grant execute to authenticated users (the function itself checks for admin)
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, boolean, text, boolean)
  TO authenticated;

-- ── Utility Functions ────────────────────────────────────────────────────────

-- Trigger function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Functions created successfully';
  RAISE NOTICE '📊 Total functions: 5';
END $$;
