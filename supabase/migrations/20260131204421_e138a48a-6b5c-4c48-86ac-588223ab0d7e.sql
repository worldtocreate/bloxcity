-- Create achievements table
CREATE TABLE public.forum_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT 'star',
  color text DEFAULT '#FFD700',
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.forum_user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.forum_achievements(id) ON DELETE CASCADE,
  awarded_at timestamp with time zone NOT NULL DEFAULT now(),
  awarded_by uuid REFERENCES public.forum_users(id),
  UNIQUE(forum_user_id, achievement_id)
);

-- Add vault privacy and group privacy to forum_groups
ALTER TABLE public.forum_groups 
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS vault_is_private boolean DEFAULT false;

-- Enable RLS
ALTER TABLE public.forum_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS for achievements - everyone can view
CREATE POLICY "Anyone can view achievements"
ON public.forum_achievements FOR SELECT
USING (true);

-- Only admins can manage achievements
CREATE POLICY "Admins can manage achievements"
ON public.forum_achievements FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS for user achievements - everyone can view
CREATE POLICY "Anyone can view user achievements"
ON public.forum_user_achievements FOR SELECT
USING (true);

-- Only admins can award achievements
CREATE POLICY "Admins can award achievements"
ON public.forum_user_achievements FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can remove achievements
CREATE POLICY "Admins can remove achievements"
ON public.forum_user_achievements FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Insert some default achievements
INSERT INTO public.forum_achievements (name, description, icon, color, rarity) VALUES
('Early Adopter', 'Joined during the early access period', 'star', '#FFD700', 'rare'),
('First Post', 'Created your first forum post', 'message-square', '#4CAF50', 'common'),
('Verified', 'Account has been verified', 'check-circle', '#2196F3', 'rare'),
('Helpful', 'Recognized for being helpful to the community', 'heart', '#E91E63', 'common'),
('Top Contributor', 'One of the most active forum contributors', 'trophy', '#9C27B0', 'epic'),
('Legend', 'Achieved legendary status in the community', 'crown', '#FF5722', 'legendary');