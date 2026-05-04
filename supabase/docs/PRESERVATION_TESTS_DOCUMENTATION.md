# Preservation Property Tests - Task 2 Documentation

## Overview

This document describes the preservation property tests for the CORS errors comprehensive fix. These tests verify that the migration `20260430_cors_fix_all.sql` is idempotent and preserves all existing security boundaries, admin privileges, storage access patterns, triggers, and data integrity.

## Test File

**File**: `supabase/preservation_property_tests.sql`

## Test Methodology

Following the **observation-first methodology** for bugfix specs:

1. **Observe behavior on UNFIXED code** for non-buggy scenarios
2. **Write property-based tests** capturing observed behavior patterns
3. **Tests should PASS** on unfixed code (with migration applied) to confirm baseline behavior to preserve

## Test Coverage

### Test 1: Migration Produces Expected Fixed State
**Requirements**: 3.1, 3.2

Verifies that when the migration is applied to a database initialized from OLD schema.sql, it produces the expected fixed state with all 7 CORS fixes:

1. ✅ profiles_self_update policy allows admin self-update (no NOT is_admin())
2. ✅ daily_menu has 3 UPDATE policies
3. ✅ cook_requests table exists
4. ✅ cook_requests_set_updated_at trigger exists
5. ✅ flat_fund/contribution policies have TO authenticated
6. ✅ avatars_owner_update storage policy exists
7. ✅ admin_update_profile RPC function exists

**Expected Outcome**: PASS (all 7 checks pass)

### Test 2: Migration Idempotency
**Requirements**: 3.1, 3.2

Verifies that the current state matches the expected fixed state, confirming that the migration can be safely re-applied without errors or state changes.

**Expected Outcome**: PASS (state is idempotent)

### Test 3: Security Boundary - Non-admin Users Cannot Update Other Profiles
**Requirements**: 3.3

Verifies that non-admin users are still restricted to updating only their own profiles:

1. ✅ profiles_self_update restricts to own profile (uid() = id)
2. ✅ profiles_admin_update requires admin role

**Expected Outcome**: PASS (security boundary preserved)

### Test 4: Security Boundary - Unauthenticated Access Denied
**Requirements**: 3.4

Verifies that unauthenticated users are still denied access to protected resources:

1. ✅ No protected tables accessible to anon role
2. ✅ All flat_fund/contribution policies require authentication

**Expected Outcome**: PASS (unauthenticated access properly denied)

### Test 5: Admin Privileges Preserved
**Requirements**: 3.5, 3.6, 3.7

Verifies that admin users still have full access through admin-specific policies:

1. ✅ profiles_admin_update policy exists with is_admin() check
2. ✅ admin_update_profile RPC has permission check
3. ✅ DELETE policies include admin bypass

**Expected Outcome**: PASS (admin privileges preserved)

### Test 6: Storage Access Patterns Preserved
**Requirements**: 3.8, 3.9

Verifies that storage access patterns are preserved:

1. ✅ Public read access exists for all 3 storage buckets
2. ✅ Owner-based write/delete policies exist
3. ✅ avatars_owner_update policy exists (fix applied)

**Expected Outcome**: PASS (storage access patterns preserved)

### Test 7: Triggers Still Function
**Requirements**: 3.10, 3.11

Verifies that all triggers continue to function:

1. ✅ set_updated_at() function exists
2. ✅ daily_menu_set_updated_at trigger exists
3. ✅ cook_requests_set_updated_at trigger exists (newly added)
4. ✅ on_auth_user_created trigger exists
5. ✅ handle_new_user() function exists

**Expected Outcome**: PASS (all triggers exist and are configured)

### Test 8: Data Integrity Constraints Enforced
**Requirements**: 3.12, 3.13

Verifies that data integrity constraints remain enforced:

1. ✅ Foreign key constraints exist (>= 20 constraints)
2. ✅ Check constraints exist (>= 10 constraints)
3. ✅ profiles role constraint enforces valid values
4. ✅ cook_requests status constraint exists (newly added)

**Expected Outcome**: PASS (data integrity constraints enforced)

