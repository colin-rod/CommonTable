-- Migration: Add is_favorite column to recipes
-- Description: Adds a boolean flag for users to mark recipes as favorites

-- Add is_favorite column with default false
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Create partial index for efficient filtering of favorites within a household
CREATE INDEX IF NOT EXISTS idx_recipes_favorite
ON recipes(household_id, is_favorite)
WHERE is_favorite = true;
