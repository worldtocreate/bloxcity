-- Add last_post_at column to track when user last posted
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS last_post_at timestamp with time zone DEFAULT NULL;

-- Create function to update last_post_at when a post is created
CREATE OR REPLACE FUNCTION public.update_forum_user_last_post()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forum_users 
  SET last_post_at = now()
  WHERE id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to call the function after post insert
DROP TRIGGER IF EXISTS on_forum_post_created ON public.forum_posts;
CREATE TRIGGER on_forum_post_created
  AFTER INSERT ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forum_user_last_post();

-- Update RLS policy for forum_posts to include cooldown check (30 seconds)
DROP POLICY IF EXISTS "Forum users can create posts" ON public.forum_posts;
CREATE POLICY "Forum users can create posts with cooldown"
ON public.forum_posts
FOR INSERT
WITH CHECK (
  -- User must have a forum account and not be suspended
  (EXISTS (
    SELECT 1 FROM forum_users
    WHERE forum_users.user_id = auth.uid()
    AND forum_users.is_suspended = false
    AND (
      forum_users.last_post_at IS NULL 
      OR forum_users.last_post_at < now() - interval '30 seconds'
    )
  ))
  -- Thread must not be locked
  AND (NOT (EXISTS (
    SELECT 1 FROM forum_threads
    WHERE forum_threads.id = forum_posts.thread_id
    AND forum_threads.is_locked = true
  )))
);

-- Also update forum_threads insert policy with cooldown
DROP POLICY IF EXISTS "Forum users can create threads" ON public.forum_threads;
CREATE POLICY "Forum users can create threads with cooldown"
ON public.forum_threads
FOR INSERT
WITH CHECK (
  -- User must have a forum account, not be suspended, and respect cooldown
  (EXISTS (
    SELECT 1 FROM forum_users
    WHERE forum_users.user_id = auth.uid()
    AND forum_users.is_suspended = false
    AND (
      forum_users.last_post_at IS NULL 
      OR forum_users.last_post_at < now() - interval '30 seconds'
    )
  ))
  -- Category must allow user to post (admin-only check)
  AND (
    (NOT (SELECT forum_categories.is_admin_only FROM forum_categories WHERE forum_categories.id = forum_threads.category_id))
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);