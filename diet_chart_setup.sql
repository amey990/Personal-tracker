create extension if not exists "uuid-ossp";

alter table tasks
add column if not exists diet_day_type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_diet_day_type_check'
  ) then
    alter table tasks
    add constraint tasks_diet_day_type_check
    check (diet_day_type is null or diet_day_type in ('training', 'rest'));
  end if;
end $$;

create index if not exists tasks_user_category_diet_day_active_idx
on tasks(user_id, category, diet_day_type, active);

create table if not exists diet_chart_meals (
  id uuid primary key default uuid_generate_v4(),
  day_type text not null check (day_type in ('training', 'rest')),
  meal_order integer not null,
  time text not null,
  meal text not null,
  food text not null,
  kcal numeric(8,2) not null default 0,
  protein numeric(8,2) not null default 0,
  carbs numeric(8,2) not null default 0,
  fat numeric(8,2) not null default 0,
  fiber numeric(8,2) not null default 0,
  created_at timestamptz default now(),
  unique(day_type, meal_order)
);

create table if not exists diet_chart_summary (
  id uuid primary key default uuid_generate_v4(),
  day_type text not null check (day_type in ('training', 'rest')),
  position integer not null,
  nutrient text not null,
  count text not null,
  comment text not null default '',
  created_at timestamptz default now(),
  unique(day_type, position)
);

alter table diet_chart_meals enable row level security;
alter table diet_chart_summary enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'authenticated users read diet chart meals'
      and tablename = 'diet_chart_meals'
  ) then
    create policy "authenticated users read diet chart meals"
      on diet_chart_meals for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where policyname = 'authenticated users read diet chart summary'
      and tablename = 'diet_chart_summary'
  ) then
    create policy "authenticated users read diet chart summary"
      on diet_chart_summary for select
      to authenticated
      using (true);
  end if;
end $$;

insert into diet_chart_meals
  (day_type, meal_order, time, meal, food, kcal, protein, carbs, fat, fiber)
values
  ('training', 1, '6:00 AM', 'Morning walk/jog', 'Water + black coffee', 0, 0, 0, 0, 0),
  ('training', 2, '7:30 AM', 'Breakfast', '50 g oats + 30 ml milk + 1 scoop whey in 250 ml water + 5 g chia seeds', 357, 34.2, 39.8, 7.9, 7.0),
  ('training', 3, '1:00 PM', 'Lunch', '2 chapati + 2 boiled whole eggs + 100 g paneer bhurji + salad', 728, 40.6, 58.6, 38.3, 9.7),
  ('training', 4, '4:30 PM', 'Snack', '200 g dahi + 100 g guava', 190, 9.6, 23.7, 7.6, 5.4),
  ('training', 5, '6:45 PM', 'Pre-gym', '1 medium banana + black coffee', 105, 1.3, 27.0, 0.4, 3.1),
  ('training', 6, '9:15 PM', 'Post-gym dinner', '2 boiled whole eggs + 1 chapati + dinner sabzi + 1 scoop whey in water', 523, 43.5, 41.8, 20.4, 8.2),
  ('rest', 1, '6:00 AM', 'Morning walk/jog', 'Water + black coffee', 0, 0, 0, 0, 0),
  ('rest', 2, '7:30 AM', 'Breakfast', '50 g oats + 30 ml milk + 1 scoop whey in 250 ml water + 5 g chia seeds', 357, 34.2, 39.8, 7.9, 7.0),
  ('rest', 3, '1:00 PM', 'Lunch', '2 chapati + 2 boiled whole eggs + 100 g paneer bhurji + salad', 728, 40.6, 58.6, 38.3, 9.7),
  ('rest', 4, '4:30 PM', 'Snack', '200 g dahi + 100 g guava', 190, 9.6, 23.7, 7.6, 5.4),
  ('rest', 5, '9:15 PM', 'Dinner', '2 boiled whole eggs + 1 chapati + dinner sabzi + 1 scoop whey in water', 523, 43.5, 41.8, 20.4, 8.2)
on conflict (day_type, meal_order) do update set
  time = excluded.time,
  meal = excluded.meal,
  food = excluded.food,
  kcal = excluded.kcal,
  protein = excluded.protein,
  carbs = excluded.carbs,
  fat = excluded.fat,
  fiber = excluded.fiber;

insert into diet_chart_summary
  (day_type, position, nutrient, count, comment)
values
  ('training', 1, 'Calories', '1903 kcal', 'Deficit vs 2300 maintenance: 397 kcal'),
  ('training', 2, 'Protein', '129.2 g', 'Target is 128.6 g/day for 64.3 kg body weight'),
  ('training', 3, 'Carbs', '190.9 g', 'Good for night gym performance'),
  ('training', 4, 'Fat', '74.6 g', 'Lower than old 5-egg plan; keep oil controlled'),
  ('training', 5, 'Fiber', '33.4 g', 'Good range for digestion and satiety'),
  ('rest', 1, 'Calories', '1798 kcal', 'Deficit vs 2300 maintenance: 502 kcal'),
  ('rest', 2, 'Protein', '127.9 g', 'Close enough to target on rest day'),
  ('rest', 3, 'Carbs', '163.9 g', 'Lower than training day because banana is removed'),
  ('rest', 4, 'Fat', '74.2 g', 'Keep paneer/oil consistent'),
  ('rest', 5, 'Fiber', '30.3 g', 'Good range for cutting')
on conflict (day_type, position) do update set
  nutrient = excluded.nutrient,
  count = excluded.count,
  comment = excluded.comment;
