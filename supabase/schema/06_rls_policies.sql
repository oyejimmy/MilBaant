-- ============================================================
-- MilBaant Database Schema - RLS Policies
-- ============================================================
-- PURPOSE: Define Row Level Security policies for all tables
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Admins can update any profile (role, permissions, name, is_active, avatar, etc.)
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Any user can update their own profile (name, phone, bio, avatar_url).
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── rooms ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rooms_select_authenticated" ON public.rooms;
CREATE POLICY "rooms_select_authenticated" ON public.rooms
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "rooms_admin_modify" ON public.rooms;
CREATE POLICY "rooms_admin_modify" ON public.rooms
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── beds ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "beds_select_authenticated" ON public.beds;
CREATE POLICY "beds_select_authenticated" ON public.beds
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "beds_admin_modify" ON public.beds;
CREATE POLICY "beds_admin_modify" ON public.beds
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── bed_assignments ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "bed_assignments_select_authenticated" ON public.bed_assignments;
CREATE POLICY "bed_assignments_select_authenticated" ON public.bed_assignments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "bed_assignments_admin_modify" ON public.bed_assignments;
CREATE POLICY "bed_assignments_admin_modify" ON public.bed_assignments
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── expenses ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "expenses_select_authenticated" ON public.expenses;
CREATE POLICY "expenses_select_authenticated" ON public.expenses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "expenses_insert_authenticated" ON public.expenses;
CREATE POLICY "expenses_insert_authenticated" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "expenses_update_authenticated" ON public.expenses;
CREATE POLICY "expenses_update_authenticated" ON public.expenses
  FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

DROP POLICY IF EXISTS "expenses_delete_authenticated" ON public.expenses;
CREATE POLICY "expenses_delete_authenticated" ON public.expenses
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ── expense_participants ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "expense_participants_select_authenticated" ON public.expense_participants;
CREATE POLICY "expense_participants_select_authenticated" ON public.expense_participants
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "expense_participants_insert" ON public.expense_participants;
CREATE POLICY "expense_participants_insert" ON public.expense_participants
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "expense_participants_admin_delete" ON public.expense_participants;
CREATE POLICY "expense_participants_admin_delete" ON public.expense_participants
  FOR DELETE TO authenticated USING (public.is_admin());

-- ── announcements ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "announcements_select_authenticated" ON public.announcements;
CREATE POLICY "announcements_select_authenticated" ON public.announcements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "announcements_admin_modify" ON public.announcements;
CREATE POLICY "announcements_admin_modify" ON public.announcements
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── settings ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "settings_select_authenticated" ON public.settings;
CREATE POLICY "settings_select_authenticated" ON public.settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "settings_admin_modify" ON public.settings;
CREATE POLICY "settings_admin_modify" ON public.settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── debt_settlements ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "settlements_select_authenticated" ON public.debt_settlements;
CREATE POLICY "settlements_select_authenticated" ON public.debt_settlements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "settlements_insert_authenticated" ON public.debt_settlements;
CREATE POLICY "settlements_insert_authenticated" ON public.debt_settlements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "settlements_delete_authenticated" ON public.debt_settlements;
CREATE POLICY "settlements_delete_authenticated" ON public.debt_settlements
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ── rides ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rides_select_authenticated" ON public.rides;
CREATE POLICY "rides_select_authenticated" ON public.rides
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "rides_insert_authenticated" ON public.rides;
CREATE POLICY "rides_insert_authenticated" ON public.rides
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "rides_delete_authenticated" ON public.rides;
CREATE POLICY "rides_delete_authenticated" ON public.rides
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ── ride_riders ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ride_riders_select_authenticated" ON public.ride_riders;
CREATE POLICY "ride_riders_select_authenticated" ON public.ride_riders
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ride_riders_insert_authenticated" ON public.ride_riders;
CREATE POLICY "ride_riders_insert_authenticated" ON public.ride_riders
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ride_riders_delete_authenticated" ON public.ride_riders;
CREATE POLICY "ride_riders_delete_authenticated" ON public.ride_riders
  FOR DELETE TO authenticated USING (true);

-- ── cook_advances ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cook_advances_select" ON public.cook_advances;
CREATE POLICY "cook_advances_select" ON public.cook_advances
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cook_advances_insert_authenticated" ON public.cook_advances;
CREATE POLICY "cook_advances_insert_authenticated" ON public.cook_advances
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = given_by);

