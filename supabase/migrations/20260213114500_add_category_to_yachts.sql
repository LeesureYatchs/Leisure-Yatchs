-- Add category column to yachts table
ALTER TABLE public.yachts 
ADD COLUMN IF NOT EXISTS category text;

-- Update existing yachts to have a default category
UPDATE public.yachts SET category = 'Luxury' WHERE category IS NULL;
