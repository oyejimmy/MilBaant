-- ============================================================
-- MilBaant - COMPLETE DATABASE SCHEMA (Single File)
-- ============================================================
-- Generated: 2026-06-01
-- HOW TO USE: Paste this entire file into Supabase SQL Editor
--             and click Run. Safe to run multiple times.
-- Tables: 23 | Functions: 8 | Triggers: 3 | Buckets: 3
-- ============================================================

-- ============================================================
-- FILE: supabase/schema/00_extensions.sql
-- ============================================================

-- ============================================================
-- MilBaant Database Schema - Extensions
-- ============================================================
-- PURPOSE: Enable required PostgreSQL extensions
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- Enable pgcrypto for UUID generation and cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Extensions enabled successfully';
END $$;


-- ============================================================
-- FILE: supabase/schema/01_tables.sql
-- ============================================================

-- ============================================================
-- MilBaant Database Schema - Tables
-- ============================================================
-- PURPOSE: Define all database tables
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ── User Management ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
    id             uuid    PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    full_name      text    NOT NULL DEFAULT '',
    role           text    NOT NULL DEFAULT 'user'
                           CHECK (role IN ('admin', 'user', 'cook')),
    can_add_expenses boolean NOT NULL DEFAULT false,
    is_active      boolean NOT NULL DEFAULT true,
    avatar_url     text,
    phone          text,
    bio            text
);

-- Ensure profile columns added after initial deploy exist on existing databases
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active   boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url  text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone       text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio         text;

-- Ensure the role check constraint includes 'cook'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'user', 'cook'));

-- ── Flat Layout ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rooms (
    id   integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text    NOT NULL UNIQUE,
    type text    NOT NULL CHECK (type IN ('bedroom','washroom','kitchen','lounge','dining'))
);

