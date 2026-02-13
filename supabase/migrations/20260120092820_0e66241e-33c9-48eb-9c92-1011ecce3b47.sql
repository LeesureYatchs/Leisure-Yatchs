-- Drop the overly permissive policy and replace with a more secure one
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

-- Create a more specific policy that still allows public booking but with validation
-- This policy allows anonymous users to create bookings with required fields
CREATE POLICY "Public can create bookings with required fields"
  ON public.bookings FOR INSERT
  WITH CHECK (
    customer_name IS NOT NULL 
    AND customer_email IS NOT NULL 
    AND customer_phone IS NOT NULL
    AND booking_date IS NOT NULL
    AND start_time IS NOT NULL
    AND end_time IS NOT NULL
    AND yacht_id IS NOT NULL
  );