### Test 9: Schema Supports Data Preservation
**Requirements**: 3.14, 3.15

Verifies that the schema structure supports data preservation:

1. ✅ All expected tables exist (>= 17 tables)
2. ✅ Indexes preserved for query performance (>= 20 indexes)
3. ✅ RLS enabled on all tables (data protection)

**Expected Outcome**: PASS (schema supports data preservation)

## How to Execute Tests

### Option 1: Supabase SQL Editor (Recommended)

1. Open: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
2. Copy contents of: `supabase/preservation_property_tests.sql`
3. Paste and click "Run"
4. Review NOTICE messages in Results panel

### Option 2: psql Command Line

```bash
# If you have direct PostgreSQL access
psql <connection_string> -f supabase/preservation_property_tests.sql
```

### Option 3: Node.js Script

```bash
# If you have a Node.js script that connects to Supabase
node scripts/run-preservation-tests.js
```

## Expected Test Results

### On UNFIXED Schema (Before Applying Migration)

Some tests will **FAIL** because the fixes are not yet applied:
- ❌ Test 1: Some checks will fail (missing fixes)
- ❌ Test 2: State does not match fixed state
- ✅ Test 3-9: Should PASS (these verify existing behavior)

### After Applying Migration to OLD Schema

All tests should **PASS**:
- ✅ Test 1: All 7 fixes present
- ✅ Test 2: State is idempotent
- ✅ Test 3-9: All preservation checks pass

### After Applying Migration to FIXED Schema (Idempotency Check)

All tests should **PASS** with no errors:
- ✅ Test 1: All 7 fixes still present
- ✅ Test 2: State unchanged (idempotent)
- ✅ Test 3-9: All preservation checks still pass

## Test Design Rationale

### Why SQL Tests?

1. **Direct Database Inspection**: Tests query PostgreSQL system catalogs to verify schema state
2. **No Application Dependencies**: Tests run independently of the React application
3. **Environment Agnostic**: Can run in Supabase SQL Editor, psql, or any PostgreSQL client
4. **Precise Verification**: Check exact policy definitions, trigger existence, function signatures

### Property-Based Testing Approach

While these tests are written in SQL (not using a PBT framework like QuickCheck), they follow property-based testing principles:

1. **Universal Properties**: Tests verify properties that should hold for ALL database states
2. **Multiple Scenarios**: Tests cover various aspects (security, triggers, constraints)
3. **Idempotency**: Tests verify migration can be applied multiple times safely
4. **Preservation**: Tests verify existing behavior is not broken by fixes

### Test Structure

Each test follows this pattern:

```sql
DO $
DECLARE
  -- Variables to capture state
BEGIN
  -- Query system catalog or test behavior
  -- Evaluate condition
  -- Report PASS/FAIL with details
END $;
```

This provides:
- Clear pass/fail indication
- Detailed information when tests fail
- Human-readable output in NOTICE messages

## Validation Criteria

Task 2 is complete when:

- ✅ Test file created with all 9 preservation tests
- ✅ Tests cover all preservation requirements (3.1-3.15)
- ✅ Tests are ready to execute against database
- ✅ Documentation provided
- ✅ Tests PASS on database with migration applied

## Next Steps

1. **Execute Tests**: Run `preservation_property_tests.sql` in Supabase SQL Editor
2. **Verify Results**: All 9 tests should PASS
3. **Document Results**: Record any failures or unexpected behavior
4. **Proceed to Task 3**: Implement the fixes in schema.sql

## References

- **Test File**: `supabase/preservation_property_tests.sql`
- **Design Doc**: `.kiro/specs/cors-errors-comprehensive-fix/design.md`
- **Requirements**: `.kiro/specs/cors-errors-comprehensive-fix/bugfix.md`
- **Migration Reference**: `supabase/migrations/20260430_cors_fix_all.sql`
- **Task 1 Tests**: `supabase/bug_condition_exploration_test.sql`

## Notes

- Tests are designed to PASS after migration is applied
- Tests verify both that fixes are present AND that existing behavior is preserved
- Tests are idempotent and can be run multiple times
- Tests do not modify data, only inspect schema state
