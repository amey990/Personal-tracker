create extension if not exists "uuid-ossp";

-- Marks workout tasks that should appear every day in Daily Fatburn.
alter table public.tasks
add column if not exists is_daily boolean not null default false;

create index if not exists tasks_user_daily_workout_active_idx
on public.tasks (user_id, category, is_daily, active);

-- Stores dashboard todos by user and date.
create table if not exists public.todos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  text text not null check (char_length(trim(text)) > 0),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.todos enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'todos'
      and policyname = 'users manage own todos'
  ) then
    create policy "users manage own todos"
      on public.todos
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists todos_user_date_created_idx
on public.todos (user_id, date, created_at);

grant select, insert, update, delete on public.todos to authenticated;
