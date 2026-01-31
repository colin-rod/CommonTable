-- =============================================================================
-- Migration: Update Recipe Functions for New Metadata Fields (FIXED)
-- Description: Updates create_recipe_with_version and related functions to
--              support cuisine, meal_type, key_ingredients, priority, status
-- Author: Claude Code
-- Date: 2026-01-30
-- =============================================================================

-- =============================================================================
-- DROP OLD FUNCTION SIGNATURES FIRST
-- =============================================================================

-- Drop all existing versions of create_recipe_with_version
-- PostgreSQL requires exact signature match, so we drop all possible versions
DROP FUNCTION IF EXISTS public.create_recipe_with_version(UUID, TEXT, TEXT, JSONB, JSONB, INT, INT, INT, TEXT, UUID);

-- Drop all existing versions of update_recipe_create_version
DROP FUNCTION IF EXISTS public.update_recipe_create_version(UUID, TEXT, TEXT, JSONB, JSONB, INT, INT, INT, TEXT, UUID);

-- =============================================================================
-- FUNCTION: Create Recipe with Initial Version (Updated with New Metadata)
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
  -- New metadata parameters (optional)
  p_cuisine cuisine_type DEFAULT NULL,
  p_meal_type meal_type DEFAULT NULL,
  p_key_ingredients TEXT[] DEFAULT NULL,
  p_priority INT DEFAULT NULL,
  p_status recipe_status DEFAULT 'suggested'
) RETURNS UUID AS $$
DECLARE
  v_recipe_id UUID;
  v_version_id UUID;
BEGIN
  -- Generate UUIDs
  v_recipe_id := gen_random_uuid();
  v_version_id := gen_random_uuid();

  -- Insert recipe with new metadata fields
  INSERT INTO public.recipes (
    id,
    household_id,
    title,
    description,
    current_version_id,
    created_by,
    created_at,
    updated_at,
    -- New metadata fields
    cuisine,
    meal_type,
    key_ingredients,
    priority,
    status
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
    p_status
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

COMMENT ON FUNCTION public.create_recipe_with_version IS
  'Creates a recipe with its initial version atomically (version 1). Supports new metadata fields: cuisine, meal_type, key_ingredients, priority, status';

-- =============================================================================
-- FUNCTION: Update Recipe (Creates New Version) - Updated
-- =============================================================================

CREATE FUNCTION public.update_recipe_create_version(
  p_recipe_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_ingredients_json JSONB,
  p_steps_json JSONB,
  p_servings INT,
  p_prep_time_minutes INT,
  p_cook_time_minutes INT,
  p_notes TEXT,
  p_user_id UUID,
  -- New metadata parameters (optional)
  p_cuisine cuisine_type DEFAULT NULL,
  p_meal_type meal_type DEFAULT NULL,
  p_key_ingredients TEXT[] DEFAULT NULL,
  p_priority INT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_version_id UUID;
  v_next_version_number INT;
BEGIN
  -- Get the next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version_number
  FROM public.recipe_versions
  WHERE recipe_id = p_recipe_id;

  -- Generate UUID for new version
  v_version_id := gen_random_uuid();

  -- Insert new version
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
    p_recipe_id,
    v_next_version_number,
    p_ingredients_json,
    p_steps_json,
    p_servings,
    p_prep_time_minutes,
    p_cook_time_minutes,
    p_notes,
    p_user_id,
    NOW()
  );

  -- Update recipe metadata and current_version_id
  UPDATE public.recipes
  SET
    title = p_title,
    description = p_description,
    current_version_id = v_version_id,
    updated_at = NOW(),
    -- Update new metadata fields if provided
    cuisine = COALESCE(p_cuisine, cuisine),
    meal_type = COALESCE(p_meal_type, meal_type),
    key_ingredients = COALESCE(p_key_ingredients, key_ingredients),
    priority = COALESCE(p_priority, priority)
  WHERE id = p_recipe_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_recipe_create_version IS
  'Updates a recipe by creating a new version (every edit = new version). Supports updating metadata fields: cuisine, meal_type, key_ingredients, priority';
