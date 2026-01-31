-- Fix the profile views insert policy to require authentication
DROP POLICY IF EXISTS "Authenticated users can log profile views" ON public.forum_profile_views;

CREATE POLICY "Authenticated users can log profile views" ON public.forum_profile_views
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );