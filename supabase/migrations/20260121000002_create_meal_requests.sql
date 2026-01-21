-- Migration: Create meal_requests table
-- Description: Allow household members to request meals for future dates
-- This creates a structured request queue where family members can suggest meals
-- they'd like to have on specific dates and meal slots

-- =============================================================================
-- TABLE: meal_requests (structured request queue)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.meal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  requested_date DATE NOT NULL,
  requested_meal_slot TEXT NOT NULL CHECK (requested_meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES (Performance optimization)
-- =============================================================================

-- Household isolation (most queries filter by household_id)
CREATE INDEX IF NOT EXISTS idx_meal_requests_household
  ON public.meal_requests(household_id);

-- Foreign key index (PostgreSQL doesn't auto-index foreign keys)
CREATE INDEX IF NOT EXISTS idx_meal_requests_recipe
  ON public.meal_requests(recipe_id);

-- Common query pattern: "show me meal requests for the next 7 days"
CREATE INDEX IF NOT EXISTS idx_meal_requests_date
  ON public.meal_requests(household_id, requested_date);

-- Common query pattern: "show me all requests for dinner this week"
CREATE INDEX IF NOT EXISTS idx_meal_requests_meal_slot
  ON public.meal_requests(household_id, requested_meal_slot, requested_date);

-- =============================================================================
-- RLS POLICIES (Row Level Security)
-- =============================================================================

-- Enable RLS
ALTER TABLE public.meal_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their household's meal requests
CREATE POLICY "Users can view their household's meal requests"
  ON public.meal_requests FOR SELECT
  USING (household_id = public.get_user_household_id());

-- Policy: Users can create meal requests in their household
-- Users can only create requests for themselves (requested_by = auth.uid())
CREATE POLICY "Users can create meal requests in their household"
  ON public.meal_requests FOR INSERT
  WITH CHECK (
    household_id = public.get_user_household_id()
    AND requested_by = auth.uid()
  );

-- Policy: Users can update their own meal requests
-- Users can only update requests they created
CREATE POLICY "Users can update their own meal requests"
  ON public.meal_requests FOR UPDATE
  USING (
    household_id = public.get_user_household_id()
    AND requested_by = auth.uid()
  );

-- Policy: Users can delete their own meal requests
-- Users can only delete requests they created
CREATE POLICY "Users can delete their own meal requests"
  ON public.meal_requests FOR DELETE
  USING (
    household_id = public.get_user_household_id()
    AND requested_by = auth.uid()
  );

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================

COMMENT ON TABLE public.meal_requests IS
  'Structured request queue where household members can request meals for future dates';

COMMENT ON COLUMN public.meal_requests.recipe_id IS
  'Optional recipe reference - can be NULL if requester wants meal type without specific recipe';

COMMENT ON COLUMN public.meal_requests.requested_by IS
  'User who created this meal request (foreign key to auth.users)';

COMMENT ON COLUMN public.meal_requests.requested_date IS
  'Target date when the requester wants this meal';

COMMENT ON COLUMN public.meal_requests.requested_meal_slot IS
  'Target meal slot: breakfast, lunch, dinner, or snack';

COMMENT ON COLUMN public.meal_requests.notes IS
  'Optional notes explaining why this meal was requested or any special considerations';

-- =============================================================================
-- End of migration
-- =============================================================================
