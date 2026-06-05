-- =============================================================================
-- Splitwise Clone — Initial schema, RLS policies, triggers
-- =============================================================================
-- Run this in the Supabase SQL Editor (or via `supabase db push`).
-- On a fresh project you can paste it once.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- TABLES
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  emoji       text default '🧾',
  created_by  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups (id) on delete cascade,
  description  text not null,
  amount       numeric(12,2) not null check (amount > 0),
  currency     text not null default 'INR',
  category     text not null default 'general',
  paid_by      uuid not null references public.profiles (id) on delete restrict,
  split_type   text not null default 'equal',
  expense_date date not null default current_date,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.expense_splits (
  id         uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  amount     numeric(12,2) not null check (amount >= 0),
  unique (expense_id, user_id)
);

create table if not exists public.settlements (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  payer_id   uuid not null references public.profiles (id) on delete restrict,
  payee_id   uuid not null references public.profiles (id) on delete restrict,
  amount     numeric(12,2) not null check (amount > 0),
  note       text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_group_members_user on public.group_members (user_id);
create index if not exists idx_group_members_group on public.group_members (group_id);
create index if not exists idx_expenses_group on public.expenses (group_id);
create index if not exists idx_splits_expense on public.expense_splits (expense_id);
create index if not exists idx_settlements_group on public.settlements (group_id);

-- -----------------------------------------------------------------------------
-- HELPER FUNCTION (avoids recursive RLS on group_members)
-- -----------------------------------------------------------------------------
create or replace function public.is_group_member(_group_id uuid, _user_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.group_members
    where group_id = _group_id and user_id = _user_id
  );
$$;

-- -----------------------------------------------------------------------------
-- TRIGGERS
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_new_group()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id)
  values (new.id, new.created_by)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- -----------------------------------------------------------------------------
-- BACKFILL profiles for existing auth users
-- -----------------------------------------------------------------------------
insert into public.profiles (id, full_name, email)
select u.id,
       coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
       u.email
from auth.users u
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements    enable row level security;

-- profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- groups
drop policy if exists "groups_select_member" on public.groups;
create policy "groups_select_member" on public.groups
  for select to authenticated using (public.is_group_member(id, auth.uid()));
drop policy if exists "groups_insert_self" on public.groups;
create policy "groups_insert_self" on public.groups
  for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "groups_update_member" on public.groups;
create policy "groups_update_member" on public.groups
  for update to authenticated using (public.is_group_member(id, auth.uid()));
drop policy if exists "groups_delete_creator" on public.groups;
create policy "groups_delete_creator" on public.groups
  for delete to authenticated using (auth.uid() = created_by);

-- group_members
drop policy if exists "members_select" on public.group_members;
create policy "members_select" on public.group_members
  for select to authenticated using (public.is_group_member(group_id, auth.uid()));
drop policy if exists "members_insert" on public.group_members;
create policy "members_insert" on public.group_members
  for insert to authenticated
  with check (public.is_group_member(group_id, auth.uid()) or auth.uid() = user_id);
drop policy if exists "members_delete" on public.group_members;
create policy "members_delete" on public.group_members
  for delete to authenticated using (public.is_group_member(group_id, auth.uid()));

-- expenses
drop policy if exists "expenses_select" on public.expenses;
create policy "expenses_select" on public.expenses
  for select to authenticated using (public.is_group_member(group_id, auth.uid()));
drop policy if exists "expenses_insert" on public.expenses;
create policy "expenses_insert" on public.expenses
  for insert to authenticated with check (public.is_group_member(group_id, auth.uid()));
drop policy if exists "expenses_update" on public.expenses;
create policy "expenses_update" on public.expenses
  for update to authenticated using (public.is_group_member(group_id, auth.uid()));
drop policy if exists "expenses_delete" on public.expenses;
create policy "expenses_delete" on public.expenses
  for delete to authenticated using (public.is_group_member(group_id, auth.uid()));

-- expense_splits
drop policy if exists "splits_select" on public.expense_splits;
create policy "splits_select" on public.expense_splits
  for select to authenticated using (
    exists (select 1 from public.expenses e
            where e.id = expense_id and public.is_group_member(e.group_id, auth.uid())));
drop policy if exists "splits_insert" on public.expense_splits;
create policy "splits_insert" on public.expense_splits
  for insert to authenticated with check (
    exists (select 1 from public.expenses e
            where e.id = expense_id and public.is_group_member(e.group_id, auth.uid())));
drop policy if exists "splits_delete" on public.expense_splits;
create policy "splits_delete" on public.expense_splits
  for delete to authenticated using (
    exists (select 1 from public.expenses e
            where e.id = expense_id and public.is_group_member(e.group_id, auth.uid())));

-- settlements
drop policy if exists "settlements_select" on public.settlements;
create policy "settlements_select" on public.settlements
  for select to authenticated using (public.is_group_member(group_id, auth.uid()));
drop policy if exists "settlements_insert" on public.settlements;
create policy "settlements_insert" on public.settlements
  for insert to authenticated with check (public.is_group_member(group_id, auth.uid()));
drop policy if exists "settlements_delete" on public.settlements;
create policy "settlements_delete" on public.settlements
  for delete to authenticated using (public.is_group_member(group_id, auth.uid()));

-- =============================================================================
-- Done.
-- =============================================================================
