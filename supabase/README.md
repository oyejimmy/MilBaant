# MilBaant Database Documentation

## 📁 Directory Structure

```
supabase/
├── README.md                          # This file - documentation and guide
├── START_HERE.md                      # Quick start guide
├── QUICK_REFERENCE.md                 # Quick lookup reference
├── ARCHITECTURE.md                    # System architecture diagrams
├── STRUCTURE.md                       # Directory structure overview
├── schema/
│   ├── 00_extensions.sql             # PostgreSQL extensions
│   ├── 01_tables.sql                 # All table definitions
│   ├── 02_indexes.sql                # Database indexes
│   ├── 03_functions.sql              # Stored procedures and functions
│   ├── 04_triggers.sql               # Database triggers
│   ├── 05_rls_enable.sql             # Enable RLS on all tables
│   ├── 06_rls_policies.sql           # Row Level Security policies
│   ├── 07_storage.sql                # Storage buckets and policies
│   └── 08_seed_data.sql              # Initial seed data
├── scripts/
│   ├── setup.sql                     # Complete setup (runs all schema files)
│   ├── reset.sql                     # Reset database (drop all data)
│   └── verify.sql                    # Verification queries
├── tests/
│   ├── bug_condition_exploration.sql
│   ├── preservation_tests.sql
│   ├── preservation_property_tests.sql
│   ├── verify_bug_conditions.sql
│   └── verify_bug_fixes.sql
└── docs/
    ├── BUG_CONDITION_TEST_RESULTS.md
    ├── PRESERVATION_TESTS_DOCUMENTATION.md
    ├── TASK_1_COMPLETION_SUMMARY.md
    ├── TASK_2_COMPLETION_SUMMARY.md
    ├── TASK_3_9_EXECUTION_SUMMARY.md
    └── TASK_3_9_VERIFICATION.md
```

## 🚀 Quick Start

### Initial Setup (New Database)

Run the complete setup script in Supabase SQL Editor:

```sql
-- Run this file in Supabase SQL Editor
\i supabase/scripts/setup.sql
```

Or run schema files individually in order:

```bash
# In Supabase SQL Editor, run these in sequence:
1. schema/00_extensions.sql
2. schema/01_tables.sql
3. schema/02_indexes.sql
4. schema/03_functions.sql
5. schema/04_triggers.sql
6. schema/05_rls_enable.sql
7. schema/06_rls_policies.sql
8. schema/07_storage.sql
9. schema/08_seed_data.sql
```

### Reset Database

To completely reset your database (⚠️ **DESTRUCTIVE - ALL DATA WILL BE LOST**):

```sql
\i supabase/scripts/reset.sql
```

### Verify Setup

To verify your database is correctly configured:

```sql
\i supabase/scripts/verify.sql
```

## 📋 Schema Overview

### Core Tables

- **profiles** - User profiles and roles (admin, user, cook)
- **rooms** - Flat room definitions
- **beds** - Bed assignments in rooms
- **bed_assignments** - User-to-bed mappings

### Financial Tables

- **expenses** - Shared expenses tracking
- **expense_participants** - Who participates in each expense
- **debt_settlements** - Debt payment records
- **flat_fund_allocations** - Flat fund contributions
- **flat_fund_expenses** - Flat fund expenditures
- **contribution_payments** - Monthly contribution payments

### Cook Management

- **cook_advances** - Advance payments to cook
- **cook_purchases** - Cook's purchase records
- **cook_requests** - User requests to cook
- **daily_menu** - Daily meal planning

### Other Tables

- **rides** - Shared ride expenses
- **ride_riders** - Ride participants
- **announcements** - Flat announcements
- **activity_logs** - Audit trail
- **settings** - Application settings

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- **SELECT**: Generally open to all authenticated users
- **INSERT**: Restricted to authenticated users (creator must match auth.uid())
- **UPDATE**: Creator or admin only (some exceptions for cook role)
- **DELETE**: Creator or admin only

### Storage Buckets

Three storage buckets with appropriate policies:
- **bill-images** - Expense bill images (public read, authenticated write)
- **payment-screenshots** - Payment proof images (public read, authenticated write)
- **avatars** - User profile pictures (public read, owner write)

### Helper Functions

- `is_admin()` - Check if current user is admin
- `is_cook()` - Check if current user is cook
- `can_current_user_add_expenses()` - Check expense permission
- `admin_update_profile()` - Admin function to update user profiles (SECURITY DEFINER)

## 🔄 Schema Changes

All schema changes are incorporated into the modular schema files in the `schema/` directory. The schema files are the **source of truth** for your database structure.

### Making Schema Changes

When you need to modify the database:

1. **Edit the appropriate schema file** in `schema/` directory
2. **Test locally** using `scripts/verify.sql`
3. **Apply to production** by running the modified schema file
4. **Document** significant changes in this README

## 🧪 Testing

Test files are located in `tests/` directory:

- **bug_condition_exploration.sql** - Explore specific bug conditions
- **preservation_tests.sql** - Test data preservation
- **preservation_property_tests.sql** - Property-based preservation tests
- **verify_bug_conditions.sql** - Verify bug conditions exist
- **verify_bug_fixes.sql** - Verify bugs are fixed

Run tests in Supabase SQL Editor to verify database behavior.

## 📚 Documentation

Detailed documentation is available in `docs/` directory:

- Bug fix summaries
- Task completion reports
- Test results and documentation

## 🛠️ Development Workflow

### Making Schema Changes

1. **Never modify existing migration files** - they represent historical changes
2. **Create a new migration file** with timestamp: `YYYYMMDD_description.sql`
3. **Update the appropriate schema file** in `schema/` directory
4. **Update `scripts/setup.sql`** if needed
5. **Test the migration** on a development database
6. **Document the change** in this README

### Best Practices

- ✅ All SQL files should be idempotent (safe to run multiple times)
- ✅ Use `IF NOT EXISTS` for CREATE statements
- ✅ Use `DROP ... IF EXISTS` before CREATE OR REPLACE
- ✅ Always include comments explaining the purpose
- ✅ Test on development database before production
- ✅ Keep migrations small and focused
- ✅ Document breaking changes

## 🔍 Troubleshooting

### Common Issues

**Issue**: RLS policy denying access
- **Solution**: Check if user is authenticated and has correct role
- **Verify**: Run `SELECT * FROM public.profiles WHERE id = auth.uid();`

**Issue**: CORS errors on profile updates
- **Solution**: Use `admin_update_profile()` function instead of direct UPDATE
- **Verify**: Check if function exists: `SELECT * FROM pg_proc WHERE proname = 'admin_update_profile';`

**Issue**: Storage upload fails
- **Solution**: Check storage bucket policies
- **Verify**: Run queries in `scripts/verify.sql`

## 📞 Support

For issues or questions:
1. Check the documentation in `docs/` directory
2. Review test files in `tests/` directory
3. Verify setup using `scripts/verify.sql`

---

**Last Updated**: May 4, 2026
**Database Version**: 1.0
**Supabase Project**: MilBaant
