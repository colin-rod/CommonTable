-- =============================================================================
-- Migration: Repair orphaned profiles from pre-fix signups
-- =============================================================================
-- This migration fixes ALL users who signed up before migration 20260126000001
-- was applied. The old trigger created profiles with:
-- - Random UUID for id
-- - auth_user_id = NULL (or sometimes populated)
-- - No household or household_member record
--
-- This migration:
-- 1. Backfills auth_user_id for profiles where it's NULL
-- 2. Creates households for users who don't have one
-- 3. Creates household_member records linking profiles to households
-- =============================================================================

-- =============================================================================
-- STEP 1: Backfill auth_user_id for profiles with NULL values
-- =============================================================================
-- These were created by the old trigger before the fix
-- We set auth_user_id = id because the old trigger set id = auth.users.id

UPDATE public.profiles
SET auth_user_id = id
WHERE member_type = 'authenticated'
  AND auth_user_id IS NULL;

-- =============================================================================
-- STEP 2: Create households and household_members for orphaned profiles
-- =============================================================================
-- Find profiles that have no household_member record and create both
-- household and household_member in one transaction

WITH orphaned_profiles AS (
  -- Find all authenticated profiles without a household_member
  SELECT
    p.id as profile_id,
    p.auth_user_id,
    p.display_name
  FROM public.profiles p
  WHERE p.member_type = 'authenticated'
    AND NOT EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.user_id = p.id
    )
),
new_households AS (
  -- Create a household for each orphaned profile
  INSERT INTO public.households (name, created_at, updated_at)
  SELECT
    COALESCE(display_name || '''s Household', 'My Household'),
    NOW(),
    NOW()
  FROM orphaned_profiles
  RETURNING id
)
-- Link each profile to its new household as admin
INSERT INTO public.household_members (household_id, user_id, role, joined_at)
SELECT
  nh.id,
  op.profile_id,
  'admin',
  NOW()
FROM new_households nh
CROSS JOIN orphaned_profiles op;

-- =============================================================================
-- STEP 3: Verification queries
-- =============================================================================
-- Count how many profiles were fixed

-- Profiles with auth_user_id now populated (should be 0 NULL values)
SELECT
  COUNT(*) FILTER (WHERE auth_user_id IS NULL) as profiles_with_null_auth_user_id,
  COUNT(*) FILTER (WHERE auth_user_id IS NOT NULL) as profiles_with_auth_user_id
FROM public.profiles
WHERE member_type = 'authenticated';

-- Profiles with household_member records (should match total authenticated profiles)
SELECT
  COUNT(*) as total_authenticated_profiles,
  COUNT(*) FILTER (WHERE hm.user_id IS NOT NULL) as profiles_with_household,
  COUNT(*) FILTER (WHERE hm.user_id IS NULL) as orphaned_profiles
FROM public.profiles p
LEFT JOIN public.household_members hm ON hm.user_id = p.id
WHERE p.member_type = 'authenticated';

-- =============================================================================
-- ROLLBACK PLAN (if needed)
-- =============================================================================
-- WARNING: This migration is a data repair, not a schema change.
-- Rolling back would re-break the affected users.
-- If rollback is needed, manually delete the created households/household_members:
--
-- DELETE FROM public.household_members
-- WHERE joined_at >= NOW() - INTERVAL '1 hour';
--
-- DELETE FROM public.households
-- WHERE created_at >= NOW() - INTERVAL '1 hour';
--
-- UPDATE public.profiles
-- SET auth_user_id = NULL
-- WHERE member_type = 'authenticated'
--   AND updated_at >= NOW() - INTERVAL '1 hour';
-- =============================================================================
