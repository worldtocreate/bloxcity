-- Create newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribe_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public inserts with email validation
CREATE POLICY "Anyone can subscribe with valid email"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$');

-- Block direct select (use edge functions)
CREATE POLICY "Block direct SELECT access"
ON public.newsletter_subscribers
FOR SELECT
USING (false);

-- Block direct updates and deletes (use edge functions)
CREATE POLICY "Block direct UPDATE"
ON public.newsletter_subscribers
FOR UPDATE
USING (false);

CREATE POLICY "Block direct DELETE"
ON public.newsletter_subscribers
FOR DELETE
USING (false);