-- Add last_seen_at column to track online status
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for efficient online status queries
CREATE INDEX IF NOT EXISTS idx_forum_users_last_seen_at ON public.forum_users(last_seen_at);

-- Update RLS to allow users to update their own last_seen_at
-- (existing policies should cover this since users can update their own records)