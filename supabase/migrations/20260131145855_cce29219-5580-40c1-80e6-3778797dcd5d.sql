-- Add cover_url column to forum_users
ALTER TABLE public.forum_users ADD COLUMN cover_url text;

-- Create cover photo requests table
CREATE TABLE public.forum_cover_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  denial_reason text
);

-- Enable RLS
ALTER TABLE public.forum_cover_requests ENABLE ROW LEVEL SECURITY;

-- Users can submit cover requests
CREATE POLICY "Users can submit cover requests"
ON public.forum_cover_requests
FOR INSERT
WITH CHECK (
  forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  AND status = 'pending'
);

-- Users can view their own cover requests
CREATE POLICY "Users can view their own cover requests"
ON public.forum_cover_requests
FOR SELECT
USING (
  forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

-- Admins can view all cover requests
CREATE POLICY "Admins can view all cover requests"
ON public.forum_cover_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update cover requests
CREATE POLICY "Admins can update cover requests"
ON public.forum_cover_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete cover requests
CREATE POLICY "Admins can delete cover requests"
ON public.forum_cover_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'));