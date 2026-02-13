
-- Create trip_itineraries table
create table public.trip_itineraries (
  id uuid primary key default gen_random_uuid(),
  duration_label text not null,
  route_description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert initial data
insert into public.trip_itineraries (duration_label, route_description) values
  ('2 Hours', 'Dubai Harbor → Bluewaters Island → JBR → Burj Al Arab → Sheikh''s Private Island → Lagoon → Dubai Harbor'),
  ('3 Hours', 'Dubai Harbor → Bluewaters Island → JBR → Atlantis → Royal Atlantis → Burj Al Arab → Sheikh''s Private Island → Lagoon → Dubai Harbor'),
  ('4 Hours', 'Dubai Harbor → Bluewaters Island → JBR (Swimming) → Atlantis → Royal Atlantis → Burj Al Arab → Sheikh''s Private Island → Lagoon (Swimming) → Dubai Harbor'),
  ('5 Hours', 'Dubai Harbor → Bluewaters Island → JBR (Swimming) → Outside World Islands → Atlantis → Royal Atlantis → Burj Al Arab → Sheikh''s Private Island → Lagoon (Swimming) → Dubai Harbor');

-- Enable RLS
alter table public.trip_itineraries enable row level security;

-- Create policies
create policy "Itineraries are viewable by everyone" on public.trip_itineraries
  for select using (true);

create policy "Itineraries are insertable by admins only" on public.trip_itineraries
  for insert with check (
    auth.uid() in (
      select user_id from user_roles where role = 'admin'
    )
  );

create policy "Itineraries are updatable by admins only" on public.trip_itineraries
  for update using (
    auth.uid() in (
      select user_id from user_roles where role = 'admin'
    )
  );

create policy "Itineraries are deletable by admins only" on public.trip_itineraries
  for delete using (
    auth.uid() in (
      select user_id from user_roles where role = 'admin'
    )
  );

-- Add trip_itinerary_ids column to yachts table
alter table public.yachts 
add column if not exists trip_itinerary_ids uuid[];
