-- Migration: Auth Triggers (Cloud Compatible)
-- Creates function to auto-create profile when a user signs up via Supabase Auth
-- This uses Supabase's auth hooks feature instead of direct triggers on auth.users

-- =============================================================================
-- FUNCTION: handle_new_user
-- =============================================================================
-- This function will be called by Supabase auth hooks
-- It creates a profile record with metadata from the auth.users raw_user_meta_data

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Extract display_name from raw_user_meta_data (set during signup)
  -- Fallback to email local part if display_name is not provided
  INSERT INTO public.profiles (id, display_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile when a new user signs up (called via Supabase auth hook)';
