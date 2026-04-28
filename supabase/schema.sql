-- ============================================================
-- Full schema — run this once in the Supabase SQL editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ── Core tables ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text not null default '',
    role text not null default 'user' check (role in ('admin', 'user')),
    can_add_expenses boolean not null default false
);

create table if not exists public.rooms (
    id integer generated always as identity primary key,
    name text not null unique,
    type text not null check (
        type in (
            'bedroom',
            'washroom',
            'kitchen',
            'lounge',
            'dining'
        )
    )
);

create table if not exists public.beds (
    id integer generated always as identity primary key,
    room_id integer not null references public.rooms (id) on delete cascade,
    label text not null
);

create table if not exists public.bed_assignments (
    id integer generated always as identity primary key,
    user_id uuid not null unique references public.profiles (id) on delete cascade,
    bed_id integer not null unique references public.beds (id) on delete cascade
);

create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid (),
    created_by uuid not null references public.profiles (id) on delete restrict,
    category text not null check (
        category in (
            'gas_bill',
            'light_bill',
            'cook_salary',
            'kitchen_daily',
            'water_roti',
            'meat',
            'maintenance',
            'pcc_grocery',
            'weekend_meal'
        )
    ),
    description text,
    amount numeric(10, 2) not null check (amount >= 0),
    date date not null,
    last_date date,
    split_type text not null check (
        split_type in (
            'all_members',
            'custom_participants'
        )
    ),
    bill_image_url text,
    created_at timestamptz not null default timezone ('utc', now())
);

