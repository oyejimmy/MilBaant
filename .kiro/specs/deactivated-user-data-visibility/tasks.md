# Implementation Plan: Deactivated User Data Visibility

## Overview

Implement a client-side data visibility layer that hides deactivated users' data by default across all views. The feature is built entirely in the React/TypeScript frontend using a shared `useShowDeactivated` hook, a `useActiveProfiles` hook, updated data-fetching hooks with an `activeUserIds` filter parameter, a reusable `DeactivatedToggle` component, and visual distinction utilities.

No database schema changes are required — `profiles.is_active` already exists.

## Tasks

- [ ] 1. Add utility functions and shared filtering helpers
  - Add `deactivatedNameStyle()` and `formatUserName(name, isActive)` to `src/lib/ui-helpers.ts`
  - Add a pure `filterRecordsByActiveUsers(records, activeIds, ownerField)` helper to `src/lib/ui-helpers.ts` for use in tests
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 1.1 Write property test for `formatUserName`
    - **Property 4: Deactivated name formatting appends label**
    - **Validates: Requirements 3.5**

  - [ ]* 1.2 Write property test for `filterRecordsByActiveUsers`
    - **Property 1: Active-only filter excludes all deactivated records**
    - **Property 2: Show-all filter is identity**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.7**

- [ ] 2. Implement `useShowDeactivated` hook
  - Create `src/hooks/useShowDeactivated.ts`
  - Read initial value from `localStorage` key `'milbaant_show_deactivated'`, defaulting to `false`
  - Wrap both `localStorage.getItem` and `localStorage.setItem` in `try/catch`; on read failure default to `false`, on write failure continue with in-memory state
  - Export `[show, toggle]` tuple
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 15.3, 15.4_

  - [ ]* 2.1 Write property test for `useShowDeactivated` persistence round-trip
    - **Property 5: Visibility preference round-trip**
    - **Validates: Requirements 4.1, 4.2, 4.4**

- [ ] 3. Implement `useActiveProfiles` and `useActiveProfileIds` hooks
  - Create `src/hooks/useActiveProfiles.ts`
  - `useActiveProfiles(includeDeactivated = false)` filters `useProfiles()` data, returning only profiles where `is_active !== false` when `includeDeactivated` is `false`
  - `useActiveProfileIds(includeDeactivated = false)` returns the `id` array from `useActiveProfiles`
  - _Requirements: 1.8, 1.9, 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 3.1 Write property test for `useActiveProfiles` filtering
    - **Property 3: User list filtering excludes deactivated profiles**
    - **Property 8: User selection dropdowns always show only active users**
    - **Validates: Requirements 1.8, 1.9, 13.1, 13.2, 13.3, 13.4, 13.5**

- [ ] 4. Implement `DeactivatedToggle` component
  - Create `src/components/DeactivatedToggle.tsx`
  - Render an Ant Design `Switch` with label `"Show Deactivated Users"` when `value = false` and `"Hide Deactivated Users"` when `value = true`
  - Accept `value: boolean` and `onChange: (value: boolean) => void` props
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 4.1 Write unit test for `DeactivatedToggle` label rendering
    - **Property 6: Toggle label reflects state**
    - **Validates: Requirements 8.1, 8.2**

- [ ] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Update `useExpenses` hook to accept `activeUserIds` filter
  - Add optional `activeUserIds?: string[]` parameter to `useExpenses(month, activeUserIds?)`
  - When `activeUserIds` is provided, add `.in('created_by', activeUserIds)` to the Supabase query
  - Include `activeUserIds ?? 'all'` in the React Query key so toggling causes a re-fetch
  - _Requirements: 1.1, 1.2, 6.1, 6.5_

- [ ] 7. Update `useRides` hook to accept `activeUserIds` filter
  - Add optional `activeUserIds?: string[]` parameter to `useRides(month, activeUserIds?)`
  - When `activeUserIds` is provided, add `.in('paid_by', activeUserIds)` to the Supabase query
  - Include `activeUserIds ?? 'all'` in the React Query key
  - _Requirements: 1.3, 1.4, 6.2, 6.5, 10.1, 10.2_

- [ ] 8. Update `useCookAdvances` and `useCookPurchases` hooks to accept `activeUserIds` filter
  - Add optional `activeUserIds?: string[]` to `useCookAdvances(activeUserIds?)`; filter on `given_by`
  - Add optional `activeUserIds?: string[]` to `useCookPurchases(activeUserIds?)`; filter on `created_by`
  - Include `activeUserIds ?? 'all'` in each React Query key
  - _Requirements: 1.5, 1.6, 6.3, 6.5, 11.1, 11.2_

