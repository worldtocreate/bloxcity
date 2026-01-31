-- Ensure storage policies exist for cover uploads
-- The forum-avatars bucket already exists, we just need to make sure policies are correct

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Anyone can view forum avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum-avatars');

CREATE POLICY "Authenticated users can upload to forum avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'forum-avatars');

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'forum-avatars' AND (storage.foldername(name))[1] IN ('avatars', 'covers'));

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'forum-avatars' AND (storage.foldername(name))[1] IN ('avatars', 'covers'));