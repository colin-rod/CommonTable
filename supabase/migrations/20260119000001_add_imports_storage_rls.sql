-- Migration: Add RLS support for temporary image imports
-- Description: Allows users to read their own temp images from /imports/{user_id}/ folder

-- ============================================================================
-- HELPER FUNCTION: Extract user_id from imports path
-- ============================================================================
-- Path format: imports/{user_id}/{timestamp}_{uuid}/{image_id}.{ext}
-- Example: imports/550e8400-e29b-41d4-a716-446655440000/1737292800000_d4e5f6/abc123.jpg

CREATE OR REPLACE FUNCTION public.get_user_id_from_imports_path(path TEXT)
RETURNS UUID AS $$
DECLARE
  path_parts TEXT[];
BEGIN
  -- Split path by '/'
  path_parts := string_to_array(path, '/');

  -- Check if path starts with 'imports'
  IF path_parts[1] = 'imports' AND array_length(path_parts, 1) >= 2 THEN
    -- Return user_id (2nd segment)
    RETURN path_parts[2]::UUID;
  END IF;

  RETURN NULL;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.get_user_id_from_imports_path IS
  'Extracts user_id from imports storage path format: imports/{user_id}/{timestamp}_{uuid}/{image_id}.{ext}';

-- ============================================================================
-- HELPER FUNCTION: Check if path is in imports folder
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_imports_path(path TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN path LIKE 'imports/%';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.is_imports_path IS
  'Checks if a storage path is in the temporary imports folder';

-- ============================================================================
-- MANUAL STEP REQUIRED: Update Storage RLS Policies
-- ============================================================================
--
-- Since storage bucket RLS policies cannot be modified via SQL migrations,
-- you must update them manually through the Supabase Dashboard.
--
-- Go to: Storage → recipe-images bucket → Policies
--
-- UPDATE POLICY: recipe_images_select_policy (SELECT/viewing)
-- ------------------------------------------------------------
-- Update the USING expression to:
--
-- (bucket_id = 'recipe-images' AND (
--   (
--     -- Allow reading from household recipes (existing logic)
--     public.user_belongs_to_household(public.get_household_id_from_storage_path(name)) AND
--     public.recipe_belongs_to_household(
--       public.get_recipe_id_from_storage_path(name),
--       public.get_household_id_from_storage_path(name)
--     )
--   ) OR (
--     -- NEW: Allow reading from own imports folder
--     public.is_imports_path(name) AND
--     public.get_user_id_from_imports_path(name) = auth.uid()
--   )
-- ))
--
-- UPDATE POLICY: recipe_images_insert_policy (INSERT/uploading)
-- --------------------------------------------------------------
-- Update the WITH CHECK expression to:
--
-- (bucket_id = 'recipe-images' AND (
--   (
--     -- Allow uploading to household recipes (existing logic)
--     public.user_belongs_to_household(public.get_household_id_from_storage_path(name)) AND
--     public.recipe_belongs_to_household(
--       public.get_recipe_id_from_storage_path(name),
--       public.get_household_id_from_storage_path(name)
--     )
--   ) OR (
--     -- NEW: Allow uploading to own imports folder
--     public.is_imports_path(name) AND
--     public.get_user_id_from_imports_path(name) = auth.uid()
--   )
-- ))
--
-- NOTE: UPDATE and DELETE policies do NOT need changes.
-- Temp imports should not be updated or deleted via client (only via Edge Function).
--
-- ============================================================================

-- Test the helper functions
DO $$
DECLARE
  test_path TEXT := 'imports/550e8400-e29b-41d4-a716-446655440000/1737292800000_d4e5f6/abc123.jpg';
  test_user_id UUID := '550e8400-e29b-41d4-a716-446655440000';
  extracted_user_id UUID;
  is_imports BOOLEAN;
BEGIN
  -- Test get_user_id_from_imports_path
  extracted_user_id := public.get_user_id_from_imports_path(test_path);
  IF extracted_user_id != test_user_id THEN
    RAISE EXCEPTION 'get_user_id_from_imports_path failed: expected %, got %',
      test_user_id, extracted_user_id;
  END IF;

  -- Test is_imports_path
  is_imports := public.is_imports_path(test_path);
  IF NOT is_imports THEN
    RAISE EXCEPTION 'is_imports_path failed: expected TRUE for imports path';
  END IF;

  -- Test non-imports path
  is_imports := public.is_imports_path('household-123/recipe-456/img.jpg');
  IF is_imports THEN
    RAISE EXCEPTION 'is_imports_path failed: expected FALSE for non-imports path';
  END IF;

  RAISE NOTICE 'All helper function tests passed';
END $$;

-- ============================================================================
-- Migration complete. Helper functions created and tested.
-- ============================================================================
-- Remember to manually update the storage RLS policies in the Supabase Dashboard
-- as documented above.
-- ============================================================================
