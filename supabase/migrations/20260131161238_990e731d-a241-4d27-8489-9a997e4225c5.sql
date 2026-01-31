-- Add level and XP fields to forum_users
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS thread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avatar_effect TEXT DEFAULT NULL;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_forum_users_xp ON public.forum_users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_forum_users_post_count ON public.forum_users(post_count DESC);
CREATE INDEX IF NOT EXISTS idx_forum_users_thread_count ON public.forum_users(thread_count DESC);

-- Create function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp_value INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Level formula: Each level requires progressively more XP
  -- Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, Level 4: 450 XP, etc.
  RETURN GREATEST(1, FLOOR((-50 + SQRT(2500 + 200 * xp_value)) / 100)::INTEGER + 1);
END;
$$;

-- Create function to update XP when posting
CREATE OR REPLACE FUNCTION public.update_user_xp_on_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  xp_gain INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- 5 XP per reply
  xp_gain := 5;
  
  UPDATE public.forum_users 
  SET 
    xp = xp + xp_gain,
    level = calculate_level(xp + xp_gain),
    post_count = post_count + 1
  WHERE id = NEW.author_id
  RETURNING xp INTO new_xp;
  
  RETURN NEW;
END;
$$;

-- Create function to update XP when creating thread
CREATE OR REPLACE FUNCTION public.update_user_xp_on_thread()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  xp_gain INTEGER;
  new_xp INTEGER;
BEGIN
  -- 10 XP per thread
  xp_gain := 10;
  
  UPDATE public.forum_users 
  SET 
    xp = xp + xp_gain,
    level = calculate_level(xp + xp_gain),
    thread_count = thread_count + 1
  WHERE id = NEW.author_id
  RETURNING xp INTO new_xp;
  
  RETURN NEW;
END;
$$;

-- Create triggers for XP updates
DROP TRIGGER IF EXISTS update_xp_on_post ON public.forum_posts;
CREATE TRIGGER update_xp_on_post
  AFTER INSERT ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_xp_on_post();

DROP TRIGGER IF EXISTS update_xp_on_thread ON public.forum_threads;
CREATE TRIGGER update_xp_on_thread
  AFTER INSERT ON public.forum_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_xp_on_thread();

-- Update existing users with thread counts and recalculate XP/levels
UPDATE public.forum_users fu
SET 
  thread_count = (SELECT COUNT(*) FROM public.forum_threads ft WHERE ft.author_id = fu.id AND ft.is_deleted = false),
  xp = (
    (SELECT COUNT(*) FROM public.forum_threads ft WHERE ft.author_id = fu.id AND ft.is_deleted = false) * 10 +
    (SELECT COUNT(*) FROM public.forum_posts fp WHERE fp.author_id = fu.id AND fp.is_deleted = false) * 5
  );

UPDATE public.forum_users
SET level = calculate_level(xp);

-- Add policy to allow storage uploads to covers folder
-- Note: The forum-avatars bucket should already have proper policies