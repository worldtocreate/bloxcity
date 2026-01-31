-- Create table for trusted 2FA devices
CREATE TABLE public.forum_2fa_trusted_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forum_user_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_2fa_trusted_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own trusted devices
CREATE POLICY "Users can view own trusted devices"
ON public.forum_2fa_trusted_devices
FOR SELECT
USING (forum_user_id IN (
  SELECT id FROM public.forum_users WHERE user_id = auth.uid()
));

-- Users can delete their own trusted devices
CREATE POLICY "Users can delete own trusted devices"
ON public.forum_2fa_trusted_devices
FOR DELETE
USING (forum_user_id IN (
  SELECT id FROM public.forum_users WHERE user_id = auth.uid()
));

-- Create index for faster lookups
CREATE INDEX idx_forum_2fa_trusted_devices_token ON public.forum_2fa_trusted_devices(device_token);
CREATE INDEX idx_forum_2fa_trusted_devices_user ON public.forum_2fa_trusted_devices(forum_user_id);
CREATE INDEX idx_forum_2fa_trusted_devices_expires ON public.forum_2fa_trusted_devices(expires_at);