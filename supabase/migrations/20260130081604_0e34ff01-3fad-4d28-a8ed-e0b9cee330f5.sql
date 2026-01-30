-- Create function to count reserved usernames (no sensitive data exposed)
CREATE OR REPLACE FUNCTION public.get_reservation_count()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM reserved_usernames);
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_reservation_count TO anon;
GRANT EXECUTE ON FUNCTION public.get_reservation_count TO authenticated;

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can check username availability" ON public.reserved_usernames;

-- Create a restrictive SELECT policy that blocks direct access
-- (edge function uses service role key, so it bypasses RLS)
CREATE POLICY "Block direct SELECT access"
ON public.reserved_usernames
FOR SELECT
USING (false);

-- Add explicit DENY policies for UPDATE and DELETE (defense in depth)
CREATE POLICY "Reservations are immutable"
ON public.reserved_usernames
FOR UPDATE
USING (false);

CREATE POLICY "Reservations cannot be deleted"
ON public.reserved_usernames
FOR DELETE
USING (false);