-- =============================================================================
-- Migration: Add Recipe Status Workflow
-- Description: Adds status column to recipes table for tracking recipe
--              lifecycle (suggested → to_buy → to_cook → cooked)
-- Author: Claude Code
-- Date: 2026-01-30
-- =============================================================================

-- =============================================================================
-- ENUM TYPE FOR RECIPE STATUS
-- =============================================================================

-- Create recipe_status enum with 4 lifecycle states
DO $$ BEGIN
  CREATE TYPE recipe_status AS ENUM (
    'suggested',  -- New recipes or ideas (default state)
    'to_buy',     -- Recipe is being considered for meal planning
    'to_cook',    -- Recipe is ready to schedule on calendar
    'cooked'      -- Recipe has been prepared (auto-set when cooking event logged)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- ADD STATUS COLUMN TO RECIPES TABLE
-- =============================================================================

-- Add status column with default value 'suggested'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.recipes ADD COLUMN status recipe_status NOT NULL DEFAULT 'suggested';
  END IF;
END $$;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for filtering recipes by status within a household
CREATE INDEX IF NOT EXISTS idx_recipes_status
  ON public.recipes(household_id, status);

-- Composite index for status-based queries with sorting
CREATE INDEX IF NOT EXISTS idx_recipes_status_created
  ON public.recipes(household_id, status, created_at DESC);

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN public.recipes.status IS
  'Recipe lifecycle status: suggested (default/new), to_buy (considering for planning), to_cook (ready to schedule), cooked (has been prepared)';

COMMENT ON TYPE recipe_status IS
  'Recipe workflow states: suggested → to_buy → to_cook → cooked (auto-set on cooking event)';