create table if not exists public.expense_participants (
    expense_id uuid not null references public.expenses (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    primary key (expense_id, user_id)
);

create table if not exists public.announcements (
    id uuid primary key default gen_random_uuid (),
    title text not null,
    content text not null,
    created_by uuid not null references public.profiles (id) on delete restrict,
    created_at timestamptz not null default timezone ('utc', now())
);

create table if not exists public.settings (
    key text primary key,
    value text not null
);

-- ── Settlements ───────────────────────────────────────────────────────────────
create table if not exists public.debt_settlements (
    id uuid primary key default gen_random_uuid (),
    payer_id uuid not null references public.profiles (id) on delete cascade,
    payee_id uuid not null references public.profiles (id) on delete cascade,
    amount numeric(10, 2) not null check (amount > 0),
    note text,
    settled_at date not null default current_date,
    created_at timestamptz not null default timezone ('utc', now()),
    created_by uuid not null references public.profiles (id) on delete restrict
);

-- ── Rides ─────────────────────────────────────────────────────────────────────
create table if not exists public.rides (
    id uuid primary key default gen_random_uuid (),
    date date not null,
    service text not null default 'Other',
    route text,
    amount numeric(10, 2) not null check (amount >= 0),
    paid_by uuid not null references public.profiles (id) on delete restrict,
    note text,
    created_by uuid not null references public.profiles (id) on delete restrict,
    created_at timestamptz not null default timezone ('utc', now())
);

create table if not exists public.ride_riders (
    ride_id uuid not null references public.rides (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    primary key (ride_id, user_id)
);

-- ── Cook ──────────────────────────────────────────────────────────────────────
create table if not exists public.cook_advances (
    id uuid primary key default gen_random_uuid (),
    amount numeric(10, 2) not null check (amount > 0),
    date date not null default current_date,
    note text,
    given_by uuid not null references public.profiles (id) on delete restrict,
    created_at timestamptz not null default timezone ('utc', now())
);

create table if not exists public.cook_purchases (
    id uuid primary key default gen_random_uuid (),
    date date not null default current_date,
    item text not null,
    amount numeric(10, 2) not null check (amount > 0),
    category text not null default 'grocery' check (
        category in (
            'grocery',
            'meat',
            'vegetables',
            'spices',
            'dairy',
            'other'
        )
    ),
    note text,
    created_at timestamptz not null default timezone ('utc', now()),
    created_by uuid not null references public.profiles (id) on delete restrict
);

create table if not exists public.daily_menu (
    id uuid primary key default gen_random_uuid (),
    date date not null unique,
    breakfast text,
    lunch text,
    dinner text,
    notes text,
    created_by uuid not null references public.profiles (id) on delete restrict,
    created_at timestamptz not null default timezone ('utc', now()),
    updated_at timestamptz not null default timezone ('utc', now())
);

-- ── Activity logs ─────────────────────────────────────────────────────────────
create table if not exists public.activity_logs (
    id uuid primary key default gen_random_uuid (),
    user_id uuid not null references public.profiles (id) on delete restrict,
    action text not null check (
        action in ('create', 'update', 'delete')
    ),
    entity text not null,
    entity_id text,
    description text not null,
    created_at timestamptz not null default timezone ('utc', now())
);

-- ── Flat Fund ─────────────────────────────────────────────────────────────────
-- Tracks money allocated to members from the shared flat fund,
-- and expenses they spend from it.

create table if not exists public.flat_fund_allocations (
    id uuid primary key default gen_random_uuid (),
    user_id uuid not null references public.profiles (id) on delete cascade,
    amount numeric(10, 2) not null check (amount > 0),
    note text,
    allocated_by uuid not null references public.profiles (id) on delete restrict,
    date date not null default current_date,
    created_at timestamptz not null default timezone ('utc', now())
);

create table if not exists public.flat_fund_expenses (
    id uuid primary key default gen_random_uuid (),
    user_id uuid not null references public.profiles (id) on delete cascade,
    amount numeric(10, 2) not null check (amount > 0),
    description text not null,
    category text not null default 'other' check (
        category in (
            'bulb',
            'bread',
            'water_bottle',
            'cleaning',
            'maintenance',
            'grocery',
            'other'
        )
    ),
    date date not null default current_date,
    created_by uuid not null references public.profiles (id) on delete restrict,
    created_at timestamptz not null default timezone ('utc', now())
);

-- ── Contribution Payments ─────────────────────────────────────────────────────
-- Members submit proof of payment (screenshot + amount + date) for their
-- monthly share. Admins can see who paid and who is overdue.

create table if not exists public.contribution_payments (
    id uuid primary key default gen_random_uuid (),
    user_id uuid not null references public.profiles (id) on delete cascade,
    month text not null, -- 'YYYY-MM'
    amount numeric(10, 2) not null check (amount > 0),
    paid_at date not null default current_date,
    screenshot_url text,
    note text,
    created_by uuid not null references public.profiles (id) on delete restrict,
    created_at timestamptz not null default timezone ('utc', now())
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists expenses_date_idx on public.expenses (date);

create index if not exists expenses_category_idx on public.expenses (category);

create index if not exists expense_participants_user_idx on public.expense_participants (user_id);

create index if not exists settlements_payer_idx on public.debt_settlements (payer_id);

create index if not exists settlements_payee_idx on public.debt_settlements (payee_id);

create index if not exists settlements_date_idx on public.debt_settlements (settled_at);

create index if not exists rides_date_idx on public.rides (date);

create index if not exists rides_paid_by_idx on public.rides (paid_by);

create index if not exists ride_riders_user_idx on public.ride_riders (user_id);

create index if not exists cook_advances_date_idx on public.cook_advances (date);

create index if not exists cook_purchases_date_idx on public.cook_purchases (date);

create index if not exists daily_menu_date_idx on public.daily_menu (date);

create index if not exists activity_logs_user_idx on public.activity_logs (user_id);

create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);

create index if not exists flat_fund_alloc_user_idx on public.flat_fund_allocations (user_id);

create index if not exists flat_fund_alloc_date_idx on public.flat_fund_allocations (date);

create index if not exists flat_fund_exp_user_idx on public.flat_fund_expenses (user_id);

create index if not exists flat_fund_exp_date_idx on public.flat_fund_expenses (date);

create index if not exists contrib_payments_user_idx on public.contribution_payments (user_id);

create index if not exists contrib_payments_month_idx on public.contribution_payments (month);

-- ── Helper functions ──────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_profiles integer;
begin
  select count(*) into existing_profiles from public.profiles;

  insert into public.profiles (id, full_name, role, can_add_expenses)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when existing_profiles = 0 then 'admin' else 'user' end,
    case when existing_profiles = 0 then true else false end
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.can_current_user_add_expenses()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'admin' or can_add_expenses = true)
  );
