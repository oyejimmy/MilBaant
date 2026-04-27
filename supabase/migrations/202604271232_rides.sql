-- Rides table: shared taxi rides (Yango, InDriver, etc.)
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  service text not null default 'Other',   -- e.g. Yango, InDriver, Other
  route text,                               -- e.g. "Home → Mall"
  amount numeric(10, 2) not null check (amount >= 0),
  paid_by uuid not null references public.profiles (id) on delete restrict,
  note text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

-- Riders: who was in the ride
create table if not exists public.ride_riders (
  ride_id uuid not null references public.rides (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (ride_id, user_id)
);

create index if not exists rides_date_idx on public.rides (date);
create index if not exists rides_paid_by_idx on public.rides (paid_by);
create index if not exists ride_riders_user_idx on public.ride_riders (user_id);

alter table public.rides enable row level security;
alter table public.ride_riders enable row level security;

-- Rides RLS
drop policy if exists "rides_select_authenticated" on public.rides;
create policy "rides_select_authenticated"
  on public.rides for select to authenticated using (true);

drop policy if exists "rides_insert_authenticated" on public.rides;
create policy "rides_insert_authenticated"
  on public.rides for insert to authenticated
  with check (auth.uid() = created_by and public.can_current_user_add_expenses());

drop policy if exists "rides_admin_delete" on public.rides;
create policy "rides_admin_delete"
  on public.rides for delete to authenticated
  using (public.is_admin() or auth.uid() = created_by);

-- Ride riders RLS
drop policy if exists "ride_riders_select_authenticated" on public.ride_riders;
create policy "ride_riders_select_authenticated"
  on public.ride_riders for select to authenticated using (true);

drop policy if exists "ride_riders_insert_authenticated" on public.ride_riders;
create policy "ride_riders_insert_authenticated"
  on public.ride_riders for insert to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.rides
      where id = ride_id and created_by = auth.uid()
    )
  );

drop policy if exists "ride_riders_admin_delete" on public.ride_riders;
create policy "ride_riders_admin_delete"
  on public.ride_riders for delete to authenticated
  using (public.is_admin());
