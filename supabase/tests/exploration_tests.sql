-- ============================================================
-- MilBaant — Bug Condition Exploration Tests
-- ============================================================
--
-- PURPOSE:
--   This file documents six SQL queries that confirm the existence of
--   six bugs in the ORIGINAL schema.sql (before any migrations or fixes).
--
--   HOW TO USE:
--   1. Run these queries in the Supabase SQL Editor against a database
--      initialised from the ORIGINAL schema.sql (before any migrations).
--   2. Each query should return the "EXPECTED FAILURE" result, which
--      confirms the bug exists on the unfixed schema.
--   3. After applying supabase_full_setup.sql, re-run each query and
--      verify it returns the "EXPECTED FIXED" result.
--
--   IMPORTANT:
--   - These are READ-ONLY queries against pg_policies, pg_trigger, and
--     pg_proc system catalogs. They do not modify any data.
--   - Run them one at a time in the Supabase SQL Editor.
--   - The "EXPECTED FAILURE" results below are the documented
--     counterexamples that prove each bug exists.
--
-- ============================================================


-- ============================================================
-- BUG 1 — profiles_self_update USING clause contains NOT is_admin()
-- ============================================================
--
-- ROOT CAUSE:
--   The original schema.sql created profiles_self_update with:
--     USING (auth.uid() = id AND NOT public.is_admin())
--   When an admin updates their own profile row, is_admin() returns true,
--   so NOT is_admin() is false, and the USING clause evaluates to false.
--   The result is a 403 that browsers surface as a CORS error.
--
-- QUERY:
SELECT qual
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'profiles_self_update';

-- EXPECTED FAILURE (unfixed schema):
--   qual = '((uid() = id) AND (NOT is_admin()))'
--   → The NOT is_admin() guard blocks admin self-updates entirely.
--   → Counterexample: admin user (id=X) calls
--       supabase.from('profiles').update({full_name: 'New'}).eq('id', X)
--     → returns 403/CORS error.
--
-- EXPECTED FIXED (after applying supabase_full_setup.sql):
--   qual = '(uid() = id)'
--   → No NOT is_admin() restriction. Admin self-update succeeds.


-- ============================================================
-- BUG 2 — daily_menu has only 1 UPDATE policy (not 3)
-- ============================================================
--
-- ROOT CAUSE:
--   The original schema.sql had a single update policy:
--     USING (auth.uid() = created_by OR public.is_admin())
--   Regular users saving breakfast preferences and the cook updating
--   dinner entries are neither the creator nor admin, so they get 403.
--
-- QUERY:
SELECT COUNT(*)
FROM pg_policies
WHERE tablename = 'daily_menu'
  AND cmd = 'UPDATE';

-- EXPECTED FAILURE (unfixed schema):
--   count = 1
--   → Only daily_menu_update_authenticated exists.
--   → Counterexample: regular user calls
--       supabase.from('daily_menu').update({notes: 'roti'}).eq('date', today)
--     → returns 403/CORS error (user is not the creator or admin).
--   → Counterexample: cook calls
--       supabase.from('daily_menu').update({dinner: 'biryani'}).eq('date', today)
--     → returns 403/CORS error (cook is not the creator or admin).
--
-- EXPECTED FIXED (after applying supabase_full_setup.sql):
--   count = 3
--   → Three permissive UPDATE policies exist:
--       daily_menu_update_creator_or_admin
--       daily_menu_update_cook
--       daily_menu_update_notes_any_user


-- ============================================================
-- BUG 3 — cook_requests_set_updated_at trigger is absent
-- ============================================================
--
-- ROOT CAUSE:
--   The original schema.sql did not include the cook_requests table or
--   its set_updated_at trigger. The client hook useCookReply was sending
--   updated_at in the UPDATE payload while the DB trigger also tried to
--   set the same column, causing a constraint/conflict error surfaced as
--   a CORS error. The trigger was added in migration
--   20260429_cook_requests.sql but was never backported to schema.sql.
--
-- QUERY:
SELECT tgname
FROM pg_trigger
WHERE tgrelid = 'public.cook_requests'::regclass
  AND tgname = 'cook_requests_set_updated_at';

-- EXPECTED FAILURE (unfixed schema):
--   0 rows returned
--   → The trigger does not exist on the cook_requests table.
--   → Counterexample: cook replies to a request (status + comment update)
--     → returns CORS/constraint error because the trigger is absent and
--       the client/trigger column ownership conflict cannot be resolved.
--
-- EXPECTED FIXED (after applying supabase_full_setup.sql):
--   1 row: tgname = 'cook_requests_set_updated_at'
--   → Trigger exists. updated_at is set server-side automatically.
--   → Client no longer sends updated_at in the payload (already fixed in
--     src/hooks/useCookRequests.ts).


