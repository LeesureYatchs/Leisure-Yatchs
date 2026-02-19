-- Add sharing feature columns to yachts table
ALTER TABLE public.yachts 
ADD COLUMN IF NOT EXISTS is_sharing_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sharing_price_60_adult DECIMAL(10, 2) DEFAULT 150,
ADD COLUMN IF NOT EXISTS sharing_price_60_kid DECIMAL(10, 2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS sharing_price_100_adult DECIMAL(10, 2) DEFAULT 200,
ADD COLUMN IF NOT EXISTS sharing_price_100_kid DECIMAL(10, 2) DEFAULT 150;