$$;

-- ── Seed data ─────────────────────────────────────────────────────────────────

-- Flatmates (6 members)
-- Room 1: Yasir Ajmal Mehmand & Muhammad Haris
-- Room 2: Sajid Ali & Ahmad Raza
-- Room 3: Babar Jamil Ur Rahman (Jimmy) & Ateeb Raza
-- Cook: Muhammad Sajid Khan

insert into
    public.rooms (name, type)
values (
        'Yasir & Haris Room',
        'bedroom'
    ),
    (
        'Sajid & Raza Room',
        'bedroom'
    ),
    (
        'Jimmy & Ateeb Room',
        'bedroom'
    ),
    (
        'Yasir & Haris Washroom',
        'washroom'
    ),
    (
        'Sajid & Raza Washroom',
        'washroom'
    ),
    (
        'Jimmy & Ateeb Washroom',
        'washroom'
    ),
    ('Kitchen', 'kitchen'),
    ('TV Lounge', 'lounge'),
    ('Dining', 'dining') on conflict (name) do nothing;

insert into
    public.beds (room_id, label)
select rooms.id, bed_labels.label
from public.rooms
    cross join (
        values ('Bed A'), ('Bed B')
    ) as bed_labels (label)
where
    rooms.name in (
        'Yasir & Haris Room',
        'Sajid & Raza Room',
        'Jimmy & Ateeb Room'
    )
    and not exists (
        select 1
        from public.beds existing_beds
        where
            existing_beds.room_id = rooms.id
            and existing_beds.label = bed_labels.label
    );

insert into
    public.settings (key, value)
values ('member_count', '6'),
    (
        'flatmates',
        'Yasir Ajmal Mehmand, Muhammad Haris, Sajid Ali, Ahmad Raza, Babar Jamil Ur Rahman (Jimmy), Ateeb Raza'
    ),
    (
        'cook_name',
        'Muhammad Sajid Khan'
    ) on conflict (key) do
update
set
    value = excluded.value;

-- ── Storage bucket ────────────────────────────────────────────────────────────
insert into
    storage.buckets (id, name, public)
values (
        'bill-images',
        'bill-images',
        true
    ) on conflict (id) do nothing;

insert into
    storage.buckets (id, name, public)
values (
        'payment-screenshots',
        'payment-screenshots',
        true
    ) on conflict (id) do nothing;

-- ── Enable RLS ────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

alter table public.rooms enable row level security;

alter table public.beds enable row level security;

alter table public.bed_assignments enable row level security;

alter table public.expenses enable row level security;

alter table public.expense_participants enable row level security;

alter table public.announcements enable row level security;

alter table public.settings enable row level security;

alter table public.debt_settlements enable row level security;

alter table public.rides enable row level security;

alter table public.ride_riders enable row level security;

alter table public.cook_advances enable row level security;

alter table public.cook_purchases enable row level security;

alter table public.activity_logs enable row level security;

alter table public.flat_fund_allocations enable row level security;

alter table public.flat_fund_expenses enable row level security;

alter table public.contribution_payments enable row level security;

alter table public.daily_menu enable row level security;

-- ── RLS Policies ─────────────────────────────────────────────────────────────

-- profiles
drop policy if exists "profiles_select_authenticated" on public.profiles;

create policy "profiles_select_authenticated" on public.profiles for
select to authenticated using (true);

drop policy if exists "profiles_insert_self" on public.profiles;

create policy "profiles_insert_self" on public.profiles for
insert
    to authenticated
with
    check (auth.uid () = id);

drop policy if exists "profiles_admin_update" on public.profiles;

