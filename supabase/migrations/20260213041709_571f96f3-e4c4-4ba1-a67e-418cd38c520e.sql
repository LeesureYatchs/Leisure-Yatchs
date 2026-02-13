
-- Add new columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN duration_hours integer NOT NULL DEFAULT 1,
ADD COLUMN total_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN guests integer NOT NULL DEFAULT 1,
ADD COLUMN event_type text NOT NULL DEFAULT 'General Event';
