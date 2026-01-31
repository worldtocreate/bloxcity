-- Add coins column to forum_users
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_coin_claim timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status_text text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status_updated_at timestamp with time zone DEFAULT NULL;

-- Create friend requests table
CREATE TABLE public.forum_friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone DEFAULT NULL,
  UNIQUE (sender_id, receiver_id)
);

-- Create friendships table (for accepted friends)
CREATE TABLE public.forum_friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_1_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  user_2_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_1_id, user_2_id),
  CHECK (user_1_id < user_2_id)
);

-- Create status likes table
CREATE TABLE public.forum_status_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  liked_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (liker_id, liked_user_id)
);

-- Create reports table
CREATE TABLE public.forum_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  reported_type text NOT NULL CHECK (reported_type IN ('thread', 'post', 'status', 'profile')),
  reported_id uuid NOT NULL,
  reason text NOT NULL,
  details text DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by uuid REFERENCES public.forum_users(id) DEFAULT NULL,
  reviewed_at timestamp with time zone DEFAULT NULL,
  action_taken text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create membership redemption history
CREATE TABLE public.forum_membership_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('bronze', 'silver', 'platinum')),
  coins_spent integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_status_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_membership_redemptions ENABLE ROW LEVEL SECURITY;

-- Friend Requests RLS
CREATE POLICY "Users can view their own friend requests"
ON public.forum_friend_requests FOR SELECT
USING (
  sender_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can send friend requests"
ON public.forum_friend_requests FOR INSERT
WITH CHECK (
  sender_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  AND sender_id != receiver_id
);

CREATE POLICY "Receiver can update friend request status"
ON public.forum_friend_requests FOR UPDATE
USING (
  receiver_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own requests"
ON public.forum_friend_requests FOR DELETE
USING (
  sender_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

-- Friendships RLS
CREATE POLICY "Anyone can view friendships"
ON public.forum_friendships FOR SELECT
USING (true);

CREATE POLICY "Users can delete their own friendships"
ON public.forum_friendships FOR DELETE
USING (
  user_1_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  OR user_2_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

-- Status Likes RLS
CREATE POLICY "Anyone can view status likes"
ON public.forum_status_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like statuses"
ON public.forum_status_likes FOR INSERT
WITH CHECK (
  liker_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can unlike statuses"
ON public.forum_status_likes FOR DELETE
USING (
  liker_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

-- Reports RLS
CREATE POLICY "Users can create reports"
ON public.forum_reports FOR INSERT
WITH CHECK (
  reporter_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their own reports"
ON public.forum_reports FOR SELECT
USING (
  reporter_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admins can update reports"
ON public.forum_reports FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admins can delete reports"
ON public.forum_reports FOR DELETE
USING (
  has_role(auth.uid(), 'admin')
);

-- Membership Redemptions RLS
CREATE POLICY "Users can view their own redemptions"
ON public.forum_membership_redemptions FOR SELECT
USING (
  forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create redemptions"
ON public.forum_membership_redemptions FOR INSERT
WITH CHECK (
  forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

-- Function to accept friend request and create friendship
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid;
  v_receiver_id uuid;
  v_user_1 uuid;
  v_user_2 uuid;
BEGIN
  -- Get the request details
  SELECT sender_id, receiver_id INTO v_sender_id, v_receiver_id
  FROM forum_friend_requests
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or already processed';
  END IF;
  
  -- Verify the current user is the receiver
  IF NOT EXISTS (SELECT 1 FROM forum_users WHERE id = v_receiver_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to accept this request';
  END IF;
  
  -- Order the IDs for the friendship table constraint
  IF v_sender_id < v_receiver_id THEN
    v_user_1 := v_sender_id;
    v_user_2 := v_receiver_id;
  ELSE
    v_user_1 := v_receiver_id;
    v_user_2 := v_sender_id;
  END IF;
  
  -- Create the friendship
  INSERT INTO forum_friendships (user_1_id, user_2_id)
  VALUES (v_user_1, v_user_2)
  ON CONFLICT DO NOTHING;
  
  -- Update the request status
  UPDATE forum_friend_requests
  SET status = 'accepted', responded_at = now()
  WHERE id = request_id;
END;
$$;

-- Function to claim daily coins
CREATE OR REPLACE FUNCTION public.claim_daily_coins()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_forum_user_id uuid;
  v_last_claim timestamp with time zone;
  v_new_coins integer;
BEGIN
  -- Get the forum user
  SELECT id, last_coin_claim, coins INTO v_forum_user_id, v_last_claim, v_new_coins
  FROM forum_users
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Forum user not found';
  END IF;
  
  -- Check if 24 hours have passed since last claim
  IF v_last_claim IS NOT NULL AND v_last_claim > now() - interval '24 hours' THEN
    RAISE EXCEPTION 'Daily coins already claimed';
  END IF;
  
  -- Add 25 coins
  v_new_coins := COALESCE(v_new_coins, 0) + 25;
  
  UPDATE forum_users
  SET coins = v_new_coins, last_coin_claim = now()
  WHERE id = v_forum_user_id;
  
  RETURN v_new_coins;
END;
$$;

-- Function to redeem membership
CREATE OR REPLACE FUNCTION public.redeem_membership(tier_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_forum_user_id uuid;
  v_current_coins integer;
  v_cost integer;
BEGIN
  -- Validate tier
  IF tier_name NOT IN ('bronze', 'silver', 'platinum') THEN
    RAISE EXCEPTION 'Invalid membership tier';
  END IF;
  
  -- Set cost based on tier
  CASE tier_name
    WHEN 'bronze' THEN v_cost := 250;
    WHEN 'silver' THEN v_cost := 500;
    WHEN 'platinum' THEN v_cost := 1000;
  END CASE;
  
  -- Get user's current coins
  SELECT id, coins INTO v_forum_user_id, v_current_coins
  FROM forum_users
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Forum user not found';
  END IF;
  
  IF v_current_coins < v_cost THEN
    RAISE EXCEPTION 'Not enough coins';
  END IF;
  
  -- Deduct coins and set membership
  UPDATE forum_users
  SET coins = coins - v_cost, membership_tier = tier_name
  WHERE id = v_forum_user_id;
  
  -- Record the redemption
  INSERT INTO forum_membership_redemptions (forum_user_id, tier, coins_spent)
  VALUES (v_forum_user_id, tier_name, v_cost);
END;
$$;