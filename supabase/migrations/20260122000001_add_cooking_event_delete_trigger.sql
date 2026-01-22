-- Migration: Add trigger to recalculate rolling_score on DELETE
-- This ensures rolling_score stays accurate when cooking events are deleted

-- Update existing trigger to handle DELETE operations
DROP TRIGGER IF EXISTS trigger_update_rolling_score ON cooking_events;

CREATE TRIGGER trigger_update_rolling_score
  AFTER INSERT OR DELETE ON cooking_events
  FOR EACH ROW
  EXECUTE FUNCTION update_rolling_score_after_cooking_event();

-- Update trigger function to handle both INSERT and DELETE
CREATE OR REPLACE FUNCTION update_rolling_score_after_cooking_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For INSERT, use NEW.recipe_id
  -- For DELETE, use OLD.recipe_id
  IF TG_OP = 'INSERT' THEN
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

COMMENT ON FUNCTION update_rolling_score_after_cooking_event() IS 'Trigger function: Updates recipes.rolling_score after INSERT or DELETE of cooking_events';
