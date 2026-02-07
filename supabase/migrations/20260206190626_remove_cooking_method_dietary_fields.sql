-- =============================================================================
-- Migration: Remove Cooking Method, Dietary Categories, and Dish Category Fields
-- Description: Removes cooking_method, dietary_categories, and dish_category
--              fields from recipes table to reduce friction in recipe entry
-- Author: Claude Code
-- Date: 2026-02-06
-- =============================================================================

-- =============================================================================
-- DROP INDEXES
-- =============================================================================

DROP INDEX IF EXISTS idx_recipes_cooking_method;
DROP INDEX IF EXISTS idx_recipes_dietary_categories;
DROP INDEX IF EXISTS idx_recipes_dish_category;

-- =============================================================================
-- DROP EXISTING TRIGGER (must drop before updating function)
-- =============================================================================

DROP TRIGGER IF EXISTS update_recipe_search_vector_trigger ON recipes;
DROP TRIGGER IF EXISTS recipes_search_vector_update ON recipes;

-- =============================================================================
-- UPDATE FULL-TEXT SEARCH VECTOR (Remove references to dropped fields)
-- =============================================================================

-- Update the search vector trigger to exclude removed metadata fields
CREATE OR REPLACE FUNCTION update_recipe_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  v_has_tags BOOLEAN;
  v_has_search_vector BOOLEAN;
BEGIN
  -- Check if tags column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'tags'
  ) INTO v_has_tags;

  -- Check if search_vector column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'search_vector'
  ) INTO v_has_search_vector;

  -- Only update search_vector if the column exists
  IF v_has_search_vector THEN
    -- Build search vector with weighted components:
    -- A (highest): title
    -- B: description
    -- C: tags (if exists), key_ingredients
    -- D (lowest): cuisine, meal_type
    IF v_has_tags THEN
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.key_ingredients, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.cuisine::text, '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.meal_type::text, '')), 'D');
    ELSE
      -- Without tags column
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.key_ingredients, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.cuisine::text, '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.meal_type::text, '')), 'D');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to exclude removed columns
DO $$
DECLARE
  v_has_search_vector BOOLEAN;
  v_has_tags BOOLEAN;
  v_trigger_columns TEXT;
BEGIN
  -- Check if search_vector column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'search_vector'
  ) INTO v_has_search_vector;

  -- Check if tags column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'tags'
  ) INTO v_has_tags;

  -- Only update trigger if search_vector exists
  IF v_has_search_vector THEN
    -- Drop existing trigger
    DROP TRIGGER IF EXISTS update_recipe_search_vector_trigger ON recipes;

    -- Build column list for trigger (exclude cooking_method, dietary_categories, dish_category)
    IF v_has_tags THEN
      v_trigger_columns := 'title, description, tags, cuisine, meal_type, key_ingredients';
    ELSE
      v_trigger_columns := 'title, description, cuisine, meal_type, key_ingredients';
    END IF;

    -- Create new trigger with updated column list
    EXECUTE format(
      'CREATE TRIGGER update_recipe_search_vector_trigger
       BEFORE INSERT OR UPDATE OF %s ON recipes
       FOR EACH ROW
       EXECUTE FUNCTION update_recipe_search_vector()',
      v_trigger_columns
    );
  END IF;
END $$;

-- =============================================================================
-- DROP COLUMNS FROM RECIPES TABLE
-- =============================================================================

-- Drop cooking_method column
ALTER TABLE recipes DROP COLUMN IF EXISTS cooking_method;

-- Drop dietary_categories column
ALTER TABLE recipes DROP COLUMN IF EXISTS dietary_categories;

-- Drop dish_category column
ALTER TABLE recipes DROP COLUMN IF EXISTS dish_category;

-- =============================================================================
-- DROP ENUM TYPES
-- =============================================================================

-- Drop enum types (no longer needed)
-- Note: DROP TYPE will fail if any other table references these types
DO $$ BEGIN
  DROP TYPE IF EXISTS cooking_method CASCADE;
  DROP TYPE IF EXISTS dietary_category CASCADE;
  DROP TYPE IF EXISTS dish_category CASCADE;
EXCEPTION
  WHEN dependent_objects_still_exist THEN
    RAISE NOTICE 'Cannot drop enum types - dependent objects still exist';
END $$;

-- =============================================================================
-- VERIFY CHANGES
-- =============================================================================

-- Verify columns have been dropped
DO $$
DECLARE
  v_cooking_method_exists BOOLEAN;
  v_dietary_categories_exists BOOLEAN;
  v_dish_category_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'cooking_method'
  ) INTO v_cooking_method_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'dietary_categories'
  ) INTO v_dietary_categories_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'dish_category'
  ) INTO v_dish_category_exists;

  IF v_cooking_method_exists THEN
    RAISE EXCEPTION 'cooking_method column still exists';
  END IF;

  IF v_dietary_categories_exists THEN
    RAISE EXCEPTION 'dietary_categories column still exists';
  END IF;

  IF v_dish_category_exists THEN
    RAISE EXCEPTION 'dish_category column still exists';
  END IF;

  RAISE NOTICE 'Successfully removed cooking_method, dietary_categories, and dish_category fields';
END $$;
