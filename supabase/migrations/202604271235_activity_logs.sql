-- Activity logs: append-only audit trail, no update/delete allowed
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  action text not null check (action in ('create', 'update', 'delete')),
  entity text not null,
  entity_id text,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists activity_logs_user_idx on public.activity_logs (user_id);
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);

alter table public.activity_logs enable row level security;

-- Everyone authenticated can read logs
drop policy if exists "activity_logs_select" on public.activity_logs;
create policy "activity_logs_select"
  on public.activity_logs for select to authenticated using (true);

-- Any authenticated user can insert logs
drop policy if exists "activity_logs_insert" on public.activity_logs;
create policy "activity_logs_insert"
  on public.activity_logs for insert to authenticated with check (true);

-- NO delete policy — logs are permanent
-- NO update policy — logs are immutable
