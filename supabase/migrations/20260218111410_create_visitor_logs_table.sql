-- Create visitor_logs table to track visitors
create table if not exists public.visitor_logs (
    id uuid default gen_random_uuid() primary key,
    ip_address text,
    city text,
    region text,
    country text,
    user_agent text,
    page_visited text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.visitor_logs enable row level security;

-- Only Allow Inserts from anyone (Public)
create policy "Anyone can log visit" 
    on public.visitor_logs for insert 
    with check (true);

-- Only Admins can view logs
create policy "Admins can view visitor logs" 
    on public.visitor_logs for select 
    to authenticated 
    using (true);
