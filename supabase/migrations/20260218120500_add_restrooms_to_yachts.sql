-- Add restrooms column to yachts table
ALTER TABLE yachts ADD COLUMN IF NOT EXISTS restrooms INTEGER DEFAULT 1;
