
-- Create recreation_extras table
create table public.recreation_extras (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert initial extras
insert into public.recreation_extras (name) values
  ('Jet Ski'),
  ('Jet Car'),
  ('Yacht Slides'),
  ('Food Catering'),
  ('Beverage Catering'),
  ('DJ');

-- Enable RLS
alter table public.recreation_extras enable row level security;

-- Create policies
create policy "Extras are viewable by everyone" on public.recreation_extras
  for select using (true);

create policy "Extras are insertable by admins only" on public.recreation_extras
  for insert with check (
    auth.uid() in (
      select user_id from user_roles where role = 'admin'
    )
  );

create policy "Extras are updatable by admins only" on public.recreation_extras
  for update using (
    auth.uid() in (
      select user_id from user_roles where role = 'admin'
    )
  );

create policy "Extras are deletable by admins only" on public.recreation_extras
  for delete using (
    auth.uid() in (
      select user_id from user_roles where role = 'admin'
    )
  );

-- Add recreation_extras column to yachts table
alter table public.yachts 
add column if not exists recreation_extras text[];
