-- Allow any authenticated user to add/delete weekend expenses, rides, and cook records

-- ── Expenses (weekend_meal) ────────────────────────────────────────────────
drop policy if exists "expenses_insert_authenticated" on public.expenses;
create policy "expenses_insert_authenticated"
  on public.expenses for insert to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "expenses_delete_authenticated" on public.expenses;
create policy "expenses_delete_authenticated"
  on public.expenses for delete to authenticated
  using (auth.uid() = created_by or public.is_admin());

drop policy if exists "expenses_update_authenticated" on public.expenses;
create policy "expenses_update_authenticated"
  on public.expenses for update to authenticated
  using (auth.uid() = created_by or public.is_admin());

-- ── Expense participants ───────────────────────────────────────────────────
drop policy if exists "expense_participants_insert" on public.expense_participants;
create policy "expense_participants_insert"
  on public.expense_participants for insert to authenticated
  with check (true);

-- ── Rides ─────────────────────────────────────────────────────────────────
drop policy if exists "rides_insert_authenticated" on public.rides;
create policy "rides_insert_authenticated"
  on public.rides for insert to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "rides_admin_delete" on public.rides;
create policy "rides_delete_authenticated"
  on public.rides for delete to authenticated
  using (auth.uid() = created_by or public.is_admin());

-- ── Ride riders ───────────────────────────────────────────────────────────
drop policy if exists "ride_riders_insert_authenticated" on public.ride_riders;
create policy "ride_riders_insert_authenticated"
  on public.ride_riders for insert to authenticated
  with check (true);

drop policy if exists "ride_riders_admin_delete" on public.ride_riders;
create policy "ride_riders_delete_authenticated"
  on public.ride_riders for delete to authenticated
  using (true);

-- ── Cook advances ─────────────────────────────────────────────────────────
drop policy if exists "cook_advances_admin_insert" on public.cook_advances;
create policy "cook_advances_insert_authenticated"
  on public.cook_advances for insert to authenticated
  with check (auth.uid() = given_by);

drop policy if exists "cook_advances_admin_delete" on public.cook_advances;
create policy "cook_advances_delete_authenticated"
  on public.cook_advances for delete to authenticated
  using (auth.uid() = given_by or public.is_admin());

-- ── Cook purchases ────────────────────────────────────────────────────────
drop policy if exists "cook_purchases_insert" on public.cook_purchases;
create policy "cook_purchases_insert_authenticated"
  on public.cook_purchases for insert to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "cook_purchases_admin_delete" on public.cook_purchases;
create policy "cook_purchases_delete_authenticated"
  on public.cook_purchases for delete to authenticated
  using (auth.uid() = created_by or public.is_admin());

-- ── Debt settlements ──────────────────────────────────────────────────────
drop policy if exists "settlements_insert_authenticated" on public.debt_settlements;
create policy "settlements_insert_authenticated"
  on public.debt_settlements for insert to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "settlements_admin_delete" on public.debt_settlements;
create policy "settlements_delete_authenticated"
  on public.debt_settlements for delete to authenticated
  using (auth.uid() = created_by or public.is_admin());
