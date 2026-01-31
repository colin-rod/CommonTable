-- =============================================================================
-- Migration: Add Recipe Metadata Fields (FIXED)
-- Description: Adds cuisine, meal_type, key_ingredients, and priority fields
--              to recipes table for enhanced categorization and discovery
-- Author: Claude Code
-- Date: 2026-01-30
-- =============================================================================

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Create cuisine_type enum with 30 cuisine options
DO $$ BEGIN
  CREATE TYPE cuisine_type AS ENUM (
    'african',
    'american',
    'asian',
    'brazilian',
    'breakfast',
    'chinese',
    'dessert',
    'french',
    'german',
    'greek',
    'hungarian',
    'indian',
    'italian',
    'japanese',
    'korean',
    'mediterranean',
    'mexican',
    'middle_eastern',
    'pastry',
    'persian',
    'peruvian',
    'salad',
    'sauce',
    'seafood',
    'spanish',
    'staple',
    'thai',
    'vegetable',
    'vietnamese'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create meal_type enum with 6 meal categories
DO $$ BEGIN
  CREATE TYPE meal_type AS ENUM (
    'main_dish',
    'side_dish',
    'breakfast',
    'dessert',
    'snack',
    'beverage'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- ADD COLUMNS TO RECIPES TABLE
-- =============================================================================

-- Add cuisine column (optional categorization)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'cuisine'
  ) THEN
    ALTER TABLE public.recipes ADD COLUMN cuisine cuisine_type;
  END IF;
END $$;

-- Add meal_type column (optional categorization)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'meal_type'
  ) THEN
    ALTER TABLE public.recipes ADD COLUMN meal_type meal_type;
  END IF;
END $$;

-- Add key_ingredients column (TEXT array for ingredient-based filtering)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'key_ingredients'
  ) THEN
    ALTER TABLE public.recipes ADD COLUMN key_ingredients TEXT[];
  END IF;
END $$;

-- Add priority column (1-5 scale for meal planning priority)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.recipes ADD COLUMN priority INT CHECK (priority BETWEEN 1 AND 5);
  END IF;
END $$;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for filtering by cuisine
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine
  ON public.recipes(household_id, cuisine)
  WHERE cuisine IS NOT NULL;

-- Index for filtering by meal_type
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type
  ON public.recipes(household_id, meal_type)
  WHERE meal_type IS NOT NULL;

-- Index for filtering by priority
CREATE INDEX IF NOT EXISTS idx_recipes_priority
  ON public.recipes(household_id, priority)
  WHERE priority IS NOT NULL;

-- GIN index for key_ingredients array searching
CREATE INDEX IF NOT EXISTS idx_recipes_key_ingredients
  ON public.recipes USING GIN(key_ingredients)
  WHERE key_ingredients IS NOT NULL AND array_length(key_ingredients, 1) > 0;

-- =============================================================================
-- UPDATE FULL-TEXT SEARCH VECTOR (CONDITIONAL - ONLY IF COLUMNS EXIST)
-- =============================================================================

-- Update the search vector trigger to include new metadata fields
-- This version conditionally checks for tags and search_vector columns
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
    -- D (lowest): cuisine
    IF v_has_tags THEN
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.key_ingredients, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.cuisine::text, '')), 'D');
    ELSE
      -- Without tags column
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(NEW.key_ingredients, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.cuisine::text, '')), 'D');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if search_vector column exists
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
    DROP TRIGGER IF EXISTS recipes_search_vector_update ON public.recipes;

    -- Build the trigger columns list based on what exists
    IF v_has_tags THEN
      v_trigger_columns := 'title, description, tags, key_ingredients, cuisine';
    ELSE
      v_trigger_columns := 'title, description, key_ingredients, cuisine';
    END IF;

    -- Create trigger with appropriate columns
    EXECUTE format('
      CREATE TRIGGER recipes_search_vector_update
        BEFORE INSERT OR UPDATE OF %s
        ON public.recipes
        FOR EACH ROW
        EXECUTE FUNCTION update_recipe_search_vector()
    ', v_trigger_columns);
  END IF;
END $$;

-- =============================================================================
-- UPDATE EXISTING RECIPES' SEARCH VECTORS (CONDITIONAL)
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

  IF v_has_search_vector THEN
    IF v_has_tags THEN
      -- With tags column
      UPDATE public.recipes
      SET search_vector =
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(array_to_string(key_ingredients, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(cuisine::text, '')), 'D')
      WHERE search_vector IS NULL OR search_vector = ''::tsvector;
    ELSE
      -- Without tags column
      UPDATE public.recipes
      SET search_vector =
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(key_ingredients, ' '), '')), 'C') ||
        setweight(to_tsvector('english', coalesce(cuisine::text, '')), 'D')
      WHERE search_vector IS NULL OR search_vector = ''::tsvector;
    END IF;
  END IF;
END $$;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN public.recipes.cuisine IS
  'Optional cuisine/category classification (30 options: african, american, asian, brazilian, etc.)';

COMMENT ON COLUMN public.recipes.meal_type IS
  'Optional meal type classification (6 options: main_dish, side_dish, breakfast, dessert, snack, beverage)';

COMMENT ON COLUMN public.recipes.key_ingredients IS
  'Array of key ingredient names for filtering and discovery (e.g., [''chicken'', ''tomato'', ''basil''])';

COMMENT ON COLUMN public.recipes.priority IS
  'Optional priority level (1-5 scale) for meal planning and recipe organization';