create policy "profiles_admin_update" on public.profiles for
update to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

-- rooms
drop policy if exists "rooms_select_authenticated" on public.rooms;

create policy "rooms_select_authenticated" on public.rooms for
select to authenticated using (true);

drop policy if exists "rooms_admin_modify" on public.rooms;

create policy "rooms_admin_modify" on public.rooms for all to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

-- beds
drop policy if exists "beds_select_authenticated" on public.beds;

create policy "beds_select_authenticated" on public.beds for
select to authenticated using (true);

drop policy if exists "beds_admin_modify" on public.beds;

create policy "beds_admin_modify" on public.beds for all to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

-- bed_assignments
drop policy if exists "bed_assignments_select_authenticated" on public.bed_assignments;

create policy "bed_assignments_select_authenticated" on public.bed_assignments for
select to authenticated using (true);

drop policy if exists "bed_assignments_admin_modify" on public.bed_assignments;

create policy "bed_assignments_admin_modify" on public.bed_assignments for all to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

-- expenses
drop policy if exists "expenses_select_authenticated" on public.expenses;

create policy "expenses_select_authenticated" on public.expenses for
select to authenticated using (true);

drop policy if exists "expenses_insert_authenticated" on public.expenses;

create policy "expenses_insert_authenticated" on public.expenses for
insert
    to authenticated
with
    check (auth.uid () = created_by);

drop policy if exists "expenses_update_authenticated" on public.expenses;

create policy "expenses_update_authenticated" on public.expenses for
update to authenticated using (
    auth.uid () = created_by
    or public.is_admin ()
);

drop policy if exists "expenses_delete_authenticated" on public.expenses;

create policy "expenses_delete_authenticated" on public.expenses for delete to authenticated using (
    auth.uid () = created_by
    or public.is_admin ()
);

-- expense_participants
drop policy if exists "expense_participants_select_authenticated" on public.expense_participants;

create policy "expense_participants_select_authenticated" on public.expense_participants for
select to authenticated using (true);

drop policy if exists "expense_participants_insert" on public.expense_participants;

create policy "expense_participants_insert" on public.expense_participants for
insert
    to authenticated
with
    check (true);

drop policy if exists "expense_participants_admin_delete" on public.expense_participants;

create policy "expense_participants_admin_delete" on public.expense_participants for delete to authenticated using (public.is_admin ());

-- announcements
drop policy if exists "announcements_select_authenticated" on public.announcements;

create policy "announcements_select_authenticated" on public.announcements for
select to authenticated using (true);

drop policy if exists "announcements_admin_modify" on public.announcements;

create policy "announcements_admin_modify" on public.announcements for all to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

-- settings
drop policy if exists "settings_select_authenticated" on public.settings;

create policy "settings_select_authenticated" on public.settings for
select to authenticated using (true);

drop policy if exists "settings_admin_modify" on public.settings;

create policy "settings_admin_modify" on public.settings for all to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

-- debt_settlements
drop policy if exists "settlements_select_authenticated" on public.debt_settlements;

create policy "settlements_select_authenticated" on public.debt_settlements for
select to authenticated using (true);

drop policy if exists "settlements_insert_authenticated" on public.debt_settlements;

create policy "settlements_insert_authenticated" on public.debt_settlements for
insert
    to authenticated
with
    check (auth.uid () = created_by);

drop policy if exists "settlements_delete_authenticated" on public.debt_settlements;

create policy "settlements_delete_authenticated" on public.debt_settlements for delete to authenticated using (
    auth.uid () = created_by
    or public.is_admin ()
);

-- rides
drop policy if exists "rides_select_authenticated" on public.rides;

create policy "rides_select_authenticated" on public.rides for
select to authenticated using (true);

drop policy if exists "rides_insert_authenticated" on public.rides;

create policy "rides_insert_authenticated" on public.rides for
insert
    to authenticated
with
    check (auth.uid () = created_by);

drop policy if exists "rides_delete_authenticated" on public.rides;

