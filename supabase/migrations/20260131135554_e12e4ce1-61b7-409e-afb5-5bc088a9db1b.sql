-- Two-Factor Authentication Tables

-- Table for storing user 2FA settings and TOTP secrets
CREATE TABLE public.forum_2fa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  method text NOT NULL DEFAULT 'none' CHECK (method IN ('none', 'totp', 'email')),
  totp_secret text, -- Encrypted TOTP secret for Google Authenticator
  backup_codes text[], -- Array of hashed backup codes
  backup_codes_used boolean[] DEFAULT '{}', -- Track which backup codes are used
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(forum_user_id)
);

-- Table for temporary 2FA codes (email verification codes)
CREATE TABLE public.forum_2fa_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  code text NOT NULL,
  type text NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'backup')),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_forum_2fa_codes_user ON public.forum_2fa_codes(forum_user_id);
CREATE INDEX idx_forum_2fa_codes_expires ON public.forum_2fa_codes(expires_at) WHERE used_at IS NULL;

-- Enable RLS
ALTER TABLE public.forum_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_2fa_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 2FA settings
CREATE POLICY "Users can view their own 2FA settings"
ON public.forum_2fa_settings FOR SELECT
USING (forum_user_id IN (
  SELECT id FROM forum_users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage their own 2FA settings"
ON public.forum_2fa_settings FOR ALL
USING (forum_user_id IN (
  SELECT id FROM forum_users WHERE user_id = auth.uid()
));

-- RLS Policies for 2FA codes (managed by edge functions)
CREATE POLICY "Users can view their own 2FA codes"
ON public.forum_2fa_codes FOR SELECT
USING (forum_user_id IN (
  SELECT id FROM forum_users WHERE user_id = auth.uid()
));

-- Post Moderation Tables

-- Add soft delete columns to forum_posts
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted_by uuid,
ADD COLUMN IF NOT EXISTS deletion_reason text;

-- Add soft delete columns to forum_threads
ALTER TABLE public.forum_threads
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted_by uuid,
ADD COLUMN IF NOT EXISTS deletion_reason text;

-- Table for moderation action history
CREATE TABLE public.forum_moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('post', 'thread')),
  target_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('delete', 'restore')),
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/mods can view moderation logs
CREATE POLICY "Admins can view moderation logs"
ON public.forum_moderation_logs FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can insert moderation logs"
ON public.forum_moderation_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Update posts policy to hide deleted posts from non-admins
DROP POLICY IF EXISTS "Anyone can view posts" ON public.forum_posts;
CREATE POLICY "Anyone can view non-deleted posts"
ON public.forum_posts FOR SELECT
USING (
  is_deleted = false 
  OR has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'moderator')
);

-- Update threads policy to hide deleted threads from non-admins
DROP POLICY IF EXISTS "Anyone can view threads" ON public.forum_threads;
CREATE POLICY "Anyone can view non-deleted threads"
ON public.forum_threads FOR SELECT
USING (
  is_deleted = false 
  OR has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'moderator')
);

-- Allow admins to update posts for moderation
DROP POLICY IF EXISTS "Authors can update their posts" ON public.forum_posts;
CREATE POLICY "Authors and admins can update posts"
ON public.forum_posts FOR UPDATE
USING (
  (author_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'moderator')
);

-- Allow admins to update threads for moderation
DROP POLICY IF EXISTS "Authors can update their threads" ON public.forum_threads;
CREATE POLICY "Authors and admins can update threads"
ON public.forum_threads FOR UPDATE
USING (
  (author_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'moderator')
);