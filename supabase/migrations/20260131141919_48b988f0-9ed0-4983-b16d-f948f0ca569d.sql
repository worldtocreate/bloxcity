-- Fix verification request INSERT policy recursion by moving the existence check into a SECURITY DEFINER function

CREATE OR REPLACE FUNCTION public.has_pending_verification_request(_forum_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.forum_verification_requests
    WHERE forum_user_id = _forum_user_id
      AND status = 'pending'
  )
$$;

DROP POLICY IF EXISTS "Users can submit verification requests" ON public.forum_verification_requests;

CREATE POLICY "Users can submit verification requests"
ON public.forum_verification_requests
FOR INSERT
WITH CHECK (
  (forum_user_id IN (
    SELECT forum_users.id
    FROM public.forum_users
    WHERE forum_users.user_id = auth.uid()
  ))
  AND (status = 'pending'::text)
  AND (NOT public.has_pending_verification_request(forum_verification_requests.forum_user_id))
);