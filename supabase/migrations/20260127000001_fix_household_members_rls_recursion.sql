-- =============================================================================
-- Migration: Fix household_members RLS infinite recursion
-- =============================================================================
-- Root cause: household_members SELECT policy queried household_members, which
-- re-triggered the same policy and caused 42P17 "infinite recursion detected".
-- Fix: Use security-definer helper function (get_user_household_id) to avoid
-- self-referencing the table inside the policy.
-- =============================================================================

-- Drop any prior SELECT policies that referenced household_members directly
DROP POLICY IF EXISTS "Users can view members of their household" ON public.household_members;
DROP POLICY IF EXISTS household_members_view ON public.household_members;

-- Recreate SELECT policy without recursive self-query
CREATE POLICY household_members_view ON public.household_members
  FOR SELECT
  USING (household_id = public.get_user_household_id());
