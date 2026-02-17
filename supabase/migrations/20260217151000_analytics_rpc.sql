
-- RPC to fetch yachts with views safely
CREATE OR REPLACE FUNCTION public.get_yachts_with_views()
RETURNS SETOF public.yachts AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.yachts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
