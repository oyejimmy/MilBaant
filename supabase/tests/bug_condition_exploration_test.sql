-- ============================================================
-- MilBaant — Bug Condition Exploration Test (Task 1)
-- ============================================================
--
-- PURPOSE:
--   This test file verifies that 7 specific bugs exist in databases
--   initialized from the UNFIXED supabase/schema.sql file.
--
--   **CRITICAL**: These tests MUST FAIL on unfixed code - failure
--   confirms the bugs exist. DO NOT attempt to fix the test or code
--   when it fails.
--
--   **NOTE**: This test encodes the expected behavior - it will validate
--   the fix when it passes after implementation.
--
-- HOW TO USE:
--   1. Initialize a fresh database from UNFIXED supabase/schema.sql
--   2. Run this file in Supabase SQL Editor
--   3. Each test should FAIL (return false or 0 rows)
--   4. Document the counterexamples found
--   5. After fixing schema.sql, re-run and verify all tests PASS
--
-- EXPECTED OUTCOME ON UNFIXED SCHEMA:
--   All 7 tests FAIL (this proves the bugs exist)
--
-- ============================================================

-- ============================================================
-- TEST 1: Admin Self-Update Policy Check
-- Bug: profiles_self_update has "NOT is_admin()" restriction
-- Expected Failure: qual contains "NOT is_admin()"
-- ============================================================

DO $$
DECLARE
  policy_qual text;
  test_passed boolean := false;
BEGIN
  -- Get the USING clause of profiles_self_update policy
  SELECT qual INTO policy_qual
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND policyname = 'profiles_self_update';
  
  -- Test passes if qual does NOT contain "NOT is_admin()"
  -- On unfixed schema, this will FAIL because qual contains "NOT is_admin()"
  IF policy_qual IS NOT NULL AND policy_qual NOT LIKE '%NOT%is_admin%' THEN
    test_passed := true;
  END IF;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 1 PASSED: profiles_self_update policy allows admin self-update';
  ELSE
    RAISE NOTICE '❌ TEST 1 FAILED: profiles_self_update policy blocks admin self-update';
    RAISE NOTICE '   Counterexample: qual = %', policy_qual;
    RAISE NOTICE '   Expected: qual should be "(uid() = id)" without NOT is_admin()';
  END IF;
END $$;

-- ============================================================
-- TEST 2: Daily Menu Update Policies Count
-- Bug: Only 1 UPDATE policy exists instead of 3
-- Expected Failure: count = 1
-- ============================================================

DO $$
DECLARE
  policy_count integer;
  test_passed boolean := false;
BEGIN
  -- Count UPDATE policies on daily_menu table
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'daily_menu'
    AND cmd = 'UPDATE';
  
  -- Test passes if count = 3 (three permissive policies)
  -- On unfixed schema, this will FAIL because count = 1
  IF policy_count = 3 THEN
    test_passed := true;
  END IF;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 2 PASSED: daily_menu has 3 UPDATE policies';
  ELSE
    RAISE NOTICE '❌ TEST 2 FAILED: daily_menu has insufficient UPDATE policies';
    RAISE NOTICE '   Counterexample: policy_count = %', policy_count;
    RAISE NOTICE '   Expected: 3 policies (creator/admin, cook, any-user)';
  END IF;
END $$;

-- ============================================================
-- TEST 3: Cook Requests Table Existence
-- Bug: cook_requests table doesn't exist in base schema
-- Expected Failure: table not found
-- ============================================================

DO $$
DECLARE
  table_exists boolean := false;
  test_passed boolean := false;
BEGIN
  -- Check if cook_requests table exists
  SELECT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'cook_requests'
  ) INTO table_exists;
  
  -- Test passes if table exists
  -- On unfixed schema, this will FAIL because table doesn't exist
  IF table_exists THEN
    test_passed := true;
  END IF;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 3 PASSED: cook_requests table exists';
  ELSE
    RAISE NOTICE '❌ TEST 3 FAILED: cook_requests table does not exist';
    RAISE NOTICE '   Counterexample: table not found in public schema';
    RAISE NOTICE '   Expected: cook_requests table with proper structure';
  END IF;
END $$;

-- ============================================================
-- TEST 4: Cook Requests Updated_At Trigger
-- Bug: set_updated_at trigger not attached to cook_requests
-- Expected Failure: trigger not found
-- ============================================================

DO $$
DECLARE
  trigger_exists boolean := false;
  test_passed boolean := false;
