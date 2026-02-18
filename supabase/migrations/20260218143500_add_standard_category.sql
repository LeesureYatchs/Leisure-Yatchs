-- Ensure 'Standard' category exists in yacht_categories table
INSERT INTO public.yacht_categories (name)
VALUES ('Standard')
ON CONFLICT (name) DO NOTHING;
