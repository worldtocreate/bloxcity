-- Forum Ads System
CREATE TABLE public.forum_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  destination_url text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  denial_reason text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  click_count integer DEFAULT 0,
  coins_earned integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  last_ad_at timestamp with time zone
);

-- Ad clicks tracking for anti-bot
CREATE TABLE public.forum_ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.forum_ads(id) ON DELETE CASCADE,
  clicker_forum_user_id uuid REFERENCES public.forum_users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for checking duplicate clicks
CREATE INDEX idx_ad_clicks_anti_bot ON public.forum_ad_clicks(ad_id, ip_address, created_at);
CREATE INDEX idx_ad_clicks_user ON public.forum_ad_clicks(ad_id, clicker_forum_user_id, created_at);

-- Profile views tracking
CREATE TABLE public.forum_profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewed_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  viewer_user_id uuid REFERENCES public.forum_users(id) ON DELETE SET NULL,
  viewer_ip text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_views_viewed ON public.forum_profile_views(viewed_user_id, created_at DESC);
CREATE INDEX idx_profile_views_anti_spam ON public.forum_profile_views(viewed_user_id, viewer_ip, created_at);

-- Enable RLS
ALTER TABLE public.forum_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_ad_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_profile_views ENABLE ROW LEVEL SECURITY;

-- Forum Ads Policies
CREATE POLICY "Users can view approved ads" ON public.forum_ads
  FOR SELECT USING (status = 'approved' OR forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit their own ads" ON public.forum_ads
  FOR INSERT WITH CHECK (
    forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "Users can update their pending ads" ON public.forum_ads
  FOR UPDATE USING (
    (forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()) AND status = 'pending')
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their own ads" ON public.forum_ads
  FOR DELETE USING (
    forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Ad Clicks Policies
CREATE POLICY "Anyone can view click counts" ON public.forum_ad_clicks
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can click ads" ON public.forum_ad_clicks
  FOR INSERT WITH CHECK (
    clicker_forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  );

-- Profile Views Policies
CREATE POLICY "Users can view who viewed their profile" ON public.forum_profile_views
  FOR SELECT USING (
    viewed_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authenticated users can log profile views" ON public.forum_profile_views
  FOR INSERT WITH CHECK (true);

-- Function to handle ad clicks with anti-bot protection
CREATE OR REPLACE FUNCTION public.click_ad(ad_id uuid, clicker_ip text, clicker_agent text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clicker_forum_user_id uuid;
  v_ad_owner_id uuid;
  v_recent_click_count integer;
  v_user_click_exists boolean;
BEGIN
  -- Get clicker's forum user id
  SELECT id INTO v_clicker_forum_user_id
  FROM forum_users WHERE user_id = auth.uid();
  
  IF v_clicker_forum_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get ad owner
  SELECT forum_user_id INTO v_ad_owner_id
  FROM forum_ads WHERE id = ad_id AND status = 'approved';
  
  IF v_ad_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ad not found');
  END IF;
  
  -- Can't click own ad
  IF v_ad_owner_id = v_clicker_forum_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot click your own ad');
  END IF;
  
  -- Check if user already clicked this ad in last 24 hours
  SELECT EXISTS (
    SELECT 1 FROM forum_ad_clicks
    WHERE ad_id = click_ad.ad_id
    AND clicker_forum_user_id = v_clicker_forum_user_id
    AND created_at > now() - interval '24 hours'
  ) INTO v_user_click_exists;
  
  IF v_user_click_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already clicked this ad recently');
  END IF;
  
  -- Check IP rate limiting (max 5 ad clicks per IP per hour)
  SELECT COUNT(*) INTO v_recent_click_count
  FROM forum_ad_clicks
  WHERE ip_address = clicker_ip
  AND created_at > now() - interval '1 hour';
  
  IF v_recent_click_count >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate limit exceeded');
  END IF;
  
  -- Record the click
  INSERT INTO forum_ad_clicks (ad_id, clicker_forum_user_id, ip_address, user_agent)
  VALUES (click_ad.ad_id, v_clicker_forum_user_id, clicker_ip, clicker_agent);
  
  -- Award 5 coins to ad owner
  UPDATE forum_users SET coins = COALESCE(coins, 0) + 5 WHERE id = v_ad_owner_id;
  
  -- Update ad stats
  UPDATE forum_ads 
  SET click_count = click_count + 1, coins_earned = coins_earned + 5
  WHERE id = click_ad.ad_id;
  
  RETURN jsonb_build_object('success', true, 'coins_awarded', 5);
END;
$$;

-- Function to check if user can submit an ad (24 hour cooldown)
CREATE OR REPLACE FUNCTION public.can_submit_ad()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_forum_user_id uuid;
  v_last_ad timestamp with time zone;
BEGIN
  SELECT id INTO v_forum_user_id
  FROM forum_users WHERE user_id = auth.uid();
  
  IF v_forum_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT MAX(created_at) INTO v_last_ad
  FROM forum_ads
  WHERE forum_user_id = v_forum_user_id;
  
  IF v_last_ad IS NULL OR v_last_ad < now() - interval '24 hours' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;