-- =============================================================================
-- Migration: Add Cooking Method and Dietary Category Fields to Recipes
-- Description: Adds cooking_method, dietary_categories, and dish_category fields
--              to recipes table for enhanced queue lane organization
--              These fields enable the queue system to group recipes by:
--              - Cooking Method (quick, slow_cook, bake, grill, etc.)
--              - Dietary Categories (vegetarian, vegan, gluten_free, etc.)
--              - Dish Category (main, side, appetizer, etc.)
-- Author: Claude Code
-- Date: 2026-02-03
-- =============================================================================

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Create cooking_method enum (for "Cooking Method" lane type)
DO $$ BEGIN
  CREATE TYPE cooking_method AS ENUM (
    'quick',          -- < 30 min
    'slow_cook',      -- Slow cooker / crock pot
    'instant_pot',    -- Pressure cooker
    'bake',           -- Oven baking
    'grill',          -- Grilling / BBQ
    'stovetop',       -- Stovetop cooking
    'air_fryer',      -- Air fryer
    'no_cook'         -- No cooking required
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create dietary_category enum (for "Dietary" lane type)
DO $$ BEGIN
  CREATE TYPE dietary_category AS ENUM (
    'vegetarian',
    'vegan',
    'gluten_free',
    'dairy_free',
    'keto',
    'paleo',
    'low_carb',
    'low_fat',
    'high_protein',
    'pescatarian'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create dish_category enum (for "Main/Side" lane type)
DO $$ BEGIN
  CREATE TYPE dish_category AS ENUM (
    'main',
    'side',
    'appetizer',
    'soup',
    'salad',
    'bread',
    'condiment'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- ADD COLUMNS TO RECIPES TABLE
-- =============================================================================

-- Add cooking_method column (optional, single value)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'cooking_method'
  ) THEN
    ALTER TABLE recipes ADD COLUMN cooking_method cooking_method;
  END IF;
END $$;

-- Add dietary_categories column (optional, array of values)
-- Recipes can have multiple dietary categories (e.g., vegetarian AND gluten_free)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'dietary_categories'
  ) THEN
    ALTER TABLE recipes ADD COLUMN dietary_categories dietary_category[];
  END IF;
END $$;

-- Add dish_category column (optional, single value)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'dish_category'
  ) THEN
    ALTER TABLE recipes ADD COLUMN dish_category dish_category;
  END IF;
END $$;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for filtering by cooking_method within household
CREATE INDEX IF NOT EXISTS idx_recipes_cooking_method
  ON recipes(household_id, cooking_method)
  WHERE cooking_method IS NOT NULL;

-- GIN index for dietary_categories array searching
-- Allows efficient queries like: WHERE 'vegetarian' = ANY(dietary_categories)
CREATE INDEX IF NOT EXISTS idx_recipes_dietary_categories
  ON recipes USING GIN(dietary_categories)
  WHERE dietary_categories IS NOT NULL AND array_length(dietary_categories, 1) > 0;

-- Index for filtering by dish_category within household
CREATE INDEX IF NOT EXISTS idx_recipes_dish_category
  ON recipes(household_id, dish_category)
  WHERE dish_category IS NOT NULL;

-- =============================================================================
-- UPDATE FULL-TEXT SEARCH VECTOR
-- =============================================================================

-- Update the search vector trigger to include new metadata fields
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
    -- C: tags (if exists), key_ingredients, dietary_categories
    -- D (lowest): cuisine, cooking_method, dish_category
    IF v_has_tags THEN
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.key_ingredients, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.dietary_categories::text[], ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.cuisine::text, '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.cooking_method::text, '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.dish_category::text, '')), 'D');
    ELSE
      -- Without tags column
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.key_ingredients, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.dietary_categories::text[], ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.cuisine::text, '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.cooking_method::text, '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.dish_category::text, '')), 'D');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create/update trigger if search_vector column exists
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

  IF v_has_search_vector THEN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS recipes_search_vector_update ON recipes;

    -- Build the trigger columns list based on what exists
    IF v_has_tags THEN
      v_trigger_columns := 'title, description, tags, key_ingredients, cuisine, cooking_method, dietary_categories, dish_category';
    ELSE
      v_trigger_columns := 'title, description, key_ingredients, cuisine, cooking_method, dietary_categories, dish_category';
    END IF;

    -- Create trigger with appropriate columns
    EXECUTE format('
      CREATE TRIGGER recipes_search_vector_update
        BEFORE INSERT OR UPDATE OF %s
        ON recipes
        FOR EACH ROW
        EXECUTE FUNCTION update_recipe_search_vector()
    ', v_trigger_columns);
  END IF;
END $$;

-- =============================================================================
-- BACKFILL EXISTING RECIPES' SEARCH VECTORS
-- =============================================================================

-- Backfill search vectors for existing recipes (only if search_vector column exists)
DO $$
DECLARE
  v_has_tags BOOLEAN;
  v_has_search_vector BOOLEAN;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'tags'
  ) INTO v_has_tags;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'search_vector'
  ) INTO v_has_search_vector;

  -- Only backfill if search_vector column exists
  IF v_has_search_vector THEN
    -- Trigger updated_at to regenerate search vectors
    UPDATE recipes SET updated_at = NOW() WHERE id IS NOT NULL;
  END IF;
END $$;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN recipes.cooking_method IS
  'Primary cooking method (quick, slow_cook, bake, grill, stovetop, air_fryer, instant_pot, no_cook)';

COMMENT ON COLUMN recipes.dietary_categories IS
  'Array of dietary categories (vegetarian, vegan, gluten_free, dairy_free, keto, paleo, low_carb, low_fat, high_protein, pescatarian)';

COMMENT ON COLUMN recipes.dish_category IS
  'Dish category (main, side, appetizer, soup, salad, bread, condiment)';

COMMENT ON TYPE cooking_method IS
  'Cooking method categories for queue lane organization';

COMMENT ON TYPE dietary_category IS
  'Dietary restriction categories for queue lane organization';

COMMENT ON TYPE dish_category IS
  'Dish type categories for queue lane organization';

-- =============================================================================
-- End of migration
-- =============================================================================
