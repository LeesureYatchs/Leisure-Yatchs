-- Robust migration for visitor_logs

-- 1. Create table if it doesn't exist
create table if not exists public.visitor_logs (
    id uuid default gen_random_uuid() primary key,
    ip_address text,
    city text,
    region text,
    country text,
    user_agent text,
    page_visited text,
    last_visited_at timestamp with time zone default timezone('utc'::text, now()),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add Unique Constraint on IP (Safe execution)
do $$ 
begin
  if not exists (select 1 from pg_constraint where conname = 'unique_ip_address') then
    -- Clean up duplicates before adding constraint if any exist
    delete from public.visitor_logs a using public.visitor_logs b
    where a.id < b.id and a.ip_address = b.ip_address;
    
    alter table public.visitor_logs add constraint unique_ip_address unique (ip_address);
  end if;
end $$;

-- 3. Enable RLS
alter table public.visitor_logs enable row level security;

-- 4. Drop old policies to ensure clean slate
drop policy if exists "Anyone can log visit" on public.visitor_logs;
drop policy if exists "Anyone can update their own visit" on public.visitor_logs;
drop policy if exists "Admins can view visitor logs" on public.visitor_logs;
drop policy if exists "Public insert" on public.visitor_logs;
drop policy if exists "Public update" on public.visitor_logs;

-- 5. Create Permissive Policies for Anon/Public
-- Allow anyone to INSERT a new log
create policy "Public insert" 
    on public.visitor_logs for insert 
    with check (true);

-- Allow anyone to UPDATE (needed for UPSERT on conflict)
create policy "Public update" 
    on public.visitor_logs for update 
    using (true);

-- Allow Admins to View
create policy "Admins select" 
    on public.visitor_logs for select 
    to authenticated 
    using (true);
