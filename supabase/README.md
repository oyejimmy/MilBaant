# 🗄️ MilBaant Database Scripts

Complete database setup and management scripts for the MilBaant flat management application.

## 📁 Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `00_RESET_DATABASE.sql` | **Complete reset** - Deletes all data and recreates schema | Starting fresh, major issues |
| `01_delete_all_data.sql` | **Delete only** - Removes all data but keeps structure | Clean slate, testing |
| `02_complete_schema.sql` | **Create schema** - Sets up all tables, policies, functions | Initial setup, after delete |

## 🚀 Quick Start

### First Time Setup

1. **Go to Supabase Dashboard** → Your Project → SQL Editor
2. **Copy and paste** the contents of `02_complete_schema.sql`
3. **Click "Run"**
4. **Done!** Your database is ready

### Complete Reset (Delete Everything + Recreate)

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy and paste** the contents of `00_RESET_DATABASE.sql`
3. **Click "Run"**
4. **Wait** for completion
5. **Done!** Fresh database ready

## 📋 Detailed Usage

### Option 1: Complete Reset (Recommended for Fresh Start)

```sql
-- Run this in Supabase SQL Editor
-- File: 00_RESET_DATABASE.sql
```

**What it does:**
- ✅ Deletes all tables, data, policies, functions
- ✅ Recreates complete schema from scratch
- ✅ Sets up RLS policies
- ✅ Creates storage buckets
- ✅ Adds seed data (rooms, beds, settings)

**When to use:**
- Starting fresh
- Major database issues
- After breaking changes
- Testing from scratch

---

### Option 2: Delete All Data Only

```sql
-- Run this in Supabase SQL Editor
-- File: 01_delete_all_data.sql
```

**What it does:**
- ✅ Deletes all tables and data
- ✅ Removes all policies
- ✅ Cleans storage buckets
- ✅ Drops functions and triggers
- ❌ Does NOT recreate anything

**When to use:**
- You want to manually recreate schema
- Testing deletion process
- Preparing for migration

**After running this, you MUST run `02_complete_schema.sql` to recreate the database!**

---

### Option 3: Create Schema Only

```sql
-- Run this in Supabase SQL Editor
-- File: 02_complete_schema.sql
```

**What it does:**
- ✅ Creates all tables
- ✅ Sets up RLS policies
- ✅ Creates functions and triggers
- ✅ Sets up storage buckets
- ✅ Adds seed data
- ✅ Safe to run multiple times (idempotent)

**When to use:**
- Initial database setup
- After running delete script
- Updating schema (safe to re-run)

---

## 🗂️ Database Structure

### Tables Created (17 total)

#### Core Tables
- `profiles` - User profiles and roles
- `rooms` - Flat rooms (bedrooms, washrooms, etc.)
- `beds` - Beds in each room
- `bed_assignments` - User bed assignments

#### Expense Management
- `expenses` - All expenses (bills, groceries, etc.)
- `expense_participants` - Who participates in each expense
- `debt_settlements` - Debt payments between users

#### Cook Management
- `cook_advances` - Money given to cook
- `cook_purchases` - Cook's purchases
- `daily_menu` - Daily meal menu

#### Transportation
- `rides` - Ride sharing records
- `ride_riders` - Participants in each ride

#### Flat Fund
- `flat_fund_allocations` - Money allocated to flat fund
- `flat_fund_expenses` - Expenses from flat fund

#### Other
- `contribution_payments` - Monthly contribution payments
- `announcements` - Flat announcements
- `activity_logs` - Activity history
- `settings` - App settings

### Storage Buckets (3 total)

- `bill-images` - Bill/receipt images
- `payment-screenshots` - Payment proof screenshots
- `avatars` - User profile pictures

### Functions (3 total)

- `handle_new_user()` - Auto-creates profile when user signs up
- `is_admin()` - Checks if current user is admin
- `can_current_user_add_expenses()` - Checks expense permissions

---

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies:

- **Admins** can do everything
- **Users** can:
  - View all data
  - Create their own records
  - Update/delete their own records
  - Update their own profile
- **First user** becomes admin automatically

### Storage Security

- **Public read** for all buckets (images, screenshots, avatars)
- **Authenticated write** - only logged-in users can upload
- **Owner delete** - users can delete their own files
- **Admin delete** - admins can delete any file

---

## 🎯 Common Scenarios

### Scenario 1: Fresh Installation

```bash
# 1. Create Supabase project
# 2. Go to SQL Editor
# 3. Run: 02_complete_schema.sql
# 4. Create first user (becomes admin)
# 5. Done!
```

### Scenario 2: Database Corrupted

```bash
# 1. Go to SQL Editor
# 2. Run: 00_RESET_DATABASE.sql
# 3. Wait for completion
# 4. Create first user again
# 5. Done!
```

### Scenario 3: Testing/Development

