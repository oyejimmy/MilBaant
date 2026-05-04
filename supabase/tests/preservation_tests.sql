-- =============================================================================
-- PRESERVATION PROPERTY TESTS (P2-A through P2-F)
-- Property 2: Non-Buggy Operations Unchanged After Fix
-- =============================================================================
--
-- PURPOSE:
--   These tests verify that operations which currently work correctly (or are
--   expected to work correctly after the fix) remain unchanged. They serve as
--   post-fix regression checks to confirm no unintended side effects were
--   introduced by the six bug fixes.
--
-- USAGE:
--   Run these queries in the Supabase SQL Editor (or via psql) against your
--   database. Compare the actual output to the EXPECTED PASS result documented
--   in each section.
--
-- WHEN TO RUN:
--   - After applying supabase_full_setup.sql (primary use case — regression check)
--   - P2-E can also be run on the UNFIXED schema as a baseline invariant check
--   - P2-A, P2-B, P2-C, P2-D, P2-F are POST-FIX only (see notes per test)
--
-- VALIDATES: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
-- =============================================================================


-- =============================================================================
-- P2-A: Non-admin self-update policy still uses auth.uid() = id
--       (no NOT is_admin() restriction)
-- =============================================================================
-- PRESERVATION REQUIREMENT (3.1):
--   Non-admin users must still be able to update their own profile row.
--   The fix removes NOT is_admin() from profiles_self_update, but the core
--   auth.uid() = id condition must remain intact so non-admins are not affected.
--
-- EXPECTED PASS (after fix):
--   qual = '(uid() = id)'  — contains only the uid check, no NOT is_admin()
--
-- NOTE: On UNFIXED schema this will show NOT is_admin() in the qual column —
--       that is the Bug 1 condition being fixed. This test is a POST-FIX
--       regression check confirming the fix was applied correctly and that
--       non-admin self-update is preserved.

SELECT qual
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'profiles_self_update';


-- =============================================================================
-- P2-B: No public-schema policy accidentally applies to the anon role
-- =============================================================================
-- PRESERVATION REQUIREMENT (3.2):
--   Unauthenticated (anon) requests to any protected table must continue to be
--   rejected. All policies on protected tables must include TO authenticated.
--   The only intentional exception is activity_logs, which has an open insert
--   policy for audit trail purposes.
--
-- EXPECTED PASS (after fix):
--   COUNT = 0  — no policies with empty roles on protected tables
--               (activity_logs is excluded from the check intentionally)
--
-- NOTE: On UNFIXED schema this will return > 0 because the flat_fund_allocations,
--       flat_fund_expenses, and contribution_payments policies lack TO authenticated
--       (that is Bug 4). This test is a POST-FIX regression check confirming
--       all policies are properly scoped to the authenticated role.

SELECT COUNT(*)
FROM pg_policies
WHERE schemaname = 'public'
  AND roles = '{}'
  AND tablename NOT IN ('activity_logs');


-- =============================================================================
-- P2-C: daily_menu_update_notes_any_user covers all columns
--       (application layer enforces column-level restriction)
-- =============================================================================
-- PRESERVATION REQUIREMENT (3.3):
--   Regular users (not cook, not admin) must be allowed to update daily_menu
--   rows at the RLS level. Column-level restrictions (e.g. preventing regular
--   users from changing meal fields) are enforced by the application layer,
--   not by RLS. The permissive policy must have qual = 'true' and
--   with_check = 'true' to cover all columns.
--
-- EXPECTED PASS (after fix):
--   qual = 'true', with_check = 'true'
--
-- NOTE: This policy does not exist on the UNFIXED schema — it is created by
--       the Bug 2 fix. This test is a POST-FIX regression check confirming
--       the policy was created with the correct (fully permissive) conditions
--       so that application-layer column restrictions are not bypassed by RLS.

SELECT qual, with_check
FROM pg_policies
WHERE tablename = 'daily_menu'
  AND policyname = 'daily_menu_update_notes_any_user';