- [ ] 9. Update `useContributionPayments` hook to accept `activeUserIds` filter
  - Add optional `activeUserIds?: string[]` to `useContributionPayments(month, activeUserIds?)`; filter on `user_id`
  - Include `activeUserIds ?? 'all'` in the React Query key
  - _Requirements: 1.7, 6.4, 6.5_

- [ ] 10. Update `useAnnouncements` hook to accept `activeUserIds` filter
  - Add optional `activeUserIds?: string[]` to `useAnnouncements(activeUserIds?)`; filter on `created_by`
  - Include `activeUserIds ?? 'all'` in the React Query key
  - _Requirements: 12.1, 12.3_

- [ ] 11. Update `useActivityLogs` hook to accept `activeUserIds` filter
  - Add optional `activeUserIds?: string[]` to `useActivityLogs(activeUserIds?)`; filter on `user_id`
  - Include `activeUserIds ?? 'all'` in the React Query key
  - _Requirements: 12.2, 12.4_

- [ ] 12. Update `useBedAssignments` hook to accept `activeUserIds` filter
  - Add optional `activeUserIds?: string[]` to `useBedAssignments(activeUserIds?)`; filter on `user_id`
  - Include `activeUserIds ?? 'all'` in the React Query key
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 13. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Wire toggle into `ExpensesPage`
  - Import `useShowDeactivated`, `useActiveProfileIds`, and `DeactivatedToggle`
  - Derive `activeUserIds` from `useActiveProfileIds(showDeactivated)` (only when `profilesQuery.isSuccess`, otherwise `undefined`)
  - Pass `activeUserIds` to `useExpenses` and `useContributionPayments`
  - Pass only active profiles to `buildMonthlyUserSummary` and `calculatePerMemberShare` (use active profile count, not stored member count, when `showDeactivated = false`)
  - Render `<DeactivatedToggle>` in the `actions` prop of `PageHeader` when `isAdmin` is true
  - Apply `deactivatedNameStyle()` and `formatUserName()` to creator names in expense table rows when `showDeactivated = true`
  - _Requirements: 2.2, 3.1, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4_

- [ ] 15. Wire toggle into `WeekendExpensesPage`
  - Import `useShowDeactivated`, `useActiveProfiles`, `useActiveProfileIds`, and `DeactivatedToggle`
  - Pass `activeUserIds` to `useExpenses`
  - Pass only active profiles to `buildDebtMatrix` when `showDeactivated = false`
  - Render `<DeactivatedToggle>` in `PageHeader` actions when `isAdmin` is true
  - Apply visual distinction to deactivated participant names in expense detail modal when `showDeactivated = true`
  - _Requirements: 2.3, 3.2, 8.4, 8.5, 8.6_

- [ ] 16. Wire toggle into `RidesPage`
  - Import `useShowDeactivated`, `useActiveProfiles`, `useActiveProfileIds`, and `DeactivatedToggle`
  - Pass `activeUserIds` to `useRides`
  - Use `useActiveProfiles(false)` (always active-only) for the "Paid By" and "Riders" dropdowns in `AddRideModal`
  - Render `<DeactivatedToggle>` in `PageHeader` actions when `isAdmin` is true
  - Apply `deactivatedNameStyle()` and `formatUserName()` to rider/payer names in table rows when `showDeactivated = true`
  - _Requirements: 2.4, 3.2, 8.4, 8.5, 8.6, 10.1, 10.2, 10.3, 10.4, 13.2_

- [ ] 17. Wire toggle into `CookPage`
  - Import `useShowDeactivated`, `useActiveProfileIds`, and `DeactivatedToggle`
  - Pass `activeUserIds` to `useCookAdvances` and `useCookPurchases`
  - Use `useActiveProfiles(false)` for the "Given By" dropdown in `AdvanceModal`
  - Render `<DeactivatedToggle>` in `PageHeader` actions when `isAdmin` is true
  - Apply `deactivatedNameStyle()` and `formatUserName()` to giver/creator names in table rows when `showDeactivated = true`
  - _Requirements: 2.5, 3.3, 8.4, 8.5, 8.6, 11.1, 11.2, 11.3, 11.4, 13.3_