```bash
# 1. Run: 01_delete_all_data.sql (clean slate)
# 2. Run: 02_complete_schema.sql (recreate)
# 3. Add test data
# 4. Test your changes
# 5. Repeat as needed
```

### Scenario 4: Schema Update

```bash
# 1. Run: 02_complete_schema.sql
# 2. Script is idempotent (safe to re-run)
# 3. Existing data preserved
# 4. New columns/tables added
# 5. Done!
```

---

## ⚠️ Important Notes

### Before Running Delete Scripts

- ✅ **Backup your data** if you need it
- ✅ **Verify you're on the correct project**
- ✅ **Understand this is permanent**
- ✅ **Have your .env file ready** for reconnection

### After Running Scripts

- ✅ **Create first user** (becomes admin automatically)
- ✅ **Verify RLS policies** are working
- ✅ **Test authentication** flow
- ✅ **Check storage buckets** are accessible

### User Accounts

The delete scripts do **NOT** delete auth users by default. This is for safety.

To also delete all user accounts, uncomment this line in the delete script:
```sql
-- DELETE FROM auth.users;
```

---

## 🧪 Verification Queries

After running scripts, verify everything is set up correctly:

### Check Tables
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** 17 tables, all with `rls_enabled = true`

### Check Functions
```sql
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;
```

**Expected:** 3 functions (handle_new_user, is_admin, can_current_user_add_expenses)

### Check Storage Buckets
```sql
SELECT id, name, public FROM storage.buckets;
```

**Expected:** 3 buckets (bill-images, payment-screenshots, avatars)

### Check RLS Policies
```sql
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Expected:** Multiple policies per table

### Check Seed Data
```sql
-- Check rooms
SELECT * FROM public.rooms ORDER BY name;

-- Check beds
SELECT b.*, r.name as room_name 
FROM public.beds b 
JOIN public.rooms r ON b.room_id = r.id 
ORDER BY r.name, b.label;

-- Check settings
SELECT * FROM public.settings;
```

**Expected:** 9 rooms, 6 beds, 3 settings

---

## 🐛 Troubleshooting

### Error: "relation does not exist"

**Cause:** Tables not created yet

**Fix:** Run `02_complete_schema.sql`

### Error: "permission denied"

**Cause:** RLS policies blocking access

**Fix:** 
1. Check you're logged in
2. Verify your role in profiles table
3. Check RLS policies are correct

### Error: "function does not exist"

**Cause:** Functions not created

**Fix:** Run `02_complete_schema.sql`

### Error: "bucket does not exist"

**Cause:** Storage buckets not created

**Fix:** Run `02_complete_schema.sql`

### First user is not admin

**Cause:** Trigger not working or profiles table had existing data

**Fix:**
```sql
-- Manually set first user as admin
UPDATE public.profiles 
SET role = 'admin', can_add_expenses = true 
WHERE id = 'YOUR_USER_ID';
```

---

## 📚 Additional Resources

### Supabase Documentation
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

### Project Documentation
- See `../README.md` for application setup
- See `../src/lib/types.ts` for TypeScript types
- See `../src/hooks/` for data access patterns

---

## 🔄 Migration Strategy

If you need to migrate from an old schema to this new one:

1. **Backup existing data:**
   ```sql
   -- Export each table
   COPY public.profiles TO '/tmp/profiles.csv' CSV HEADER;
   -- Repeat for all tables
   ```

2. **Run reset:**
   ```sql
   -- Run: 00_RESET_DATABASE.sql
   ```

3. **Import data:**
   ```sql
   -- Import each table
   COPY public.profiles FROM '/tmp/profiles.csv' CSV HEADER;
   -- Repeat for all tables
   ```

4. **Verify:**
   - Check all data is present
   - Test authentication
   - Test RLS policies

---

## 📞 Support

If you encounter issues:

1. **Check verification queries** above
2. **Review Supabase logs** (Dashboard → Logs)
3. **Check browser console** for errors
4. **Verify .env configuration**
5. **Try complete reset** (`00_RESET_DATABASE.sql`)

---

## ✅ Checklist

### Initial Setup
- [ ] Run `02_complete_schema.sql` in Supabase SQL Editor
- [ ] Verify 17 tables created
- [ ] Verify 3 storage buckets created
- [ ] Verify 3 functions created
- [ ] Create first user (becomes admin)
- [ ] Test login
- [ ] Test admin panel access

### After Reset
- [ ] Run `00_RESET_DATABASE.sql`
- [ ] Wait for completion
- [ ] Verify all tables recreated
- [ ] Create first user again
- [ ] Test authentication
- [ ] Verify RLS policies working

### Before Production
- [ ] Backup database
- [ ] Test all features
- [ ] Verify RLS policies
- [ ] Test storage uploads
- [ ] Check error handling
- [ ] Review security settings

---

**Last Updated:** 2024
**Version:** 1.0.0
**Project:** MilBaant - Flat Management System