create policy "rides_delete_authenticated" on public.rides for delete to authenticated using (
    auth.uid () = created_by
    or public.is_admin ()
);

-- ride_riders
drop policy if exists "ride_riders_select_authenticated" on public.ride_riders;

create policy "ride_riders_select_authenticated" on public.ride_riders for
select to authenticated using (true);

drop policy if exists "ride_riders_insert_authenticated" on public.ride_riders;

create policy "ride_riders_insert_authenticated" on public.ride_riders for
insert
    to authenticated
with
    check (true);

drop policy if exists "ride_riders_delete_authenticated" on public.ride_riders;

create policy "ride_riders_delete_authenticated" on public.ride_riders for delete to authenticated using (true);

-- cook_advances
drop policy if exists "cook_advances_select" on public.cook_advances;

create policy "cook_advances_select" on public.cook_advances for
select to authenticated using (true);

drop policy if exists "cook_advances_insert_authenticated" on public.cook_advances;

create policy "cook_advances_insert_authenticated" on public.cook_advances for
insert
    to authenticated
with
    check (auth.uid () = given_by);

drop policy if exists "cook_advances_delete_authenticated" on public.cook_advances;

create policy "cook_advances_delete_authenticated" on public.cook_advances for delete to authenticated using (
    auth.uid () = given_by
    or public.is_admin ()
);

-- cook_purchases
drop policy if exists "cook_purchases_select" on public.cook_purchases;

create policy "cook_purchases_select" on public.cook_purchases for
select to authenticated using (true);

drop policy if exists "cook_purchases_insert_authenticated" on public.cook_purchases;

create policy "cook_purchases_insert_authenticated" on public.cook_purchases for
insert
    to authenticated
with
    check (auth.uid () = created_by);

drop policy if exists "cook_purchases_delete_authenticated" on public.cook_purchases;

create policy "cook_purchases_delete_authenticated" on public.cook_purchases for delete to authenticated using (
    auth.uid () = created_by
    or public.is_admin ()
);

-- daily_menu
drop policy if exists "daily_menu_select" on public.daily_menu;

create policy "daily_menu_select" on public.daily_menu for
select to authenticated using (true);

drop policy if exists "daily_menu_insert_authenticated" on public.daily_menu;

create policy "daily_menu_insert_authenticated" on public.daily_menu for
insert
    to authenticated
with
    check (auth.uid () = created_by);

drop policy if exists "daily_menu_update_authenticated" on public.daily_menu;

create policy "daily_menu_update_authenticated" on public.daily_menu for
update to authenticated using (
    auth.uid () = created_by
    or public.is_admin ()
);

drop policy if exists "daily_menu_delete_authenticated" on public.daily_menu;

create policy "daily_menu_delete_authenticated" on public.daily_menu for delete to authenticated using (
    auth.uid () = created_by
    or public.is_admin ()
);

-- activity_logs
drop policy if exists "activity_logs_select" on public.activity_logs;

create policy "activity_logs_select" on public.activity_logs for
select to authenticated using (true);

drop policy if exists "activity_logs_insert" on public.activity_logs;

create policy "activity_logs_insert" on public.activity_logs for
insert
    to authenticated
with
    check (true);

-- flat_fund_allocations
drop policy if exists "flat_fund_alloc_select" on public.flat_fund_allocations;

create policy "flat_fund_alloc_select" on public.flat_fund_allocations for
select using (true);

drop policy if exists "flat_fund_alloc_insert" on public.flat_fund_allocations;

create policy "flat_fund_alloc_insert" on public.flat_fund_allocations for
insert
with
    check (auth.uid () is not null);

drop policy if exists "flat_fund_alloc_delete" on public.flat_fund_allocations;

create policy "flat_fund_alloc_delete" on public.flat_fund_allocations for delete using (auth.uid () = allocated_by);

-- flat_fund_expenses
drop policy if exists "flat_fund_exp_select" on public.flat_fund_expenses;

create policy "flat_fund_exp_select" on public.flat_fund_expenses for
select using (true);