-- =============================================================================
-- P2-D: flat_fund DELETE still requires ownership or admin
-- =============================================================================
-- PRESERVATION REQUIREMENT (3.5):
--   Admins must continue to be able to delete flat fund allocations and expenses
--   via the is_admin() check. Regular users can only delete rows they created
--   (allocated_by = auth.uid()). This ownership + admin guard must be preserved
--   after the Bug 4 fix adds TO authenticated to these policies.
--
-- EXPECTED PASS (after fix):
--   qual contains both 'allocated_by' AND 'is_admin()'
--   e.g. '((uid() = allocated_by) OR is_admin())'
--
-- NOTE: On UNFIXED schema the DELETE policy may lack the OR is_admin() clause
--       (that is part of Bug 4). This test is a POST-FIX regression check
--       confirming the DELETE policy was corrected to include both conditions.

SELECT qual
FROM pg_policies
WHERE tablename = 'flat_fund_allocations'
  AND cmd = 'DELETE';


-- =============================================================================
-- P2-E: handle_new_user trigger still exists on auth.users
-- =============================================================================
-- PRESERVATION REQUIREMENT (3.7):
--   When the first user registers, they must automatically be assigned the
--   admin role via the on_auth_user_created trigger. This trigger must exist
--   on auth.users both before and after the fix is applied.
--
-- EXPECTED PASS (both unfixed and fixed):
--   tgname = 'on_auth_user_created'  — 1 row returned
--
-- NOTE: This trigger should exist on BOTH the unfixed and fixed schemas.
--       It is a baseline invariant check — if this returns 0 rows on either
--       schema, the first-user admin assignment feature is broken regardless
--       of the six bug fixes. This is the only P2 test that can be used as
--       a pre-fix baseline verification.

SELECT tgname
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';


-- =============================================================================
-- P2-F: admin_update_profile still validates role
--       (function body contains exception text for invalid roles)
-- =============================================================================
-- PRESERVATION REQUIREMENT (3.8):
--   When an admin calls admin_update_profile with an invalid role value, the
--   function must raise an exception ('Invalid role: <value>') without modifying
--   any row. This validation behavior must be preserved after the Bug 5 fix
--   creates/replaces the function.
--
-- EXPECTED PASS (after fix):
--   prosrc contains the string 'Invalid role: %'
--   (the % is the format placeholder for the RAISE EXCEPTION call)
--
-- NOTE: On UNFIXED schema (original schema.sql without migrations) this query
--       returns 0 rows because admin_update_profile does not exist — that is
--       Bug 5. This test is a POST-FIX regression check confirming the function
--       was created with the correct role validation logic intact.

SELECT prosrc
FROM pg_proc
WHERE proname = 'admin_update_profile';


-- =============================================================================
-- SUMMARY: Which tests can be run on unfixed vs post-fix schema
-- =============================================================================
--
-- ┌───────┬──────────────────────────────────────────────┬──────────┬───────────┐
-- │ Test  │ Description                                  │ Unfixed  │ Post-fix  │
-- ├───────┼──────────────────────────────────────────────┼──────────┼───────────┤
-- │ P2-A  │ profiles_self_update has no NOT is_admin()   │ FAILS*   │ PASSES ✓  │
-- │ P2-B  │ No anon-accessible policies on public tables │ FAILS*   │ PASSES ✓  │
-- │ P2-C  │ daily_menu_update_notes_any_user qual=true   │ FAILS*   │ PASSES ✓  │
-- │ P2-D  │ flat_fund DELETE requires ownership or admin │ FAILS*   │ PASSES ✓  │
-- │ P2-E  │ on_auth_user_created trigger exists          │ PASSES ✓ │ PASSES ✓  │
-- │ P2-F  │ admin_update_profile validates role          │ FAILS*   │ PASSES ✓  │
-- └───────┴──────────────────────────────────────────────┴──────────┴───────────┘
--
-- * FAILS on unfixed schema because the condition being tested is part of the
--   bug being fixed (P2-A: Bug 1, P2-B: Bug 4, P2-C: Bug 2, P2-D: Bug 4,
--   P2-F: Bug 5). These tests are designed as POST-FIX regression checks.
--
-- P2-E is the only test that serves as both a pre-fix baseline and a post-fix
-- regression check. If P2-E fails on either schema, the first-user admin
-- assignment feature is broken independently of the six bug fixes.
--
-- Run all six P2 tests after applying supabase_full_setup.sql to confirm:
--   1. All six bug fixes were applied correctly (P2-A, P2-B, P2-C, P2-D, P2-F)
--   2. No regressions were introduced (all six pass)
--   3. The baseline trigger invariant is preserved (P2-E)
-- =============================================================================
