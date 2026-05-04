# Bug Condition Exploration Test Results

## Test Execution Date
**Status**: Ready to Execute  
**Database**: Supabase (https://shfurtphvyejbbiktzsj.supabase.co)

## Purpose
This document records the results of running `bug_condition_exploration_test.sql` against a database initialized from the **UNFIXED** `supabase/schema.sql` file.

**CRITICAL**: These tests are EXPECTED TO FAIL on unfixed code. Failure confirms the bugs exist.

## How to Execute

### Prerequisites
1. Access to Supabase SQL Editor
2. Database initialized from UNFIXED `supabase/schema.sql`
3. No migrations applied (especially NOT `20260430_cors_fix_all.sql`)

### Execution Steps
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/shfurtphvyejbbiktzsj/sql
2. Copy contents of `supabase/bug_condition_exploration_test.sql`
3. Paste into SQL Editor
4. Click "Run" to execute all tests
5. Review NOTICE messages in the Results panel
6. Document counterexamples below

## Expected Test Results (Unfixed Schema)

### Test 1: Admin Self-Update Policy Check
**Expected Result**: ❌ FAIL  
**Bug**: `profiles_self_update` policy has `NOT is_admin()` restriction  
**Counterexample**: 
```
qual = '((uid() = id) AND (NOT is_admin()))'
```
**Impact**: Admin users cannot update their own profile (name, phone, bio, avatar)  
**Browser Error**: 403 Forbidden (interpreted as CORS error)

---

### Test 2: Daily Menu Update Policies Count
**Expected Result**: ❌ FAIL  
**Bug**: Only 1 UPDATE policy exists instead of 3  
**Counterexample**: 
```
policy_count = 1
Only policy: daily_menu_update_authenticated
```
**Impact**: 
- Regular users cannot update daily menu notes
- Cook cannot update dinner entries
- Only creator or admin can update any field

**Browser Error**: 403 Forbidden (interpreted as CORS error)

---

### Test 3: Cook Requests Table Existence
**Expected Result**: ❌ FAIL  
**Bug**: `cook_requests` table doesn't exist in base schema  
**Counterexample**: 
```
table not found in public schema
```
**Impact**: 
- Users cannot create cook requests
- Application features dependent on cook_requests fail

**Browser Error**: "relation does not exist"

---

### Test 4: Cook Requests Updated_At Trigger
**Expected Result**: ❌ FAIL  
**Bug**: `set_updated_at` trigger not attached to `cook_requests`  
**Counterexample**: 
```
trigger not found on cook_requests table
(Also fails because table doesn't exist)
```
**Impact**: 
- Client must manually send `updated_at` timestamps
- Potential constraint conflicts when both client and server try to set timestamp

**Browser Error**: Constraint violation (interpreted as CORS error)

---

### Test 5: Flat Fund Role Bindings
**Expected Result**: ❌ FAIL  
**Bug**: Policies lack explicit `TO authenticated` role binding  
**Counterexample**: 
```
0 of 9 policies have role binding
roles = '{}' for all policies on:
  - flat_fund_allocations
  - flat_fund_expenses
  - contribution_payments
```
**Impact**: 
- Policies apply to both `authenticated` and `anon` roles
- Unpredictable authorization behavior
- Authenticated requests may be routed through anon policy path

**Browser Error**: 403 Forbidden or empty result sets

---

### Test 6: Avatars Storage UPDATE Policy
**Expected Result**: ❌ FAIL  
**Bug**: `avatars_owner_update` storage policy is missing  
**Counterexample**: 
```
policy not found on storage.objects
Only policies: avatars_owner_upsert, avatars_owner_delete
```
**Impact**: 
- Users can INSERT (upload) avatars
- Users can DELETE avatars
- Users CANNOT UPDATE (replace) avatars

**Browser Error**: 403 Forbidden (interpreted as CORS error)

---

### Test 7: Admin Update Profile RPC Function
**Expected Result**: ❌ FAIL  
**Bug**: `admin_update_profile()` function doesn't exist  
**Counterexample**: 
```
function not found in public schema
```
**Impact**: 
- Admins cannot update user roles via RPC
- Admins cannot activate/deactivate users
- Admin panel profile management features fail

**Browser Error**: "function does not exist"

---

## Summary of Counterexamples

All 7 tests are expected to FAIL on the unfixed schema, confirming:

1. ✅ **Admin self-update blocked** - `NOT is_admin()` restriction in policy
2. ✅ **Daily menu updates restricted** - Only 1 policy instead of 3
3. ✅ **Cook requests table missing** - Table not in base schema
4. ✅ **Cook requests trigger missing** - Trigger not attached
5. ✅ **Role bindings missing** - Policies apply to anon role
6. ✅ **Avatar UPDATE policy missing** - Cannot replace avatars
7. ✅ **Admin RPC function missing** - Function not in base schema

## Validation After Fix

After updating `supabase/schema.sql` with all 7 fixes, re-run this test file. All tests should PASS:

- ✅ TEST 1 PASSED: profiles_self_update policy allows admin self-update
- ✅ TEST 2 PASSED: daily_menu has 3 UPDATE policies
- ✅ TEST 3 PASSED: cook_requests table exists
- ✅ TEST 4 PASSED: cook_requests_set_updated_at trigger exists
- ✅ TEST 5 PASSED: All flat_fund/contribution policies have TO authenticated
- ✅ TEST 6 PASSED: avatars_owner_update storage policy exists
- ✅ TEST 7 PASSED: admin_update_profile() RPC function exists

## Notes

- These tests are READ-ONLY queries against PostgreSQL system catalogs
- No data is modified during test execution
- Tests can be run multiple times safely
- Tests are idempotent and deterministic

## References

- **Bugfix Requirements**: `.kiro/specs/cors-errors-comprehensive-fix/bugfix.md`
- **Design Document**: `.kiro/specs/cors-errors-comprehensive-fix/design.md`
- **Migration File**: `supabase/migrations/20260430_cors_fix_all.sql`
- **Original Exploration Tests**: `supabase/exploration_tests.sql`
