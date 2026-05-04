# Task 3.9: Verify Bug Condition Exploration Test Now Passes

## Overview

This task verifies that all 7 bug fixes implemented in Tasks 3.1-3.8 are correctly applied to `supabase/schema.sql`. We re-run the same bug condition exploration test from Task 1, but this time we expect all tests to **PASS** (confirming the bugs are fixed).

## Test File

**File**: `supabase/verify_bug_fixes.sql`

This is the same test logic from Task 1 (`bug_condition_exploration_test.sql`), but with updated expectations:
- **Task 1 (Unfixed)**: Tests FAIL → proves bugs exist
- **Task 3.9 (Fixed)**: Tests PASS → proves bugs are fixed

## How to Execute

### Option 1: Supabase SQL Editor (Recommended)

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/shfurtphvyejbbiktzsj/sql
2. Copy contents of `supabase/verify_bug_fixes.sql`
3. Paste into SQL Editor
4. Click "Run" to execute all tests
5. Review NOTICE messages in the Results panel

### Option 2: psql Command Line

```bash
# Set environment variables
export PGHOST=db.shfurtphvyejbbiktzsj.supabase.co
export PGPORT=5432
export PGDATABASE=postgres
export PGUSER=postgres
export PGPASSWORD=<your-db-password>

# Run the test
psql -f supabase/verify_bug_fixes.sql
```

## Expected Results (Fixed Schema)

All 7 tests should **PASS**:

### ✅ Test 1: Admin Self-Update Policy Check
**Expected**: PASS  
**Verification**: `profiles_self_update` policy qual does NOT contain `NOT is_admin()`  
**Fixed State**: `qual = "(uid() = id)"`

### ✅ Test 2: Daily Menu Update Policies Count
**Expected**: PASS  
**Verification**: 3 UPDATE policies exist on `daily_menu` table  
**Fixed State**: 
- `daily_menu_update_creator_or_admin`
- `daily_menu_update_cook`
- `daily_menu_update_notes_any_user`

### ✅ Test 3: Cook Requests Table Existence
**Expected**: PASS  
**Verification**: `cook_requests` table exists in public schema  
**Fixed State**: Table with 9 columns (id, item, quantity, note, status, cook_comment, requested_by, created_at, updated_at)

### ✅ Test 4: Cook Requests Updated_At Trigger
**Expected**: PASS  
**Verification**: `cook_requests_set_updated_at` trigger exists  
**Fixed State**: Trigger attached to `cook_requests` table, calls `set_updated_at()` function

### ✅ Test 5: Flat Fund Role Bindings
**Expected**: PASS  
**Verification**: All policies on flat_fund/contribution tables have `TO authenticated`  
**Fixed State**: 9 policies with explicit `roles = {authenticated}` binding

### ✅ Test 6: Avatars Storage UPDATE Policy
**Expected**: PASS  
**Verification**: `avatars_owner_update` policy exists on `storage.objects`  
**Fixed State**: Policy allows users to UPDATE (replace) their own avatars

### ✅ Test 7: Admin Update Profile RPC Function
**Expected**: PASS  
**Verification**: `admin_update_profile()` function exists in public schema  
**Fixed State**: SECURITY DEFINER function with 5 parameters

## Verification Checklist

Before running the test, verify the following fixes are present in `supabase/schema.sql`:

- [ ] **Line ~390**: `profiles_self_update` policy has `USING (auth.uid() = id)` (no `NOT is_admin()`)
- [ ] **Line ~520**: Three daily_menu UPDATE policies exist (creator/admin, cook, any-user)
- [ ] **Line ~180**: `cook_requests` table definition with all columns
- [ ] **Line ~340**: `cook_requests_set_updated_at` trigger definition
- [ ] **Line ~550-570**: Flat fund and contribution policies have `TO authenticated`
- [ ] **Line ~640**: `avatars_owner_update` storage policy definition
- [ ] **Line ~330**: `admin_update_profile()` function definition

## Schema Verification

The fixed `supabase/schema.sql` includes all 7 fixes:

### Fix 1: Admin Self-Update (Line ~390)
```sql
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Fix 2: Daily Menu Policies (Line ~520)
```sql
CREATE POLICY "daily_menu_update_creator_or_admin" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin())
  WITH CHECK (auth.uid() = created_by OR public.is_admin());

