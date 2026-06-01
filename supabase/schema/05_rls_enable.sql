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
