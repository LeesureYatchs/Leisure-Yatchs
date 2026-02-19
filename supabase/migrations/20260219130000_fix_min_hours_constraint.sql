-- Fix minimum_hours constraint to allow 1 hour
ALTER TABLE public.yachts 
DROP CONSTRAINT IF EXISTS check_minimum_hours;

ALTER TABLE public.yachts 
ADD CONSTRAINT check_minimum_hours CHECK (minimum_hours >= 1 AND minimum_hours <= 8);
