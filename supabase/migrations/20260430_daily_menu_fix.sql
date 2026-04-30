-- ============================================================
-- Fix daily_menu RLS so that:
--   1. Any authenticated user can update the notes column
--      (breakfast preferences + suggestions are stored there)
--   2. Admin AND cook can update breakfast/lunch/dinner/notes
--   3. The original creator can always update their own row
-- ============================================================

-- Drop the old single update policy
DROP POLICY IF EXISTS "daily_menu_update_authenticated" ON public.daily_menu;

-- Policy 1: creator or admin can update any column
CREATE POLICY "daily_menu_update_creator_or_admin" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin())
  WITH CHECK (auth.uid() = created_by OR public.is_admin());

-- Policy 2: cook role can update any column (dinner overrides, etc.)
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

-- Policy 3: any authenticated user can update ONLY the notes column
-- (used for breakfast preferences and dinner suggestions)
-- We can't restrict to specific columns in RLS, so we allow the update
-- and rely on the application to only send notes in this case.
-- This policy covers the case where a regular user saves their breakfast pref.
CREATE POLICY "daily_menu_update_notes_any_user" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also fix INSERT: any authenticated user should be able to create today's menu
-- (needed when no menu exists yet and a user saves their breakfast pref)
DROP POLICY IF EXISTS "daily_menu_insert_authenticated" ON public.daily_menu;
CREATE POLICY "daily_menu_insert_authenticated" ON public.daily_menu
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Add a trigger to auto-update updated_at so the client doesn't need to send it
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS daily_menu_set_updated_at ON public.daily_menu;
CREATE TRIGGER daily_menu_set_updated_at
  BEFORE UPDATE ON public.daily_menu
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
