-- Migration: Add is_public column to recipe_images table
-- Description: Allows individual images to be marked as publicly accessible

-- Step 1: Add is_public column (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipe_images'
      AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.recipe_images ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Step 2: Add column comment
COMMENT ON COLUMN public.recipe_images.is_public IS 'When true, the image can be accessed via public URL without authentication. Private images require signed URLs.';

-- Step 3: Create index for public images (useful for future public recipe sharing)
CREATE INDEX IF NOT EXISTS idx_recipe_images_public ON public.recipe_images(recipe_id) WHERE is_public = TRUE;

COMMENT ON INDEX idx_recipe_images_public IS 'Index for quickly finding public images for a recipe';
