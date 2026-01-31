-- Allow anyone to view admin and moderator roles (for staff page)
CREATE POLICY "Anyone can view staff roles"
ON public.user_roles
FOR SELECT
USING (role IN ('admin', 'moderator'));