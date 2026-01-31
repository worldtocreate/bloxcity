-- Add verification and privacy columns to forum_users
ALTER TABLE public.forum_users 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dm_encryption_pin_hash text,
ADD COLUMN IF NOT EXISTS allow_dms boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS hide_threads boolean DEFAULT false;

-- Create verification requests table
CREATE TABLE public.forum_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reason text,
  denial_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(forum_user_id, status)
);

-- Create direct messages table with encrypted content
CREATE TABLE public.forum_direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  encrypted_content text NOT NULL,
  iv text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create conversations table to track message threads between users
CREATE TABLE public.forum_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  participant_2 uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Create pinned threads table for user profiles
CREATE TABLE public.forum_pinned_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_user_id uuid NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  pinned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(forum_user_id, thread_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.forum_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_pinned_threads ENABLE ROW LEVEL SECURITY;

-- RLS for verification requests
CREATE POLICY "Users can view their own verification requests"
ON public.forum_verification_requests FOR SELECT
USING (forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can submit verification requests"
ON public.forum_verification_requests FOR INSERT
WITH CHECK (
  forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  AND status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM forum_verification_requests 
    WHERE forum_user_id = forum_verification_requests.forum_user_id 
    AND status = 'pending'
  )
);

CREATE POLICY "Admins can view all verification requests"
ON public.forum_verification_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verification requests"
ON public.forum_verification_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- RLS for direct messages
CREATE POLICY "Users can view their own messages"
ON public.forum_direct_messages FOR SELECT
USING (
  sender_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  OR recipient_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can send messages"
ON public.forum_direct_messages FOR INSERT
WITH CHECK (
  sender_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM forum_users 
    WHERE id = recipient_id 
    AND allow_dms = true
    AND is_suspended = false
  )
  AND NOT EXISTS (
    SELECT 1 FROM forum_blocked_users 
    WHERE blocker_id = recipient_id 
    AND blocked_id = sender_id
  )
);

CREATE POLICY "Users can update their received messages"
ON public.forum_direct_messages FOR UPDATE
USING (recipient_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()));

-- RLS for conversations
CREATE POLICY "Users can view their conversations"
ON public.forum_conversations FOR SELECT
USING (
  participant_1 IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  OR participant_2 IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create conversations"
ON public.forum_conversations FOR INSERT
WITH CHECK (
  participant_1 IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  OR participant_2 IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their conversations"
ON public.forum_conversations FOR UPDATE
USING (
  participant_1 IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  OR participant_2 IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
);

-- RLS for pinned threads
CREATE POLICY "Anyone can view pinned threads"
ON public.forum_pinned_threads FOR SELECT
USING (true);

CREATE POLICY "Users can pin their own threads"
ON public.forum_pinned_threads FOR INSERT
WITH CHECK (
  forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid())
  AND thread_id IN (SELECT id FROM forum_threads WHERE author_id = forum_user_id)
);

CREATE POLICY "Users can unpin their own threads"
ON public.forum_pinned_threads FOR DELETE
USING (forum_user_id IN (SELECT id FROM forum_users WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_dm_sender ON public.forum_direct_messages(sender_id);
CREATE INDEX idx_dm_recipient ON public.forum_direct_messages(recipient_id);
CREATE INDEX idx_dm_created_at ON public.forum_direct_messages(created_at DESC);
CREATE INDEX idx_conversations_participant_1 ON public.forum_conversations(participant_1);
CREATE INDEX idx_conversations_participant_2 ON public.forum_conversations(participant_2);
CREATE INDEX idx_verification_status ON public.forum_verification_requests(status);
CREATE INDEX idx_pinned_threads_user ON public.forum_pinned_threads(forum_user_id);