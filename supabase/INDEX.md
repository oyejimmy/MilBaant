# 📚 MilBaant Database Documentation Index

Quick navigation to all database documentation and scripts.

---

## 🚀 Quick Start

**New to the project?** Start here:

1. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick commands and tips
2. **Run:** `02_complete_schema.sql` in Supabase SQL Editor
3. **Create first user** (becomes admin automatically)
4. **Done!** ✅

---

## 📁 SQL Scripts

### Main Scripts

| File | Purpose | When to Use |
|------|---------|-------------|
| **[schema.sql](schema.sql)** | Main schema file | Reference |
| **[00_RESET_DATABASE.sql](00_RESET_DATABASE.sql)** | Complete reset | Fresh start |
| **[01_delete_all_data.sql](01_delete_all_data.sql)** | Delete only | Before manual setup |
| **[02_complete_schema.sql](02_complete_schema.sql)** | Create schema | Initial setup, updates |

### How to Run

```bash
# Option 1: Supabase Dashboard (Recommended)
# 1. Go to SQL Editor
# 2. Copy script contents
# 3. Paste and click "Run"

# Option 2: Supabase CLI
supabase db push --file supabase/02_complete_schema.sql
```

---

## 📖 Documentation

### Core Documentation

| File | Purpose | Read When |
|------|---------|-----------|
| **[README.md](README.md)** | Complete documentation | Need full details |
| **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** | Quick commands | Need quick answer |
| **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** | Migration strategies | Updating database |
| **[INDEX.md](INDEX.md)** | This file | Finding documentation |

### Additional Guides

| File | Purpose |
|------|---------|
| **[../DATABASE_SETUP_COMPLETE.md](../DATABASE_SETUP_COMPLETE.md)** | Setup completion summary |
| **[../CORS_FIX_SUMMARY.md](../CORS_FIX_SUMMARY.md)** | CORS error fix details |
| **[../QUICK_FIX_GUIDE.md](../QUICK_FIX_GUIDE.md)** | Quick CORS fix guide |
| **[../TEST_ADMIN_ACCESS.md](../TEST_ADMIN_ACCESS.md)** | Browser console tests |
| **[../FIX_RLS_ADMIN_CHECK.sql](../FIX_RLS_ADMIN_CHECK.sql)** | Optional RLS debugging |

---

## 🎯 Find What You Need

### I want to...

#### Set up database for the first time
→ **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** → "First Time Setup"
→ Run: `02_complete_schema.sql`

#### Reset everything and start fresh
→ **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** → "Complete Reset"
→ Run: `00_RESET_DATABASE.sql`

#### Update existing database
→ **[README.md](README.md)** → "Updating Existing Database"
→ Run: `02_complete_schema.sql` (safe to re-run)

#### Migrate from old version
→ **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** → "Migrating from Old Schema"

#### Export/Import data
→ **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** → "Data Export/Import"

#### Fix CORS error
→ **[../QUICK_FIX_GUIDE.md](../QUICK_FIX_GUIDE.md)**
→ Already fixed in `src/hooks/useProfiles.ts`

#### Test admin access
→ **[../TEST_ADMIN_ACCESS.md](../TEST_ADMIN_ACCESS.md)**
→ Browser console diagnostic scripts

#### Understand database structure
→ **[README.md](README.md)** → "Database Structure"
→ See: 17 tables, 3 buckets, 3 functions

#### Verify setup is correct
→ **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** → "Verification Checklist"

#### Troubleshoot issues
→ **[README.md](README.md)** → "Troubleshooting"
→ **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** → "Common Issues"

#### Learn about RLS policies
→ **[README.md](README.md)** → "Security Features"
→ **[../FIX_RLS_ADMIN_CHECK.sql](../FIX_RLS_ADMIN_CHECK.sql)**

#### Backup and restore
→ **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** → "Backup & Restore"

---

## 📊 Database Overview

### Tables (17)
- profiles, rooms, beds, bed_assignments
- expenses, expense_participants
- announcements, settings
- debt_settlements
- rides, ride_riders
- cook_advances, cook_purchases
- daily_menu, activity_logs
- flat_fund_allocations, flat_fund_expenses
- contribution_payments

### Storage Buckets (3)
- bill-images
- payment-screenshots
- avatars

### Functions (3)
- handle_new_user()
- is_admin()
- can_current_user_add_expenses()

### Security
- ✅ RLS enabled on all tables
- ✅ 50+ RLS policies
- ✅ Storage policies for all buckets
- ✅ First user becomes admin automatically

---

## 🔍 Quick Commands

### Verification
```sql
-- Check tables (should be 17)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check functions (should be 3)
SELECT COUNT(*) FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace;

-- Check buckets (should be 3)
SELECT COUNT(*) FROM storage.buckets;
```

### User Management
```sql
-- Make yourself admin
UPDATE public.profiles 
SET role = 'admin', can_add_expenses = true 
WHERE email = 'your-email@example.com';

-- Check your role
SELECT * FROM public.profiles WHERE id = auth.uid();

-- List all users
SELECT p.full_name, p.role, u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;
```

### Data Counts
```sql
-- Count all records
SELECT 
  'profiles' as table_name, COUNT(*) FROM public.profiles
UNION ALL SELECT 'expenses', COUNT(*) FROM public.expenses
UNION ALL SELECT 'announcements', COUNT(*) FROM public.announcements
ORDER BY table_name;
```

---

## 🚨 Common Issues

### "permission denied"
→ Use Supabase Dashboard SQL Editor
→ Check you're logged in as admin

### "relation already exists"
→ Normal! Script is idempotent
→ Safe to re-run

### "function does not exist"
→ Run: `02_complete_schema.sql`

### First user not admin
```sql
UPDATE public.profiles 
SET role = 'admin', can_add_expenses = true 
WHERE email = 'your-email@example.com';
```

### CORS error on role update
→ Already fixed in `src/hooks/useProfiles.ts`
→ See: `../QUICK_FIX_GUIDE.md`

---

## 📚 External Resources

### Supabase
- [Official Docs](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Functions Guide](https://supabase.com/docs/guides/database/functions)

### PostgreSQL
- [CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)
- [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html)

---

## ✅ Quick Checklist

### Initial Setup
- [ ] Run `02_complete_schema.sql`
- [ ] Verify 17 tables created
- [ ] Verify 3 buckets created
- [ ] Create first user
- [ ] Test login

### After Reset
- [ ] Run `00_RESET_DATABASE.sql`
- [ ] Wait for completion
- [ ] Create first user again
- [ ] Test all features

### Before Production
- [ ] Backup database
- [ ] Test all features
- [ ] Verify RLS policies
- [ ] Test storage uploads
- [ ] Review security

---

## 🎯 Recommended Reading Order

### For Beginners
1. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Start here
2. **[README.md](README.md)** - Full details
3. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - When needed

### For Experienced Users
1. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick commands
2. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Advanced scenarios
3. **[README.md](README.md)** - Reference

### For Troubleshooting
1. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Common issues
2. **[README.md](README.md)** - Troubleshooting section
3. **[../QUICK_FIX_GUIDE.md](../QUICK_FIX_GUIDE.md)** - CORS fix

---

## 📞 Need Help?

1. **Check this index** - Find relevant documentation
2. **Check QUICK_REFERENCE.md** - Quick answers
3. **Check README.md** - Detailed explanations
4. **Check Supabase logs** - Dashboard → Logs
5. **Check browser console** - F12 → Console

---

## 🎉 You're All Set!

Everything you need is documented. Pick the file that matches your need and get started!

**Quick Start:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

**Last Updated:** 2024
**Project:** MilBaant - Flat Management System
