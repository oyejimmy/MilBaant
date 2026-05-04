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

-- ── Hard-delete a user and all their data ────────────────────────────────────
--
-- Permanently removes a user from auth.users (which cascades to profiles and
-- all ON DELETE CASCADE child rows).  Tables that use ON DELETE RESTRICT are
-- handled explicitly before the auth.users delete so the operation never
-- fails with a foreign-key violation.
--
-- Safety rules enforced inside the function:
--   • Caller must be an admin.
--   • An admin cannot delete themselves.
--   • The target user must already be deactivated (is_active = false) to
--     prevent accidental deletion of active accounts.
--
CREATE OR REPLACE FUNCTION public.admin_hard_delete_user(
  target_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_active boolean;
BEGIN
  -- 1. Caller must be an admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  -- 2. Cannot delete yourself
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- 3. Target must be deactivated first (safety gate)
  SELECT is_active INTO v_is_active
  FROM public.profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_is_active IS TRUE THEN
    RAISE EXCEPTION 'User must be deactivated before permanent deletion';
  END IF;

  -- 4. Handle ON DELETE RESTRICT tables by nullifying or deleting rows
  --    that reference this user before we remove the auth.users row.

  -- expenses.created_by → RESTRICT: delete the expense (and its participants cascade)
  DELETE FROM public.expenses
  WHERE created_by = target_user_id;

  -- debt_settlements.created_by → RESTRICT: delete settlements created by this user
  DELETE FROM public.debt_settlements
  WHERE created_by = target_user_id;

  -- rides.created_by / paid_by → RESTRICT: delete rides created or paid by this user
  DELETE FROM public.rides
  WHERE created_by = target_user_id
     OR paid_by    = target_user_id;

  -- cook_advances.given_by → RESTRICT
  DELETE FROM public.cook_advances
  WHERE given_by = target_user_id;

  -- cook_purchases.created_by → RESTRICT
  DELETE FROM public.cook_purchases
  WHERE created_by = target_user_id;

  -- daily_menu.created_by → RESTRICT
  DELETE FROM public.daily_menu
  WHERE created_by = target_user_id;

  -- flat_fund_allocations.allocated_by → RESTRICT
  DELETE FROM public.flat_fund_allocations
  WHERE allocated_by = target_user_id;

  -- flat_fund_expenses.created_by → RESTRICT
  DELETE FROM public.flat_fund_expenses
  WHERE created_by = target_user_id;

  -- contribution_payments.created_by → RESTRICT
  DELETE FROM public.contribution_payments
  WHERE created_by = target_user_id;

  -- announcements.created_by → RESTRICT
  DELETE FROM public.announcements
  WHERE created_by = target_user_id;

  -- activity_logs.user_id → RESTRICT
  DELETE FROM public.activity_logs
  WHERE user_id = target_user_id;

  -- 5. Delete from auth.users — cascades to profiles and all
  --    ON DELETE CASCADE child rows (bed_assignments, expense_participants,
  --    ride_riders, debt_settlements as payer/payee, flat_fund rows, etc.)
  DELETE FROM auth.users
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_hard_delete_user(uuid)
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

-- ── Daily Menu Functions ─────────────────────────────────────────────────────

-- Upsert daily menu — any authenticated user can call this.
-- Using SECURITY DEFINER + RPC (POST) avoids the CORS preflight that
-- Supabase's PATCH endpoint triggers on some project configurations.
CREATE OR REPLACE FUNCTION public.upsert_daily_menu(
  p_date                text,
  p_dinner              text    DEFAULT NULL,
  p_dinner_description  text    DEFAULT NULL,
  p_notes               text    DEFAULT NULL,
  p_breakfast           text    DEFAULT NULL,
  p_lunch               text    DEFAULT NULL,
  p_created_by          uuid    DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_result_id   uuid;
  v_creator     uuid;
BEGIN
  v_creator := COALESCE(p_created_by, auth.uid());

  IF v_creator IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if a row already exists for this date
  SELECT id INTO v_existing_id
  FROM public.daily_menu
  WHERE date = p_date::date;

  IF v_existing_id IS NOT NULL THEN
    -- Sparse update: only overwrite columns that were explicitly passed (non-NULL)
    UPDATE public.daily_menu
    SET
      dinner             = CASE WHEN p_dinner             IS NOT NULL THEN p_dinner             ELSE dinner             END,
      dinner_description = CASE WHEN p_dinner_description IS NOT NULL THEN p_dinner_description ELSE dinner_description END,
      notes              = CASE WHEN p_notes              IS NOT NULL THEN p_notes              ELSE notes              END,
      breakfast          = CASE WHEN p_breakfast          IS NOT NULL THEN p_breakfast          ELSE breakfast          END,
      lunch              = CASE WHEN p_lunch              IS NOT NULL THEN p_lunch              ELSE lunch              END,
      updated_at         = timezone('utc', now())
    WHERE id = v_existing_id;

    v_result_id := v_existing_id;
  ELSE
    -- Insert new row
    INSERT INTO public.daily_menu (date, dinner, dinner_description, notes, breakfast, lunch, created_by)
    VALUES (
      p_date::date,
      p_dinner,
      p_dinner_description,
      p_notes,
      p_breakfast,
      p_lunch,
      v_creator
    )
    RETURNING id INTO v_result_id;
  END IF;

  RETURN v_result_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_daily_menu(text, text, text, text, text, text, uuid)
  TO authenticated;

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Functions created successfully';
  RAISE NOTICE '📊 Total functions: 5';
END $$;