CREATE POLICY "daily_menu_update_cook" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (public.is_cook())
  WITH CHECK (public.is_cook());

CREATE POLICY "daily_menu_update_notes_any_user" ON public.daily_menu
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Fix 3: Cook Requests Table (Line ~180)
```sql
CREATE TABLE IF NOT EXISTS public.cook_requests (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    item         text        NOT NULL,
    quantity     text,
    note         text,
    status       text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    cook_comment text,
    requested_by uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at   timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at   timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

### Fix 4: Cook Requests Trigger (Line ~340)
```sql
DROP TRIGGER IF EXISTS cook_requests_set_updated_at ON public.cook_requests;
CREATE TRIGGER cook_requests_set_updated_at
  BEFORE UPDATE ON public.cook_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### Fix 5: Role Bindings (Line ~550-570)
```sql
-- Example: flat_fund_allocations
CREATE POLICY "flat_fund_alloc_select" ON public.flat_fund_allocations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "flat_fund_alloc_insert" ON public.flat_fund_allocations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "flat_fund_alloc_delete" ON public.flat_fund_allocations
  FOR DELETE TO authenticated USING (auth.uid() = allocated_by);
```

### Fix 6: Avatars UPDATE Policy (Line ~640)
```sql
CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Fix 7: Admin RPC Function (Line ~330)
```sql
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  target_user_id  uuid,
  p_role          text    DEFAULT NULL,
  p_can_add_exp   boolean DEFAULT NULL,
  p_full_name     text    DEFAULT NULL,
  p_is_active     boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF p_role IS NOT NULL AND p_role NOT IN ('user', 'admin', 'cook') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE public.profiles
  SET
    role             = COALESCE(p_role,        role),
    can_add_expenses = COALESCE(p_can_add_exp, can_add_expenses),
    full_name        = COALESCE(p_full_name,   full_name),
    is_active        = COALESCE(p_is_active,   is_active)
  WHERE id = target_user_id;
END;
$$;
```

## Test Execution Results

### Manual Verification (Code Review)

I have verified that `supabase/schema.sql` contains all 7 fixes:

1. ✅ **Admin Self-Update**: Line 390 - `profiles_self_update` policy allows admin self-update
2. ✅ **Daily Menu Policies**: Lines 520-540 - Three UPDATE policies exist
3. ✅ **Cook Requests Table**: Line 180 - Table definition with all columns
4. ✅ **Cook Requests Trigger**: Line 340 - Trigger attached to table
5. ✅ **Role Bindings**: Lines 550-570 - All policies have `TO authenticated`
6. ✅ **Avatars UPDATE Policy**: Line 640 - `avatars_owner_update` policy exists
7. ✅ **Admin RPC Function**: Line 330 - `admin_update_profile()` function exists

### Database Verification (Required)

To complete Task 3.9, the test must be run against the live database:

**Status**: ⏳ Awaiting database execution

**Instructions**:
1. Run `supabase/verify_bug_fixes.sql` in Supabase SQL Editor
2. Verify all 7 tests show ✅ PASSED
3. Document any failures and investigate root cause

## Success Criteria

Task 3.9 is complete when:

- [x] All 7 fixes are present in `supabase/schema.sql` (verified by code review)
- [ ] `verify_bug_fixes.sql` test executed against live database
- [ ] All 7 tests show ✅ PASSED in test output
- [ ] No counterexamples or failures reported

## Next Steps

After Task 3.9 passes:
- Proceed to **Task 3.10**: Verify preservation tests still pass
- Ensure no regressions were introduced by the fixes
- Validate migration idempotency

## References

- **Task 1 Results**: `supabase/BUG_CONDITION_TEST_RESULTS.md`
- **Bugfix Requirements**: `.kiro/specs/cors-errors-comprehensive-fix/bugfix.md`
- **Design Document**: `.kiro/specs/cors-errors-comprehensive-fix/design.md`
- **Original Test**: `supabase/bug_condition_exploration_test.sql`
- **Verification Test**: `supabase/verify_bug_fixes.sql`
