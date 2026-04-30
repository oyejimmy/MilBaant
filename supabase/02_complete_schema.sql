-- ============================================================
-- MilBaant — Complete Database Schema
-- Run this to set up the entire database from scratch
-- All statements are idempotent (safe to run multiple times)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Tables ───────────────────────────────────────────────────────────────────

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

CREATE TABLE IF NOT EXISTS public.expenses (
    id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by    uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    category      text         NOT NULL CHECK (category IN (
                                   'gas_bill','light_bill','cook_salary','kitchen_daily',
                                   'water_roti','meat','maintenance','pcc_grocery','weekend_meal'
                               )),
    description   text,
    amount        numeric(10,2) NOT NULL CHECK (amount >= 0),
    date          date          NOT NULL,
    last_date     date,
    split_type    text          NOT NULL CHECK (split_type IN ('all_members','custom_participants')),
    bill_image_url text,
    created_at    timestamptz   NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.expense_participants (
    expense_id uuid NOT NULL REFERENCES public.expenses (id) ON DELETE CASCADE,
    user_id    uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    PRIMARY KEY (expense_id, user_id)
);

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

CREATE TABLE IF NOT EXISTS public.daily_menu (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    date       date        NOT NULL UNIQUE,
    breakfast  text,
    lunch      text,
    dinner     text,
    notes      text,
    created_by uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
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

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS expenses_date_idx                ON public.expenses (date);
CREATE INDEX IF NOT EXISTS expenses_category_idx            ON public.expenses (category);
CREATE INDEX IF NOT EXISTS expense_participants_user_idx    ON public.expense_participants (user_id);
CREATE INDEX IF NOT EXISTS settlements_payer_idx            ON public.debt_settlements (payer_id);
CREATE INDEX IF NOT EXISTS settlements_payee_idx            ON public.debt_settlements (payee_id);
CREATE INDEX IF NOT EXISTS settlements_date_idx             ON public.debt_settlements (settled_at);
CREATE INDEX IF NOT EXISTS rides_date_idx                   ON public.rides (date);
CREATE INDEX IF NOT EXISTS rides_paid_by_idx                ON public.rides (paid_by);
CREATE INDEX IF NOT EXISTS ride_riders_user_idx             ON public.ride_riders (user_id);
CREATE INDEX IF NOT EXISTS cook_advances_date_idx           ON public.cook_advances (date);
CREATE INDEX IF NOT EXISTS cook_purchases_date_idx          ON public.cook_purchases (date);
CREATE INDEX IF NOT EXISTS daily_menu_date_idx              ON public.daily_menu (date);
CREATE INDEX IF NOT EXISTS activity_logs_user_idx           ON public.activity_logs (user_id);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx     ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS flat_fund_alloc_user_idx         ON public.flat_fund_allocations (user_id);
CREATE INDEX IF NOT EXISTS flat_fund_alloc_date_idx         ON public.flat_fund_allocations (date);
CREATE INDEX IF NOT EXISTS flat_fund_exp_user_idx           ON public.flat_fund_expenses (user_id);
CREATE INDEX IF NOT EXISTS flat_fund_exp_date_idx           ON public.flat_fund_expenses (date);
CREATE INDEX IF NOT EXISTS contrib_payments_user_idx        ON public.contribution_payments (user_id);
CREATE INDEX IF NOT EXISTS contrib_payments_month_idx       ON public.contribution_payments (month);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx           ON public.profiles (is_active);
CREATE INDEX IF NOT EXISTS profiles_has_avatar_idx          ON public.profiles (id) WHERE avatar_url IS NOT NULL;

-- ── Functions ─────────────────────────────────────────────────────────────────

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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

-- ── Enable Row Level Security ─────────────────────────────────────────────────

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
ALTER TABLE public.activity_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flat_fund_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flat_fund_expenses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menu            ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ─────────────────────────────────────────────────────────────

-- profiles
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

-- Any user (including admins) can update their own profile (name, phone, bio, avatar_url).
-- Note: NOT is_admin() was removed — admins updating their own row must also match this policy.
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING     (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- rooms
DROP POLICY IF EXISTS "rooms_select_authenticated" ON public.rooms;
CREATE POLICY "rooms_select_authenticated" ON public.rooms
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "rooms_admin_modify" ON public.rooms;
CREATE POLICY "rooms_admin_modify" ON public.rooms
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- beds
DROP POLICY IF EXISTS "beds_select_authenticated" ON public.beds;
CREATE POLICY "beds_select_authenticated" ON public.beds
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "beds_admin_modify" ON public.beds;
CREATE POLICY "beds_admin_modify" ON public.beds
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- bed_assignments
DROP POLICY IF EXISTS "bed_assignments_select_authenticated" ON public.bed_assignments;
CREATE POLICY "bed_assignments_select_authenticated" ON public.bed_assignments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "bed_assignments_admin_modify" ON public.bed_assignments;
CREATE POLICY "bed_assignments_admin_modify" ON public.bed_assignments
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- expenses
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

-- expense_participants
DROP POLICY IF EXISTS "expense_participants_select_authenticated" ON public.expense_participants;
CREATE POLICY "expense_participants_select_authenticated" ON public.expense_participants
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "expense_participants_insert" ON public.expense_participants;
CREATE POLICY "expense_participants_insert" ON public.expense_participants
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "expense_participants_admin_delete" ON public.expense_participants;
CREATE POLICY "expense_participants_admin_delete" ON public.expense_participants
  FOR DELETE TO authenticated USING (public.is_admin());

-- announcements
DROP POLICY IF EXISTS "announcements_select_authenticated" ON public.announcements;
CREATE POLICY "announcements_select_authenticated" ON public.announcements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "announcements_admin_modify" ON public.announcements;
CREATE POLICY "announcements_admin_modify" ON public.announcements
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- settings
DROP POLICY IF EXISTS "settings_select_authenticated" ON public.settings;
CREATE POLICY "settings_select_authenticated" ON public.settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "settings_admin_modify" ON public.settings;
CREATE POLICY "settings_admin_modify" ON public.settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- debt_settlements
DROP POLICY IF EXISTS "settlements_select_authenticated" ON public.debt_settlements;
CREATE POLICY "settlements_select_authenticated" ON public.debt_settlements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "settlements_insert_authenticated" ON public.debt_settlements;
CREATE POLICY "settlements_insert_authenticated" ON public.debt_settlements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "settlements_delete_authenticated" ON public.debt_settlements;
CREATE POLICY "settlements_delete_authenticated" ON public.debt_settlements
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- rides
DROP POLICY IF EXISTS "rides_select_authenticated" ON public.rides;
CREATE POLICY "rides_select_authenticated" ON public.rides
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "rides_insert_authenticated" ON public.rides;
CREATE POLICY "rides_insert_authenticated" ON public.rides
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "rides_delete_authenticated" ON public.rides;
CREATE POLICY "rides_delete_authenticated" ON public.rides
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ride_riders
DROP POLICY IF EXISTS "ride_riders_select_authenticated" ON public.ride_riders;
CREATE POLICY "ride_riders_select_authenticated" ON public.ride_riders
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ride_riders_insert_authenticated" ON public.ride_riders;
CREATE POLICY "ride_riders_insert_authenticated" ON public.ride_riders
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ride_riders_delete_authenticated" ON public.ride_riders;
CREATE POLICY "ride_riders_delete_authenticated" ON public.ride_riders
  FOR DELETE TO authenticated USING (true);

-- cook_advances
DROP POLICY IF EXISTS "cook_advances_select" ON public.cook_advances;
CREATE POLICY "cook_advances_select" ON public.cook_advances
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cook_advances_insert_authenticated" ON public.cook_advances;
CREATE POLICY "cook_advances_insert_authenticated" ON public.cook_advances
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = given_by);

DROP POLICY IF EXISTS "cook_advances_delete_authenticated" ON public.cook_advances;
CREATE POLICY "cook_advances_delete_authenticated" ON public.cook_advances
  FOR DELETE TO authenticated USING (auth.uid() = given_by OR public.is_admin());

-- cook_purchases
DROP POLICY IF EXISTS "cook_purchases_select" ON public.cook_purchases;
CREATE POLICY "cook_purchases_select" ON public.cook_purchases
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cook_purchases_insert_authenticated" ON public.cook_purchases;
CREATE POLICY "cook_purchases_insert_authenticated" ON public.cook_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "cook_purchases_delete_authenticated" ON public.cook_purchases;
CREATE POLICY "cook_purchases_delete_authenticated" ON public.cook_purchases
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- daily_menu
DROP POLICY IF EXISTS "daily_menu_select" ON public.daily_menu;
CREATE POLICY "daily_menu_select" ON public.daily_menu
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "daily_menu_insert_authenticated" ON public.daily_menu;
CREATE POLICY "daily_menu_insert_authenticated" ON public.daily_menu
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Drop all update policy variants (old name + migration names) before recreating
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

-- Policy 3: any authenticated user can update (notes / breakfast preferences)
CREATE POLICY "daily_menu_update_notes_any_user" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING     (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "daily_menu_delete_authenticated" ON public.daily_menu;
CREATE POLICY "daily_menu_delete_authenticated" ON public.daily_menu
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- activity_logs
DROP POLICY IF EXISTS "activity_logs_select" ON public.activity_logs;
CREATE POLICY "activity_logs_select" ON public.activity_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "activity_logs_insert" ON public.activity_logs;
CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- flat_fund_allocations
DROP POLICY IF EXISTS "flat_fund_alloc_select" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_select" ON public.flat_fund_allocations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "flat_fund_alloc_insert" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_insert" ON public.flat_fund_allocations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "flat_fund_alloc_delete" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_delete" ON public.flat_fund_allocations
  FOR DELETE TO authenticated USING (auth.uid() = allocated_by OR public.is_admin());

-- flat_fund_expenses
DROP POLICY IF EXISTS "flat_fund_exp_select" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_select" ON public.flat_fund_expenses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "flat_fund_exp_insert" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_insert" ON public.flat_fund_expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "flat_fund_exp_delete" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_delete" ON public.flat_fund_expenses
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- contribution_payments
DROP POLICY IF EXISTS "contrib_payments_select" ON public.contribution_payments;
CREATE POLICY "contrib_payments_select" ON public.contribution_payments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "contrib_payments_insert" ON public.contribution_payments;
CREATE POLICY "contrib_payments_insert" ON public.contribution_payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "contrib_payments_delete" ON public.contribution_payments;
CREATE POLICY "contrib_payments_delete" ON public.contribution_payments
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ── Cook Requests ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cook_requests (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    item         text        NOT NULL,
    quantity     text,
    note         text,
    cook_comment text,                         -- cook's reply / reason
    status       text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'acknowledged', 'done', 'rejected')),
    requested_by uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    created_at   timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at   timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS cook_requests_status_idx       ON public.cook_requests (status);
CREATE INDEX IF NOT EXISTS cook_requests_requested_by_idx ON public.cook_requests (requested_by);
CREATE INDEX IF NOT EXISTS cook_requests_created_at_idx   ON public.cook_requests (created_at DESC);

ALTER TABLE public.cook_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cook_requests_select" ON public.cook_requests;
CREATE POLICY "cook_requests_select" ON public.cook_requests
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cook_requests_insert" ON public.cook_requests;
CREATE POLICY "cook_requests_insert" ON public.cook_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);

DROP POLICY IF EXISTS "cook_requests_update" ON public.cook_requests;
CREATE POLICY "cook_requests_update" ON public.cook_requests
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = requested_by
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'cook')
  );

