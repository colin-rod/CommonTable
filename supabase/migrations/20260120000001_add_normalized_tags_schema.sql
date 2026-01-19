-- ============================================================================
-- Migration: Add Normalized Tags Schema
-- Description: Creates tags, recipe_version_tags, and ai_tag_suggestions tables
-- Issue: CRO-1013 / Issue 4.1
-- ============================================================================

-- Step 1: Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tags_name_length CHECK (LENGTH(name) <= 20 AND LENGTH(name) > 0)
);

-- Create unique index on (household_id, LOWER(name)) for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_household_name_unique ON public.tags(household_id, LOWER(name));
CREATE INDEX IF NOT EXISTS idx_tags_household ON public.tags(household_id);

-- Step 2: Create recipe_version_tags join table
CREATE TABLE IF NOT EXISTS public.recipe_version_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_version_id UUID NOT NULL REFERENCES public.recipe_versions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recipe_version_tags_unique UNIQUE (recipe_version_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_version_tags_version ON public.recipe_version_tags(recipe_version_id);
CREATE INDEX IF NOT EXISTS idx_recipe_version_tags_tag ON public.recipe_version_tags(tag_id);

-- Step 3: Create ai_tag_suggestions table
CREATE TABLE IF NOT EXISTS public.ai_tag_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_version_id UUID NOT NULL REFERENCES public.recipe_versions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  user_accepted BOOLEAN DEFAULT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_tag_suggestions_unique UNIQUE (recipe_version_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_tag_suggestions_version ON public.ai_tag_suggestions(recipe_version_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tag_suggestions_tag ON public.ai_tag_suggestions(tag_id);
CREATE INDEX IF NOT EXISTS idx_ai_tag_suggestions_pending ON public.ai_tag_suggestions(recipe_version_id) WHERE user_accepted IS NULL;

-- Step 4: Enable RLS on all tables
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_version_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tag_suggestions ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS policies for tags table
CREATE POLICY "Users can view household tags"
  ON public.tags FOR SELECT
  USING (household_id = public.get_user_household_id());

CREATE POLICY "Users can create household tags"
  ON public.tags FOR INSERT
  WITH CHECK (household_id = public.get_user_household_id());

CREATE POLICY "Users can update household tags"
  ON public.tags FOR UPDATE
  USING (household_id = public.get_user_household_id())
  WITH CHECK (household_id = public.get_user_household_id());

CREATE POLICY "Users can delete household tags"
  ON public.tags FOR DELETE
  USING (household_id = public.get_user_household_id());

-- Step 6: RLS policies for recipe_version_tags table
CREATE POLICY "Users can view household recipe version tags"
  ON public.recipe_version_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.recipe_versions rv
      JOIN public.recipes r ON r.id = rv.recipe_id
      WHERE rv.id = recipe_version_tags.recipe_version_id
        AND r.household_id = public.get_user_household_id()
    )
  );

CREATE POLICY "Users can create household recipe version tags"
  ON public.recipe_version_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.recipe_versions rv
      JOIN public.recipes r ON r.id = rv.recipe_id
      WHERE rv.id = recipe_version_tags.recipe_version_id
        AND r.household_id = public.get_user_household_id()
    )
    AND EXISTS (
      SELECT 1
      FROM public.tags t
      WHERE t.id = recipe_version_tags.tag_id
        AND t.household_id = public.get_user_household_id()
    )
  );

CREATE POLICY "Users can delete household recipe version tags"
  ON public.recipe_version_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.recipe_versions rv
      JOIN public.recipes r ON r.id = rv.recipe_id
      WHERE rv.id = recipe_version_tags.recipe_version_id
        AND r.household_id = public.get_user_household_id()
    )
  );

-- Step 7: RLS policies for ai_tag_suggestions table
CREATE POLICY "Users can view household ai tag suggestions"
  ON public.ai_tag_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.recipe_versions rv
      JOIN public.recipes r ON r.id = rv.recipe_id
      WHERE rv.id = ai_tag_suggestions.recipe_version_id
        AND r.household_id = public.get_user_household_id()
    )
  );

