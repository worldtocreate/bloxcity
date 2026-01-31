-- Create banned words table for auto-rejection
CREATE TABLE public.banned_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;

-- Only admins can manage banned words
CREATE POLICY "Only admins can view banned words"
ON public.banned_words
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert banned words"
ON public.banned_words
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update banned words"
ON public.banned_words
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete banned words"
ON public.banned_words
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Insert some default banned words
INSERT INTO public.banned_words (word, reason) VALUES
('lordclassified', 'Banned user'),
('lord_classified', 'Banned user'),
('admin', 'Reserved system name'),
('administrator', 'Reserved system name'),
('moderator', 'Reserved system name'),
('bloxcity', 'Reserved brand name'),
('blox_city', 'Reserved brand name'),
('support', 'Reserved system name'),
('system', 'Reserved system name'),
('official', 'Reserved system name');