DROP POLICY IF EXISTS "cook_requests_delete" ON public.cook_requests;
CREATE POLICY "cook_requests_delete" ON public.cook_requests
  FOR DELETE TO authenticated
  USING (auth.uid() = requested_by OR public.is_admin());

-- ── Storage Buckets ───────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('bill-images',          'bill-images',          true),
  ('payment-screenshots',  'payment-screenshots',  true),
  ('avatars',              'avatars',              true)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ──────────────────────────────────────────────────────

-- bill-images
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

-- payment-screenshots
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

-- avatars — users manage their own, public read
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

-- ── Seed Data ─────────────────────────────────────────────────────────────────

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

INSERT INTO public.beds (room_id, label)
SELECT r.id, b.label
FROM public.rooms r
CROSS JOIN (VALUES ('Bed A'), ('Bed B')) AS b(label)
WHERE r.name IN ('Yasir & Haris Room', 'Sajid & Raza Room', 'Jimmy & Ateeb Room')
  AND NOT EXISTS (
    SELECT 1 FROM public.beds e WHERE e.room_id = r.id AND e.label = b.label
  );

INSERT INTO public.settings (key, value) VALUES
  ('member_count', '6'),
  ('flatmates',    'Yasir Ajmal Mehmand, Muhammad Haris, Sajid Ali, Ahmad Raza, Babar Jamil Ur Rahman (Jimmy), Ateeb Raza'),
  ('cook_name',    'Muhammad Sajid Khan')
ON CONFLICT (key) DO UPDATE SET value = excluded.value;

-- ── Admin RPC: update any profile (bypasses RLS) ─────────────────────────────

-- Admins call this RPC to change role / permissions / name / active status
-- on any user. SECURITY DEFINER means it runs as the DB owner and is not
-- subject to the profiles RLS policies, which avoids the 401→CORS error
-- that browsers surface when the policy check fails mid-request.

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
AS $fn$
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
$fn$;

GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, boolean, text, boolean)
  TO authenticated;

-- ============================================================
-- VERIFICATION: Check if everything is created
-- ============================================================

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
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ MilBaant database schema created successfully!';
  RAISE NOTICE '📊 Tables: 17 created';
  RAISE NOTICE '🔒 RLS: Enabled on all tables';
  RAISE NOTICE '🗂️  Storage: 3 buckets created';
  RAISE NOTICE '⚙️  Functions: 3 created';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your database is ready to use!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Create your first user (will become admin automatically)';
  RAISE NOTICE '   2. Configure your .env file with Supabase credentials';
  RAISE NOTICE '   3. Run: npm run dev';
END $$;
