-- Create table for site updates
CREATE TABLE public.site_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.site_updates ENABLE ROW LEVEL SECURITY;

-- Anyone can view published updates
CREATE POLICY "Anyone can view published updates"
ON public.site_updates
FOR SELECT
USING (is_published = true);

-- Admins can view all updates
CREATE POLICY "Admins can view all updates"
ON public.site_updates
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can create updates
CREATE POLICY "Admins can create updates"
ON public.site_updates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update updates
CREATE POLICY "Admins can update updates"
ON public.site_updates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete updates
CREATE POLICY "Admins can delete updates"
ON public.site_updates
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add index for faster queries
CREATE INDEX idx_site_updates_published ON public.site_updates (is_published, created_at DESC);