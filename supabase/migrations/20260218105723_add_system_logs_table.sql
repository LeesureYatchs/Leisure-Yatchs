-- Create system_logs table to track activity and keep the DB alive
create table if not exists public.system_logs (
    id uuid default gen_random_uuid() primary key,
    type text not null, -- e.g., 'activity', 'greeting', 'alert'
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Basic RLS for system_logs
alter table public.system_logs enable row level security;

create policy "Admins can view system logs"
    on public.system_logs for select
    to authenticated
    using (true);

create policy "Admins can insert system logs"
    on public.system_logs for insert
    to authenticated
    with check (true);
