-- Add conversation encryption key column
-- Each conversation has a shared key, encrypted separately for each participant
ALTER TABLE public.forum_conversations
ADD COLUMN IF NOT EXISTS encryption_key_p1 TEXT,
ADD COLUMN IF NOT EXISTS encryption_key_p2 TEXT,
ADD COLUMN IF NOT EXISTS key_iv TEXT;