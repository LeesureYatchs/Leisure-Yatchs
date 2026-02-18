-- FIX 401 ERROR: Grant explicit permissions and fix RLS

-- 1. Ensure Table permissions (Key step often missed)
GRANT ALL ON TABLE public.visitor_logs TO anon;
GRANT ALL ON TABLE public.visitor_logs TO authenticated;
GRANT ALL ON TABLE public.visitor_logs TO service_role;

-- 2. Drop all existing policies to avoid conflicts
drop policy if exists "Public insert" on public.visitor_logs;
drop policy if exists "Public update" on public.visitor_logs;
drop policy if exists "Admins select" on public.visitor_logs;
drop policy if exists "Anyone can log visit" on public.visitor_logs;
drop policy if exists "Anyone can update their own visit" on public.visitor_logs;
drop policy if exists "Admins can view visitor logs" on public.visitor_logs;
drop policy if exists "Enable insert for all" on public.visitor_logs;
drop policy if exists "Enable update for all" on public.visitor_logs;
drop policy if exists "Enable select for all" on public.visitor_logs;

-- 3. Create Clean Policies for Unauthenticated Access (Public)
-- Allow anyone to INSERT
create policy "Enable insert for anon"
on public.visitor_logs for insert
to anon, authenticated
with check (true);

-- Allow anyone to UPDATE (Required for Upsert 'on conflict')
create policy "Enable update for anon"
on public.visitor_logs for update
to anon, authenticated
using (true);

-- Allow anyone to SELECT (Required for Upsert to check conflicts)
create policy "Enable select for anon"
on public.visitor_logs for select
to anon, authenticated
using (true);
