-- Migration: Fix expenses_category_check constraint
-- The live DB constraint is missing newer categories added to the frontend.
-- Run this once in your Supabase SQL Editor.

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_category_check;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_category_check
  CHECK (category IN (
    'gas_bill',
    'light_bill',
    'cook_salary',
    'kitchen_daily',
    'water_roti',
    'meat',
    'maintenance',
    'pcc_grocery',
    'weekend_meal'
  ));
