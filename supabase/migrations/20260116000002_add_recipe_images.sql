-- Migration: Add recipe_images table for multiple images per recipe
-- Description: Creates a table to store metadata for recipe images with support for
-- multiple images per recipe, primary image designation, and proper ordering

-- Step 1: Create recipe_images table
CREATE TABLE IF NOT EXISTS recipe_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  file_size_bytes INTEGER,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE recipe_images IS 'Stores metadata for recipe images. Actual images are stored in Supabase Storage. Supports multiple images per recipe with ordering and primary designation.';

-- Add column comments
COMMENT ON COLUMN recipe_images.storage_path IS 'Path in Supabase Storage (e.g., recipes/{recipe_id}/{image_id}.jpg)';
COMMENT ON COLUMN recipe_images.display_order IS 'Order for displaying multiple images (0-indexed). Lower numbers appear first.';
COMMENT ON COLUMN recipe_images.is_primary IS 'Designates the primary/featured image for the recipe. Only one primary image allowed per recipe.';
COMMENT ON COLUMN recipe_images.alt_text IS 'Accessibility description for screen readers';
COMMENT ON COLUMN recipe_images.file_size_bytes IS 'File size in bytes for storage tracking';

-- Step 2: Create unique constraint to ensure only one primary image per recipe
-- Using EXCLUDE constraint with btree equality operator
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_images_one_primary_per_recipe
  ON recipe_images (recipe_id)
  WHERE is_primary = TRUE;

COMMENT ON INDEX idx_recipe_images_one_primary_per_recipe IS 'Ensures only one image can be marked as primary per recipe';

-- Step 3: Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_recipe_images_recipe ON recipe_images(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_images_recipe_order ON recipe_images(recipe_id, display_order);

-- Step 4: Enable Row Level Security
ALTER TABLE recipe_images ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for household isolation

-- Policy: Users can view images for recipes in their household
CREATE POLICY recipe_images_select_policy ON recipe_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM recipes r
      WHERE r.id = recipe_images.recipe_id
        AND r.household_id IN (
          SELECT household_id
          FROM household_members
          WHERE user_id = auth.uid()
        )
    )
  );

COMMENT ON POLICY recipe_images_select_policy ON recipe_images IS 'Users can view images for recipes in their household';

-- Policy: Users can insert images for recipes in their household
CREATE POLICY recipe_images_insert_policy ON recipe_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM recipes r
      WHERE r.id = recipe_images.recipe_id
        AND r.household_id IN (
          SELECT household_id
          FROM household_members
          WHERE user_id = auth.uid()
        )
    )
    AND created_by = auth.uid()
  );

COMMENT ON POLICY recipe_images_insert_policy ON recipe_images IS 'Users can add images to recipes in their household';

-- Policy: Users can update images for recipes in their household
-- (Allows changing display_order, is_primary, alt_text, but not storage_path or recipe_id)
CREATE POLICY recipe_images_update_policy ON recipe_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM recipes r
      WHERE r.id = recipe_images.recipe_id
        AND r.household_id IN (
          SELECT household_id
          FROM household_members
          WHERE user_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM recipes r
      WHERE r.id = recipe_images.recipe_id
        AND r.household_id IN (
          SELECT household_id
          FROM household_members
          WHERE user_id = auth.uid()
        )
    )
  );

COMMENT ON POLICY recipe_images_update_policy ON recipe_images IS 'Users can update images for recipes in their household';

-- Policy: Users can delete images for recipes in their household
CREATE POLICY recipe_images_delete_policy ON recipe_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM recipes r
      WHERE r.id = recipe_images.recipe_id
        AND r.household_id IN (
          SELECT household_id
          FROM household_members
          WHERE user_id = auth.uid()
        )
    )
  );

COMMENT ON POLICY recipe_images_delete_policy ON recipe_images IS 'Users can delete images for recipes in their household';
