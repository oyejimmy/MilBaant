-- ============================================================
-- DELETE ALL DATA - MilBaant Database
-- ⚠️ WARNING: This will permanently delete ALL data from your database!
-- Run this ONLY if you want to completely reset your database.
-- ============================================================

-- ============================================================
-- STEP 1: Drop all RLS policies
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;

-- rooms
DROP POLICY IF EXISTS "rooms_select_authenticated" ON public.rooms;
DROP POLICY IF EXISTS "rooms_admin_modify" ON public.rooms;

-- beds
DROP POLICY IF EXISTS "beds_select_authenticated" ON public.beds;
DROP POLICY IF EXISTS "beds_admin_modify" ON public.beds;

-- bed_assignments
DROP POLICY IF EXISTS "bed_assignments_select_authenticated" ON public.bed_assignments;
DROP POLICY IF EXISTS "bed_assignments_admin_modify" ON public.bed_assignments;

-- expenses
DROP POLICY IF EXISTS "expenses_select_authenticated" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_authenticated" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_authenticated" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_authenticated" ON public.expenses;

-- expense_participants
DROP POLICY IF EXISTS "expense_participants_select_authenticated" ON public.expense_participants;
DROP POLICY IF EXISTS "expense_participants_insert" ON public.expense_participants;
DROP POLICY IF EXISTS "expense_participants_admin_delete" ON public.expense_participants;

-- announcements
DROP POLICY IF EXISTS "announcements_select_authenticated" ON public.announcements;
DROP POLICY IF EXISTS "announcements_admin_modify" ON public.announcements;

-- settings
DROP POLICY IF EXISTS "settings_select_authenticated" ON public.settings;
DROP POLICY IF EXISTS "settings_admin_modify" ON public.settings;

-- debt_settlements
DROP POLICY IF EXISTS "settlements_select_authenticated" ON public.debt_settlements;
DROP POLICY IF EXISTS "settlements_insert_authenticated" ON public.debt_settlements;
DROP POLICY IF EXISTS "settlements_delete_authenticated" ON public.debt_settlements;

-- rides
DROP POLICY IF EXISTS "rides_select_authenticated" ON public.rides;
DROP POLICY IF EXISTS "rides_insert_authenticated" ON public.rides;
DROP POLICY IF EXISTS "rides_delete_authenticated" ON public.rides;

-- ride_riders
DROP POLICY IF EXISTS "ride_riders_select_authenticated" ON public.ride_riders;
DROP POLICY IF EXISTS "ride_riders_insert_authenticated" ON public.ride_riders;
DROP POLICY IF EXISTS "ride_riders_delete_authenticated" ON public.ride_riders;

-- cook_advances
DROP POLICY IF EXISTS "cook_advances_select" ON public.cook_advances;
DROP POLICY IF EXISTS "cook_advances_insert_authenticated" ON public.cook_advances;
DROP POLICY IF EXISTS "cook_advances_delete_authenticated" ON public.cook_advances;

-- cook_purchases
DROP POLICY IF EXISTS "cook_purchases_select" ON public.cook_purchases;
DROP POLICY IF EXISTS "cook_purchases_insert_authenticated" ON public.cook_purchases;
DROP POLICY IF EXISTS "cook_purchases_delete_authenticated" ON public.cook_purchases;

-- daily_menu
DROP POLICY IF EXISTS "daily_menu_select" ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_insert_authenticated" ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_update_authenticated" ON public.daily_menu;
DROP POLICY IF EXISTS "daily_menu_delete_authenticated" ON public.daily_menu;

-- activity_logs
DROP POLICY IF EXISTS "activity_logs_select" ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert" ON public.activity_logs;

-- flat_fund_allocations
DROP POLICY IF EXISTS "flat_fund_alloc_select" ON public.flat_fund_allocations;
DROP POLICY IF EXISTS "flat_fund_alloc_insert" ON public.flat_fund_allocations;
DROP POLICY IF EXISTS "flat_fund_alloc_delete" ON public.flat_fund_allocations;

-- flat_fund_expenses
DROP POLICY IF EXISTS "flat_fund_exp_select" ON public.flat_fund_expenses;
DROP POLICY IF EXISTS "flat_fund_exp_insert" ON public.flat_fund_expenses;
DROP POLICY IF EXISTS "flat_fund_exp_delete" ON public.flat_fund_expenses;

-- contribution_payments
DROP POLICY IF EXISTS "contrib_payments_select" ON public.contribution_payments;
DROP POLICY IF EXISTS "contrib_payments_insert" ON public.contribution_payments;
DROP POLICY IF EXISTS "contrib_payments_delete" ON public.contribution_payments;

-- ============================================================
-- STEP 2: Drop all storage policies
-- ============================================================

-- bill-images
DROP POLICY IF EXISTS "bill_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "bill_images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "bill_images_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "bill_images_owner_delete" ON storage.objects;

-- payment-screenshots
DROP POLICY IF EXISTS "payment_screenshots_public_read" ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "payment_screenshots_owner_delete" ON storage.objects;

-- avatars
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_upsert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;

-- ============================================================
-- STEP 3: Delete all files from storage buckets
-- ============================================================

-- Delete all objects from bill-images bucket
DELETE FROM storage.objects WHERE bucket_id = 'bill-images';

-- Delete all objects from payment-screenshots bucket
DELETE FROM storage.objects WHERE bucket_id = 'payment-screenshots';

-- Delete all objects from avatars bucket
DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- ============================================================
-- STEP 4: Drop all storage buckets
-- ============================================================

DELETE FROM storage.buckets WHERE id IN ('bill-images', 'payment-screenshots', 'avatars');

-- ============================================================
-- STEP 5: Drop all triggers
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================
-- STEP 6: Drop all functions
-- ============================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.can_current_user_add_expenses() CASCADE;

-- ============================================================
-- STEP 7: Drop all tables (CASCADE will drop foreign keys)
-- ============================================================

DROP TABLE IF EXISTS public.contribution_payments CASCADE;
DROP TABLE IF EXISTS public.flat_fund_expenses CASCADE;
DROP TABLE IF EXISTS public.flat_fund_allocations CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.daily_menu CASCADE;
DROP TABLE IF EXISTS public.cook_purchases CASCADE;
DROP TABLE IF EXISTS public.cook_advances CASCADE;
DROP TABLE IF EXISTS public.ride_riders CASCADE;
DROP TABLE IF EXISTS public.rides CASCADE;
DROP TABLE IF EXISTS public.debt_settlements CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.expense_participants CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.bed_assignments CASCADE;
DROP TABLE IF EXISTS public.beds CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================
-- STEP 8: Delete all auth users (optional - be careful!)
-- ⚠️ WARNING: This will delete all user accounts!
-- Comment out the next line if you want to keep user accounts
-- ============================================================

-- DELETE FROM auth.users;

-- ============================================================
-- VERIFICATION: Check if everything is deleted
-- ============================================================

-- Check remaining tables
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check remaining functions
SELECT 
  proname as function_name
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

-- Check remaining storage buckets
SELECT id, name FROM storage.buckets;

-- ============================================================
-- RESULT: Database should be completely clean now!
-- ============================================================

-- If you see any tables/functions/buckets above, they were not part of
-- the MilBaant schema and should be reviewed manually.

RAISE NOTICE '✅ All MilBaant data has been deleted!';
RAISE NOTICE '⚠️  Run 02_complete_schema.sql to recreate the database structure.';
