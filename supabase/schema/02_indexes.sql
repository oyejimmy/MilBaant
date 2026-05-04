-- ============================================================
-- MilBaant Database Schema - Indexes
-- ============================================================
-- PURPOSE: Create indexes for query optimization
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ── Expenses ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS expenses_date_idx                ON public.expenses (date);
CREATE INDEX IF NOT EXISTS expenses_category_idx            ON public.expenses (category);
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
  RAISE NOTICE '📊 Total indexes: 24';
END $$;
