-- Create a secure function to get recent bookings for social proof
-- This allows public access ONLY to name, yacht name, and time, hiding email/phone.

CREATE OR REPLACE FUNCTION public.get_social_proof_bookings()
RETURNS TABLE (
  customer_name TEXT,
  yacht_name TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (admin)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.customer_name,
    y.name as yacht_name,
    y.tour_details as location, -- Using tour_details as proxy for location or custom logic
    b.created_at
  FROM bookings b
  JOIN yachts y ON b.yacht_id = y.id
  WHERE b.status IN ('pending', 'confirmed')
  ORDER BY b.created_at DESC
  LIMIT 10;
END;
$$;
