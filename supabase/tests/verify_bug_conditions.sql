-- ============================================================
-- Quick Verification Script - Check Current Database State
-- ============================================================
-- Run this to quickly check which bugs exist in current database
-- ============================================================

\echo '═══════════════════════════════════════════════════════════'
\echo 'Bug Condition Verification'
\echo '═══════════════════════════════════════════════════════════'
\echo ''

-- Bug 1: Check profiles_self_update policy
\echo '1. Checking profiles_self_update policy...'
SELECT 
  CASE 
    WHEN qual LIKE '%NOT%is_admin%' THEN '❌ BUG EXISTS: Policy blocks admin self-update'
    ELSE '✅ FIXED: Policy allows admin self-update'
  END as status,
  qual as policy_definition
FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'profiles_self_update';

\echo ''

-- Bug 2: Check daily_menu UPDATE policies count
\echo '2. Checking daily_menu UPDATE policies...'
SELECT 
  CASE 
    WHEN COUNT(*) < 3 THEN '❌ BUG EXISTS: Only ' || COUNT(*) || ' UPDATE policy(ies)'
    ELSE '✅ FIXED: ' || COUNT(*) || ' UPDATE policies exist'
  END as status
FROM pg_policies
WHERE tablename = 'daily_menu' AND cmd = 'UPDATE';

\echo ''

-- Bug 3: Check cook_requests table
\echo '3. Checking cook_requests table...'
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cook_requests')
    THEN '✅ FIXED: cook_requests table exists'
    ELSE '❌ BUG EXISTS: cook_requests table missing'
  END as status;

\echo ''

-- Bug 4: Check cook_requests trigger
\echo '4. Checking cook_requests_set_updated_at trigger...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgrelid = 'public.cook_requests'::regclass 
        AND tgname = 'cook_requests_set_updated_at'
    )
    THEN '✅ FIXED: Trigger exists'
    ELSE '❌ BUG EXISTS: Trigger missing'
  END as status;

\echo ''

-- Bug 5: Check role bindings on flat_fund and contribution tables
\echo '5. Checking role bindings on flat_fund/contribution tables...'
SELECT 
  CASE 
    WHEN COUNT(*) FILTER (WHERE 'authenticated' = ANY(roles)) = COUNT(*)
    THEN '✅ FIXED: All ' || COUNT(*) || ' policies have TO authenticated'
    ELSE '❌ BUG EXISTS: ' || COUNT(*) FILTER (WHERE 'authenticated' = ANY(roles)) || ' of ' || COUNT(*) || ' policies have role binding'
  END as status
FROM pg_policies
WHERE tablename IN ('flat_fund_allocations', 'flat_fund_expenses', 'contribution_payments');

\echo ''

-- Bug 6: Check avatars_owner_update storage policy
\echo '6. Checking avatars_owner_update storage policy...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' AND policyname = 'avatars_owner_update'
    )
    THEN '✅ FIXED: Storage UPDATE policy exists'
    ELSE '❌ BUG EXISTS: Storage UPDATE policy missing'
  END as status;

\echo ''

-- Bug 7: Check admin_update_profile function
\echo '7. Checking admin_update_profile() RPC function...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'admin_update_profile' 
        AND pronamespace = 'public'::regnamespace
    )
    THEN '✅ FIXED: RPC function exists'
    ELSE '❌ BUG EXISTS: RPC function missing'
  END as status;

\echo ''
\echo '═══════════════════════════════════════════════════════════'
\echo 'Verification Complete'
\echo '═══════════════════════════════════════════════════════════'
