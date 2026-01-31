-- Add date_of_birth column to forum_users
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  author_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on blog_posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view published blog posts
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts
FOR SELECT
USING (is_published = true);

-- Admins can view all blog posts
CREATE POLICY "Admins can view all blog posts"
ON public.blog_posts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can create blog posts
CREATE POLICY "Admins can create blog posts"
ON public.blog_posts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update blog posts
CREATE POLICY "Admins can update blog posts"
ON public.blog_posts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete blog posts
CREATE POLICY "Admins can delete blog posts"
ON public.blog_posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient querying
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);