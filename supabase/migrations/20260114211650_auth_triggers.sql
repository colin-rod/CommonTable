-- Migration: Auth Triggers
-- Creates trigger to auto-create profile when a user signs up via Supabase Auth
-- This ensures every user in auth.users has a corresponding profile in public.profiles

-- =============================================================================
-- FUNCTION: handle_new_user
-- =============================================================================
-- This function is called automatically when a new user is created in auth.users
-- It creates a profile record with metadata from the auth.users raw_user_meta_data

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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

-- =============================================================================
-- TRIGGER: on_auth_user_created
-- =============================================================================
-- Automatically create a profile when a new user is created in auth.users

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile when a new user signs up';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to auto-create profile on user signup';
