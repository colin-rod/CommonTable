-- Migration: Drop recipe_shortlists table
-- Reason: Shortlist feature consolidated into Meal Plan (recipe_queue)
-- Users now add recipes directly to the meal plan instead of using a separate shortlist

-- Drop RLS policy first
DROP POLICY IF EXISTS recipe_shortlists_household_isolation ON recipe_shortlists;

-- Drop the index
DROP INDEX IF EXISTS idx_recipe_shortlists_household;

-- Drop table
DROP TABLE IF EXISTS recipe_shortlists;
