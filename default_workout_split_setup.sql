-- Run this once in the Supabase SQL editor after creating your workout split.
--
-- The migration snapshots the weekly workout split belonging to the user with
-- the largest active split. That user is treated as the template owner. Each
-- other user receives an independent copy the first time they open the app.

create extension if not exists "uuid-ossp";

create table if not exists public.default_workout_split_source (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null references auth.users(id) on delete restrict,
  captured_at timestamptz not null default now()
);

create table if not exists public.default_workout_split (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  scheduled_weekday integer check (scheduled_weekday between 1 and 7),
  exercises jsonb not null default '[]'::jsonb,
  color text not null default '#dc2626',
  position bigint not null,
  active boolean not null default true
);

create table if not exists public.default_workout_split_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  seeded_at timestamptz not null default now()
);

alter table public.default_workout_split_source enable row level security;
alter table public.default_workout_split enable row level security;
alter table public.default_workout_split_users enable row level security;

revoke all on public.default_workout_split_source from anon, authenticated;
revoke all on public.default_workout_split from anon, authenticated;
revoke all on public.default_workout_split_users from anon, authenticated;

do $$
declare
  template_owner uuid;
begin
  select user_id
    into template_owner
  from public.tasks
  where category = 'workout'
    and coalesce(is_daily, false) = false
    and active = true
  group by user_id
  order by count(*) desc, min(created_at), user_id
  limit 1;

  if template_owner is null then
    raise exception 'Create the weekly workout split before running this setup.';
  end if;

  insert into public.default_workout_split_source (singleton, user_id)
  values (true, template_owner)
  on conflict (singleton) do nothing;

  if not exists (select 1 from public.default_workout_split) then
    insert into public.default_workout_split (
      name,
      scheduled_weekday,
      exercises,
      color,
      position,
      active
    )
    select
      name,
      scheduled_weekday,
      coalesce(to_jsonb(exercises), '[]'::jsonb),
      color,
      position,
      active
    from public.tasks
    where user_id = template_owner
      and category = 'workout'
      and coalesce(is_daily, false) = false
      and active = true
    order by position, created_at;
  end if;

  -- The template owner already has the original rows and must not get copies.
  insert into public.default_workout_split_users (user_id)
  select user_id from public.default_workout_split_source where singleton = true
  on conflict (user_id) do nothing;
end
$$;

create or replace function public.ensure_default_workout_split()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  claimed_user_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Claim the seed once. Concurrent page loads cannot create duplicates.
  insert into public.default_workout_split_users (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing
  returning user_id into claimed_user_id;

  if claimed_user_id is null then
    return false;
  end if;

  insert into public.tasks (
    user_id,
    name,
    type,
    category,
    target_date,
    scheduled_weekday,
    is_daily,
    diet_day_type,
    exercises,
    color,
    position,
    active
  )
  select
    current_user_id,
    name,
    'recurring',
    'workout',
    null,
    scheduled_weekday,
    false,
    null,
    exercises,
    color,
    position,
    active
  from public.default_workout_split
  order by position;

  return true;
end;
$$;

revoke all on function public.ensure_default_workout_split() from public;
grant execute on function public.ensure_default_workout_split() to authenticated;

