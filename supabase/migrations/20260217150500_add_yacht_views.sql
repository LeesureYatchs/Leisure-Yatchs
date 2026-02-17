
-- Add views_count to yachts table to track popularity
ALTER TABLE public.yachts ADD COLUMN views_count INTEGER DEFAULT 0;

-- Function to increment views_count safely
CREATE OR REPLACE FUNCTION public.increment_yacht_views(yacht_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.yachts
  SET views_count = views_count + 1
  WHERE id = yacht_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
