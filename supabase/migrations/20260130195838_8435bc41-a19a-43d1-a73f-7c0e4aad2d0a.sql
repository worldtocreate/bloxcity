-- Add status column to track reservation review status
ALTER TABLE public.reserved_usernames 
ADD COLUMN status text NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'denied'));

-- Add denial reason column
ALTER TABLE public.reserved_usernames 
ADD COLUMN denial_reason text;

-- Create index for status lookups
CREATE INDEX idx_reserved_usernames_status ON public.reserved_usernames(status);

-- Update existing reservations to approved (they were already accepted)
UPDATE public.reserved_usernames SET status = 'approved' WHERE status = 'pending';