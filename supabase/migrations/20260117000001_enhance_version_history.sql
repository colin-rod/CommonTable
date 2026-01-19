-- Migration: Enhance get_recipe_version_history function
-- Description: Add created_by_name field by joining with profiles table

-- =============================================================================
-- FUNCTION: Get Recipe Version History (Enhanced)
-- =============================================================================
-- Replaces the existing function to include the display name of the user
-- who created each version. Uses LEFT JOIN to handle cases where profile
-- may not exist (e.g., deleted users).

-- Drop existing function to allow signature change
DROP FUNCTION IF EXISTS public.get_recipe_version_history(UUID);

CREATE OR REPLACE FUNCTION public.get_recipe_version_history(p_recipe_id UUID)
RETURNS TABLE (
  version_id UUID,
  version_number INT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rv.id AS version_id,
    rv.version_number,
    rv.created_by,
    p.display_name AS created_by_name,
    rv.created_at,
    (rv.id = r.current_version_id) AS is_current
  FROM public.recipe_versions rv
  JOIN public.recipes r ON r.id = rv.recipe_id
  LEFT JOIN public.profiles p ON p.id = rv.created_by
  WHERE rv.recipe_id = p_recipe_id
  ORDER BY rv.version_number DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_recipe_version_history IS 'Returns version history for a recipe with current version indicator and creator display name';
