# Quick Reference Guide

## 🚀 Common Tasks

### Setup New Database
```sql
-- Run in Supabase SQL Editor
\i supabase/scripts/setup.sql
```

### Reset Database (⚠️ Deletes all data)
```sql
\i supabase/scripts/reset.sql
```

### Verify Database
```sql
\i supabase/scripts/verify.sql
```

### Apply a Migration
```sql
\i supabase/migrations/YYYYMMDD_description.sql
```

## 📁 File Locations

| What I Need | Where to Find It |
|-------------|------------------|
| Create tables | `schema/01_tables.sql` |
| Add indexes | `schema/02_indexes.sql` |
| Create functions | `schema/03_functions.sql` |
| Add triggers | `schema/04_triggers.sql` |
| RLS policies | `schema/06_rls_policies.sql` |
| Storage buckets | `schema/07_storage.sql` |
| Seed data | `schema/08_seed_data.sql` |
| Complete setup | `scripts/setup.sql` |
| Reset database | `scripts/reset.sql` |
| Verify setup | `scripts/verify.sql` |
| Migrations | `migrations/*.sql` |
| Tests | `tests/*.sql` |
| Documentation | `docs/*.md` |

## 🔧 Making Changes

### Adding a New Table

1. Edit `schema/01_tables.sql`:
```sql
CREATE TABLE IF NOT EXISTS public.my_new_table (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

2. Add indexes in `schema/02_indexes.sql`:
```sql
CREATE INDEX IF NOT EXISTS my_new_table_name_idx ON public.my_new_table (name);
```

3. Enable RLS in `schema/05_rls_enable.sql`:
```sql
ALTER TABLE public.my_new_table ENABLE ROW LEVEL SECURITY;
```

4. Add policies in `schema/06_rls_policies.sql`:
```sql
CREATE POLICY "my_new_table_select" ON public.my_new_table
  FOR SELECT TO authenticated USING (true);
```

5. Create migration in `migrations/`:
```sql
-- migrations/20260504_add_my_new_table.sql
CREATE TABLE IF NOT EXISTS public.my_new_table (...);
-- Add indexes, RLS, policies
```

### Adding a New Function

Edit `schema/03_functions.sql`:
```sql
CREATE OR REPLACE FUNCTION public.my_function()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT true;
$$;
```

### Adding a New RLS Policy

Edit `schema/06_rls_policies.sql`:
```sql
DROP POLICY IF EXISTS "my_policy_name" ON public.my_table;
CREATE POLICY "my_policy_name" ON public.my_table
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

## 🗂️ Database Schema Overview

### Core Tables
- `profiles` - User profiles and roles
- `rooms` - Flat room definitions
- `beds` - Bed assignments
- `bed_assignments` - User-to-bed mappings

### Financial
- `expenses` - Shared expenses
- `expense_participants` - Expense participants
- `debt_settlements` - Debt payments
- `flat_fund_allocations` - Flat fund contributions
- `flat_fund_expenses` - Flat fund expenses
- `contribution_payments` - Monthly contributions

### Cook
- `cook_advances` - Cook advance payments
- `cook_purchases` - Cook purchases
- `cook_requests` - User requests to cook
- `daily_menu` - Daily meal planning

### Other
- `rides` - Shared rides
- `ride_riders` - Ride participants
- `announcements` - Announcements
- `activity_logs` - Audit trail
- `settings` - App settings

## 🔒 Security Functions

```sql
-- Check if current user is admin
SELECT public.is_admin();

-- Check if current user is cook
SELECT public.is_cook();

-- Check if user can add expenses
SELECT public.can_current_user_add_expenses();

-- Admin update user profile (bypasses RLS)
SELECT public.admin_update_profile(
  target_user_id := 'uuid-here',
  p_role := 'admin',
  p_can_add_exp := true,
  p_full_name := 'New Name',
  p_is_active := true
);
```

## 💾 Storage Buckets

- `bill-images` - Expense bill images
- `payment-screenshots` - Payment proof images
- `avatars` - User profile pictures

## 🧪 Testing

```sql
-- Run all tests
\i supabase/tests/preservation_tests.sql
\i supabase/tests/verify_bug_fixes.sql

-- Run specific test
\i supabase/tests/bug_condition_exploration.sql
```

## 📊 Useful Queries

### Check RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Count Policies per Table
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename;
```

### List All Functions
```sql
SELECT proname, prosecdef 
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace;
```

### Check Storage Buckets
```sql
SELECT id, name, public 
FROM storage.buckets;
```

### View Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🆘 Troubleshooting

### RLS Blocking Access
```sql
-- Check current user
SELECT auth.uid();

-- Check user role
SELECT role FROM public.profiles WHERE id = auth.uid();

-- Check policies on table
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

### Function Not Found
```sql
-- List all functions
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;

-- Recreate function
\i supabase/schema/03_functions.sql
```

### Storage Upload Fails
```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'your-bucket';

-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'your-bucket';
```

## 📚 More Information

- Full documentation: `README.md`
- Migration guide: `MIGRATION_GUIDE.md`
- Schema files: `schema/*.sql`
- Test files: `tests/*.sql`
- Historical docs: `docs/*.md`

---

**Last Updated**: May 4, 2026
