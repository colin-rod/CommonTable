-- =============================================================================
-- Emergency Fix: Repair orphaned profile for user fe1b7afa-e7bb-4675-a6be-f87cbed76699
-- =============================================================================
-- This script fixes a specific user who signed up before migration 20260126000001
-- was applied. The old trigger created a profile with a random UUID for id and
-- auth_user_id = NULL, and no household was created.
--
-- Run this in the Supabase SQL Editor to immediately unblock this user.
-- =============================================================================

-- Step 1: Backfill auth_user_id (if NULL)
-- This ensures the profile has auth_user_id populated correctly
UPDATE public.profiles
SET auth_user_id = 'fe1b7afa-e7bb-4675-a6be-f87cbed76699'
WHERE id = '153d311b-5ca5-4826-9a76-35865a33b7d1'
  AND auth_user_id IS NULL;

-- Step 2: Create household and household_member in one transaction
-- This creates the household and links the profile to it
WITH new_household AS (
  INSERT INTO public.households (id, name, created_at, updated_at)
  VALUES (gen_random_uuid(), 'Colin''s Household', NOW(), NOW())
  RETURNING id
)
INSERT INTO public.household_members (household_id, user_id, role, joined_at)
SELECT id, '153d311b-5ca5-4826-9a76-35865a33b7d1', 'admin', NOW()
FROM new_household
WHERE NOT EXISTS (
  -- Don't create duplicate household_member if one already exists
  SELECT 1 FROM public.household_members
  WHERE user_id = '153d311b-5ca5-4826-9a76-35865a33b7d1'
);

-- Step 3: Verify the fix
SELECT
  p.id as profile_id,
  p.auth_user_id,
  p.display_name,
  p.member_type,
  hm.household_id,
  hm.role,
  h.name as household_name
FROM public.profiles p
LEFT JOIN public.household_members hm ON hm.user_id = p.id
LEFT JOIN public.households h ON h.id = hm.household_id
WHERE p.auth_user_id = 'fe1b7afa-e7bb-4675-a6be-f87cbed76699';

-- Expected result:
-- profile_id: 153d311b-5ca5-4826-9a76-35865a33b7d1
-- auth_user_id: fe1b7afa-e7bb-4675-a6be-f87cbed76699
-- display_name: Colin
-- member_type: authenticated
-- household_id: (a new UUID)
-- role: admin
-- household_name: Colin's Household
