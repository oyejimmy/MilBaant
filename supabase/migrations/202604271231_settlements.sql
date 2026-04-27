-- Debt settlements table
-- Records when one person pays another to clear a debt

create table if not exists public.debt_settlements (
  id uuid primary key default gen_random_uuid(),
  payer_id uuid not null references public.profiles (id) on delete cascade,
  payee_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  note text,
  settled_at date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references public.profiles (id) on delete restrict
);

create index if not exists settlements_payer_idx on public.debt_settlements (payer_id);
create index if not exists settlements_payee_idx on public.debt_settlements (payee_id);
create index if not exists settlements_date_idx on public.debt_settlements (settled_at);

alter table public.debt_settlements enable row level security;

drop policy if exists "settlements_select_authenticated" on public.debt_settlements;
create policy "settlements_select_authenticated"
  on public.debt_settlements for select to authenticated using (true);

drop policy if exists "settlements_insert_authenticated" on public.debt_settlements;
create policy "settlements_insert_authenticated"
  on public.debt_settlements for insert to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "settlements_admin_delete" on public.debt_settlements;
create policy "settlements_admin_delete"
  on public.debt_settlements for delete to authenticated
  using (public.is_admin() or auth.uid() = created_by);
