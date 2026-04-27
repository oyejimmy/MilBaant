-- Cook advance: money given to the cook upfront
create table if not exists public.cook_advances (
  id uuid primary key default gen_random_uuid(),
  amount numeric(10, 2) not null check (amount > 0),
  date date not null default current_date,
  note text,
  given_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

-- Cook purchase: items the cook bought using the advance
create table if not exists public.cook_purchases (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  item text not null,
  amount numeric(10, 2) not null check (amount > 0),
  category text not null default 'grocery' check (
    category in ('grocery', 'meat', 'vegetables', 'spices', 'dairy', 'other')
  ),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references public.profiles (id) on delete restrict
);

create index if not exists cook_advances_date_idx on public.cook_advances (date);
create index if not exists cook_purchases_date_idx on public.cook_purchases (date);

alter table public.cook_advances enable row level security;
alter table public.cook_purchases enable row level security;

-- Everyone can read
drop policy if exists "cook_advances_select" on public.cook_advances;
create policy "cook_advances_select"
  on public.cook_advances for select to authenticated using (true);

drop policy if exists "cook_purchases_select" on public.cook_purchases;
create policy "cook_purchases_select"
  on public.cook_purchases for select to authenticated using (true);

-- Only admins can record advances
drop policy if exists "cook_advances_admin_insert" on public.cook_advances;
create policy "cook_advances_admin_insert"
  on public.cook_advances for insert to authenticated
  with check (public.is_admin());

drop policy if exists "cook_advances_admin_delete" on public.cook_advances;
create policy "cook_advances_admin_delete"
  on public.cook_advances for delete to authenticated
  using (public.is_admin());

-- Users with expense permission can log purchases
drop policy if exists "cook_purchases_insert" on public.cook_purchases;
create policy "cook_purchases_insert"
  on public.cook_purchases for insert to authenticated
  with check (
    auth.uid() = created_by
    and public.can_current_user_add_expenses()
  );

drop policy if exists "cook_purchases_admin_delete" on public.cook_purchases;
create policy "cook_purchases_admin_delete"
  on public.cook_purchases for delete to authenticated
  using (public.is_admin() or auth.uid() = created_by);
