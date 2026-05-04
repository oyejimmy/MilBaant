-- ============================================================
-- MilBaant — Verify Bug Fixes Test (Task 3.9)
-- ============================================================
--
-- PURPOSE:
--   Re-run the bug condition exploration test from Task 1 on the
--   FIXED schema.sql to verify all 7 tests now PASS.
--
-- EXPECTED OUTCOME:
--   All 7 tests PASS (confirms bugs are fixed)
--
-- HOW TO USE:
--   1. Ensure database is initialized from FIXED supabase/schema.sql
--   2. Run this file in Supabase SQL Editor
--   3. Verify all tests show ✅ PASSED
--
-- ============================================================

-- ============================================================
-- TEST 1: Admin Self-Update Policy Check
-- Expected: ✅ PASS (qual does NOT contain "NOT is_admin()")
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
  IF policy_qual IS NOT NULL AND policy_qual NOT LIKE '%NOT%is_admin%' THEN
    test_passed := true;
  END IF;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 1 PASSED: profiles_self_update policy allows admin self-update';
    RAISE NOTICE '   Policy qual: %', policy_qual;
  ELSE
    RAISE NOTICE '❌ TEST 1 FAILED: profiles_self_update policy blocks admin self-update';
    RAISE NOTICE '   Counterexample: qual = %', policy_qual;
    RAISE NOTICE '   Expected: qual should be "(uid() = id)" without NOT is_admin()';
  END IF;
END $$;

-- ============================================================
-- TEST 2: Daily Menu Update Policies Count
-- Expected: ✅ PASS (count = 3)
-- ============================================================

DO $$
DECLARE
  policy_count integer;
  policy_names text;
  test_passed boolean := false;
BEGIN
  -- Count UPDATE policies on daily_menu table
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'daily_menu'
    AND cmd = 'UPDATE';
  
  -- Get policy names
  SELECT string_agg(policyname, ', ') INTO policy_names
  FROM pg_policies
  WHERE tablename = 'daily_menu'
    AND cmd = 'UPDATE';
  
  -- Test passes if count = 3 (three permissive policies)
  IF policy_count = 3 THEN
    test_passed := true;
  END IF;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 2 PASSED: daily_menu has 3 UPDATE policies';
    RAISE NOTICE '   Policies: %', policy_names;
  ELSE
    RAISE NOTICE '❌ TEST 2 FAILED: daily_menu has insufficient UPDATE policies';
    RAISE NOTICE '   Counterexample: policy_count = %', policy_count;
    RAISE NOTICE '   Policies found: %', policy_names;
    RAISE NOTICE '   Expected: 3 policies (creator/admin, cook, any-user)';
  END IF;
END $$;

-- ============================================================
-- TEST 3: Cook Requests Table Existence
-- Expected: ✅ PASS (table exists)
-- ============================================================

DO $$
DECLARE
  table_exists boolean := false;
  column_count integer;
  test_passed boolean := false;
BEGIN
  -- Check if cook_requests table exists
  SELECT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'cook_requests'
  ) INTO table_exists;
  
  -- Count columns if table exists
  IF table_exists THEN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cook_requests';
  END IF;
  
  -- Test passes if table exists
  IF table_exists THEN
    test_passed := true;
  END IF;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 3 PASSED: cook_requests table exists';
    RAISE NOTICE '   Columns: % columns found', column_count;
  ELSE
    RAISE NOTICE '❌ TEST 3 FAILED: cook_requests table does not exist';
    RAISE NOTICE '   Counterexample: table not found in public schema';
    RAISE NOTICE '   Expected: cook_requests table with proper structure';
  END IF;
END $$;

-- ============================================================
-- TEST 4: Cook Requests Updated_At Trigger
-- Expected: ✅ PASS (trigger exists)
-- ============================================================

DO $$
DECLARE
  trigger_exists boolean := false;
  test_passed boolean := false;
BEGIN
  -- Check if cook_requests_set_updated_at trigger exists
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
-- Expected: ✅ PASS (all policies have 'authenticated' role)
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
  IF total_policies > 0 AND policies_with_role = total_policies THEN
    test_passed := true;
  END IF;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 5 PASSED: All flat_fund/contribution policies have TO authenticated';
    RAISE NOTICE '   % of % policies have explicit role binding', policies_with_role, total_policies;
  ELSE
    RAISE NOTICE '❌ TEST 5 FAILED: Policies lack explicit role binding';
    RAISE NOTICE '   Counterexample: % of % policies have role binding', policies_with_role, total_policies;
    RAISE NOTICE '   Expected: All policies should have roles = {authenticated}';
  END IF;
END $$;

-- ============================================================
-- TEST 6: Avatars Storage UPDATE Policy
-- Expected: ✅ PASS (policy exists)
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
-- Expected: ✅ PASS (function exists)
-- ============================================================

DO $$
DECLARE
  function_exists boolean := false;
  function_security text;
  test_passed boolean := false;
BEGIN
  -- Check if admin_update_profile function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'admin_update_profile'
      AND pronamespace = 'public'::regnamespace
  ) INTO function_exists;
  
  -- Check if function is SECURITY DEFINER
  IF function_exists THEN
    SELECT 
      CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END
    INTO function_security
    FROM pg_proc
    WHERE proname = 'admin_update_profile'
      AND pronamespace = 'public'::regnamespace;
  END IF;
  
  -- Test passes if function exists
  IF function_exists THEN
    test_passed := true;
  END IF;
  
  IF test_passed THEN
    RAISE NOTICE '✅ TEST 7 PASSED: admin_update_profile() RPC function exists';
    RAISE NOTICE '   Security: %', function_security;
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
  RAISE NOTICE 'Bug Fix Verification Test Complete (Task 3.9)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'EXPECTED OUTCOME ON FIXED SCHEMA:';
  RAISE NOTICE '  All 7 tests should PASS (confirms bugs are fixed)';
  RAISE NOTICE '';
  RAISE NOTICE 'Review the test results above.';
  RAISE NOTICE '';
  RAISE NOTICE 'If all tests passed:';
  RAISE NOTICE '  ✅ Schema fixes are complete and verified';
  RAISE NOTICE '  ✅ Database initialized from schema.sql has all 7 fixes';
  RAISE NOTICE '  ✅ Ready to proceed to Task 3.10 (preservation tests)';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
