-- Migration: Create recipe_shortlists table for household-level meal planning
-- Description: Allows household members to shortlist recipes before adding to calendar

-- Step 1: Create recipe_shortlists table
CREATE TABLE IF NOT EXISTS recipe_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, recipe_id)
);

-- Add table comment
COMMENT ON TABLE recipe_shortlists IS 'Household-level shortlist for meal planning. All household members see same shortlisted recipes.';

-- Add column comments
COMMENT ON COLUMN recipe_shortlists.household_id IS 'The household this shortlist entry belongs to';
COMMENT ON COLUMN recipe_shortlists.recipe_id IS 'The recipe being shortlisted';
COMMENT ON COLUMN recipe_shortlists.added_by_user_id IS 'User who added this recipe to shortlist';
COMMENT ON COLUMN recipe_shortlists.added_at IS 'Timestamp when recipe was shortlisted';

-- Step 2: Create index for fast household lookups
CREATE INDEX IF NOT EXISTS idx_recipe_shortlists_household ON recipe_shortlists(household_id);

-- Step 3: Enable Row Level Security
ALTER TABLE recipe_shortlists ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy for household isolation
CREATE POLICY recipe_shortlists_household_isolation ON recipe_shortlists
  FOR ALL
  USING (household_id = get_user_household_id());

COMMENT ON POLICY recipe_shortlists_household_isolation ON recipe_shortlists IS 'Users can only access shortlist entries for their household';