CREATE TABLE IF NOT EXISTS public.beds (
    id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    room_id integer NOT NULL REFERENCES public.rooms (id) ON DELETE CASCADE,
    label   text    NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bed_assignments (
    id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid    NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
    bed_id  integer NOT NULL UNIQUE REFERENCES public.beds (id)     ON DELETE CASCADE
);

-- ── Expenses ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.expenses (
    id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by       uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    category         text         NOT NULL CHECK (category IN (
                                     'gas_bill','light_bill','cook_salary','kitchen_daily',
                                     'water_roti','meat','maintenance','pcc_grocery','weekend_meal'
                                 )),
    description      text,
    amount           numeric(10,2) NOT NULL CHECK (amount >= 0),
    date             date          NOT NULL,
    last_date        date,
    split_type       text          NOT NULL CHECK (split_type IN ('all_members','custom_participants')),
    bill_image_url   text,
    monthly_period_id text,
    created_at       timestamptz   NOT NULL DEFAULT timezone('utc', now())
);

-- Ensure monthly_period_id column exists on existing databases
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS monthly_period_id text;

CREATE TABLE IF NOT EXISTS public.expense_participants (
    expense_id uuid NOT NULL REFERENCES public.expenses (id) ON DELETE CASCADE,
    user_id    uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    PRIMARY KEY (expense_id, user_id)
);

-- ── Debt Settlements ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.debt_settlements (
    id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_id   uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    payee_id   uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    amount     numeric(10,2) NOT NULL CHECK (amount > 0),
    note       text,
    settled_at date          NOT NULL DEFAULT current_date,
    created_at timestamptz   NOT NULL DEFAULT timezone('utc', now()),
    created_by uuid          NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT
);

-- ── Rides ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rides (
    id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    date       date         NOT NULL,
    service    text         NOT NULL DEFAULT 'Other',
    route      text,
    amount     numeric(10,2) NOT NULL CHECK (amount >= 0),
    paid_by    uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    note       text,
    created_by uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    created_at timestamptz  NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ride_riders (
    ride_id uuid NOT NULL REFERENCES public.rides (id)    ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    PRIMARY KEY (ride_id, user_id)
);

-- ── Cook Management ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cook_advances (
    id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    amount     numeric(10,2) NOT NULL CHECK (amount > 0),
    date       date          NOT NULL DEFAULT current_date,
    note       text,
    given_by   uuid          NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    created_at timestamptz   NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.cook_purchases (
    id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    date       date         NOT NULL DEFAULT current_date,
    item       text         NOT NULL,
    amount     numeric(10,2) NOT NULL CHECK (amount > 0),
    category   text         NOT NULL DEFAULT 'grocery'
                            CHECK (category IN ('grocery','meat','vegetables','spices','dairy','other')),
    note       text,
    created_at timestamptz  NOT NULL DEFAULT timezone('utc', now()),
    created_by uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.cook_requests (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    item         text        NOT NULL,
    quantity     text,
    note         text,
    status       text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'acknowledged', 'done', 'rejected')),
    cook_comment text,
    requested_by uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at   timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at   timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Migrate any legacy status values from old schema
UPDATE public.cook_requests SET status = 'done'         WHERE status = 'completed';
UPDATE public.cook_requests SET status = 'acknowledged' WHERE status = 'approved';

-- Drop and recreate the constraint with correct values
ALTER TABLE public.cook_requests DROP CONSTRAINT IF EXISTS cook_requests_status_check;
ALTER TABLE public.cook_requests ADD CONSTRAINT cook_requests_status_check
    CHECK (status IN ('pending', 'acknowledged', 'done', 'rejected'));

CREATE TABLE IF NOT EXISTS public.daily_menu (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    date                date        NOT NULL UNIQUE,
    breakfast           text,
    lunch               text,
    dinner              text,
    dinner_description  text,
    notes               text,
    created_by          uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    created_at          timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at          timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Ensure dinner_description column exists on existing databases
ALTER TABLE public.daily_menu ADD COLUMN IF NOT EXISTS dinner_description text;

-- ── Flat Fund ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.flat_fund_allocations (
    id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    amount       numeric(10,2) NOT NULL CHECK (amount > 0),
    note         text,
    allocated_by uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    date         date         NOT NULL DEFAULT current_date,
    created_at   timestamptz  NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.flat_fund_expenses (
    id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    amount      numeric(10,2) NOT NULL CHECK (amount > 0),
    description text         NOT NULL,
    category    text         NOT NULL DEFAULT 'other'
                             CHECK (category IN ('bulb','bread','water_bottle','cleaning','maintenance','grocery','other')),
    date        date         NOT NULL DEFAULT current_date,
    created_by  uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    created_at  timestamptz  NOT NULL DEFAULT timezone('utc', now())
);

-- ── Contributions ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contribution_payments (
    id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    month          text         NOT NULL,
    amount         numeric(10,2) NOT NULL CHECK (amount > 0),
    paid_at        date         NOT NULL DEFAULT current_date,
    screenshot_url text,
    note           text,
    created_by     uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    created_at     timestamptz  NOT NULL DEFAULT timezone('utc', now())
);

-- ── System Tables ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.announcements (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title      text        NOT NULL,
    content    text        NOT NULL,
    created_by uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.settings (
    key   text PRIMARY KEY,
    value text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    action      text        NOT NULL CHECK (action IN ('create','update','delete')),
    entity      text        NOT NULL,
    entity_id   text,
    description text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Tables created successfully';
  RAISE NOTICE '📊 Total tables: 19 (core) + 4 (advance contributions) = 23';
END $$;


-- ============================================================
-- FILE: supabase/schema/02_indexes.sql
-- ============================================================

-- ============================================================
-- MilBaant Database Schema - Indexes
-- ============================================================
-- PURPOSE: Create indexes for query optimization
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ── Expenses ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS expenses_date_idx                ON public.expenses (date);
CREATE INDEX IF NOT EXISTS expenses_category_idx            ON public.expenses (category);
CREATE INDEX IF NOT EXISTS expenses_monthly_period_idx      ON public.expenses (monthly_period_id);
CREATE INDEX IF NOT EXISTS expense_participants_user_idx    ON public.expense_participants (user_id);

-- ── Debt Settlements ─────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS settlements_payer_idx            ON public.debt_settlements (payer_id);
CREATE INDEX IF NOT EXISTS settlements_payee_idx            ON public.debt_settlements (payee_id);
CREATE INDEX IF NOT EXISTS settlements_date_idx             ON public.debt_settlements (settled_at);

-- ── Rides ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS rides_date_idx                   ON public.rides (date);
CREATE INDEX IF NOT EXISTS rides_paid_by_idx                ON public.rides (paid_by);
CREATE INDEX IF NOT EXISTS ride_riders_user_idx             ON public.ride_riders (user_id);

-- ── Cook Management ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS cook_advances_date_idx           ON public.cook_advances (date);
CREATE INDEX IF NOT EXISTS cook_purchases_date_idx          ON public.cook_purchases (date);
CREATE INDEX IF NOT EXISTS cook_requests_status_idx         ON public.cook_requests (status);
CREATE INDEX IF NOT EXISTS cook_requests_requested_by_idx   ON public.cook_requests (requested_by);
CREATE INDEX IF NOT EXISTS cook_requests_created_at_idx     ON public.cook_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS daily_menu_date_idx              ON public.daily_menu (date);

-- ── Flat Fund ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS flat_fund_alloc_user_idx         ON public.flat_fund_allocations (user_id);
CREATE INDEX IF NOT EXISTS flat_fund_alloc_date_idx         ON public.flat_fund_allocations (date);
CREATE INDEX IF NOT EXISTS flat_fund_exp_user_idx           ON public.flat_fund_expenses (user_id);
CREATE INDEX IF NOT EXISTS flat_fund_exp_date_idx           ON public.flat_fund_expenses (date);

-- ── Contributions ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS contrib_payments_user_idx        ON public.contribution_payments (user_id);
CREATE INDEX IF NOT EXISTS contrib_payments_month_idx       ON public.contribution_payments (month);

-- ── Profiles ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS profiles_is_active_idx           ON public.profiles (is_active);
CREATE INDEX IF NOT EXISTS profiles_has_avatar_idx          ON public.profiles (id) WHERE avatar_url IS NOT NULL;

-- ── Activity Logs ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS activity_logs_user_idx           ON public.activity_logs (user_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx     ON public.activity_logs (created_at DESC);

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Indexes created successfully';
  RAISE NOTICE '📊 Total indexes: 25';
END $$;


-- ============================================================
-- FILE: supabase/schema/03_functions.sql
-- ============================================================

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


-- ============================================================
-- FILE: supabase/schema/04_triggers.sql
-- ============================================================

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


-- ============================================================
-- FILE: supabase/schema/05_rls_enable.sql
-- ============================================================

-- ============================================================
-- MilBaant Database Schema - Enable RLS
-- ============================================================
-- PURPOSE: Enable Row Level Security on all tables
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_assignments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_settlements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_riders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cook_advances         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cook_purchases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cook_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flat_fund_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flat_fund_expenses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menu            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_contribution_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budget        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_breakdown ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Row Level Security enabled on all tables';
  RAISE NOTICE '📊 Total tables with RLS: 23';
END $$;


-- ============================================================
-- FILE: supabase/schema/06_rls_policies.sql
-- ============================================================

-- ============================================================
-- MilBaant Database Schema - RLS Policies
-- ============================================================
-- PURPOSE: Define Row Level Security policies for all tables
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Admins can update any profile (role, permissions, name, is_active, avatar, etc.)
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Any user can update their own profile (name, phone, bio, avatar_url).
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── rooms ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rooms_select_authenticated" ON public.rooms;
CREATE POLICY "rooms_select_authenticated" ON public.rooms
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "rooms_admin_modify" ON public.rooms;
CREATE POLICY "rooms_admin_modify" ON public.rooms
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── beds ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "beds_select_authenticated" ON public.beds;
CREATE POLICY "beds_select_authenticated" ON public.beds
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "beds_admin_modify" ON public.beds;
CREATE POLICY "beds_admin_modify" ON public.beds
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── bed_assignments ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "bed_assignments_select_authenticated" ON public.bed_assignments;
CREATE POLICY "bed_assignments_select_authenticated" ON public.bed_assignments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "bed_assignments_admin_modify" ON public.bed_assignments;
CREATE POLICY "bed_assignments_admin_modify" ON public.bed_assignments
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── expenses ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "expenses_select_authenticated" ON public.expenses;
CREATE POLICY "expenses_select_authenticated" ON public.expenses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "expenses_insert_authenticated" ON public.expenses;
CREATE POLICY "expenses_insert_authenticated" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "expenses_update_authenticated" ON public.expenses;
CREATE POLICY "expenses_update_authenticated" ON public.expenses
  FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

DROP POLICY IF EXISTS "expenses_delete_authenticated" ON public.expenses;
CREATE POLICY "expenses_delete_authenticated" ON public.expenses
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ── expense_participants ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "expense_participants_select_authenticated" ON public.expense_participants;
CREATE POLICY "expense_participants_select_authenticated" ON public.expense_participants
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "expense_participants_insert" ON public.expense_participants;
CREATE POLICY "expense_participants_insert" ON public.expense_participants
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "expense_participants_admin_delete" ON public.expense_participants;
CREATE POLICY "expense_participants_admin_delete" ON public.expense_participants
  FOR DELETE TO authenticated USING (public.is_admin());

-- ── announcements ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "announcements_select_authenticated" ON public.announcements;
CREATE POLICY "announcements_select_authenticated" ON public.announcements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "announcements_admin_modify" ON public.announcements;
CREATE POLICY "announcements_admin_modify" ON public.announcements
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── settings ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "settings_select_authenticated" ON public.settings;
CREATE POLICY "settings_select_authenticated" ON public.settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "settings_admin_modify" ON public.settings;
CREATE POLICY "settings_admin_modify" ON public.settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── debt_settlements ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "settlements_select_authenticated" ON public.debt_settlements;
CREATE POLICY "settlements_select_authenticated" ON public.debt_settlements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "settlements_insert_authenticated" ON public.debt_settlements;
CREATE POLICY "settlements_insert_authenticated" ON public.debt_settlements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "settlements_delete_authenticated" ON public.debt_settlements;
CREATE POLICY "settlements_delete_authenticated" ON public.debt_settlements
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ── rides ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rides_select_authenticated" ON public.rides;
CREATE POLICY "rides_select_authenticated" ON public.rides
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "rides_insert_authenticated" ON public.rides;
CREATE POLICY "rides_insert_authenticated" ON public.rides
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "rides_delete_authenticated" ON public.rides;
CREATE POLICY "rides_delete_authenticated" ON public.rides
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ── ride_riders ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ride_riders_select_authenticated" ON public.ride_riders;
CREATE POLICY "ride_riders_select_authenticated" ON public.ride_riders
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ride_riders_insert_authenticated" ON public.ride_riders;
CREATE POLICY "ride_riders_insert_authenticated" ON public.ride_riders
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ride_riders_delete_authenticated" ON public.ride_riders;
CREATE POLICY "ride_riders_delete_authenticated" ON public.ride_riders
  FOR DELETE TO authenticated USING (true);

-- ── cook_advances ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cook_advances_select" ON public.cook_advances;
CREATE POLICY "cook_advances_select" ON public.cook_advances
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cook_advances_insert_authenticated" ON public.cook_advances;
CREATE POLICY "cook_advances_insert_authenticated" ON public.cook_advances
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = given_by);

DROP POLICY IF EXISTS "cook_advances_delete_authenticated" ON public.cook_advances;
CREATE POLICY "cook_advances_delete_authenticated" ON public.cook_advances
  FOR DELETE TO authenticated USING (auth.uid() = given_by OR public.is_admin());

-- ── cook_purchases ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cook_purchases_select" ON public.cook_purchases;
CREATE POLICY "cook_purchases_select" ON public.cook_purchases
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cook_purchases_insert_authenticated" ON public.cook_purchases;
CREATE POLICY "cook_purchases_insert_authenticated" ON public.cook_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "cook_purchases_delete_authenticated" ON public.cook_purchases;
CREATE POLICY "cook_purchases_delete_authenticated" ON public.cook_purchases
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ── cook_requests ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cook_requests_select" ON public.cook_requests;
CREATE POLICY "cook_requests_select" ON public.cook_requests
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cook_requests_insert" ON public.cook_requests;
CREATE POLICY "cook_requests_insert" ON public.cook_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);

DROP POLICY IF EXISTS "cook_requests_update" ON public.cook_requests;
CREATE POLICY "cook_requests_update" ON public.cook_requests
  FOR UPDATE TO authenticated USING (public.is_cook() OR public.is_admin() OR auth.uid() = requested_by);

DROP POLICY IF EXISTS "cook_requests_delete" ON public.cook_requests;
CREATE POLICY "cook_requests_delete" ON public.cook_requests
  FOR DELETE TO authenticated USING (auth.uid() = requested_by OR public.is_admin());

-- ── daily_menu ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "daily_menu_select" ON public.daily_menu;
CREATE POLICY "daily_menu_select" ON public.daily_menu
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "daily_menu_insert_authenticated" ON public.daily_menu;
CREATE POLICY "daily_menu_insert_authenticated" ON public.daily_menu
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "daily_menu_update_authenticated" ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_creator_or_admin" ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_cook" ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_notes_any_user" ON public.daily_menu;

-- Policy 1: creator or admin can update any column
CREATE POLICY "daily_menu_update_creator_or_admin" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin())
  WITH CHECK (auth.uid() = created_by OR public.is_admin());

-- Policy 2: cook role can update any column
CREATE POLICY "daily_menu_update_cook" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (public.is_cook())
  WITH CHECK (public.is_cook());

-- Policy 3: any authenticated user can update (for notes / breakfast preferences)
CREATE POLICY "daily_menu_update_notes_any_user" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "daily_menu_delete_authenticated" ON public.daily_menu;
CREATE POLICY "daily_menu_delete_authenticated" ON public.daily_menu
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ── activity_logs ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "activity_logs_select" ON public.activity_logs;
CREATE POLICY "activity_logs_select" ON public.activity_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "activity_logs_insert" ON public.activity_logs;
CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- ── flat_fund_allocations ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "flat_fund_alloc_select" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_select" ON public.flat_fund_allocations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "flat_fund_alloc_insert" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_insert" ON public.flat_fund_allocations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "flat_fund_alloc_delete" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_delete" ON public.flat_fund_allocations
  FOR DELETE TO authenticated USING (auth.uid() = allocated_by);

-- ── flat_fund_expenses ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "flat_fund_exp_select" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_select" ON public.flat_fund_expenses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "flat_fund_exp_insert" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_insert" ON public.flat_fund_expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "flat_fund_exp_delete" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_delete" ON public.flat_fund_expenses
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ── contribution_payments ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "contrib_payments_select" ON public.contribution_payments;
CREATE POLICY "contrib_payments_select" ON public.contribution_payments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "contrib_payments_insert" ON public.contribution_payments;
CREATE POLICY "contrib_payments_insert" ON public.contribution_payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "contrib_payments_delete" ON public.contribution_payments;
CREATE POLICY "contrib_payments_delete" ON public.contribution_payments
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies created successfully';
  RAISE NOTICE '📊 Total policies: 50+';
END $$;


-- ============================================================
-- FILE: supabase/schema/07_storage.sql
-- ============================================================

-- ============================================================
-- MilBaant Database Schema - Storage
-- ============================================================
-- PURPOSE: Create storage buckets and policies
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ── Storage Buckets ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('bill-images',          'bill-images',          true),
  ('payment-screenshots',  'payment-screenshots',  true),
  ('avatars',              'avatars',              true)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ─────────────────────────────────────────────────────

-- ── bill-images bucket ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "bill_images_public_read"            ON storage.objects;
DROP POLICY IF EXISTS "bill_images_authenticated_insert"   ON storage.objects;
DROP POLICY IF EXISTS "bill_images_admin_delete"           ON storage.objects;
DROP POLICY IF EXISTS "bill_images_owner_delete"           ON storage.objects;

CREATE POLICY "bill_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'bill-images');

CREATE POLICY "bill_images_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bill-images');

CREATE POLICY "bill_images_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'bill-images' AND public.is_admin());

CREATE POLICY "bill_images_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'bill-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── payment-screenshots bucket ───────────────────────────────────────────────

DROP POLICY IF EXISTS "payment_screenshots_public_read"           ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_authenticated_insert"  ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_admin_delete"          ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_owner_delete"          ON storage.objects;

CREATE POLICY "payment_screenshots_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-screenshots');

CREATE POLICY "payment_screenshots_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-screenshots');

CREATE POLICY "payment_screenshots_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-screenshots' AND public.is_admin());

CREATE POLICY "payment_screenshots_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── avatars bucket ───────────────────────────────────────────────────────────

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
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets and policies created successfully';
  RAISE NOTICE '📊 Total buckets: 3';
  RAISE NOTICE '📊 Total storage policies: 12';
END $$;


-- ============================================================
-- FILE: supabase/schema/08_seed_data.sql
-- ============================================================

-- ============================================================
-- MilBaant Database Schema - Seed Data
-- ============================================================
-- PURPOSE: Insert initial seed data
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ── Rooms ────────────────────────────────────────────────────────────────────

INSERT INTO public.rooms (name, type) VALUES
  ('Yasir & Haris Room',     'bedroom'),
  ('Sajid & Raza Room',      'bedroom'),
  ('Jimmy & Ateeb Room',     'bedroom'),
  ('Yasir & Haris Washroom', 'washroom'),
  ('Sajid & Raza Washroom',  'washroom'),
  ('Jimmy & Ateeb Washroom', 'washroom'),
  ('Kitchen',                'kitchen'),
  ('TV Lounge',              'lounge'),
  ('Dining',                 'dining')
ON CONFLICT (name) DO NOTHING;

-- ── Beds ─────────────────────────────────────────────────────────────────────

INSERT INTO public.beds (room_id, label)
SELECT r.id, b.label
FROM public.rooms r
CROSS JOIN (VALUES ('Bed A'), ('Bed B')) AS b(label)
WHERE r.name IN ('Yasir & Haris Room', 'Sajid & Raza Room', 'Jimmy & Ateeb Room')
  AND NOT EXISTS (
    SELECT 1 FROM public.beds e WHERE e.room_id = r.id AND e.label = b.label
  );

-- ── Settings ─────────────────────────────────────────────────────────────────

INSERT INTO public.settings (key, value) VALUES
  ('member_count', '6'),
  ('flatmates',    'Yasir Ajmal Mehmand, Muhammad Haris, Sajid Ali, Ahmad Raza, Babar Jamil Ur Rahman (Jimmy), Ateeb Raza'),
  ('cook_name',    'Muhammad Sajid Khan')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserted successfully';
  RAISE NOTICE '📊 Rooms: 9';
  RAISE NOTICE '📊 Beds: 6';
  RAISE NOTICE '📊 Settings: 3';
END $$;


-- ============================================================
-- FILE: supabase/schema/09_advance_contributions.sql
-- ============================================================

-- ============================================================
-- MilBaant – Advance Contributions System
-- ============================================================
-- Adds 4 tables:
--   advance_contribution_categories  – static 8-category lookup
--   monthly_budget                   – admin sets per-category budget
--   monthly_contributions            – plan header (totals, publish)
--   contribution_breakdown           – per-user override amounts
-- ============================================================

-- ── 1. Categories ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.advance_contribution_categories (
    id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key        text    NOT NULL UNIQUE,
    label      text    NOT NULL,
    sort_order integer NOT NULL DEFAULT 0
);

INSERT INTO public.advance_contribution_categories (key, label, sort_order) VALUES
    ('pcc_grocery',   'Grocery',       1),
    ('maintenance',   'Maintenance',   2),
    ('meat',          'Meat',          3),
    ('water_roti',    'Water + Roti',  4),
    ('kitchen_daily', 'Kitchen Daily', 5),
    ('cook_salary',   'Cook Salary',   6),
    ('light_bill',    'Light Bill',    7),
    ('gas_bill',      'Gas Bill',      8),
    ('carryover',     'Carryover',     9)
ON CONFLICT (key) DO NOTHING;

-- ── 2. Monthly Budget (admin sets per-category amounts) ───────────────────────

CREATE TABLE IF NOT EXISTS public.monthly_budget (
    id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    month         text          NOT NULL,
    category_key  text          NOT NULL
                                REFERENCES public.advance_contribution_categories (key)
                                ON DELETE RESTRICT,
    budget_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (budget_amount >= 0),
    created_by    uuid          NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    created_at    timestamptz   NOT NULL DEFAULT now(),
    updated_at    timestamptz   NOT NULL DEFAULT now(),
    UNIQUE (month, category_key)
);

-- ── 3. Monthly Contributions (plan header) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.monthly_contributions (
    id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    month              text          NOT NULL UNIQUE,
    total_budget       numeric(12,2) NOT NULL DEFAULT 0,
    flatmate_count     integer       NOT NULL DEFAULT 1 CHECK (flatmate_count > 0),
    per_person_default numeric(12,2) NOT NULL DEFAULT 0,
    is_published       boolean       NOT NULL DEFAULT false,
    published_at       timestamptz,
    published_by       uuid          REFERENCES public.profiles (id) ON DELETE SET NULL,
    created_by         uuid          NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    updated_at         timestamptz   NOT NULL DEFAULT now()
);

-- ── 4. Contribution Breakdown (per-user override) ─────────────────────────────

CREATE TABLE IF NOT EXISTS public.contribution_breakdown (
    id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    monthly_contribution_id uuid          NOT NULL
                                          REFERENCES public.monthly_contributions (id)
                                          ON DELETE CASCADE,
    user_id                 uuid          NOT NULL
                                          REFERENCES public.profiles (id)
                                          ON DELETE CASCADE,
    override_amount         numeric(12,2)          CHECK (override_amount >= 0),
    note                    text,
    created_at              timestamptz   NOT NULL DEFAULT now(),
    updated_at              timestamptz   NOT NULL DEFAULT now(),
    UNIQUE (monthly_contribution_id, user_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS monthly_budget_month_idx
    ON public.monthly_budget (month);

CREATE INDEX IF NOT EXISTS monthly_contributions_month_idx
    ON public.monthly_contributions (month);

CREATE INDEX IF NOT EXISTS contribution_breakdown_mc_idx
    ON public.contribution_breakdown (monthly_contribution_id);

CREATE INDEX IF NOT EXISTS contribution_breakdown_user_idx
    ON public.contribution_breakdown (user_id);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.advance_contribution_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budget                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_contributions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_breakdown           ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safest way)
DROP POLICY IF EXISTS "acc_select" ON public.advance_contribution_categories;
DROP POLICY IF EXISTS "acc_admin_write" ON public.advance_contribution_categories;
DROP POLICY IF EXISTS "mb_select" ON public.monthly_budget;
DROP POLICY IF EXISTS "mb_admin_write" ON public.monthly_budget;
DROP POLICY IF EXISTS "mc_select" ON public.monthly_contributions;
DROP POLICY IF EXISTS "mc_admin_write" ON public.monthly_contributions;
DROP POLICY IF EXISTS "cb_select" ON public.contribution_breakdown;
DROP POLICY IF EXISTS "cb_admin_write" ON public.contribution_breakdown;

-- advance_contribution_categories: all authenticated users can read; admin writes
CREATE POLICY "acc_select" ON public.advance_contribution_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "acc_admin_write" ON public.advance_contribution_categories
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- monthly_budget: all authenticated can read; admin writes
CREATE POLICY "mb_select" ON public.monthly_budget
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "mb_admin_write" ON public.monthly_budget
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- monthly_contributions: published rows visible to all; admin sees drafts too
CREATE POLICY "mc_select" ON public.monthly_contributions
    FOR SELECT USING (
        is_published = true
        OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "mc_admin_write" ON public.monthly_contributions
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- contribution_breakdown: users see only their own row; admin sees all
CREATE POLICY "cb_select" ON public.contribution_breakdown
    FOR SELECT USING (
        user_id = auth.uid()
        OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "cb_admin_write" ON public.contribution_breakdown
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );


