-- Add INSERT policy for profiles table so authenticated users can create their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add database-level validation for reserved_usernames table
-- Update the RLS INSERT policy to enforce basic validation
DROP POLICY IF EXISTS "Anyone can reserve a username" ON public.reserved_usernames;

CREATE POLICY "Anyone can reserve a username with validation"
ON public.reserved_usernames
FOR INSERT
WITH CHECK (
  -- Username must be 3-20 lowercase alphanumeric characters or underscores
  username ~ '^[a-z0-9_]{3,20}$'
  AND email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  AND reservation_code IS NOT NULL
  AND LENGTH(reservation_code) >= 8
);

-- Improve the handle_new_user trigger function with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate user_id is not null
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;
  
  -- Validate email format (basic check, allow null for some auth providers)
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'invalid email format';
  END IF;
  
  -- Insert with sanitized email (trim, lowercase)
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, LOWER(TRIM(COALESCE(NEW.email, ''))));
  
  RETURN NEW;
END;
$$;

-- Create a bootstrap function for first admin (can only create admin if none exist)
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if no admins exist
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'An admin already exists. Use the admin panel to manage roles.';
  END IF;
  
  -- Verify the user exists in profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'User not found. Please sign up first.';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin');
END;
$$;

-- Grant execute to authenticated users (they can only succeed if no admin exists)
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(uuid) TO authenticated;