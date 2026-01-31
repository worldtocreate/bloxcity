-- Create a function to auto-award Administrator achievement when admin role is granted
CREATE OR REPLACE FUNCTION public.auto_award_admin_achievement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement_id uuid;
  v_forum_user_id uuid;
BEGIN
  -- Only proceed if the role is 'admin'
  IF NEW.role != 'admin' THEN
    RETURN NEW;
  END IF;

  -- Get the Administrator achievement ID
  SELECT id INTO v_achievement_id
  FROM forum_achievements
  WHERE name = 'Administrator';

  -- If achievement doesn't exist, skip
  IF v_achievement_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the forum user id for this user
  SELECT id INTO v_forum_user_id
  FROM forum_users
  WHERE user_id = NEW.user_id;

  -- If forum user doesn't exist, skip
  IF v_forum_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Award the achievement (ignore if already awarded)
  INSERT INTO forum_user_achievements (forum_user_id, achievement_id)
  VALUES (v_forum_user_id, v_achievement_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_admin_role_granted ON user_roles;
CREATE TRIGGER on_admin_role_granted
  AFTER INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_admin_achievement();