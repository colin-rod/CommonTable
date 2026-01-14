-- Migration: Database Functions and Triggers
-- Business logic functions and automated triggers for CommonTable

-- =============================================================================
-- FUNCTION: Create Recipe with Initial Version (Atomic Transaction)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_recipe_with_version(
  p_household_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_ingredients_json JSONB,
  p_steps_json JSONB,
  p_servings INT,
  p_prep_time_minutes INT,
  p_cook_time_minutes INT,
  p_notes TEXT,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_recipe_id UUID;
  v_version_id UUID;
BEGIN
  -- Generate UUIDs
  v_recipe_id := gen_random_uuid();
  v_version_id := gen_random_uuid();

  -- Insert recipe
  INSERT INTO public.recipes (
    id,
    household_id,
    title,
    description,
    current_version_id,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    v_recipe_id,
    p_household_id,
    p_title,
    p_description,
    v_version_id,
    p_user_id,
    NOW(),
    NOW()
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

COMMENT ON FUNCTION public.create_recipe_with_version IS 'Creates a recipe with its initial version atomically (version 1)';

-- =============================================================================
-- FUNCTION: Update Recipe (Creates New Version)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_recipe_create_version(
  p_recipe_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_ingredients_json JSONB,
  p_steps_json JSONB,
  p_servings INT,
  p_prep_time_minutes INT,
  p_cook_time_minutes INT,
  p_notes TEXT,
  p_user_id UUID
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

  -- Update recipe to point to new current version
  UPDATE public.recipes
  SET
    title = p_title,
    description = p_description,
    current_version_id = v_version_id,
    updated_at = NOW()
  WHERE id = p_recipe_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_recipe_create_version IS 'Updates a recipe by creating a new version (every edit = new version)';

-- =============================================================================
-- FUNCTION: Fork Recipe (Create Copy in Same Household)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fork_recipe(
  p_parent_recipe_id UUID,
  p_new_title TEXT,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_parent_recipe RECORD;
  v_parent_version RECORD;
  v_new_recipe_id UUID;
  v_household_id UUID;
BEGIN
  -- Get parent recipe details
  SELECT * INTO v_parent_recipe
  FROM public.recipes
  WHERE id = p_parent_recipe_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent recipe not found: %', p_parent_recipe_id;
  END IF;

  -- Get current version of parent recipe
  SELECT * INTO v_parent_version
  FROM public.recipe_versions
  WHERE id = v_parent_recipe.current_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parent recipe version not found: %', v_parent_recipe.current_version_id;
  END IF;

  -- Use parent's household
  v_household_id := v_parent_recipe.household_id;

  -- Create new recipe with parent's version data
  v_new_recipe_id := public.create_recipe_with_version(
    v_household_id,
    p_new_title,
    v_parent_recipe.description,
    v_parent_version.ingredients_json,
    v_parent_version.steps_json,
    v_parent_version.servings,
    v_parent_version.prep_time_minutes,
    v_parent_version.cook_time_minutes,
    v_parent_version.notes,
    p_user_id
  );

  -- Record fork relationship
  INSERT INTO public.recipe_forks (
    parent_recipe_id,
    child_recipe_id,
    forked_by,
    forked_at
  ) VALUES (
    p_parent_recipe_id,
    v_new_recipe_id,
    p_user_id,
    NOW()
  );

  RETURN v_new_recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.fork_recipe IS 'Creates a copy (fork) of a recipe with lineage tracking';

-- =============================================================================
-- TRIGGER: Update recipe.last_cooked_at when cooking event is created
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_recipe_last_cooked()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.recipes
  SET last_cooked_at = NEW.cooked_at
  WHERE id = NEW.recipe_id
    AND (last_cooked_at IS NULL OR last_cooked_at < NEW.cooked_at);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_last_cooked
  AFTER INSERT ON public.cooking_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_recipe_last_cooked();

COMMENT ON FUNCTION public.update_recipe_last_cooked IS 'Trigger function: Updates recipe.last_cooked_at when a cooking event is created';

-- =============================================================================
-- FUNCTION: Get Recipe Version History
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_recipe_version_history(p_recipe_id UUID)
RETURNS TABLE (
  version_id UUID,
  version_number INT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rv.id AS version_id,
    rv.version_number,
    rv.created_by,
    rv.created_at,
    (rv.id = r.current_version_id) AS is_current
  FROM public.recipe_versions rv
  JOIN public.recipes r ON r.id = rv.recipe_id
  WHERE rv.recipe_id = p_recipe_id
  ORDER BY rv.version_number DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_recipe_version_history IS 'Returns version history for a recipe with current version indicator';

-- =============================================================================
-- FUNCTION: Get Household Recipe Stats
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_household_recipe_stats(p_household_id UUID)
RETURNS TABLE (
  total_recipes BIGINT,
  total_cooking_events BIGINT,
  recipes_cooked_last_7_days BIGINT,
  avg_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.recipes WHERE household_id = p_household_id) AS total_recipes,
    (SELECT COUNT(*) FROM public.cooking_events WHERE household_id = p_household_id) AS total_cooking_events,
    (SELECT COUNT(DISTINCT recipe_id)
     FROM public.cooking_events
     WHERE household_id = p_household_id
       AND cooked_at >= NOW() - INTERVAL '7 days') AS recipes_cooked_last_7_days,
    (SELECT ROUND(AVG(rating), 2)
     FROM public.cooking_events
     WHERE household_id = p_household_id
       AND rating IS NOT NULL) AS avg_rating;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_household_recipe_stats IS 'Returns aggregate statistics for a household';
