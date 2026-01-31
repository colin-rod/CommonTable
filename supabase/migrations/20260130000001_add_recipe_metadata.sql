-- =============================================================================
-- Migration: Add Recipe Metadata Fields
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
-- UPDATE FULL-TEXT SEARCH VECTOR
-- =============================================================================

-- Update the search vector trigger to include new metadata fields
CREATE OR REPLACE FUNCTION update_recipe_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Build search vector with weighted components:
  -- A (highest): title
  -- B: description
  -- C: tags, key_ingredients
  -- D (lowest): cuisine
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.key_ingredients, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.cuisine::text, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS recipes_search_vector_update ON public.recipes;

-- Recreate trigger
CREATE TRIGGER recipes_search_vector_update
  BEFORE INSERT OR UPDATE OF title, description, tags, key_ingredients, cuisine
  ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_search_vector();

-- =============================================================================
-- UPDATE EXISTING RECIPES' SEARCH VECTORS
-- =============================================================================

-- Backfill search vectors for existing recipes
UPDATE public.recipes
SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C') ||
  setweight(to_tsvector('english', coalesce(array_to_string(key_ingredients, ' '), '')), 'C') ||
  setweight(to_tsvector('english', coalesce(cuisine::text, '')), 'D')
WHERE search_vector IS NULL OR search_vector = '';

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
