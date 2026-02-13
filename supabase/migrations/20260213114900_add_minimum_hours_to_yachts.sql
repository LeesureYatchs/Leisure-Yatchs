-- Add minimum_hours column to yachts table
ALTER TABLE yachts 
ADD COLUMN IF NOT EXISTS minimum_hours INTEGER NOT NULL DEFAULT 2;

-- Add check constraint to ensure minimum_hours is between 2 and 7
ALTER TABLE yachts 
ADD CONSTRAINT check_minimum_hours CHECK (minimum_hours >= 2 AND minimum_hours <= 7);
