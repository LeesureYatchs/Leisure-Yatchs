-- Create reviews table
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  yacht_id uuid references public.yachts(id) not null,
  customer_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policies
create policy "Public can view approved reviews"
  on public.reviews for select
  using (status = 'approved');

create policy "Anyone can insert reviews"
  on public.reviews for insert
  with check (true);

create policy "Admins can all reviews"
  on public.reviews for all
  using (auth.role() = 'authenticated');
