-- Add username change tracking column
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS last_username_change_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add maintenance mode setting (if not exists)
INSERT INTO public.site_settings (key, value) 
VALUES ('maintenance_mode', '{"enabled": false, "password": "admin123", "message": "We are currently performing scheduled maintenance. Please check back soon."}')
ON CONFLICT (key) DO NOTHING;

-- Add purged_usernames tracking table
CREATE TABLE IF NOT EXISTS public.purged_usernames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  original_reservation_id UUID REFERENCES public.reserved_usernames(id) ON DELETE SET NULL,
  purged_by UUID NOT NULL,
  purged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  reverted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  reverted_by UUID DEFAULT NULL
);

-- Enable RLS on purged_usernames
ALTER TABLE public.purged_usernames ENABLE ROW LEVEL SECURITY;

-- Only admins can manage purged usernames
CREATE POLICY "Only admins can view purged usernames" ON public.purged_usernames
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert purged usernames" ON public.purged_usernames
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update purged usernames" ON public.purged_usernames
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add locked status to forum_users
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS locked_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS locked_by UUID DEFAULT NULL;