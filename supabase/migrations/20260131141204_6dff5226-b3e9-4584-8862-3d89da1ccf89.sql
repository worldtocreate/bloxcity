-- Fix infinite recursion in forum_verification_requests INSERT policy
-- The issue is: forum_verification_requests_1.forum_user_id = forum_verification_requests_1.forum_user_id (self-referencing)
-- Should be: forum_verification_requests_1.forum_user_id = forum_verification_requests.forum_user_id

DROP POLICY IF EXISTS "Users can submit verification requests" ON public.forum_verification_requests;

CREATE POLICY "Users can submit verification requests" 
ON public.forum_verification_requests 
FOR INSERT 
WITH CHECK (
  (forum_user_id IN ( 
    SELECT forum_users.id
    FROM forum_users
    WHERE (forum_users.user_id = auth.uid())
  )) 
  AND (status = 'pending'::text) 
  AND (NOT (EXISTS ( 
    SELECT 1
    FROM forum_verification_requests existing
    WHERE (existing.forum_user_id = forum_verification_requests.forum_user_id) 
    AND (existing.status = 'pending'::text)
  )))
);