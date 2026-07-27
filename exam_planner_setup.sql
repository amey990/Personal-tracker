create extension if not exists "uuid-ossp";

create table if not exists public.exams (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  scheduled_date date not null,
  status text not null default 'pending'a
    check (status in ('pending', 'passed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exams enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exams'
      and policyname = 'users manage own exams'
  ) then
    create policy "users manage own exams"
      on public.exams
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists exams_user_status_date_idx
on public.exams (user_id, status, scheduled_date);

grant select, insert, update, delete
on public.exams to authenticated;
