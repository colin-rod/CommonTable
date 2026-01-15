-- =============================================================================
-- Migration: Update household_members to reference profiles instead of auth.users
-- =============================================================================
-- This migration changes the household_members.user_id foreign key to reference
-- profiles.id instead of auth.users.id, allowing both authenticated and managed
-- users to be household members.
--
-- Key changes:
-- - Drop FK constraint from household_members.user_id -> auth.users.id
-- - Add FK constraint from household_members.user_id -> profiles.id
-- =============================================================================

-- Step 1: Drop existing FK constraint
ALTER TABLE public.household_members
  DROP CONSTRAINT IF EXISTS household_members_user_id_fkey;

-- Step 2: Add new FK constraint to profiles table
-- Note: Column name stays 'user_id' but now references profiles.id
-- This maintains backwards compatibility with existing queries
ALTER TABLE public.household_members
  ADD CONSTRAINT household_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 3: Verify index exists on user_id (should already exist from initial schema)
-- This is important for JOIN performance
CREATE INDEX IF NOT EXISTS idx_household_members_user
  ON public.household_members(user_id);
