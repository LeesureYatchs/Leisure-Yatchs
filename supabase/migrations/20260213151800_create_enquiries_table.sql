-- Create enquiries table
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for the contact form)
CREATE POLICY "Allow anonymous inserts to enquiries" ON public.enquiries
    FOR INSERT WITH CHECK (true);

-- Create policy to allow authenticated users (Admins) to read/update
CREATE POLICY "Allow authenticated users to manage enquiries" ON public.enquiries
    FOR ALL USING (auth.role() = 'authenticated');

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiries;
