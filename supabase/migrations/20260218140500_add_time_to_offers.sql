-- Add start_time and end_time to offers table
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Update RLS policy to allow viewing upcoming offers for the 'Starts in' feature
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.offers;
CREATE POLICY "Anyone can view active offers"
  ON public.offers FOR SELECT
  USING (
    status = 'active' 
    AND end_date >= CURRENT_DATE
  );
