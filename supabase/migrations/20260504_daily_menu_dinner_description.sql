-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: Add dinner_description column + ensure RLS allows any authenticated
--      user to update daily_menu (needed for breakfast prefs, dinner overrides)
-- Run this in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add the column (safe to run multiple times)
ALTER TABLE public.daily_menu
  ADD COLUMN IF NOT EXISTS dinner_description text;

-- 2. Back-fill from notes JSON if description was previously stored there
UPDATE public.daily_menu
SET    dinner_description = (notes::jsonb ->> 'dinnerDescription')
WHERE  notes IS NOT NULL
  AND  notes::text LIKE '%dinnerDescription%'
  AND  dinner_description IS NULL;

-- 3. Strip dinnerDescription out of notes JSON now it has its own column
UPDATE public.daily_menu
SET    notes = CASE
                 WHEN (notes::jsonb - 'dinnerDescription') = '{}'::jsonb THEN NULL
                 ELSE (notes::jsonb - 'dinnerDescription')::text
               END
WHERE  notes IS NOT NULL
  AND  notes::text LIKE '%dinnerDescription%';

-- 4. Recreate all daily_menu UPDATE policies so any authenticated user can update
--    (the "CORS" error is actually a 403 from RLS blocking the update)
DROP POLICY IF EXISTS "daily_menu_update_authenticated"    ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_creator_or_admin" ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_cook"             ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_notes_any_user"   ON public.daily_menu;

-- Allow any authenticated user to update (covers breakfast prefs, dinner, description)
CREATE POLICY "daily_menu_update_any_authenticated" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING     (true)
  WITH CHECK (true);

-- 5. Verify column exists
SELECT column_name, data_type
FROM   information_schema.columns
WHERE  table_name = 'daily_menu'
  AND  column_name = 'dinner_description';

-- 6. Verify policy exists
SELECT policyname, cmd, roles
FROM   pg_policies
WHERE  tablename = 'daily_menu'
ORDER  BY policyname;
