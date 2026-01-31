-- Add ad_type column to forum_ads table
ALTER TABLE public.forum_ads 
ADD COLUMN IF NOT EXISTS ad_type text NOT NULL DEFAULT 'banner';

-- Add a comment for clarity
COMMENT ON COLUMN public.forum_ads.ad_type IS 'Type of ad: banner (728x90) or skyscraper (160x600)';