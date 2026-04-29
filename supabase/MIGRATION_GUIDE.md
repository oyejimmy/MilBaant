# 🔄 Migration Guide - MilBaant Database

Guide for migrating between different versions or from existing data.

## 📋 Table of Contents

1. [Fresh Installation](#fresh-installation)
2. [Migrating from Old Schema](#migrating-from-old-schema)
3. [Updating Existing Database](#updating-existing-database)
4. [Data Export/Import](#data-exportimport)
5. [Rollback Strategy](#rollback-strategy)

---

## 🆕 Fresh Installation

### For New Projects

**Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be ready

**Step 2: Run Schema**
1. Go to **SQL Editor**
2. Copy contents of `02_complete_schema.sql`
3. Paste and click **Run**
4. Wait for completion

**Step 3: Configure Application**
```bash
# Copy .env.example to .env
cp .env.example .env

# Add your Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Step 4: Create First User**
1. Run your application: `npm run dev`
2. Go to Register page
3. Create account (becomes admin automatically)
4. Done! ✅

---

## 🔄 Migrating from Old Schema

### Scenario: You have an existing MilBaant database with old structure

**⚠️ WARNING: This will delete all existing data!**

### Option A: Clean Migration (Recommended for Development)

```sql
-- Step 1: Backup your data (see Data Export section below)

-- Step 2: Run complete reset
-- File: 00_RESET_DATABASE.sql

-- Step 3: Import your backed up data (see Data Import section below)
```

### Option B: Incremental Migration (For Production)

```sql
-- Step 1: Add new columns to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Step 2: Update constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'user', 'cook'));

-- Step 3: Create missing tables
-- Copy CREATE TABLE statements from 02_complete_schema.sql for any missing tables

-- Step 4: Update RLS policies
-- Copy policy statements from 02_complete_schema.sql

-- Step 5: Update functions
-- Copy function definitions from 02_complete_schema.sql

-- Step 6: Verify everything works
SELECT * FROM public.profiles LIMIT 1;
```

---

## 🔧 Updating Existing Database

### Scenario: You want to update schema without losing data

**Safe Update Process:**

```sql
-- This script is idempotent - safe to run multiple times
-- File: 02_complete_schema.sql

-- It will:
-- ✅ Add missing columns (with IF NOT EXISTS)
-- ✅ Create missing tables (with IF NOT EXISTS)
-- ✅ Update policies (DROP IF EXISTS, then CREATE)
-- ✅ Update functions (CREATE OR REPLACE)
-- ✅ Preserve all existing data
```

**Steps:**
1. **Backup first** (always!)
2. Run `02_complete_schema.sql`
3. Verify data is intact
4. Test application

**Verification:**
```sql
-- Check your data is still there
SELECT COUNT(*) FROM public.profiles;
SELECT COUNT(*) FROM public.expenses;
SELECT COUNT(*) FROM public.announcements;
-- All counts should match your expectations
```

---

## 💾 Data Export/Import

### Export All Data

```sql
-- Export profiles
COPY (SELECT * FROM public.profiles) TO '/tmp/profiles.csv' CSV HEADER;

-- Export expenses
COPY (SELECT * FROM public.expenses) TO '/tmp/expenses.csv' CSV HEADER;

-- Export expense_participants
COPY (SELECT * FROM public.expense_participants) TO '/tmp/expense_participants.csv' CSV HEADER;

-- Export announcements
COPY (SELECT * FROM public.announcements) TO '/tmp/announcements.csv' CSV HEADER;

-- Export debt_settlements
COPY (SELECT * FROM public.debt_settlements) TO '/tmp/debt_settlements.csv' CSV HEADER;

-- Export rides
COPY (SELECT * FROM public.rides) TO '/tmp/rides.csv' CSV HEADER;

-- Export ride_riders
COPY (SELECT * FROM public.ride_riders) TO '/tmp/ride_riders.csv' CSV HEADER;

-- Export cook_advances
COPY (SELECT * FROM public.cook_advances) TO '/tmp/cook_advances.csv' CSV HEADER;

-- Export cook_purchases
COPY (SELECT * FROM public.cook_purchases) TO '/tmp/cook_purchases.csv' CSV HEADER;

-- Export daily_menu
COPY (SELECT * FROM public.daily_menu) TO '/tmp/daily_menu.csv' CSV HEADER;

-- Export activity_logs
COPY (SELECT * FROM public.activity_logs) TO '/tmp/activity_logs.csv' CSV HEADER;

-- Export flat_fund_allocations
COPY (SELECT * FROM public.flat_fund_allocations) TO '/tmp/flat_fund_allocations.csv' CSV HEADER;

-- Export flat_fund_expenses
COPY (SELECT * FROM public.flat_fund_expenses) TO '/tmp/flat_fund_expenses.csv' CSV HEADER;

-- Export contribution_payments
COPY (SELECT * FROM public.contribution_payments) TO '/tmp/contribution_payments.csv' CSV HEADER;

-- Export rooms
COPY (SELECT * FROM public.rooms) TO '/tmp/rooms.csv' CSV HEADER;

-- Export beds
COPY (SELECT * FROM public.beds) TO '/tmp/beds.csv' CSV HEADER;

-- Export bed_assignments
COPY (SELECT * FROM public.bed_assignments) TO '/tmp/bed_assignments.csv' CSV HEADER;

-- Export settings
COPY (SELECT * FROM public.settings) TO '/tmp/settings.csv' CSV HEADER;
```

### Export Using Supabase Dashboard

1. Go to **Table Editor**
2. Select table
3. Click **Export** → **CSV**
4. Save file
5. Repeat for all tables

### Import Data

```sql
-- Import profiles (must be first due to foreign keys)
COPY public.profiles FROM '/tmp/profiles.csv' CSV HEADER;

-- Import rooms
COPY public.rooms FROM '/tmp/rooms.csv' CSV HEADER;

-- Import beds
COPY public.beds FROM '/tmp/beds.csv' CSV HEADER;

-- Import bed_assignments
COPY public.bed_assignments FROM '/tmp/bed_assignments.csv' CSV HEADER;

-- Import expenses
COPY public.expenses FROM '/tmp/expenses.csv' CSV HEADER;

-- Import expense_participants
COPY public.expense_participants FROM '/tmp/expense_participants.csv' CSV HEADER;

-- Import announcements
COPY public.announcements FROM '/tmp/announcements.csv' CSV HEADER;

-- Import debt_settlements
COPY public.debt_settlements FROM '/tmp/debt_settlements.csv' CSV HEADER;

-- Import rides
COPY public.rides FROM '/tmp/rides.csv' CSV HEADER;

-- Import ride_riders
COPY public.ride_riders FROM '/tmp/ride_riders.csv' CSV HEADER;

-- Import cook_advances
COPY public.cook_advances FROM '/tmp/cook_advances.csv' CSV HEADER;

-- Import cook_purchases
COPY public.cook_purchases FROM '/tmp/cook_purchases.csv' CSV HEADER;

-- Import daily_menu
COPY public.daily_menu FROM '/tmp/daily_menu.csv' CSV HEADER;

-- Import activity_logs
COPY public.activity_logs FROM '/tmp/activity_logs.csv' CSV HEADER;

-- Import flat_fund_allocations
COPY public.flat_fund_allocations FROM '/tmp/flat_fund_allocations.csv' CSV HEADER;

-- Import flat_fund_expenses
COPY public.flat_fund_expenses FROM '/tmp/flat_fund_expenses.csv' CSV HEADER;

-- Import contribution_payments
COPY public.contribution_payments FROM '/tmp/contribution_payments.csv' CSV HEADER;

-- Import settings
COPY public.settings FROM '/tmp/settings.csv' CSV HEADER;
```

### Import Using Supabase Dashboard

1. Go to **Table Editor**
2. Select table
3. Click **Import** → **CSV**
4. Select file
5. Map columns
6. Click **Import**
7. Repeat for all tables

---

## 🔙 Rollback Strategy

### If Migration Fails

**Option 1: Restore from Supabase Backup**
1. Go to **Database** → **Backups**
2. Find backup before migration
3. Click **Restore**
4. Wait for completion

**Option 2: Restore from Manual Backup**
```bash
# If you have a pg_dump backup
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  < backup_before_migration.sql
```

**Option 3: Restore from CSV Exports**
1. Run `01_delete_all_data.sql`
2. Run `02_complete_schema.sql`
3. Import all CSV files (see Import Data section)

---

## 📊 Migration Checklist

### Before Migration

- [ ] **Backup database** (Supabase Dashboard → Backups)
- [ ] **Export all data** to CSV files
- [ ] **Test migration** on a copy/staging environment
- [ ] **Notify users** of potential downtime
- [ ] **Document current state** (table counts, etc.)

### During Migration

- [ ] **Run migration script**
- [ ] **Monitor for errors**
- [ ] **Check logs** (Supabase Dashboard → Logs)
- [ ] **Verify tables created**
- [ ] **Verify functions created**
- [ ] **Verify policies created**

### After Migration

- [ ] **Verify data integrity** (counts match)
- [ ] **Test authentication** (login/logout)
- [ ] **Test RLS policies** (permissions work)
- [ ] **Test storage** (upload/download)
- [ ] **Test all features** (expenses, rides, etc.)
- [ ] **Monitor for errors** (24-48 hours)
- [ ] **Update documentation** if needed

---

## 🚨 Common Migration Issues

### Issue: Foreign key constraint violation

**Cause:** Importing data in wrong order

**Fix:** Import in this order:
1. profiles (no dependencies)
2. rooms (no dependencies)
3. beds (depends on rooms)
4. bed_assignments (depends on profiles, beds)
5. All other tables (depend on profiles)

### Issue: Duplicate key error

**Cause:** Data already exists

**Fix:**
```sql
-- Clear table before import
TRUNCATE public.table_name CASCADE;

-- Then import
COPY public.table_name FROM '/tmp/table_name.csv' CSV HEADER;
```

### Issue: Column does not exist

**Cause:** Old CSV format doesn't match new schema

**Fix:**
1. Add missing columns to CSV
2. Or update schema to match CSV
3. Or manually map columns during import

### Issue: RLS policy blocks import

**Cause:** RLS is enabled during import

**Fix:**
```sql
-- Temporarily disable RLS
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;

-- Import data
COPY public.table_name FROM '/tmp/table_name.csv' CSV HEADER;

-- Re-enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
```

---

## 🎯 Migration Scenarios

### Scenario 1: Development → Production

```bash
# 1. Export dev data
# Run export queries on dev database

# 2. Set up production
# Run 02_complete_schema.sql on production

# 3. Import data
# Run import queries on production

# 4. Verify
# Test all features on production
```

### Scenario 2: Old Version → New Version

```bash
# 1. Backup old database
# Use Supabase Dashboard or pg_dump

# 2. Test migration on copy
# Create copy of database, test migration

# 3. Run migration on production
# Run 02_complete_schema.sql (idempotent)

# 4. Verify and monitor
# Check data, test features, monitor logs
```

### Scenario 3: Different Supabase Project

```bash
# 1. Export from old project
# Use CSV export or pg_dump

# 2. Create new project
# Set up new Supabase project

# 3. Run schema on new project
# Run 02_complete_schema.sql

# 4. Import data
# Import CSV files or restore dump

# 5. Update application config
# Update .env with new project credentials
```

---

## 📞 Need Help?

- **Check logs:** Supabase Dashboard → Logs
- **Check errors:** Browser Console (F12)
- **Verify schema:** Run verification queries
- **Test incrementally:** Test each step
- **Ask for help:** Supabase Discord or GitHub Issues

---

**Remember:** Always backup before migration! 💾
