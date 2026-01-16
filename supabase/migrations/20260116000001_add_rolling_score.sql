-- Migration: Add rolling_score field to recipes table
-- Description: Adds a rolling_score column that stores the average rating from cooking_events
-- This enables tracking recipe quality based on user feedback over time

-- Step 1: Add rolling_score column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS rolling_score NUMERIC(3,2);

-- Add comment for documentation
COMMENT ON COLUMN recipes.rolling_score IS 'Average rating from cooking_events (0.00 to 5.00). NULL if no cooking events exist.';

-- Step 2: Create function to calculate rolling score from cooking events
CREATE OR REPLACE FUNCTION calculate_rolling_score(p_recipe_id UUID)
RETURNS NUMERIC(3,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_avg_rating NUMERIC(3,2);
BEGIN
  -- Calculate average rating from cooking_events for this recipe
  SELECT ROUND(AVG(rating)::NUMERIC, 2)
  INTO v_avg_rating
  FROM cooking_events
  WHERE recipe_id = p_recipe_id
    AND rating IS NOT NULL;

  -- Return NULL if no cooking events exist
  RETURN v_avg_rating;
END;
$$;

COMMENT ON FUNCTION calculate_rolling_score(UUID) IS 'Calculates the average rating from cooking_events for a given recipe. Returns NULL if no rated cooking events exist.';

-- Step 3: Create trigger function to update rolling_score after cooking event
CREATE OR REPLACE FUNCTION update_rolling_score_after_cooking_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the recipe's rolling_score whenever a cooking event is inserted
  UPDATE recipes
  SET rolling_score = calculate_rolling_score(NEW.recipe_id)
  WHERE id = NEW.recipe_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_rolling_score_after_cooking_event() IS 'Trigger function that updates recipes.rolling_score after a new cooking_event is inserted.';

-- Step 4: Create trigger on cooking_events table
DROP TRIGGER IF EXISTS trigger_update_rolling_score ON cooking_events;

CREATE TRIGGER trigger_update_rolling_score
  AFTER INSERT ON cooking_events
  FOR EACH ROW
  EXECUTE FUNCTION update_rolling_score_after_cooking_event();

COMMENT ON TRIGGER trigger_update_rolling_score ON cooking_events IS 'Updates recipes.rolling_score after each new cooking_event is inserted.';

-- Step 5: Backfill rolling_score for existing recipes
-- This is a one-time operation to populate rolling_score for all existing recipes
UPDATE recipes
SET rolling_score = calculate_rolling_score(id)
WHERE rolling_score IS NULL;