- [ ] 18. Wire toggle into `ContributionsPage`
  - Import `useShowDeactivated`, `useActiveProfiles`, `useActiveProfileIds`, and `DeactivatedToggle`
  - Pass `activeUserIds` to `useContributionPayments`
  - Use `useActiveProfiles(false)` to build the summary table (only active users shown by default)
  - Render `<DeactivatedToggle>` in `PageHeader` actions when `isAdmin` is true
  - Apply `deactivatedNameStyle()` and `formatUserName()` to member names when `showDeactivated = true`
  - _Requirements: 2.6, 3.4, 8.4, 8.5, 8.6, 13.4_

- [ ] 19. Wire toggle into `AnnouncementsPage`
  - Import `useShowDeactivated`, `useActiveProfileIds`, and `DeactivatedToggle`
  - Pass `activeUserIds` to `useAnnouncements`
  - Render `<DeactivatedToggle>` in `PageHeader` actions when `isAdmin` is true
  - Apply `deactivatedNameStyle()` and `formatUserName()` to creator names when `showDeactivated = true`
  - _Requirements: 12.1, 12.3, 8.4, 8.5, 8.6_

- [ ] 20. Wire toggle into `LogsPage`
  - Import `useShowDeactivated`, `useActiveProfileIds`, and `DeactivatedToggle`
  - Pass `activeUserIds` to `useActivityLogs`
  - Render `<DeactivatedToggle>` in `PageHeader` actions when `isAdmin` is true
  - Apply `deactivatedNameStyle()` and `formatUserName()` to actor names in the log table when `showDeactivated = true`
  - _Requirements: 12.2, 12.4, 8.4, 8.5, 8.6_

- [ ] 21. Wire toggle into `DashboardPage`
  - Import `useShowDeactivated`, `useActiveProfiles`, `useActiveProfileIds`, and `DeactivatedToggle`
  - Pass `activeUserIds` to `useExpenses` and `useContributionPayments`
  - Pass only active profiles to `buildMonthlyUserSummary`; use active profile count for `calculatePerMemberShare` when `showDeactivated = false`
  - Render `<DeactivatedToggle>` in `PageHeader` actions when `isAdmin` is true
  - Apply `deactivatedNameStyle()` and `formatUserName()` to flatmate names in the balance table when `showDeactivated = true`
  - _Requirements: 2.1, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 21.1 Write property test for balance calculation with active profile count
    - **Property 7: Balance calculation uses active profile count**
    - **Validates: Requirements 9.1**

- [ ] 22. Wire toggle into `FlatViewPage` and `FlatView3D` component
  - Import `useShowDeactivated`, `useActiveProfileIds`, and `DeactivatedToggle` in `FlatViewPage`
  - Pass `activeUserIds` down to `FlatView3D` (or directly to `useBedAssignments`)
  - Update `useBedAssignments` call to pass `activeUserIds`
  - Render `<DeactivatedToggle>` in `FlatViewPage`'s `PageHeader` actions when `isAdmin` is true
  - When `showDeactivated = true`, render deactivated user avatars with reduced opacity (`deactivatedNameStyle()`)
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 8.4, 8.5, 8.6_

- [ ] 23. Confirm `AdminPage` is unaffected
  - Verify `AdminPage` does NOT import or render `DeactivatedToggle`
  - Verify `useProfiles()` in `AdminPage` is called without any `activeUserIds` filter (always shows all users)
  - Verify `FlatFloorplan` in `AdminPage` uses `useBedAssignments()` without filter
  - No code changes needed if already correct; add a comment if clarification helps
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 24. Update user selection dropdowns to always use active-only profiles
  - In `ExpenseFormModal` (participant selection): replace `useProfiles()` with `useActiveProfiles(false)`
  - In `AddRideModal` (riders and paid-by): replace `useProfiles()` with `useActiveProfiles(false)`
  - In `AdvanceModal` (given-by): replace `useProfiles()` with `useActiveProfiles(false)`
  - In `ContributionsPage` payment modal (user selection): replace `useProfiles()` with `useActiveProfiles(false)`
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 25. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use [fast-check](https://fast-check.dev/) — install with `npm install --save-dev fast-check` if not already present
- Each property test file should include the comment tag: `// Feature: deactivated-user-data-visibility, Property N: <property text>`
- The `activeUserIds` filter is only applied when `profilesQuery.isSuccess` is true; pass `undefined` otherwise so unfiltered data is shown on profiles query failure (Requirement 15.5)
- User selection dropdowns always use `useActiveProfiles(false)` regardless of the admin toggle state (Requirement 13.5)
- The Admin page never shows the toggle and always displays all users (Requirement 5.1, 5.2)
- `calculatePerMemberShare` in `DashboardPage` and `ExpensesPage` should use `activeProfiles.length` instead of the stored member count setting when `showDeactivated = false`
