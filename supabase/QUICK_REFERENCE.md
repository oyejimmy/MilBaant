# ⚡ Quick Reference - Database Scripts

## 🎯 Which Script Should I Run?

### 🆕 First Time Setup
```sql
-- Run: 02_complete_schema.sql
```
Creates everything from scratch. Safe to run multiple times.

---

### 🔄 Complete Reset (Delete + Recreate)
```sql
-- Run: 00_RESET_DATABASE.sql
```
⚠️ **WARNING:** Deletes ALL data, then recreates schema.

---

### 🗑️ Delete Everything
```sql
-- Run: 01_delete_all_data.sql
```
⚠️ **WARNING:** Only deletes. Must run `02_complete_schema.sql` after!

---

## 📝 How to Run Scripts

### Method 1: Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard**
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste script content
6. Click **Run** (or press Ctrl+Enter)
7. Wait for completion
8. Check for success message

### Method 2: Supabase CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run script
supabase db push --file supabase/02_complete_schema.sql
```

### Method 3: psql (Advanced)

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run script
\i supabase/02_complete_schema.sql
```

---

## 🚨 Common Issues & Fixes

### Issue: "permission denied for schema public"
**Fix:** You need to be the database owner. Use Supabase Dashboard SQL Editor.

### Issue: "relation already exists"
**Fix:** This is normal! The script is idempotent (safe to re-run).

### Issue: "function does not exist"
**Fix:** Run the complete schema script: `02_complete_schema.sql`

### Issue: First user is not admin
**Fix:** 
```sql
UPDATE public.profiles 
SET role = 'admin', can_add_expenses = true 
WHERE email = 'your-email@example.com';
```

### Issue: Can't upload images
**Fix:** Check storage buckets exist:
```sql
SELECT * FROM storage.buckets;
```
If empty, run `02_complete_schema.sql` again.

---

## ✅ Verification Checklist

After running any script, verify:

```sql
-- 1. Check tables (should be 17)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Check functions (should be 3)
SELECT COUNT(*) FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace;

-- 3. Check storage buckets (should be 3)
SELECT COUNT(*) FROM storage.buckets;

-- 4. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;
-- Should return 0 rows

-- 5. Check seed data
SELECT COUNT(*) FROM public.rooms; -- Should be 9
SELECT COUNT(*) FROM public.beds;  -- Should be 6
SELECT COUNT(*) FROM public.settings; -- Should be 3
```

---

## 🎯 Quick Commands

### Get your user ID
```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

### Make yourself admin
```sql
UPDATE public.profiles 
SET role = 'admin', can_add_expenses = true 
WHERE id = 'YOUR_USER_ID';
```

### Check your role
```sql
SELECT id, full_name, role, can_add_expenses, is_active 
FROM public.profiles 
WHERE id = auth.uid();
```

### List all users
```sql
SELECT p.full_name, p.role, p.can_add_expenses, p.is_active, u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.full_name;
```

### Count records in all tables
```sql
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL SELECT 'expenses', COUNT(*) FROM public.expenses
UNION ALL SELECT 'announcements', COUNT(*) FROM public.announcements
UNION ALL SELECT 'rides', COUNT(*) FROM public.rides
UNION ALL SELECT 'debt_settlements', COUNT(*) FROM public.debt_settlements
UNION ALL SELECT 'cook_advances', COUNT(*) FROM public.cook_advances
UNION ALL SELECT 'cook_purchases', COUNT(*) FROM public.cook_purchases
UNION ALL SELECT 'daily_menu', COUNT(*) FROM public.daily_menu
UNION ALL SELECT 'activity_logs', COUNT(*) FROM public.activity_logs
UNION ALL SELECT 'flat_fund_allocations', COUNT(*) FROM public.flat_fund_allocations
UNION ALL SELECT 'flat_fund_expenses', COUNT(*) FROM public.flat_fund_expenses
UNION ALL SELECT 'contribution_payments', COUNT(*) FROM public.contribution_payments
ORDER BY table_name;
```

---

## 🔐 Security Quick Check

### Test RLS policies
```sql
-- As regular user, try to update another user's profile (should fail)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id != auth.uid();
-- Expected: 0 rows updated (blocked by RLS)

-- As admin, try to update any profile (should work)
UPDATE public.profiles 
SET full_name = full_name 
WHERE id = 'ANY_USER_ID';
-- Expected: 1 row updated (if you're admin)
```

### Test is_admin() function
```sql
SELECT public.is_admin();
-- Expected: true (if you're admin), false (if not)
```

### Check storage policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
-- Expected: Multiple policies for each bucket
```

---

## 📊 Database Stats

### Get database size
```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

### Get table sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Get storage usage
```sql
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
GROUP BY bucket_id;
```

---

## 🔄 Backup & Restore

### Backup (using Supabase Dashboard)
1. Go to **Database** → **Backups**
2. Click **Create Backup**
3. Wait for completion
4. Download if needed

### Backup (using pg_dump)
```bash
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  --schema=public \
  --file=backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  < backup_20240101.sql
```

---

## 🎓 Learning Resources

### Supabase Docs
- [SQL Editor](https://supabase.com/docs/guides/database/overview)
- [RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)

### PostgreSQL Docs
- [CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)
- [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html)

---

## 📞 Need Help?

1. **Check README.md** - Full documentation
2. **Check Supabase Logs** - Dashboard → Logs
3. **Check Browser Console** - F12 → Console
4. **Run verification queries** - See checklist above
5. **Try complete reset** - `00_RESET_DATABASE.sql`

---

**Quick Tip:** Bookmark this page for easy reference! 🔖
