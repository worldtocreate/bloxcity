-- Drop the existing INSERT policy that only allows self-joining
DROP POLICY IF EXISTS "Users can join groups" ON forum_group_members;

-- Create new INSERT policy that allows:
-- 1. Users to join groups themselves
-- 2. Group owners to add members (for accepting join requests)
CREATE POLICY "Users can join or owners can add members"
ON forum_group_members FOR INSERT
WITH CHECK (
  -- User is inserting themselves
  (forum_user_id IN (
    SELECT forum_users.id
    FROM forum_users
    WHERE forum_users.user_id = auth.uid()
  ))
  OR
  -- Group owner is adding a member
  (group_id IN (
    SELECT forum_groups.id
    FROM forum_groups
    WHERE forum_groups.owner_id IN (
      SELECT forum_users.id
      FROM forum_users
      WHERE forum_users.user_id = auth.uid()
    )
  ))
);