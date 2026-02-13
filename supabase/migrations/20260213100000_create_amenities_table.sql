
-- Create amenities table
create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert initial amenities
insert into public.amenities (name) values
  ('Shower'),
  ('IPod Docking'),
  ('Ensuite'),
  ('Air Conditioning'),
  ('Rear Deck Dining Table'),
  ('Soft Drinks'),
  ('Cooler Box'),
  ('Toilets'),
  ('Speakers'),
  ('Bar'),
  ('Rooftop Entertaining Area'),
  ('Sunbeds'),
  ('Ice'),
  ('Cutlery & Plates'),
  ('Fridge'),
  ('Bedrooms'),
  ('BBQ'),
  ('Spacious Main Saloon'),
  ('Front Entertaining Area'),
  ('Cups');

-- Enable RLS
alter table public.amenities enable row level security;

-- Create policies
create policy "Amenities are viewable by everyone" on public.amenities
  for select using (true);

create policy "Amenities are insertable by admins only" on public.amenities
  for insert with check (
    auth.uid() in (
      select user_id from user_roles where role = 'admin'
    )
  );

create policy "Amenities are updatable by admins only" on public.amenities
  for update using (
    auth.uid() in (
      select user_id from user_roles where role = 'admin'
    )
  );

create policy "Amenities are deletable by admins only" on public.amenities
  for delete using (
    auth.uid() in (
      select user_id from user_roles where role = 'admin'
    )
  );
