-- Add social links columns to forum_users
ALTER TABLE public.forum_users
ADD COLUMN social_discord TEXT,
ADD COLUMN social_x TEXT;

-- Add membership tier column to forum_users
ALTER TABLE public.forum_users
ADD COLUMN membership_tier TEXT DEFAULT NULL;

-- Create user sessions table for tracking active sessions
CREATE TABLE public.forum_user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_user_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  user_agent TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_current BOOLEAN DEFAULT false
);

-- Enable RLS on sessions table
ALTER TABLE public.forum_user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.forum_user_sessions
FOR SELECT
USING (forum_user_id IN (
  SELECT id FROM forum_users WHERE user_id = auth.uid()
));

-- Users can delete their own sessions (for logout)
CREATE POLICY "Users can delete their own sessions"
ON public.forum_user_sessions
FOR DELETE
USING (forum_user_id IN (
  SELECT id FROM forum_users WHERE user_id = auth.uid()
));

-- Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions"
ON public.forum_user_sessions
FOR INSERT
WITH CHECK (forum_user_id IN (
  SELECT id FROM forum_users WHERE user_id = auth.uid()
));

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
ON public.forum_user_sessions
FOR UPDATE
USING (forum_user_id IN (
  SELECT id FROM forum_users WHERE user_id = auth.uid()
));

-- Add account deletion request tracking
CREATE TABLE public.forum_account_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_user_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(forum_user_id)
);

-- Enable RLS on deletion requests
ALTER TABLE public.forum_account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own deletion requests
CREATE POLICY "Users can view their own deletion requests"
ON public.forum_account_deletion_requests
FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own deletion requests  
CREATE POLICY "Users can create their own deletion requests"
ON public.forum_account_deletion_requests
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can view all deletion requests
CREATE POLICY "Admins can view all deletion requests"
ON public.forum_account_deletion_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update deletion requests
CREATE POLICY "Admins can update deletion requests"
ON public.forum_account_deletion_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));