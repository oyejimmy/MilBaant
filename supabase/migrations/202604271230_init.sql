create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'user' check (role in ('admin', 'user')),
  can_add_expenses boolean not null default false
);

create table if not exists public.rooms (
  id integer generated always as identity primary key,
  name text not null unique,
  type text not null check (type in ('bedroom', 'washroom', 'kitchen', 'lounge', 'dining'))
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
  id uuid primary key default gen_random_uuid(),
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
  split_type text not null check (split_type in ('all_members', 'custom_participants')),
  bill_image_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.expense_participants (
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (expense_id, user_id)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.settings (
  key text primary key,
  value text not null
);

create index if not exists expenses_date_idx on public.expenses (date);
create index if not exists expenses_category_idx on public.expenses (category);
create index if not exists expense_participants_user_idx on public.expense_participants (user_id);

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
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
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
    select 1
    from public.profiles
    where id = auth.uid()
      and (role = 'admin' or can_add_expenses = true)
  );
$$;

insert into public.rooms (name, type)
values
  ('Room 1', 'bedroom'),
  ('Room 2', 'bedroom'),
  ('Room 3', 'bedroom'),
  ('Room 1 Washroom', 'washroom'),
  ('Room 2 Washroom', 'washroom'),
  ('Room 3 Washroom', 'washroom'),
  ('Kitchen', 'kitchen'),
  ('TV Lounge', 'lounge'),
  ('Dining', 'dining')
on conflict (name) do nothing;

insert into public.beds (room_id, label)
select rooms.id, bed_labels.label
from public.rooms
cross join (
  values ('Bed A'), ('Bed B')
) as bed_labels(label)
where rooms.name in ('Room 1', 'Room 2', 'Room 3')
  and not exists (
    select 1
    from public.beds existing_beds
    where existing_beds.room_id = rooms.id
      and existing_beds.label = bed_labels.label
  );

insert into public.settings (key, value)
values ('member_count', '10')
on conflict (key) do nothing;

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.beds enable row level security;
alter table public.bed_assignments enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_participants enable row level security;
alter table public.announcements enable row level security;
alter table public.settings enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "rooms_select_authenticated" on public.rooms;
create policy "rooms_select_authenticated"
  on public.rooms
  for select
  to authenticated
  using (true);

drop policy if exists "rooms_admin_modify" on public.rooms;
create policy "rooms_admin_modify"
  on public.rooms
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "beds_select_authenticated" on public.beds;
create policy "beds_select_authenticated"
  on public.beds
  for select
  to authenticated
  using (true);

drop policy if exists "beds_admin_modify" on public.beds;
create policy "beds_admin_modify"
  on public.beds
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "bed_assignments_select_authenticated" on public.bed_assignments;
create policy "bed_assignments_select_authenticated"
  on public.bed_assignments
  for select
  to authenticated
  using (true);

drop policy if exists "bed_assignments_admin_modify" on public.bed_assignments;
create policy "bed_assignments_admin_modify"
  on public.bed_assignments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "expenses_select_authenticated" on public.expenses;
create policy "expenses_select_authenticated"
  on public.expenses
  for select
  to authenticated
  using (true);

drop policy if exists "expenses_insert_allowed_users" on public.expenses;
create policy "expenses_insert_allowed_users"
  on public.expenses
  for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and public.can_current_user_add_expenses()
    and (
      (category = 'weekend_meal' and split_type = 'custom_participants')
      or
      (category <> 'weekend_meal' and split_type = 'all_members')
    )
  );

drop policy if exists "expenses_admin_update" on public.expenses;
create policy "expenses_admin_update"
  on public.expenses
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "expenses_admin_delete" on public.expenses;
create policy "expenses_admin_delete"
  on public.expenses
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "expense_participants_select_authenticated" on public.expense_participants;
create policy "expense_participants_select_authenticated"
  on public.expense_participants
  for select
  to authenticated
  using (true);

drop policy if exists "expense_participants_insert_creator_or_admin" on public.expense_participants;
create policy "expense_participants_insert_creator_or_admin"
  on public.expense_participants
  for insert
  to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.expenses
      where id = expense_id
        and created_by = auth.uid()
    )
  );

drop policy if exists "expense_participants_admin_delete" on public.expense_participants;
create policy "expense_participants_admin_delete"
  on public.expense_participants
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "announcements_select_authenticated" on public.announcements;
create policy "announcements_select_authenticated"
  on public.announcements
  for select
  to authenticated
  using (true);

drop policy if exists "announcements_admin_modify" on public.announcements;
create policy "announcements_admin_modify"
  on public.announcements
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "settings_select_authenticated" on public.settings;
create policy "settings_select_authenticated"
  on public.settings
  for select
  to authenticated
  using (true);

drop policy if exists "settings_admin_modify" on public.settings;
create policy "settings_admin_modify"
  on public.settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('bill-images', 'bill-images', true)
on conflict (id) do nothing;

drop policy if exists "bill_images_authenticated_insert" on storage.objects;
create policy "bill_images_authenticated_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'bill-images');

drop policy if exists "bill_images_public_read" on storage.objects;
create policy "bill_images_public_read"
  on storage.objects
  for select
  using (bucket_id = 'bill-images');

drop policy if exists "bill_images_admin_delete" on storage.objects;
create policy "bill_images_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'bill-images'
    and public.is_admin()
  );
