-- =============================================================================
-- Migration: Update Recipe Functions for Additional Metadata Fields
-- Description: Updates create_recipe_with_version function to support:
--              - cooking_method (enum)
--              - dietary_categories (array)
--              - dish_category (enum)
-- Author: Claude Code
-- Date: 2026-02-03
-- =============================================================================

-- =============================================================================
-- DROP OLD FUNCTION SIGNATURE
-- =============================================================================

-- Drop existing version of create_recipe_with_version
DROP FUNCTION IF EXISTS public.create_recipe_with_version(
  UUID, TEXT, TEXT, JSONB, JSONB, INT, INT, INT, TEXT, UUID,
  cuisine_type, meal_type, TEXT[], INT, recipe_status
);

-- =============================================================================
-- FUNCTION: Create Recipe with Initial Version (with new metadata fields)
-- =============================================================================

CREATE FUNCTION public.create_recipe_with_version(
  p_household_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_ingredients_json JSONB,
  p_steps_json JSONB,
  p_servings INT,
  p_prep_time_minutes INT,
  p_cook_time_minutes INT,
  p_notes TEXT,
  p_user_id UUID,
  -- Existing metadata parameters
  p_cuisine cuisine_type DEFAULT NULL,
  p_meal_type meal_type DEFAULT NULL,
  p_key_ingredients TEXT[] DEFAULT NULL,
  p_priority INT DEFAULT NULL,
  p_status recipe_status DEFAULT 'suggested',
  -- NEW metadata parameters
  p_cooking_method cooking_method DEFAULT NULL,
  p_dietary_categories dietary_category[] DEFAULT NULL,
  p_dish_category dish_category DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_recipe_id UUID;
  v_version_id UUID;
BEGIN
  -- Generate UUIDs
  v_recipe_id := gen_random_uuid();
  v_version_id := gen_random_uuid();

  -- Insert recipe with all metadata fields
  INSERT INTO public.recipes (
    id,
    household_id,
    title,
    description,
    current_version_id,
    created_by,
    created_at,
    updated_at,
    -- Existing metadata fields
    cuisine,
    meal_type,
    key_ingredients,
    priority,
    status,
    -- NEW metadata fields
    cooking_method,
    dietary_categories,
    dish_category
  ) VALUES (
    v_recipe_id,
    p_household_id,
    p_title,
    p_description,
    v_version_id,
    p_user_id,
    NOW(),
    NOW(),
    p_cuisine,
    p_meal_type,
    p_key_ingredients,
    p_priority,
    p_status,
    p_cooking_method,
    p_dietary_categories,
    p_dish_category
  );

  -- Insert initial version (version 1)
  INSERT INTO public.recipe_versions (
    id,
    recipe_id,
    version_number,
    ingredients_json,
    steps_json,
    servings,
    prep_time_minutes,
    cook_time_minutes,
    notes,
    created_by,
    created_at
  ) VALUES (
    v_version_id,
    v_recipe_id,
    1,
    p_ingredients_json,
    p_steps_json,
    p_servings,
    p_prep_time_minutes,
    p_cook_time_minutes,
    p_notes,
    p_user_id,
    NOW()
  );

  RETURN v_recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION public.create_recipe_with_version IS
  'Creates a recipe with its initial version atomically, including all metadata fields (cuisine, meal_type, cooking_method, dietary_categories, dish_category, etc.)';

-- =============================================================================
-- End of migration
-- =============================================================================
