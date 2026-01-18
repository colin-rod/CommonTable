-- ============================================================================
-- Manual Storage RLS Policies Setup
-- ============================================================================
-- Run this SQL in the Supabase SQL Editor after:
-- 1. Creating the recipe-images bucket in the Dashboard
-- 2. Running migration 20260118000001 (to create helper functions)
-- ============================================================================

-- Policy 1: SELECT (viewing images)
-- Users can view images for recipes in their household
CREATE POLICY "recipe_images_select_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND public.user_belongs_to_household(public.get_household_id_from_storage_path(name))
  AND public.recipe_belongs_to_household(
    public.get_recipe_id_from_storage_path(name),
    public.get_household_id_from_storage_path(name)
  )
);

-- Policy 2: INSERT (uploading images)
-- Users can upload images to recipes in their household
CREATE POLICY "recipe_images_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images'
  AND public.user_belongs_to_household(public.get_household_id_from_storage_path(name))
  AND public.recipe_belongs_to_household(
    public.get_recipe_id_from_storage_path(name),
    public.get_household_id_from_storage_path(name)
  )
);

-- Policy 3: UPDATE (updating images)
-- Users can update images for recipes in their household
CREATE POLICY "recipe_images_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND public.user_belongs_to_household(public.get_household_id_from_storage_path(name))
  AND public.recipe_belongs_to_household(
    public.get_recipe_id_from_storage_path(name),
    public.get_household_id_from_storage_path(name)
  )
)
WITH CHECK (
  bucket_id = 'recipe-images'
  AND public.user_belongs_to_household(public.get_household_id_from_storage_path(name))
  AND public.recipe_belongs_to_household(
    public.get_recipe_id_from_storage_path(name),
    public.get_household_id_from_storage_path(name)
  )
);

-- Policy 4: DELETE (deleting images)
-- Users can delete images from recipes in their household
CREATE POLICY "recipe_images_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND public.user_belongs_to_household(public.get_household_id_from_storage_path(name))
  AND public.recipe_belongs_to_household(
    public.get_recipe_id_from_storage_path(name),
    public.get_household_id_from_storage_path(name)
  )
);

-- ============================================================================
-- Verification
-- ============================================================================
-- Run this query to verify all policies were created:
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE 'recipe_images%'
ORDER BY policyname;

-- Expected output: 4 rows showing the 4 policies created above
-- ============================================================================
