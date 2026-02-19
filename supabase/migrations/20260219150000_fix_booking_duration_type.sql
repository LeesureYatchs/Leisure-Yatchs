-- Change duration_hours from integer to numeric to allow fractional hours (e.g. 1.66 for 100 mins)
ALTER TABLE public.bookings 
ALTER COLUMN duration_hours TYPE DECIMAL(10, 2);
