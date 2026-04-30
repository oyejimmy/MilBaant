-- ============================================================
-- Migration: Require admin activation for new user accounts
-- ============================================================
-- WHAT THIS DOES:
--   1. Updates handle_new_user() so new registrations get
--      is_active = FALSE by default (except the very first
--      user, who becomes admin and stays active).
--   2. Existing users are NOT affected — all current accounts
--      keep their current is_active value.
--
-- EFFECT:
--   - New user registers → is_active = false → blocked at login
--   - Admin goes to Admin page → toggles is_active = true → user can now sign in
--   - First-ever user (the admin) → is_active = true as before
-- ============================================================

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
    -- First user ever → admin; everyone else → regular user
    CASE WHEN existing_profiles = 0 THEN 'admin' ELSE 'user' END,
    -- Admin gets expense permission; others start without it
    CASE WHEN existing_profiles = 0 THEN true ELSE false END,
    -- Admin is immediately active; all other new accounts need admin approval
    CASE WHEN existing_profiles = 0 THEN true ELSE false END
  );

  RETURN NEW;
END;
$$;
