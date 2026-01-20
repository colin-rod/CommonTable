-- Migration: Add tags to full-text search vector
-- Description: Updates search_vector to include tag names from current version
-- Issue: 4.2 - Full-text search (Postgres tsvector + trigger)
-- Weight hierarchy: Title (A) > Description (B) > Ingredients (C) > Tags (D)

-- Step 1: Update the main search vector function to include tags
CREATE OR REPLACE FUNCTION update_recipe_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title TEXT;
  v_description TEXT;
  v_ingredients TEXT;
  v_tags TEXT;
  v_current_version_id UUID;
BEGIN
  -- Get recipe title and description
  v_title := COALESCE(NEW.title, '');
  v_description := COALESCE(NEW.description, '');

  -- Get current version ID (if exists)
  v_current_version_id := NEW.current_version_id;

  -- Extract ingredient names from current version's ingredients_json
  v_ingredients := '';
  v_tags := '';

  IF v_current_version_id IS NOT NULL THEN
    -- Get ingredients from current version
    SELECT COALESCE(
      string_agg(
        COALESCE(ingredient->>'name', ''),
        ' '
      ),
      ''
    )
    INTO v_ingredients
    FROM recipe_versions rv,
         jsonb_array_elements(rv.ingredients_json) AS ingredient
    WHERE rv.id = v_current_version_id;

    -- Get tag names from current version via normalized tags tables
    SELECT COALESCE(
      string_agg(t.name, ' '),
      ''
    )
    INTO v_tags
    FROM recipe_version_tags rvt
    JOIN tags t ON t.id = rvt.tag_id
    WHERE rvt.recipe_version_id = v_current_version_id;
  END IF;

  -- Build search vector with weighted text
  -- Weight A (highest): title
  -- Weight B: description
  -- Weight C: ingredients
  -- Weight D (lowest): tags
  NEW.search_vector :=
    setweight(to_tsvector('english', v_title), 'A') ||
    setweight(to_tsvector('english', v_description), 'B') ||
    setweight(to_tsvector('english', COALESCE(v_ingredients, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(v_tags, '')), 'D');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_recipe_search_vector() IS 'Trigger function that rebuilds search_vector from title, description, ingredients, and tags (current version only)';

-- Step 2: Update the version change function to include tags
CREATE OR REPLACE FUNCTION update_recipe_search_on_version_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipe_id UUID;
  v_title TEXT;
  v_description TEXT;
  v_ingredients TEXT;
  v_tags TEXT;
BEGIN
  v_recipe_id := NEW.recipe_id;

  -- Get recipe metadata
  SELECT r.title, r.description
  INTO v_title, v_description
  FROM recipes r
  WHERE r.id = v_recipe_id;

  -- Get ingredients from this version
  SELECT COALESCE(
    string_agg(COALESCE(ingredient->>'name', ''), ' '),
    ''
  )
  INTO v_ingredients
  FROM jsonb_array_elements(NEW.ingredients_json) AS ingredient;

  -- Get tags from this version
  SELECT COALESCE(
    string_agg(t.name, ' '),
    ''
  )
  INTO v_tags
  FROM recipe_version_tags rvt
  JOIN tags t ON t.id = rvt.tag_id
  WHERE rvt.recipe_version_id = NEW.id;

  -- Update the parent recipe's search vector
  UPDATE recipes
  SET search_vector = (
    setweight(to_tsvector('english', COALESCE(v_title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(v_description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(v_ingredients, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(v_tags, '')), 'D')
  )
  WHERE id = v_recipe_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_recipe_search_on_version_change() IS 'Updates parent recipe search_vector when recipe_versions are modified, including tags';

-- Step 3: Create function to update search vector when tags change
CREATE OR REPLACE FUNCTION update_recipe_search_on_tag_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipe_id UUID;
  v_version_id UUID;
BEGIN
  -- Get the version ID from the affected row
  v_version_id := COALESCE(NEW.recipe_version_id, OLD.recipe_version_id);

  -- Get the recipe ID from the version
  SELECT recipe_id INTO v_recipe_id
  FROM recipe_versions
  WHERE id = v_version_id;

  -- Only update if this is the current version
  -- (to avoid updating search for historical versions)
  IF EXISTS (
    SELECT 1 FROM recipes
    WHERE id = v_recipe_id
      AND current_version_id = v_version_id
  ) THEN
    -- Touch the recipe to trigger search_vector rebuild
    UPDATE recipes
    SET updated_at = NOW()
    WHERE id = v_recipe_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION update_recipe_search_on_tag_change() IS 'Updates parent recipe search_vector when tags are added/removed from current version';

-- Step 4: Create trigger on recipe_version_tags table
DROP TRIGGER IF EXISTS trigger_update_recipe_search_on_tag_change ON recipe_version_tags;

CREATE TRIGGER trigger_update_recipe_search_on_tag_change
  AFTER INSERT OR UPDATE OR DELETE
  ON recipe_version_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_search_on_tag_change();

COMMENT ON TRIGGER trigger_update_recipe_search_on_tag_change ON recipe_version_tags IS 'Updates parent recipe search_vector when tags are modified on current version';

-- Step 5: Backfill existing recipes to include tags in search_vector
-- This will trigger the updated function for all existing recipes
UPDATE recipes
SET updated_at = NOW()
WHERE search_vector IS NOT NULL;
