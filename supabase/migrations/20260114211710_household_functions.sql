-- Migration: Household Functions
-- Creates function to auto-create household when a user signs up
-- This is called by the application after user creation to set up initial household

-- =============================================================================
-- FUNCTION: create_household_on_signup
-- =============================================================================
-- Creates a household for a new user and adds them as admin
-- This function is atomic - both household creation and membership insertion
-- happen in a single transaction
--
-- Parameters:
--   p_user_id: The user's UUID from auth.users
--   p_display_name: The user's display name (used to create household name)
--
-- Returns:
--   UUID of the created household

CREATE OR REPLACE FUNCTION public.create_household_on_signup(
  p_user_id UUID,
  p_display_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_household_id UUID;
  v_household_name TEXT;
BEGIN
  -- Generate household name: "{display_name}'s Household"
  v_household_name := p_display_name || '''s Household';

  -- Generate new household ID
  v_household_id := gen_random_uuid();

  -- Insert household
  INSERT INTO public.households (id, name, created_at, updated_at)
  VALUES (v_household_id, v_household_name, NOW(), NOW());

  -- Add user as admin member
  INSERT INTO public.household_members (household_id, user_id, role, joined_at)
  VALUES (v_household_id, p_user_id, 'admin', NOW());

  RETURN v_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: get_user_household_id
-- =============================================================================
-- Helper function to get the current user's household ID
-- Used by RLS policies and application queries
--
-- Returns:
--   UUID of the user's household, or NULL if user has no household

CREATE OR REPLACE FUNCTION public.get_user_household_id()
RETURNS UUID AS $$
  SELECT household_id
  FROM public.household_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: get_user_household_role
-- =============================================================================
-- Helper function to get the current user's role in their household
-- Used for permission checks in application logic
--
-- Returns:
--   TEXT role ('admin' or 'member'), or NULL if user has no household

CREATE OR REPLACE FUNCTION public.get_user_household_role()
RETURNS TEXT AS $$
  SELECT role
  FROM public.household_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION public.create_household_on_signup IS 'Creates a household for a new user and adds them as admin';
COMMENT ON FUNCTION public.get_user_household_id IS 'Returns the household ID for the current authenticated user';
COMMENT ON FUNCTION public.get_user_household_role IS 'Returns the household role for the current authenticated user';
