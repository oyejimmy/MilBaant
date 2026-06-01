-- ============================================================
-- MilBaant Database - Verification Script
-- ============================================================
-- PURPOSE: Verify that the database is correctly configured
-- HOW TO RUN: Paste this entire file in Supabase SQL Editor
-- ============================================================

-- ── Check Extensions ─────────────────────────────────────────────────────────

SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname = 'pgcrypto';

-- ── Check Tables ─────────────────────────────────────────────────────────────

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ── Check Table Counts ───────────────────────────────────────────────────────

SELECT 
  'profiles' as table_name,
  COUNT(*) as row_count
FROM public.profiles
UNION ALL
SELECT 'rooms', COUNT(*) FROM public.rooms
UNION ALL
SELECT 'beds', COUNT(*) FROM public.beds
UNION ALL
SELECT 'bed_assignments', COUNT(*) FROM public.bed_assignments
UNION ALL
SELECT 'expenses', COUNT(*) FROM public.expenses
UNION ALL
SELECT 'expense_participants', COUNT(*) FROM public.expense_participants
UNION ALL
SELECT 'announcements', COUNT(*) FROM public.announcements
UNION ALL
SELECT 'settings', COUNT(*) FROM public.settings
UNION ALL
SELECT 'debt_settlements', COUNT(*) FROM public.debt_settlements
UNION ALL
SELECT 'rides', COUNT(*) FROM public.rides
UNION ALL
SELECT 'ride_riders', COUNT(*) FROM public.ride_riders
UNION ALL
SELECT 'cook_advances', COUNT(*) FROM public.cook_advances
UNION ALL
SELECT 'cook_purchases', COUNT(*) FROM public.cook_purchases
UNION ALL
SELECT 'cook_requests', COUNT(*) FROM public.cook_requests
UNION ALL
SELECT 'daily_menu', COUNT(*) FROM public.daily_menu
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM public.activity_logs
UNION ALL
SELECT 'flat_fund_allocations', COUNT(*) FROM public.flat_fund_allocations
UNION ALL
SELECT 'flat_fund_expenses', COUNT(*) FROM public.flat_fund_expenses
UNION ALL
SELECT 'contribution_payments', COUNT(*) FROM public.contribution_payments
ORDER BY table_name;

-- ── Check Indexes ────────────────────────────────────────────────────────────

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ── Check Functions ──────────────────────────────────────────────────────────

SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

-- ── Check Triggers ───────────────────────────────────────────────────────────

SELECT 
  trigger_schema,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ── Check RLS Policies ───────────────────────────────────────────────────────

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ── Check RLS Policy Counts ──────────────────────────────────────────────────

SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ── Check Storage Buckets ────────────────────────────────────────────────────

SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
ORDER BY name;

-- ── Check Storage Policies ───────────────────────────────────────────────────

SELECT 
  policyname,
  bucket_id,
  roles
FROM storage.policies
ORDER BY bucket_id, policyname;

-- ── Check Settings ───────────────────────────────────────────────────────────

SELECT 
  key,
  value
FROM public.settings
ORDER BY key;

-- ── Check Constraints ────────────────────────────────────────────────────────

SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'CHECK', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================
-- Summary Report
-- ============================================================

DO $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
  policy_count INTEGER;
  bucket_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM pg_tables 
  WHERE schemaname = 'public';
  
  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc 
  WHERE pronamespace = 'public'::regnamespace;
  
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  -- Count buckets
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets;
  
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Database Verification Summary';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Database Objects:';
  RAISE NOTICE '   • Tables: % (expected: 17)', table_count;
  RAISE NOTICE '   • Indexes: % (expected: 24+)', index_count;
  RAISE NOTICE '   • Functions: % (expected: 5)', function_count;
  RAISE NOTICE '   • Triggers: % (expected: 3)', trigger_count;
  RAISE NOTICE '   • RLS Policies: % (expected: 50+)', policy_count;
  RAISE NOTICE '   • Storage Buckets: % (expected: 3)', bucket_count;
  RAISE NOTICE '';
  
  IF table_count = 17 AND function_count >= 5 AND trigger_count >= 3 AND policy_count >= 50 AND bucket_count = 3 THEN
    RAISE NOTICE '✅ All checks passed! Database is correctly configured.';
  ELSE
    RAISE NOTICE '⚠️  Some counts do not match expected values.';
    RAISE NOTICE '   Please review the detailed output above.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
