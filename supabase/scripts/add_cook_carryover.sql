-- Migration: Add cook_carryover table
-- Purpose: Track end-of-month cook ledger balance (positive = leftover, negative = overspent)
-- Run this once against your live Supabase database.

CREATE TABLE IF NOT EXISTS public.cook_carryover (
    id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    month      text          NOT NULL UNIQUE,            -- 'YYYY-MM'
    balance    numeric(10,2) NOT NULL DEFAULT 0,         -- +surplus or -deficit
    note       text,
    created_by uuid          NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
    created_at timestamptz   NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz   NOT NULL DEFAULT timezone('utc', now())
);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS cook_carryover_set_updated_at ON public.cook_carryover;
CREATE TRIGGER cook_carryover_set_updated_at
  BEFORE UPDATE ON public.cook_carryover
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for fast month lookups
CREATE INDEX IF NOT EXISTS cook_carryover_month_idx ON public.cook_carryover (month);

-- RLS
ALTER TABLE public.cook_carryover ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cook_carryover_select" ON public.cook_carryover;
CREATE POLICY "cook_carryover_select" ON public.cook_carryover
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cook_carryover_insert" ON public.cook_carryover;
CREATE POLICY "cook_carryover_insert" ON public.cook_carryover
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "cook_carryover_update" ON public.cook_carryover;
CREATE POLICY "cook_carryover_update" ON public.cook_carryover
  FOR UPDATE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "cook_carryover_delete" ON public.cook_carryover;
CREATE POLICY "cook_carryover_delete" ON public.cook_carryover
  FOR DELETE TO authenticated USING (public.is_admin());
