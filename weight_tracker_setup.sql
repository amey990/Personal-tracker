create extension if not exists "uuid-ossp";

create table if not exists public.weight_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(6,2) not null check (weight_kg > 0 and weight_kg <= 1000),
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weight_entries_user_date_key unique (user_id, date)
);

alter table public.weight_entries enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'weight_entries'
      and policyname = 'users manage own weight entries'
  ) then
    create policy "users manage own weight entries"
      on public.weight_entries
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

grant select, insert, update, delete on public.weight_entries to authenticated;
