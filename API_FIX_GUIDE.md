# MilBaant API Failures - Root Cause & Fix Guide

## Problem Identified 🔍

The application has **missing or improperly named foreign key constraints** in the Supabase database. This prevents PostgREST from discovering relationships between tables, causing 400 errors when queries try to join tables.

### Affected Tables:
- `cook_purchases` → cannot join to `profiles` via `created_by`
- `activity_logs` → cannot join to `profiles` via `user_id`
- `flat_fund_allocations` → cannot join to `profiles` via `user_id` and `allocated_by`
- `flat_fund_expenses` → cannot join to `profiles` via `user_id` and `created_by`
- `contribution_payments` → cannot join to `profiles` via `user_id` and `created_by`
- `announcements` → cannot join to `profiles` via `created_by`
- `cook_advances` → cannot join to `profiles` via `given_by`
- `daily_menu` → cannot join to `profiles` via `created_by`

## Error Symptoms ❌

- Network tab shows 400 errors from Supabase API
- Query returns: "Could not find a relationship between '[table]' and 'profiles' in the schema cache"
- Data partially loads but many queries fail silently

## Solution ✅

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Create a new query
5. Copy and paste the SQL from: `supabase/migrations/20260601_fix_foreign_keys.sql`
6. Click "Run" to execute

### Option 2: Apply via Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or manually:
supabase migration up
```

### Option 3: Direct SQL (if you have database access)

Run the SQL commands from `supabase/migrations/20260601_fix_foreign_keys.sql` directly in your PostgreSQL client.

## What the Fix Does 🔧

The migration script:
1. **Drops any existing conflicting constraints** to avoid duplicates
2. **Adds properly named foreign key constraints** with the format: `{table_name}_{column_name}_fkey`
3. **Enables Supabase PostgREST** to discover these relationships
4. **Allows joined queries** like:
   ```typescript
   creator:profiles!cook_purchases_created_by_fkey(id, full_name)
   ```

## Verification After Fix ✅

After applying the migration, run:

```bash
node scripts/diagnostic.mjs
```

You should see:
- ✅ All Supabase table queries succeeding
- ✅ All relationship joins working
- ✅ Login and profile fetch succeeding

## Why This Happened 🤔

The database tables were created with implicit foreign keys (PostgreSQL generates default names), but Supabase PostgREST requires explicit, consistent constraint naming to discover relationships through its schema introspection.

The original schema definition didn't explicitly name the FK constraints, which caused Supabase to be unable to create the relationship mappings.

---

**Next Steps:**
1. Apply the migration using one of the three options above
2. Refresh the app in your browser
3. All API calls should now work properly
