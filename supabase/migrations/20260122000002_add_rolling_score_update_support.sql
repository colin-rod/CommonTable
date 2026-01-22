-- Migration: Add UPDATE support to rolling_score trigger
-- This ensures rolling_score recalculates when cooking event ratings are edited

-- Drop existing trigger (INSERT OR DELETE only)
DROP TRIGGER IF EXISTS trigger_update_rolling_score ON cooking_events;

-- Recreate trigger with UPDATE support
CREATE TRIGGER trigger_update_rolling_score
  AFTER INSERT OR UPDATE OR DELETE ON cooking_events
  FOR EACH ROW
  EXECUTE FUNCTION update_rolling_score_after_cooking_event();

-- Update function to handle UPDATE operations
CREATE OR REPLACE FUNCTION update_rolling_score_after_cooking_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes
    SET rolling_score = calculate_rolling_score(NEW.recipe_id)
    WHERE id = NEW.recipe_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Recalculate rolling_score when any column is updated
    -- This ensures score stays accurate when ratings are edited
    UPDATE recipes
    SET rolling_score = calculate_rolling_score(NEW.recipe_id)
    WHERE id = NEW.recipe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes
    SET rolling_score = calculate_rolling_score(OLD.recipe_id)
    WHERE id = OLD.recipe_id;
  END IF;

  RETURN NULL; -- Return value is ignored for AFTER triggers
END;
$$;

COMMENT ON FUNCTION update_rolling_score_after_cooking_event() IS 'Trigger function: Updates recipes.rolling_score after INSERT, UPDATE, or DELETE of cooking_events';
