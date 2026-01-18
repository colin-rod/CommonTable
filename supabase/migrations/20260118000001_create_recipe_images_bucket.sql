-- Migration: Create recipe-images storage bucket with RLS policies
-- Description: Sets up Supabase Storage bucket for recipe images with household isolation

-- ============================================================================
-- MANUAL STEPS REQUIRED: Create Storage Bucket + RLS Policies
-- ============================================================================
-- Storage buckets and their RLS policies cannot be created via SQL migrations.
-- You must configure them manually through the Supabase Dashboard.
--
-- STEP 1: Create the Storage Bucket
-- ---------------------------------
-- 1. Go to Storage in the Supabase Dashboard
-- 2. Click "Create a new bucket"
-- 3. Set the following values:
--    - Name: recipe-images
--    - Public: OFF (private bucket)
--    - File size limit: 5242880 (5MB)
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- STEP 2: Create RLS Policies for storage.objects
-- ------------------------------------------------
-- Go to Storage → recipe-images bucket → Policies → New policy
-- Create 4 policies with the following settings:
--
-- Policy 1: SELECT (viewing images)
-- ---------------------------------
-- Allowed operation: SELECT
-- Policy name: recipe_images_select_policy
-- Target roles: authenticated
-- USING expression (copy this exactly):

(bucket_id = 'recipe-images' AND public.user_belongs_to_household(public.get_household_id_from_storage_path(name)) AND public.recipe_belongs_to_household(public.get_recipe_id_from_storage_path(name), public.get_household_id_from_storage_path(name)))

-- Policy 2: INSERT (uploading images)
-- -----------------------------------
-- Allowed operation: INSERT
-- Policy name: recipe_images_insert_policy
-- Target roles: authenticated
-- WITH CHECK expression (copy this exactly):

(bucket_id = 'recipe-images' AND public.user_belongs_to_household(public.get_household_id_from_storage_path(name)) AND public.recipe_belongs_to_household(public.get_recipe_id_from_storage_path(name), public.get_household_id_from_storage_path(name)))

-- Policy 3: UPDATE (updating images)
-- ----------------------------------
-- Allowed operation: UPDATE
-- Policy name: recipe_images_update_policy
-- Target roles: authenticated
-- USING expression (copy this exactly):

(bucket_id = 'recipe-images' AND public.user_belongs_to_household(public.get_household_id_from_storage_path(name)) AND public.recipe_belongs_to_household(public.get_recipe_id_from_storage_path(name), public.get_household_id_from_storage_path(name)))

-- WITH CHECK expression (copy this exactly):

(bucket_id = 'recipe-images' AND public.user_belongs_to_household(public.get_household_id_from_storage_path(name)) AND public.recipe_belongs_to_household(public.get_recipe_id_from_storage_path(name), public.get_household_id_from_storage_path(name)))

-- Policy 4: DELETE (deleting images)
-- ----------------------------------
-- Allowed operation: DELETE
-- Policy name: recipe_images_delete_policy
-- Target roles: authenticated
-- USING expression (copy this exactly):

(bucket_id = 'recipe-images' AND public.user_belongs_to_household(public.get_household_id_from_storage_path(name)) AND public.recipe_belongs_to_household(public.get_recipe_id_from_storage_path(name), public.get_household_id_from_storage_path(name)))
--
-- STEP 3: Run this migration
-- --------------------------
-- After completing steps 1-2, run this migration to create helper functions.
-- ============================================================================

-- Step 2: Create helper function to extract household_id from storage path
-- Path format: {household_id}/{recipe_id}/{image_id}.{ext}
-- Note: Functions must be in public schema (no permission to create in storage schema)
CREATE OR REPLACE FUNCTION public.get_household_id_from_storage_path(path TEXT)
RETURNS UUID AS $$
BEGIN
  -- Extract the first segment (household_id) from the path
  RETURN (string_to_array(path, '/'))[1]::UUID;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.get_household_id_from_storage_path IS 'Extracts household_id from storage path format: {household_id}/{recipe_id}/{image_id}.{ext}';

-- Step 3: Create helper function to extract recipe_id from storage path
CREATE OR REPLACE FUNCTION public.get_recipe_id_from_storage_path(path TEXT)
RETURNS UUID AS $$
BEGIN
  -- Extract the second segment (recipe_id) from the path
  RETURN (string_to_array(path, '/'))[2]::UUID;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.get_recipe_id_from_storage_path IS 'Extracts recipe_id from storage path format: {household_id}/{recipe_id}/{image_id}.{ext}';

-- Step 4: Create helper function to check if user belongs to household
CREATE OR REPLACE FUNCTION public.user_belongs_to_household(household_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_members.household_id = user_belongs_to_household.household_id
      AND household_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_belongs_to_household IS 'Checks if the current authenticated user belongs to the specified household';

-- Step 5: Create helper function to validate recipe belongs to household
CREATE OR REPLACE FUNCTION public.recipe_belongs_to_household(recipe_id UUID, household_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.recipes
    WHERE recipes.id = recipe_belongs_to_household.recipe_id
      AND recipes.household_id = recipe_belongs_to_household.household_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.recipe_belongs_to_household IS 'Validates that a recipe belongs to the specified household';

-- ============================================================================
-- Migration complete. Helper functions created.
-- ============================================================================
-- The helper functions above are now available for use in storage RLS policies.
-- Remember to create the storage bucket and policies manually in the Dashboard
-- as documented at the top of this file.
-- ============================================================================
