-- Add image_url column to forum_achievements for uploaded images
ALTER TABLE public.forum_achievements ADD COLUMN IF NOT EXISTS image_url text;

-- Drop the rarity column as it's no longer needed
ALTER TABLE public.forum_achievements DROP COLUMN IF EXISTS rarity;
ALTER TABLE public.forum_achievements DROP COLUMN IF EXISTS icon;