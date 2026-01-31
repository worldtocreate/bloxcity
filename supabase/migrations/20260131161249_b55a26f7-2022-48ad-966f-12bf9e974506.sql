-- Fix function search path for calculate_level
CREATE OR REPLACE FUNCTION public.calculate_level(xp_value INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN GREATEST(1, FLOOR((-50 + SQRT(2500 + 200 * xp_value)) / 100)::INTEGER + 1);
END;
$$;