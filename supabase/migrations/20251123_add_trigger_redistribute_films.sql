-- Migration: Add trigger to automatically redistribute films before user deletion
-- This ensures films are redistributed to sponsor or random users when a user is deleted
-- from anywhere (admin interface, API, or direct SQL)

-- Create trigger function that will be called before user deletion
CREATE OR REPLACE FUNCTION trigger_redistribute_films_before_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_films_count INTEGER;
BEGIN
  -- Call the redistribution function BEFORE the user is deleted
  -- This allows the function to access user data and redistribute films
  SELECT redistribute_user_films(OLD.id) INTO v_films_count;

  -- Log the redistribution for debugging
  RAISE NOTICE 'User % deletion: % films redistributed', OLD.id, COALESCE(v_films_count, 0);

  -- Continue with the deletion
  RETURN OLD;
END;
$$;

-- Create the BEFORE DELETE trigger on user_profiles
-- This trigger will fire before any user deletion, regardless of the source
CREATE TRIGGER before_delete_user_redistribute_films
  BEFORE DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_redistribute_films_before_user_deletion();

-- Add comment for documentation
COMMENT ON TRIGGER before_delete_user_redistribute_films ON user_profiles IS
'Automatically redistributes user films to sponsor or random users before deletion. This ensures no films are lost when users are deleted from the admin interface.';

COMMENT ON FUNCTION trigger_redistribute_films_before_user_deletion() IS
'Trigger function that calls redistribute_user_films() before a user is deleted. Returns OLD to allow deletion to proceed after redistribution.';
