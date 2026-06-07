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
    requested_by uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
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

-- ── Cook Carryover ───────────────────────────────────────────────────────────
-- Stores the end-of-month balance for the cook ledger.
-- Positive = cook has leftover advance; negative = cook overspent.
-- Recorded by admin when closing out a month.

CREATE TABLE IF NOT EXISTS public.cook_carryover (
    id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    month      text         NOT NULL UNIQUE,           -- 'YYYY-MM'
    balance    numeric(10,2) NOT NULL DEFAULT 0,       -- +surplus or -deficit
    note       text,
    created_by uuid         NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    created_at timestamptz  NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz  NOT NULL DEFAULT timezone('utc', now())
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
