-- =============================================================================
-- Migration: Fix auth trigger profile creation (duplicate profile bug)
-- =============================================================================
-- This migration fixes the signup 500 error caused by duplicate profile creation:
-- 1. Auth trigger (handle_new_user) creates incomplete profile (auth_user_id = NULL)
-- 2. create_household_on_signup RPC tries to create second profile
-- 3. Violates CHECK constraint or creates duplicate, causing 500 error
--
-- Solution:
-- - Update handle_new_user trigger to populate auth_user_id
-- - Update create_household_on_signup to use existing profile (not create new one)
-- - Return household_id from create_household_on_signup (fix return type)
-- =============================================================================

-- =============================================================================
-- FIX: handle_new_user trigger to populate auth_user_id
-- =============================================================================
-- This function now creates profiles with auth_user_id set correctly
-- so they satisfy the CHECK constraint and RLS policies

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile with auth_user_id populated
  -- This satisfies the CHECK constraint:
  -- (member_type = 'authenticated' AND auth_user_id IS NOT NULL)
  INSERT INTO public.profiles (
    auth_user_id,  -- FIX: Set auth_user_id to NEW.id
    display_name,
    avatar_url,
    member_type,   -- Explicitly set member_type
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,  -- FIX: auth_user_id = auth.users.id
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    'authenticated',  -- Explicitly set member_type
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Update comment
COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile with auth_user_id when a new user signs up (called via Supabase auth hook)';

-- =============================================================================
-- FIX: create_household_on_signup to NOT create duplicate profile
-- =============================================================================
-- This function now:
-- 1. Finds the profile created by the trigger (using auth_user_id)
-- 2. Creates household
-- 3. Creates household_members entry
-- 4. Returns household_id (was void before)

DROP FUNCTION IF EXISTS public.create_household_on_signup(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.create_household_on_signup(
  p_user_id UUID,
  p_display_name TEXT
) RETURNS UUID AS $$  -- FIX: Return UUID (household_id) instead of void
DECLARE
  v_household_id UUID;
  v_profile_id UUID;
BEGIN
  -- Find profile created by trigger (using auth_user_id)
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE auth_user_id = p_user_id;

  -- If profile doesn't exist, throw error
  -- This should never happen if trigger works correctly
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user_id: %. Trigger may have failed.', p_user_id;
  END IF;

  -- Create household
  INSERT INTO public.households (name)
  VALUES (p_display_name || '''s Household')
  RETURNING id INTO v_household_id;

  -- Add user as admin of their household
  -- Note: user_id references profiles.id (not auth.users.id)
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (v_household_id, v_profile_id, 'admin');

  RETURN v_household_id;  -- FIX: Return household_id
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION public.create_household_on_signup IS 'Creates a household for a new user during signup. Expects profile to already exist (created by trigger). Returns household_id.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_household_on_signup(UUID, TEXT) TO authenticated;