drop policy if exists "flat_fund_exp_insert" on public.flat_fund_expenses;

create policy "flat_fund_exp_insert" on public.flat_fund_expenses for
insert
with
    check (auth.uid () is not null);

drop policy if exists "flat_fund_exp_delete" on public.flat_fund_expenses;

create policy "flat_fund_exp_delete" on public.flat_fund_expenses for delete using (auth.uid () = created_by);

-- contribution_payments
drop policy if exists "contrib_payments_select" on public.contribution_payments;

create policy "contrib_payments_select" on public.contribution_payments for
select using (true);

drop policy if exists "contrib_payments_insert" on public.contribution_payments;

create policy "contrib_payments_insert" on public.contribution_payments for
insert
with
    check (auth.uid () is not null);

drop policy if exists "contrib_payments_delete" on public.contribution_payments;

create policy "contrib_payments_delete" on public.contribution_payments for delete using (auth.uid () = created_by);

-- storage
drop policy if exists "bill_images_authenticated_insert" on storage.objects;

create policy "bill_images_authenticated_insert" on storage.objects for
insert
    to authenticated
with
    check (bucket_id = 'bill-images');

drop policy if exists "bill_images_public_read" on storage.objects;

create policy "bill_images_public_read" on storage.objects for
select using (bucket_id = 'bill-images');

drop policy if exists "bill_images_admin_delete" on storage.objects;

create policy "bill_images_admin_delete" on storage.objects for delete to authenticated using (
    bucket_id = 'bill-images'
    and public.is_admin ()
);

drop policy if exists "bill_images_owner_delete" on storage.objects;

create policy "bill_images_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bill-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- payment-screenshots storage policies
drop policy if exists "payment_screenshots_authenticated_insert" on storage.objects;

create policy "payment_screenshots_authenticated_insert" on storage.objects for
insert
    to authenticated
with
    check (bucket_id = 'payment-screenshots');

drop policy if exists "payment_screenshots_public_read" on storage.objects;

create policy "payment_screenshots_public_read" on storage.objects for
select using (bucket_id = 'payment-screenshots');

drop policy if exists "payment_screenshots_admin_delete" on storage.objects;

create policy "payment_screenshots_admin_delete" on storage.objects for delete to authenticated using (
    bucket_id = 'payment-screenshots'
    and public.is_admin ()
);

drop policy if exists "payment_screenshots_owner_delete" on storage.objects;

create policy "payment_screenshots_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

-- Add missing column
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS last_date date;

-- Add missing table
CREATE TABLE IF NOT EXISTS public.daily_menu (
    id uuid primary key default gen_random_uuid (),
    date date not null unique,
    breakfast text,
    lunch text,
    dinner text,
    notes text,
    created_by uuid not null references public.profiles (id) on delete restrict,
    created_at timestamptz not null default timezone ('utc', now()),
    updated_at timestamptz not null default timezone ('utc', now())
);

CREATE INDEX IF NOT EXISTS daily_menu_date_idx ON public.daily_menu (date);

ALTER TABLE public.daily_menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_menu_select" ON public.daily_menu;

CREATE POLICY "daily_menu_select" ON public.daily_menu FOR
SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "daily_menu_insert_authenticated" ON public.daily_menu;

CREATE POLICY "daily_menu_insert_authenticated" ON public.daily_menu FOR
INSERT
    TO authenticated
WITH
    CHECK (auth.uid () = created_by);

DROP POLICY IF EXISTS "daily_menu_update_authenticated" ON public.daily_menu;

CREATE POLICY "daily_menu_update_authenticated" ON public.daily_menu FOR
UPDATE TO authenticated USING (
    auth.uid () = created_by
    OR public.is_admin ()
);

DROP POLICY IF EXISTS "daily_menu_delete_authenticated" ON public.daily_menu;

CREATE POLICY "daily_menu_delete_authenticated" ON public.daily_menu FOR DELETE TO authenticated USING (
    auth.uid () = created_by
    OR public.is_admin ()
);