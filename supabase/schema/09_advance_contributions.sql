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
