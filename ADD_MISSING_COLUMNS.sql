-- ============================================================
-- Add Missing Columns and Tables - Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add last_date column to expenses table
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS last_date date;

-- Add comment to explain the column
COMMENT ON COLUMN public.expenses.last_date IS 'Optional end date for recurring expenses or billing period';

-- 2. Create daily_menu table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.daily_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  breakfast text,
  lunch text,
  dinner text,
  notes text,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Create index on date
CREATE INDEX IF NOT EXISTS daily_menu_date_idx ON public.daily_menu (date);

-- Enable RLS
ALTER TABLE public.daily_menu ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS policies for daily_menu
DROP POLICY IF EXISTS "daily_menu_select" ON public.daily_menu;
CREATE POLICY "daily_menu_select" ON public.daily_menu
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "daily_menu_insert_authenticated" ON public.daily_menu;
CREATE POLICY "daily_menu_insert_authenticated" ON public.daily_menu
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "daily_menu_update_authenticated" ON public.daily_menu;
CREATE POLICY "daily_menu_update_authenticated" ON public.daily_menu
  FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

DROP POLICY IF EXISTS "daily_menu_delete_authenticated" ON public.daily_menu;
CREATE POLICY "daily_menu_delete_authenticated" ON public.daily_menu
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- Add comment
COMMENT ON TABLE public.daily_menu IS 'Daily menu planning for breakfast, lunch, and dinner';

-- 4. Verify changes
SELECT 'expenses.last_date column' as check_item, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_schema = 'public' 
           AND table_name = 'expenses' 
           AND column_name = 'last_date'
       ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
UNION ALL
SELECT 'daily_menu table' as check_item,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_schema = 'public' 
           AND table_name = 'daily_menu'
       ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