-- ============================================================
-- BUG 4 — flat_fund_allocations, flat_fund_expenses,
--          contribution_payments policies lack TO authenticated
-- ============================================================
--
-- ROOT CAUSE:
--   The original schema.sql created policies for these three tables
--   without a TO clause:
--     CREATE POLICY "flat_fund_alloc_select" ON public.flat_fund_allocations
--       FOR SELECT USING (true);  -- no TO authenticated
--   Without TO authenticated, the policy applies to both authenticated
--   and anon roles. This causes unpredictable RLS evaluation: Supabase
--   may route authenticated requests through the anon policy path,
--   producing unexpected 403s or empty result sets.
--
-- QUERY:
SELECT tablename, policyname, roles
FROM pg_policies
WHERE tablename IN (
    'flat_fund_allocations',
    'flat_fund_expenses',
    'contribution_payments'
)
ORDER BY tablename, policyname;

-- EXPECTED FAILURE (unfixed schema):
--   roles = '{}' (empty array) for all rows
--   → No role binding on any of these policies.
--   → Counterexample: authenticated user fetches flat fund allocations
--     → may return empty result set or 403 due to anon role policy path.
--   → Counterexample: admin deletes a flat fund expense
--     → may fail because DELETE policy lacks OR public.is_admin() clause.
--
-- EXPECTED FIXED (after applying supabase_full_setup.sql):
--   roles = '{authenticated}' for all rows
--   → All policies are scoped to the authenticated role only.
--   → Anon access is blocked. Admin delete works via is_admin() check.


-- ============================================================
-- BUG 5 — admin_update_profile function does not exist
-- ============================================================
--
-- ROOT CAUSE:
--   The admin_update_profile SECURITY DEFINER function was added in
--   migration 20260429_admin_update_role.sql, but databases initialised
--   from the original schema.sql (before that migration) do not have it.
--   The useUpdateProfilePermissions hook calls:
--     supabase.rpc('admin_update_profile', ...)
--   If the function doesn't exist, Supabase returns a "function not
--   found" error.
--
-- QUERY:
SELECT proname
FROM pg_proc
WHERE proname = 'admin_update_profile';

-- EXPECTED FAILURE (unfixed schema — original schema.sql without migrations):
--   0 rows returned
--   → The admin_update_profile RPC does not exist.
--   → Counterexample: admin changes a user's role in the admin panel
--     → returns "function not found" error.
--   → Counterexample: admin deactivates a user
--     → returns "function not found" error.
--
-- EXPECTED FIXED (after applying supabase_full_setup.sql):
--   1 row: proname = 'admin_update_profile'
--   → Function exists, is SECURITY DEFINER, and is granted to
--     the authenticated role.


-- ============================================================
-- BUG 6 — avatars_owner_update storage policy is absent
-- ============================================================
--
-- ROOT CAUSE:
--   The original schema.sql created avatars_owner_upsert (INSERT) and
--   avatars_owner_delete (DELETE) policies for the avatars bucket, but
--   no UPDATE policy. When uploadAvatar in src/lib/storage.ts calls:
--     supabase.storage.from('avatars').upload(filePath, file, {upsert: true})
--   Supabase issues an UPDATE on the existing object. Without an UPDATE
--   policy, this is blocked with a 403 that browsers surface as a CORS
--   error.
--
-- QUERY:
SELECT policyname
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname = 'avatars_owner_update';

-- EXPECTED FAILURE (unfixed schema):
--   0 rows returned
--   → No UPDATE policy exists for the avatars bucket.
--   → Counterexample: user re-uploads their avatar to replace the
--     existing one (upsert: true)
--     → returns 403/CORS error because no UPDATE policy allows it.
--
-- EXPECTED FIXED (after applying supabase_full_setup.sql):
--   1 row: policyname = 'avatars_owner_update'
--   → UPDATE policy exists. Avatar replacement (upsert) succeeds for
--     the file owner. Cross-user avatar update is still blocked.


-- ============================================================
-- SUMMARY — Documented Counterexamples (Unfixed Schema)
-- ============================================================
--
-- Bug 1: qual shows '((uid() = id) AND (NOT is_admin()))'
--        → Admin self-update blocked by NOT is_admin() guard.
--
-- Bug 2: COUNT returns 1
--        → Only one UPDATE policy exists; cook/user daily_menu updates
--          blocked.
--
-- Bug 3: 0 rows
--        → cook_requests_set_updated_at trigger absent; cook reply
--          payload conflict causes CORS error.
--
-- Bug 4: roles = '{}' for all three tables
--        → Policies apply to anon role too; authenticated requests may
--          be routed through anon policy path.
--
-- Bug 5: 0 rows
--        → admin_update_profile RPC missing on databases initialised
--          from original schema.sql.
--
-- Bug 6: 0 rows
--        → No UPDATE policy for avatars bucket; avatar replacement
--          (upsert) blocked with 403.
--
-- ============================================================
-- After applying supabase_full_setup.sql, all six queries should
-- return the EXPECTED FIXED results documented above.
-- ============================================================
