# Bugfix Requirements Document

## Introduction

The MilBaant app (React/TypeScript + Supabase) surfaces CORS-like errors on several API operations. In Supabase, a "CORS error" seen in the browser is almost always caused by an RLS (Row Level Security) policy rejection — Supabase returns a 401/403 HTTP response, and the browser misreports it as a CORS preflight failure. The root causes found across all hooks are:

1. **`profiles` UPDATE conflict** — two overlapping RLS policies (`profiles_admin_update` and `profiles_self_update`) use mutually exclusive `USING` clauses. When an admin tries to update their own profile, neither policy matches, causing a 403 that the browser surfaces as CORS.
2. **`daily_menu` UPDATE by non-creator** — the base schema only allows the creator or admin to update a menu row. Any other authenticated user (e.g. a regular user saving breakfast preferences) gets a 403/CORS error.
3. **`cook_requests` UPDATE — `updated_at` sent from client** — `useCookRequests.ts` sends `updated_at: new Date().toISOString()` in the update payload. If a DB trigger also sets `updated_at`, Supabase rejects the conflicting write as a constraint violation, which the browser surfaces as a CORS error.
4. **`flat_fund_allocations` / `flat_fund_expenses` / `contribution_payments` — missing `TO authenticated` role binding** — the INSERT and SELECT policies omit `TO authenticated`, meaning they apply to the `anon` role as well. While this does not cause a CORS error directly, it means unauthenticated requests silently succeed or fail unpredictably, and authenticated requests may hit the wrong policy path.
5. **`admin_update_profile` RPC missing** — if the database was set up from the old `schema.sql` (not `02_complete_schema.sql`) the `admin_update_profile` SECURITY DEFINER function does not exist, so every admin profile-permission change throws a CORS/network error.
6. **Storage bucket policies missing `UPDATE`** — the `avatars` bucket has an `avatars_owner_update` policy in the schema but it may be absent on databases initialised before that policy was added, causing avatar upload/replace to fail with a CORS error.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an admin user updates their own profile fields (name, phone, bio) THEN the system returns a 403/CORS error because both `profiles_admin_update` (USING `is_admin()`) and `profiles_self_update` (USING `auth.uid() = id AND NOT is_admin()`) fail to match simultaneously for an admin acting on their own row.

1.2 WHEN a regular authenticated user (non-creator, non-admin) attempts to update the `daily_menu` row (e.g. saving a breakfast preference in the `notes` column) THEN the system returns a 403/CORS error because the base schema UPDATE policy only permits the creator or admin.

1.3 WHEN the cook or admin calls `useCookReply` to update a `cook_requests` row THEN the system may return a CORS/constraint error because the client sends `updated_at: new Date().toISOString()` while a DB trigger also attempts to set `updated_at`, creating a conflict.

1.4 WHEN any authenticated user inserts into `flat_fund_allocations`, `flat_fund_expenses`, or `contribution_payments` THEN the system may silently apply the wrong policy path because the INSERT/SELECT policies lack `TO authenticated` role binding, causing unpredictable 403 errors.

1.5 WHEN an admin calls `useUpdateProfilePermissions` on a database that was initialised from the old `schema.sql` (without the `admin_update_profile` RPC) THEN the system returns a CORS/network error because the RPC function does not exist.

1.6 WHEN a user uploads or replaces their avatar image THEN the system returns a CORS error on databases where the `avatars_owner_update` storage policy was not applied, because the UPDATE operation on `storage.objects` is blocked.

### Expected Behavior (Correct)

2.1 WHEN an admin user updates their own profile fields THEN the system SHALL apply the `profiles_admin_update` policy (which already covers all users including self) and complete the update without error.

2.2 WHEN any authenticated user updates the `notes` column of a `daily_menu` row THEN the system SHALL permit the update via a permissive RLS policy that allows all authenticated users to write to `daily_menu`, and the operation SHALL complete without a CORS/403 error.

2.3 WHEN the cook or admin calls `useCookReply` to update a `cook_requests` row THEN the system SHALL NOT send `updated_at` from the client; the DB trigger SHALL set it automatically, and the update SHALL complete without error.

2.4 WHEN any authenticated user inserts into `flat_fund_allocations`, `flat_fund_expenses`, or `contribution_payments` THEN the system SHALL apply the correct `TO authenticated` scoped policies, ensuring only logged-in users can write and the correct policy path is followed.

2.5 WHEN an admin calls `useUpdateProfilePermissions` THEN the system SHALL invoke the `admin_update_profile` SECURITY DEFINER RPC which exists on the database, and the update SHALL complete without error.

2.6 WHEN a user uploads or replaces their avatar image THEN the system SHALL apply the `avatars_owner_update` storage policy and the upload SHALL complete without a CORS error.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a non-admin user updates their own profile (name, phone, bio, avatar) THEN the system SHALL CONTINUE TO apply the `profiles_self_update` policy and allow the update.

3.2 WHEN an admin updates another user's profile via the Admin page THEN the system SHALL CONTINUE TO use the `admin_update_profile` RPC and complete without error.

3.3 WHEN the creator of a `daily_menu` row updates any column (breakfast, lunch, dinner, notes) THEN the system SHALL CONTINUE TO allow the update via the creator/admin policy.

3.4 WHEN an authenticated user reads from any table (expenses, rides, cook_requests, announcements, etc.) THEN the system SHALL CONTINUE TO return data without error.

3.5 WHEN an authenticated user inserts a new expense, ride, settlement, cook advance, or cook purchase THEN the system SHALL CONTINUE TO succeed as before.

3.6 WHEN an admin deletes any record across all tables THEN the system SHALL CONTINUE TO succeed as before.

3.7 WHEN a user uploads a bill image or payment screenshot THEN the system SHALL CONTINUE TO succeed via the existing storage INSERT policies.

3.8 WHEN the `logActivity` helper inserts into `activity_logs` THEN the system SHALL CONTINUE TO succeed without error for all authenticated users.

---

## Bug Condition Pseudocode

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type SupabaseRequest
  OUTPUT: boolean

  RETURN (
    // Admin updating own profile — policy gap
    (X.table = 'profiles' AND X.operation = 'UPDATE'
      AND is_admin(X.user_id) AND X.target_id = X.user_id)

    OR

    // Non-creator, non-admin updating daily_menu
    (X.table = 'daily_menu' AND X.operation = 'UPDATE'
      AND X.user_id <> X.row.created_by AND NOT is_admin(X.user_id))

    OR

    // Client sending updated_at on cook_requests update
    (X.table = 'cook_requests' AND X.operation = 'UPDATE'
      AND 'updated_at' IN X.payload_columns)

    OR

    // Missing TO authenticated on flat fund / contribution policies
    (X.table IN ('flat_fund_allocations','flat_fund_expenses','contribution_payments')
      AND X.operation IN ('SELECT','INSERT')
      AND X.policy_role_binding = 'public')

    OR

    // admin_update_profile RPC missing
    (X.rpc = 'admin_update_profile' AND NOT rpc_exists('admin_update_profile'))

    OR

    // avatars_owner_update storage policy missing
    (X.bucket = 'avatars' AND X.operation = 'UPDATE'
      AND NOT policy_exists('avatars_owner_update'))
  )
END FUNCTION

// Property: Fix Checking
FOR ALL X WHERE isBugCondition(X) DO
  result ← handleRequest'(X)
  ASSERT result.status IN (200, 201, 204)
  ASSERT result.error IS NULL
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT handleRequest(X) = handleRequest'(X)
END FOR
```
