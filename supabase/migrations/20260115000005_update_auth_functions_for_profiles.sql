-- =============================================================================
-- Migration: Update auth functions to use new profiles structure
-- =============================================================================
-- This migration updates the create_household_on_signup function to work with
-- the new profiles table structure (auth_user_id, member_type columns).
-- =============================================================================

-- Drop existing functions first (needed if signature or return type changed)
DROP FUNCTION IF EXISTS public.create_household_on_signup(UUID, TEXT);

-- Update create_household_on_signup function
CREATE OR REPLACE FUNCTION public.create_household_on_signup(
  p_user_id UUID,
  p_display_name TEXT
) RETURNS void AS $$
DECLARE
  v_household_id UUID;
  v_profile_id UUID;
BEGIN
  -- Create household
  INSERT INTO public.households (name)
  VALUES (p_display_name || '''s Household')
  RETURNING id INTO v_household_id;

  -- Create profile (authenticated user)
  -- Note: id will auto-generate via gen_random_uuid()
  INSERT INTO public.profiles (auth_user_id, display_name, member_type)
  VALUES (p_user_id, p_display_name, 'authenticated')
  RETURNING id INTO v_profile_id;

  -- Add user as admin of their household
  -- Note: user_id now references profiles.id (not auth.users.id)
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (v_household_id, v_profile_id, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_user_household_id function to work with new profiles structure
CREATE OR REPLACE FUNCTION public.get_user_household_id()
RETURNS UUID AS $$
  SELECT hm.household_id
  FROM public.household_members hm
  INNER JOIN public.profiles p ON hm.user_id = p.id
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Update get_user_household_role function to work with new profiles structure
CREATE OR REPLACE FUNCTION public.get_user_household_role()
RETURNS TEXT AS $$
  SELECT hm.role
  FROM public.household_members hm
  INNER JOIN public.profiles p ON hm.user_id = p.id
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Update is_household_admin function to work with new profiles structure
CREATE OR REPLACE FUNCTION public.is_household_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members hm
    INNER JOIN public.profiles p ON hm.user_id = p.id
    WHERE p.auth_user_id = auth.uid()
      AND hm.role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Update is_household_admin_of function to work with new profiles structure
CREATE OR REPLACE FUNCTION public.is_household_admin_of(household_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members hm
    INNER JOIN public.profiles p ON hm.user_id = p.id
    WHERE p.auth_user_id = auth.uid()
      AND hm.household_id = is_household_admin_of.household_id
      AND hm.role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Add new helper function: get_user_profile_id
-- Returns the profile ID for the current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID AS $$
  SELECT id
  FROM public.profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_profile_id() IS 'Returns the profile ID for the currently authenticated user';
