-- Create forum_avatar_requests table for pending approvals
CREATE TABLE public.forum_avatar_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_user_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  denial_reason TEXT,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.forum_avatar_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own avatar requests"
ON public.forum_avatar_requests
FOR SELECT
USING (
  forum_user_id IN (
    SELECT id FROM forum_users WHERE user_id = auth.uid()
  )
);

-- Users can submit avatar requests
CREATE POLICY "Users can submit avatar requests"
ON public.forum_avatar_requests
FOR INSERT
WITH CHECK (
  forum_user_id IN (
    SELECT id FROM forum_users WHERE user_id = auth.uid()
  )
  AND status = 'pending'
);

-- Admins can view all requests
CREATE POLICY "Admins can view all avatar requests"
ON public.forum_avatar_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update requests (approve/deny)
CREATE POLICY "Admins can update avatar requests"
ON public.forum_avatar_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete requests
CREATE POLICY "Admins can delete avatar requests"
ON public.forum_avatar_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));