BEGIN
  -- Check if cook_requests_set_updated_at trigger exists
  -- This will fail if cook_requests table doesn't exist
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid = 'public.cook_requests'::regclass
        AND tgname = 'cook_requests_set_updated_at'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
      test_passed := true;
    END IF;
  EXCEPTION
    WHEN undefined_table THEN
      trigger_exists := false;
      test_passed := false;
  END;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 4 PASSED: cook_requests_set_updated_at trigger exists';
  ELSE
    RAISE NOTICE '❌ TEST 4 FAILED: cook_requests_set_updated_at trigger does not exist';
    RAISE NOTICE '   Counterexample: trigger not found on cook_requests table';
    RAISE NOTICE '   Expected: trigger automatically sets updated_at on UPDATE';
  END IF;
END $$;

-- ============================================================
-- TEST 5: Flat Fund Role Bindings
-- Bug: Policies lack explicit "TO authenticated" role binding
-- Expected Failure: roles = '{}' (empty array)
-- ============================================================

DO $$
DECLARE
  policies_with_role integer := 0;
  total_policies integer := 0;
  test_passed boolean := false;
BEGIN
  -- Count policies on flat_fund and contribution tables
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE tablename IN (
    'flat_fund_allocations',
    'flat_fund_expenses',
    'contribution_payments'
  );
  
  -- Count policies with explicit 'authenticated' role binding
  SELECT COUNT(*) INTO policies_with_role
  FROM pg_policies
  WHERE tablename IN (
    'flat_fund_allocations',
    'flat_fund_expenses',
    'contribution_payments'
  )
  AND 'authenticated' = ANY(roles);
  
  -- Test passes if all policies have role binding
  -- On unfixed schema, this will FAIL because roles = '{}'
  IF total_policies > 0 AND policies_with_role = total_policies THEN
    test_passed := true;
  END IF;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 5 PASSED: All flat_fund/contribution policies have TO authenticated';
  ELSE
    RAISE NOTICE '❌ TEST 5 FAILED: Policies lack explicit role binding';
    RAISE NOTICE '   Counterexample: % of % policies have role binding', policies_with_role, total_policies;
    RAISE NOTICE '   Expected: All policies should have roles = {authenticated}';
  END IF;
END $$;

-- ============================================================
-- TEST 6: Avatars Storage UPDATE Policy
-- Bug: avatars_owner_update storage policy is missing
-- Expected Failure: policy not found
-- ============================================================

DO $$
DECLARE
  policy_exists boolean := false;
  test_passed boolean := false;
BEGIN
  -- Check if avatars_owner_update policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND policyname = 'avatars_owner_update'
  ) INTO policy_exists;
  
  -- Test passes if policy exists
  -- On unfixed schema, this will FAIL because policy doesn't exist
  IF policy_exists THEN
    test_passed := true;
  END IF;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 6 PASSED: avatars_owner_update storage policy exists';
  ELSE
    RAISE NOTICE '❌ TEST 6 FAILED: avatars_owner_update storage policy does not exist';
    RAISE NOTICE '   Counterexample: policy not found on storage.objects';
    RAISE NOTICE '   Expected: UPDATE policy for avatars bucket';
  END IF;
END $$;

-- ============================================================
-- TEST 7: Admin Update Profile RPC Function
-- Bug: admin_update_profile() function doesn't exist
-- Expected Failure: function not found
-- ============================================================

DO $$
DECLARE
  function_exists boolean := false;
  test_passed boolean := false;
BEGIN
  -- Check if admin_update_profile function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'admin_update_profile'
      AND pronamespace = 'public'::regnamespace
  ) INTO function_exists;
  
  -- Test passes if function exists
  -- On unfixed schema, this will FAIL because function doesn't exist
  IF function_exists THEN
    test_passed := true;
  END IF;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 7 PASSED: admin_update_profile() RPC function exists';
  ELSE
    RAISE NOTICE '❌ TEST 7 FAILED: admin_update_profile() RPC function does not exist';
    RAISE NOTICE '   Counterexample: function not found in public schema';
    RAISE NOTICE '   Expected: SECURITY DEFINER function for admin profile updates';
  END IF;
END $$;

-- ============================================================
-- SUMMARY
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Bug Condition Exploration Test Complete';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'EXPECTED OUTCOME ON UNFIXED SCHEMA:';
  RAISE NOTICE '  All 7 tests should FAIL (this proves the bugs exist)';
  RAISE NOTICE '';
  RAISE NOTICE 'EXPECTED OUTCOME ON FIXED SCHEMA:';
  RAISE NOTICE '  All 7 tests should PASS (this confirms the fix works)';
  RAISE NOTICE '';
  RAISE NOTICE 'Review the test results above to document counterexamples.';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
