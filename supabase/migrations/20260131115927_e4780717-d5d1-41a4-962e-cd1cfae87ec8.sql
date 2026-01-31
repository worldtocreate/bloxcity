-- Forum Categories
CREATE TABLE public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  is_admin_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Forum Users (extends profiles with forum-specific data)
CREATE TABLE public.forum_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  signature TEXT,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  suspension_ends_at TIMESTAMP WITH TIME ZONE,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Forum Threads
CREATE TABLE public.forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_post_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_post_by UUID REFERENCES public.forum_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Forum Posts
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  quoted_post_id UUID REFERENCES public.forum_posts(id),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Blocked Users (user blocks another user)
CREATE TABLE public.forum_blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS on all tables
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_blocked_users ENABLE ROW LEVEL SECURITY;

-- Forum Categories RLS (everyone can read, admins can manage)
CREATE POLICY "Anyone can view categories" ON public.forum_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.forum_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Forum Users RLS
CREATE POLICY "Anyone can view forum users" ON public.forum_users
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own forum profile" ON public.forum_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forum profile" ON public.forum_users
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any forum user" ON public.forum_users
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Forum Threads RLS
CREATE POLICY "Anyone can view threads" ON public.forum_threads
  FOR SELECT USING (true);

CREATE POLICY "Forum users can create threads" ON public.forum_threads
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.forum_users WHERE user_id = auth.uid() AND is_suspended = false)
    AND (
      NOT (SELECT is_admin_only FROM public.forum_categories WHERE id = category_id)
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Authors can update their threads" ON public.forum_threads
  FOR UPDATE USING (
    author_id IN (SELECT id FROM public.forum_users WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Forum Posts RLS
CREATE POLICY "Anyone can view posts" ON public.forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Forum users can create posts" ON public.forum_posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.forum_users WHERE user_id = auth.uid() AND is_suspended = false)
    AND NOT EXISTS (SELECT 1 FROM public.forum_threads WHERE id = thread_id AND is_locked = true)
  );

CREATE POLICY "Authors can update their posts" ON public.forum_posts
  FOR UPDATE USING (
    author_id IN (SELECT id FROM public.forum_users WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Blocked Users RLS
CREATE POLICY "Users can view their blocks" ON public.forum_blocked_users
  FOR SELECT USING (blocker_id IN (SELECT id FROM public.forum_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can block others" ON public.forum_blocked_users
  FOR INSERT WITH CHECK (
    blocker_id IN (SELECT id FROM public.forum_users WHERE user_id = auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = (SELECT user_id FROM public.forum_users WHERE id = blocked_id) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can unblock others" ON public.forum_blocked_users
  FOR DELETE USING (blocker_id IN (SELECT id FROM public.forum_users WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_forum_threads_category ON public.forum_threads(category_id);
CREATE INDEX idx_forum_threads_author ON public.forum_threads(author_id);
CREATE INDEX idx_forum_threads_last_post ON public.forum_threads(last_post_at DESC);
CREATE INDEX idx_forum_posts_thread ON public.forum_posts(thread_id);
CREATE INDEX idx_forum_posts_author ON public.forum_posts(author_id);
CREATE INDEX idx_forum_users_user_id ON public.forum_users(user_id);

-- Insert default categories
INSERT INTO public.forum_categories (name, description, slug, sort_order, is_admin_only) VALUES
  ('Information & Announcements', 'Official news and updates from the BLOX City team', 'announcements', 1, true),
  ('General Discussion', 'Talk about anything BLOX City related', 'general', 2, false),
  ('Suggestions & Feedback', 'Share your ideas to improve BLOX City', 'suggestions', 3, false),
  ('Help & Support', 'Get help from the community', 'support', 4, false),
  ('Off-Topic', 'Chat about anything not related to BLOX City', 'off-topic', 5, false);

-- Create storage bucket for forum avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-avatars', 'forum-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for forum avatars
CREATE POLICY "Forum avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum-avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'forum-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'forum-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'forum-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);