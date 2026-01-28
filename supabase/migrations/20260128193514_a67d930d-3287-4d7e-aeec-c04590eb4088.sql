-- Add IP address column to track reservations per IP
ALTER TABLE public.reserved_usernames 
ADD COLUMN ip_address TEXT;

-- Create index for faster IP lookups
CREATE INDEX idx_reserved_usernames_ip ON public.reserved_usernames (ip_address);