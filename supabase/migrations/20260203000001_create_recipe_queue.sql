-- =============================================================================
-- Migration: Create recipe_queue Table
-- Description: Creates a new recipe_queue table for the queue-based meal planning system
--              Separate from meal_requests (request/approval flow) and recipe_shortlists (shortlist drawer)
--              Queue feeds from shortlist and represents recipes ready to be cooked
-- Author: Claude Code
-- Date: 2026-02-03
-- =============================================================================

-- =============================================================================
-- ENUM TYPE FOR QUEUE STATUS
-- =============================================================================

-- Create queue_status enum
DO $$ BEGIN
  CREATE TYPE queue_status AS ENUM ('queued', 'cooking', 'cooked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- CREATE RECIPE_QUEUE TABLE
-- =============================================================================

-- Create recipe_queue table
CREATE TABLE IF NOT EXISTS recipe_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  status queue_status NOT NULL DEFAULT 'queued',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(household_id, recipe_id) -- Prevent duplicate recipes in queue
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Household isolation (most queries filter by household_id)
CREATE INDEX IF NOT EXISTS idx_recipe_queue_household
  ON recipe_queue(household_id);

-- Foreign key index (PostgreSQL doesn't auto-index foreign keys)
CREATE INDEX IF NOT EXISTS idx_recipe_queue_recipe
  ON recipe_queue(recipe_id);

-- Status filtering (filter by queued vs cooking vs cooked)
CREATE INDEX IF NOT EXISTS idx_recipe_queue_status
  ON recipe_queue(household_id, status);

-- Position ordering within household and status
CREATE INDEX IF NOT EXISTS idx_recipe_queue_position
  ON recipe_queue(household_id, status, position ASC);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE recipe_queue ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Policy: Users can view their household's queue
CREATE POLICY "Users can view their household's queue"
  ON recipe_queue FOR SELECT
  USING (household_id = get_user_household_id());

-- Policy: Users can add to their household's queue
-- Ensures added_by matches auth.uid() (user can only add for themselves)
CREATE POLICY "Users can add to their household's queue"
  ON recipe_queue FOR INSERT
  WITH CHECK (
    household_id = get_user_household_id()
    AND added_by = auth.uid()
  );

-- Policy: Users can update their household's queue
-- All household members can reorder, change status, etc.
CREATE POLICY "Users can update their household's queue"
  ON recipe_queue FOR UPDATE
  USING (household_id = get_user_household_id());

-- Policy: Users can remove from their household's queue
CREATE POLICY "Users can remove from their household's queue"
  ON recipe_queue FOR DELETE
  USING (household_id = get_user_household_id());

-- =============================================================================
-- TRIGGER FOR UPDATED_AT
-- =============================================================================

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_recipe_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists to ensure idempotency)
DROP TRIGGER IF EXISTS recipe_queue_updated_at_trigger ON recipe_queue;

CREATE TRIGGER recipe_queue_updated_at_trigger
  BEFORE UPDATE ON recipe_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_queue_updated_at();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE recipe_queue IS
  'Household recipe queue with drag-and-drop ordering. Fed from recipe_shortlists.';

COMMENT ON COLUMN recipe_queue.position IS
  'Ordering position within queue (0 = first, higher numbers = lower priority)';

COMMENT ON COLUMN recipe_queue.status IS
  'Queue lifecycle: queued (in queue) → cooking (being prepared) → cooked (logged to history)';

COMMENT ON COLUMN recipe_queue.added_by IS
  'User who added recipe to queue (from shortlist drawer)';

COMMENT ON COLUMN recipe_queue.notes IS
  'Optional notes for this queue entry (e.g., "Need to buy chicken")';

COMMENT ON TYPE queue_status IS
  'Recipe queue status: queued (waiting to cook), cooking (in progress), cooked (completed and logged)';

-- =============================================================================
-- End of migration
-- =============================================================================
