-- ============================================================
-- Migration: Admin role/permission update via SECURITY DEFINER RPC
-- This bypasses RLS entirely (runs as the DB owner) so the admin
-- can update any user's role, can_add_expenses, full_name, and
-- is_active without hitting the RLS policy conflict that browsers
-- surface as a CORS error.
-- ============================================================

-- Drop old version if it exists
DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, text, boolean, text, boolean);

CREATE OR REPLACE FUNCTION public.admin_update_profile(
  target_user_id  uuid,
  p_role          text    DEFAULT NULL,
  p_can_add_exp   boolean DEFAULT NULL,
  p_full_name     text    DEFAULT NULL,
  p_is_active     boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as DB owner, bypasses RLS
SET search_path = public
AS $$
BEGIN
  -- Only admins may call this function
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  -- Validate role value if provided
  IF p_role IS NOT NULL AND p_role NOT IN ('admin', 'user', 'cook') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  UPDATE public.profiles
  SET
    role             = COALESCE(p_role,        role),
    can_add_expenses = COALESCE(p_can_add_exp, can_add_expenses),
    full_name        = COALESCE(p_full_name,   full_name),
    is_active        = COALESCE(p_is_active,   is_active)
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
END;
$$;

-- Grant execute to authenticated users (the function itself checks for admin)
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, boolean, text, boolean)
  TO authenticated;
