-- Add email column to reserved_usernames table
ALTER TABLE public.reserved_usernames 
ADD COLUMN email text;