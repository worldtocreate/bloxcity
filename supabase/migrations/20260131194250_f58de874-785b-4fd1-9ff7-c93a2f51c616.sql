-- Add warning system to forum_users
ALTER TABLE public.forum_users
ADD COLUMN IF NOT EXISTS suspension_review_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS has_pending_warning boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS warning_content text,
ADD COLUMN IF NOT EXISTS warning_moderator_note text,
ADD COLUMN IF NOT EXISTS warning_accepted_at timestamp with time zone;

-- Create Groups table
CREATE TABLE public.forum_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon_url text,
  cover_url text,
  owner_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  is_verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  verified_by uuid,
  member_count integer DEFAULT 1,
  coins_vault integer DEFAULT 0,
  require_approval boolean DEFAULT false,
  last_name_change timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Group roles table
CREATE TABLE public.forum_group_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6b7280',
  permissions jsonb DEFAULT '{}',
  rank integer NOT NULL DEFAULT 0, -- Higher rank = more permissions
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Group members table
CREATE TABLE public.forum_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  forum_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.forum_group_roles(id) ON DELETE SET NULL,
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_id, forum_user_id)
);

-- Group join requests (for manual approval)
CREATE TABLE public.forum_group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  forum_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  responded_by uuid,
  UNIQUE(group_id, forum_user_id)
);

-- Group banned members
CREATE TABLE public.forum_group_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  forum_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  banned_by uuid REFERENCES public.forum_users(id),
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_id, forum_user_id)
);

-- Group wall posts
CREATE TABLE public.forum_group_wall_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_deleted boolean DEFAULT false,
  deleted_by uuid,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Group events
CREATE TABLE public.forum_group_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  event_date timestamp with time zone,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  denial_reason text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Group affiliations
CREATE TABLE public.forum_group_affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  affiliate_group_id uuid NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  requested_by uuid REFERENCES public.forum_users(id),
  created_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  UNIQUE(group_id, affiliate_group_id),
  CHECK (group_id <> affiliate_group_id)
);

-- Group audit log
CREATE TABLE public.forum_group_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.forum_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Group blocked words
CREATE TABLE public.forum_group_blocked_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  word text NOT NULL,
  added_by uuid REFERENCES public.forum_users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Group icon/cover pending requests
CREATE TABLE public.forum_group_media_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.forum_groups(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('icon', 'cover')),
  image_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  denial_reason text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.forum_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_wall_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_blocked_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_group_media_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_groups
CREATE POLICY "Anyone can view groups" ON public.forum_groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON public.forum_groups FOR INSERT 
  WITH CHECK (owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()));
CREATE POLICY "Owners can update their groups" ON public.forum_groups FOR UPDATE 
  USING (owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete their groups" ON public.forum_groups FOR DELETE 
  USING (owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- RLS for group_roles
CREATE POLICY "Anyone can view group roles" ON public.forum_group_roles FOR SELECT USING (true);
CREATE POLICY "Group owners can manage roles" ON public.forum_group_roles FOR ALL 
  USING (group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())));

-- RLS for group_members
CREATE POLICY "Anyone can view group members" ON public.forum_group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.forum_group_members FOR INSERT 
  WITH CHECK (forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()));
CREATE POLICY "Members can leave groups" ON public.forum_group_members FOR DELETE 
  USING (forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()) 
    OR group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())));
CREATE POLICY "Group owners can manage members" ON public.forum_group_members FOR UPDATE 
  USING (group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())));

-- RLS for join requests
CREATE POLICY "Users can view their join requests" ON public.forum_group_join_requests FOR SELECT 
  USING (forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
    OR group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create join requests" ON public.forum_group_join_requests FOR INSERT 
  WITH CHECK (forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()));
CREATE POLICY "Group owners can manage requests" ON public.forum_group_join_requests FOR UPDATE 
  USING (group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())));
CREATE POLICY "Users can delete their own requests" ON public.forum_group_join_requests FOR DELETE 
  USING (forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
    OR group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())));

-- RLS for bans
CREATE POLICY "Admins and owners can view bans" ON public.forum_group_bans FOR SELECT 
  USING (group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Group owners can manage bans" ON public.forum_group_bans FOR ALL 
  USING (group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())));

-- RLS for wall posts
CREATE POLICY "Members can view wall posts" ON public.forum_group_wall_posts FOR SELECT 
  USING (is_deleted = false OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Members can create wall posts" ON public.forum_group_wall_posts FOR INSERT 
  WITH CHECK (author_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM forum_group_members WHERE group_id = forum_group_wall_posts.group_id 
      AND forum_user_id = (SELECT id FROM forum_users WHERE user_id = auth.uid())));
CREATE POLICY "Authors and owners can update posts" ON public.forum_group_wall_posts FOR UPDATE 
  USING (author_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
    OR group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'));

-- RLS for events
CREATE POLICY "Anyone can view approved events" ON public.forum_group_events FOR SELECT 
  USING (status = 'approved' OR has_role(auth.uid(), 'admin')
    OR group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())));
CREATE POLICY "Members can create events" ON public.forum_group_events FOR INSERT 
  WITH CHECK (created_by IN (SELECT id FROM forum_users WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage events" ON public.forum_group_events FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

-- RLS for affiliates
CREATE POLICY "Anyone can view accepted affiliates" ON public.forum_group_affiliates FOR SELECT 
  USING (status = 'accepted' OR group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()))
    OR affiliate_group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())));
CREATE POLICY "Group owners can manage affiliates" ON public.forum_group_affiliates FOR ALL 
  USING (group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()))
    OR affiliate_group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())));

-- RLS for audit logs
CREATE POLICY "Group members can view audit logs" ON public.forum_group_audit_logs FOR SELECT 
  USING (group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit logs" ON public.forum_group_audit_logs FOR INSERT 
  WITH CHECK (actor_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()));

-- RLS for blocked words
CREATE POLICY "Group owners can manage blocked words" ON public.forum_group_blocked_words FOR ALL 
  USING (group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())));
CREATE POLICY "Anyone can view blocked words" ON public.forum_group_blocked_words FOR SELECT USING (true);

-- RLS for media requests
CREATE POLICY "Owners can view their media requests" ON public.forum_group_media_requests FOR SELECT 
  USING (group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can create media requests" ON public.forum_group_media_requests FOR INSERT 
  WITH CHECK (group_id IN (SELECT id FROM forum_groups WHERE owner_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())));
CREATE POLICY "Admins can manage media requests" ON public.forum_group_media_requests FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_group_members_group ON public.forum_group_members(group_id);
CREATE INDEX idx_group_members_user ON public.forum_group_members(forum_user_id);
CREATE INDEX idx_group_wall_posts_group ON public.forum_group_wall_posts(group_id);
CREATE INDEX idx_group_audit_logs_group ON public.forum_group_audit_logs(group_id);
CREATE INDEX idx_groups_slug ON public.forum_groups(slug);
CREATE INDEX idx_groups_owner ON public.forum_groups(owner_id);