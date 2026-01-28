-- Create table for reserved usernames
CREATE TABLE public.reserved_usernames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  reservation_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check if a username exists (for validation)
CREATE POLICY "Anyone can check username availability"
ON public.reserved_usernames
FOR SELECT
USING (true);

-- Allow anyone to insert reservations (no auth required for this landing page)
CREATE POLICY "Anyone can reserve a username"
ON public.reserved_usernames
FOR INSERT
WITH CHECK (true);

-- Create index for faster username lookups
CREATE INDEX idx_reserved_usernames_username ON public.reserved_usernames (username);