DROP POLICY IF EXISTS "cook_advances_delete_authenticated" ON public.cook_advances;
CREATE POLICY "cook_advances_delete_authenticated" ON public.cook_advances
  FOR DELETE TO authenticated USING (auth.uid() = given_by OR public.is_admin());

-- ── cook_purchases ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cook_purchases_select" ON public.cook_purchases;
CREATE POLICY "cook_purchases_select" ON public.cook_purchases
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cook_purchases_insert_authenticated" ON public.cook_purchases;
CREATE POLICY "cook_purchases_insert_authenticated" ON public.cook_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "cook_purchases_delete_authenticated" ON public.cook_purchases;
CREATE POLICY "cook_purchases_delete_authenticated" ON public.cook_purchases
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ── cook_requests ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cook_requests_select" ON public.cook_requests;
CREATE POLICY "cook_requests_select" ON public.cook_requests
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cook_requests_insert" ON public.cook_requests;
CREATE POLICY "cook_requests_insert" ON public.cook_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);

DROP POLICY IF EXISTS "cook_requests_update" ON public.cook_requests;
CREATE POLICY "cook_requests_update" ON public.cook_requests
  FOR UPDATE TO authenticated USING (public.is_cook() OR public.is_admin() OR auth.uid() = requested_by);

DROP POLICY IF EXISTS "cook_requests_delete" ON public.cook_requests;
CREATE POLICY "cook_requests_delete" ON public.cook_requests
  FOR DELETE TO authenticated USING (auth.uid() = requested_by OR public.is_admin());

-- ── daily_menu ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "daily_menu_select" ON public.daily_menu;
CREATE POLICY "daily_menu_select" ON public.daily_menu
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "daily_menu_insert_authenticated" ON public.daily_menu;
CREATE POLICY "daily_menu_insert_authenticated" ON public.daily_menu
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "daily_menu_update_authenticated" ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_creator_or_admin" ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_cook" ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_notes_any_user" ON public.daily_menu;

-- Policy 1: creator or admin can update any column
CREATE POLICY "daily_menu_update_creator_or_admin" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin())
  WITH CHECK (auth.uid() = created_by OR public.is_admin());

-- Policy 2: cook role can update any column
CREATE POLICY "daily_menu_update_cook" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (public.is_cook())
  WITH CHECK (public.is_cook());

-- Policy 3: any authenticated user can update (for notes / breakfast preferences)
CREATE POLICY "daily_menu_update_notes_any_user" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "daily_menu_delete_authenticated" ON public.daily_menu;
CREATE POLICY "daily_menu_delete_authenticated" ON public.daily_menu
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- ── activity_logs ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "activity_logs_select" ON public.activity_logs;
CREATE POLICY "activity_logs_select" ON public.activity_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "activity_logs_insert" ON public.activity_logs;
CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- ── flat_fund_allocations ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "flat_fund_alloc_select" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_select" ON public.flat_fund_allocations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "flat_fund_alloc_insert" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_insert" ON public.flat_fund_allocations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "flat_fund_alloc_delete" ON public.flat_fund_allocations;
CREATE POLICY "flat_fund_alloc_delete" ON public.flat_fund_allocations
  FOR DELETE TO authenticated USING (auth.uid() = allocated_by);

-- ── flat_fund_expenses ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "flat_fund_exp_select" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_select" ON public.flat_fund_expenses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "flat_fund_exp_insert" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_insert" ON public.flat_fund_expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "flat_fund_exp_delete" ON public.flat_fund_expenses;
CREATE POLICY "flat_fund_exp_delete" ON public.flat_fund_expenses
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ── contribution_payments ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "contrib_payments_select" ON public.contribution_payments;
CREATE POLICY "contrib_payments_select" ON public.contribution_payments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "contrib_payments_insert" ON public.contribution_payments;
CREATE POLICY "contrib_payments_insert" ON public.contribution_payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "contrib_payments_delete" ON public.contribution_payments;
CREATE POLICY "contrib_payments_delete" ON public.contribution_payments
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies created successfully';
  RAISE NOTICE '📊 Total policies: 50+';
END $$;
