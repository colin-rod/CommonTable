-- =============================================================================
-- Migration: Modify profiles table to support managed (non-authenticated) users
-- =============================================================================
-- This migration changes the profiles table to support two types of users:
-- 1. Authenticated users: Have email/password, linked to auth.users
-- 2. Managed users: No auth (e.g., kids), created by household admins
--
-- Key changes:
-- - Drop FK constraint from profiles.id -> auth.users.id
-- - Add nullable auth_user_id column (FK to auth.users)
-- - Add member_type column ('authenticated' | 'managed')
-- - Add CHECK constraint to enforce auth_user_id presence based on member_type
-- =============================================================================

-- Step 1: Drop existing FK constraint from profiles.id to auth.users.id
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Add new columns
-- auth_user_id: Nullable FK to auth.users (only for authenticated users)
-- member_type: Discriminator for user type
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS member_type TEXT NOT NULL DEFAULT 'authenticated'
    CHECK (member_type IN ('authenticated', 'managed'));

-- Step 3: Migrate existing data
-- For all existing profiles, set auth_user_id = id (they are authenticated users)
UPDATE public.profiles
SET auth_user_id = id
WHERE auth_user_id IS NULL;

-- Step 4: Add unique constraint on auth_user_id
-- One profile per auth user (null values excluded from unique constraint)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_auth_user_id_key
  ON public.profiles(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Step 5: Change id column default to gen_random_uuid()
-- This allows new managed users to get auto-generated UUIDs
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 6: Add CHECK constraint to enforce data integrity
-- Authenticated users MUST have auth_user_id
-- Managed users MUST NOT have auth_user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_authenticated_must_have_auth_user'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_authenticated_must_have_auth_user
      CHECK (
        (member_type = 'authenticated' AND auth_user_id IS NOT NULL) OR
        (member_type = 'managed' AND auth_user_id IS NULL)
      );
  END IF;
END $$;

-- Step 7: Add index for common queries (find profile by auth_user_id)
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id
  ON public.profiles(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Step 8: Add index for member_type for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_member_type
  ON public.profiles(member_type);
