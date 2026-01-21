-- Migration: Deprecate recipes.tags column
-- Description: Remove legacy tags column after full migration to normalized schema
-- This migration drops the old recipes.tags TEXT[] column and related infrastructure
-- after verifying data consistency with the normalized tags schema

-- ============================================================================
-- Data Consistency Verification
-- ============================================================================

-- Step 1: Verify data consistency between old and new schemas
-- This query checks if any recipes have inconsistent tags between:
-- - recipes.tags (legacy TEXT[] column)
-- - normalized tables (tags + recipe_version_tags)
DO $$
DECLARE
  v_inconsistent_count INTEGER;
  v_sample_recipe RECORD;
BEGIN
  -- Count recipes with tag mismatches
  SELECT COUNT(*) INTO v_inconsistent_count
  FROM public.recipes r
  WHERE r.current_version_id IS NOT NULL
    AND EXISTS (
      -- Check if tags arrays differ
      SELECT 1
      FROM (
        -- Get tags from normalized tables
        SELECT ARRAY(
          SELECT t.name
          FROM public.recipe_version_tags rvt
          JOIN public.tags t ON t.id = rvt.tag_id
          WHERE rvt.recipe_version_id = r.current_version_id
          ORDER BY t.name
        ) AS normalized_tags
      ) n
      WHERE n.normalized_tags != COALESCE(r.tags, '{}'::TEXT[])
    );

  IF v_inconsistent_count > 0 THEN
    -- Log sample inconsistent recipe for debugging
    SELECT
      r.id,
      r.title,
      r.tags AS legacy_tags,
      ARRAY(
        SELECT t.name
        FROM public.recipe_version_tags rvt
        JOIN public.tags t ON t.id = rvt.tag_id
        WHERE rvt.recipe_version_id = r.current_version_id
        ORDER BY t.name
      ) AS normalized_tags
    INTO v_sample_recipe
    FROM public.recipes r
    WHERE r.current_version_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM (
          SELECT ARRAY(
            SELECT t.name
            FROM public.recipe_version_tags rvt
            JOIN public.tags t ON t.id = rvt.tag_id
            WHERE rvt.recipe_version_id = r.current_version_id
            ORDER BY t.name
          ) AS normalized_tags
        ) n
        WHERE n.normalized_tags != COALESCE(r.tags, '{}'::TEXT[])
      )
    LIMIT 1;

    RAISE EXCEPTION 'Found % recipes with inconsistent tags. Migration aborted. Sample: recipe_id=%, legacy_tags=%, normalized_tags=%',
      v_inconsistent_count,
      v_sample_recipe.id,
      v_sample_recipe.legacy_tags,
      v_sample_recipe.normalized_tags;
  END IF;

  RAISE NOTICE 'Data consistency verified: All recipes have matching tags in legacy and normalized schemas';
END $$;

-- ============================================================================
-- Drop Legacy Infrastructure
-- ============================================================================

DO $$
BEGIN
  -- Step 2: Drop GIN index for tag queries
  DROP INDEX IF EXISTS public.idx_recipes_tags;
  RAISE NOTICE 'Dropped index: idx_recipes_tags';

  -- Step 3: Drop normalize_tags trigger
  DROP TRIGGER IF EXISTS trigger_normalize_tags ON public.recipes;
  RAISE NOTICE 'Dropped trigger: trigger_normalize_tags';

  -- Step 4: Drop normalize_tags function
  DROP FUNCTION IF EXISTS public.normalize_tags();
  RAISE NOTICE 'Dropped function: normalize_tags()';

  -- Step 5: Drop old get_household_tags function (already replaced in 20260120000001)
  -- This is a no-op since the function was already recreated with a new signature
  -- But we include it for completeness
  -- Note: The new function signature is (UUID) RETURNS TABLE (tag_name TEXT, usage_count BIGINT)
  RAISE NOTICE 'Skipped: get_household_tags already updated in 20260120000001';

  -- Step 6: Drop recipes.tags column
  ALTER TABLE public.recipes DROP COLUMN IF EXISTS tags;
  RAISE NOTICE 'Dropped column: recipes.tags';
END $$;

-- ============================================================================
-- End of migration
-- ============================================================================

COMMENT ON TABLE public.recipes IS 'Recipes table (tags now managed via normalized tags schema)';
