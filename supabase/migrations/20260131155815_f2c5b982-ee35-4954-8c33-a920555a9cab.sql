-- Add self-disabled account tracking fields to forum_users
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS is_self_disabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS self_disabled_reason TEXT,
ADD COLUMN IF NOT EXISTS self_disabled_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS self_disabled_at TIMESTAMP WITH TIME ZONE;