CREATE POLICY "System can create ai tag suggestions"
  ON public.ai_tag_suggestions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.recipe_versions rv
      JOIN public.recipes r ON r.id = rv.recipe_id
      WHERE rv.id = ai_tag_suggestions.recipe_version_id
        AND r.household_id = public.get_user_household_id()
    )
  );

CREATE POLICY "Users can update ai tag suggestions acceptance"
  ON public.ai_tag_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.recipe_versions rv
      JOIN public.recipes r ON r.id = rv.recipe_id
      WHERE rv.id = ai_tag_suggestions.recipe_version_id
        AND r.household_id = public.get_user_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.recipe_versions rv
      JOIN public.recipes r ON r.id = rv.recipe_id
      WHERE rv.id = ai_tag_suggestions.recipe_version_id
        AND r.household_id = public.get_user_household_id()
    )
  );

-- Step 8: Create trigger for tags.updated_at
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 9: Create helper function get_or_create_tag
CREATE OR REPLACE FUNCTION public.get_or_create_tag(
  p_household_id UUID,
  p_tag_name TEXT,
  p_created_by UUID
) RETURNS UUID AS $$
DECLARE
  v_tag_id UUID;
  v_normalized_name TEXT;
BEGIN
  v_normalized_name := LOWER(TRIM(p_tag_name));

  IF LENGTH(v_normalized_name) = 0 OR LENGTH(v_normalized_name) > 20 THEN
    RAISE EXCEPTION 'Tag name must be between 1 and 20 characters';
  END IF;

  SELECT id INTO v_tag_id
  FROM public.tags
  WHERE household_id = p_household_id
    AND LOWER(name) = v_normalized_name
  LIMIT 1;

  IF v_tag_id IS NULL THEN
    INSERT INTO public.tags (household_id, name, created_by)
    VALUES (p_household_id, v_normalized_name, p_created_by)
    RETURNING id INTO v_tag_id;
  END IF;

  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Update get_household_tags to use normalized tables
-- Drop existing function to allow signature change
DROP FUNCTION IF EXISTS public.get_household_tags(UUID);

CREATE OR REPLACE FUNCTION public.get_household_tags(p_household_id UUID)
RETURNS TABLE (tag_name TEXT, usage_count BIGINT) AS $$
  SELECT
    t.name AS tag_name,
    COUNT(DISTINCT rvt.recipe_version_id) AS usage_count
  FROM public.tags t
  LEFT JOIN public.recipe_version_tags rvt ON rvt.tag_id = t.id
  WHERE t.household_id = p_household_id
  GROUP BY t.id, t.name
  ORDER BY usage_count DESC, t.name ASC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Step 11: Create data migration function
CREATE OR REPLACE FUNCTION public.migrate_recipe_tags_to_normalized()
RETURNS void AS $$
DECLARE
  v_recipe RECORD;
  v_tag_name TEXT;
  v_tag_id UUID;
BEGIN
  FOR v_recipe IN
    SELECT id, household_id, current_version_id, tags, created_by
    FROM public.recipes
    WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  LOOP
    IF v_recipe.current_version_id IS NOT NULL THEN
      FOREACH v_tag_name IN ARRAY v_recipe.tags
      LOOP
        v_tag_id := public.get_or_create_tag(
          v_recipe.household_id,
          v_tag_name,
          v_recipe.created_by
        );

        INSERT INTO public.recipe_version_tags (recipe_version_id, tag_id, created_by)
        VALUES (v_recipe.current_version_id, v_tag_id, v_recipe.created_by)
        ON CONFLICT (recipe_version_id, tag_id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Run data migration
SELECT public.migrate_recipe_tags_to_normalized();

-- ============================================================================
-- End of migration
-- ============================================================================
