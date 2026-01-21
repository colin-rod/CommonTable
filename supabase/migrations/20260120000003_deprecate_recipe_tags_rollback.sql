-- Rollback Migration: Restore recipes.tags column
-- Description: Rollback script for 20260120000003_deprecate_recipe_tags.sql
-- This migration restores the legacy recipes.tags column and related infrastructure
-- Use this only if you need to rollback the deprecation

-- ============================================================================
-- Restore Legacy Column
-- ============================================================================

DO $$
BEGIN
  -- Step 1: Recreate recipes.tags column
  ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

  COMMENT ON COLUMN public.recipes.tags IS 'Array of tags for categorizing recipes (e.g., vegetarian, dessert, quick). Stored as lowercase for consistency. (RESTORED from rollback)';

  RAISE NOTICE 'Recreated column: recipes.tags';

  -- Step 2: Recreate GIN index for efficient tag queries
  CREATE INDEX IF NOT EXISTS idx_recipes_tags ON public.recipes USING GIN(tags);

  COMMENT ON INDEX idx_recipes_tags IS 'GIN index for fast tag filtering queries (e.g., WHERE ''vegetarian'' = ANY(tags)) (RESTORED from rollback)';

  RAISE NOTICE 'Recreated index: idx_recipes_tags';
END $$;

-- Step 3: Recreate normalize_tags function
CREATE OR REPLACE FUNCTION public.normalize_tags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize tags to lowercase and remove empty strings
  IF NEW.tags IS NOT NULL THEN
    NEW.tags := (
      SELECT ARRAY(
        SELECT DISTINCT lower(trim(tag))
        FROM unnest(NEW.tags) AS tag
        WHERE trim(tag) != ''
          AND length(trim(tag)) <= 20  -- Max 20 chars per tag
        ORDER BY lower(trim(tag))
      )
    );
  ELSE
    NEW.tags := '{}'::TEXT[];
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.normalize_tags() IS 'Trigger function that normalizes tags to lowercase, removes duplicates and empty strings, enforces max 20 chars per tag (RESTORED from rollback)';

-- Step 4: Recreate normalize_tags trigger
DROP TRIGGER IF EXISTS trigger_normalize_tags ON public.recipes;

CREATE TRIGGER trigger_normalize_tags
  BEFORE INSERT OR UPDATE OF tags
  ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_tags();

COMMENT ON TRIGGER trigger_normalize_tags ON public.recipes IS 'Normalizes tags to lowercase and removes invalid entries before insert/update (RESTORED from rollback)';

-- ============================================================================
-- Repopulate Data from Normalized Schema
-- ============================================================================

DO $$
BEGIN
  -- Step 5: Re-populate recipes.tags from normalized tables
  UPDATE public.recipes r
  SET tags = (
    SELECT ARRAY(
      SELECT t.name
      FROM public.recipe_version_tags rvt
      JOIN public.tags t ON t.id = rvt.tag_id
      WHERE rvt.recipe_version_id = r.current_version_id
      ORDER BY t.name
    )
  )
  WHERE r.current_version_id IS NOT NULL;

  RAISE NOTICE 'Repopulated recipes.tags from normalized schema';

  -- Step 6: Set empty array for recipes without tags
  UPDATE public.recipes
  SET tags = '{}'::TEXT[]
  WHERE tags IS NULL;

  RAISE NOTICE 'Set empty arrays for recipes without tags';
END $$;

-- ============================================================================
-- Verification
-- ============================================================================

-- Step 7: Verify rollback success
DO $$
DECLARE
  v_null_count INTEGER;
  v_total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count
  FROM public.recipes
  WHERE tags IS NULL;

  SELECT COUNT(*) INTO v_total_count
  FROM public.recipes;

  IF v_null_count > 0 THEN
    RAISE WARNING 'Found % recipes with NULL tags out of % total recipes', v_null_count, v_total_count;
  ELSE
    RAISE NOTICE 'Rollback verification: All % recipes have non-NULL tags arrays', v_total_count;
  END IF;
END $$;

-- ============================================================================
-- End of rollback migration
-- ============================================================================

COMMENT ON TABLE public.recipes IS 'Recipes table (legacy tags column restored via rollback)';
