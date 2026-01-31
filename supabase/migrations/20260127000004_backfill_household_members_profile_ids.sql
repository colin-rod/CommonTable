-- =============================================================================
-- Migration: Backfill household_members.user_id to profiles.id
-- =============================================================================
-- Root cause: legacy rows stored auth.users.id in household_members.user_id.
-- Fix: Map any user_id that matches profiles.auth_user_id to profiles.id.
-- =============================================================================

-- 1) If both the legacy and corrected rows exist, remove the legacy row.
DELETE FROM public.household_members hm
USING public.profiles p
WHERE hm.user_id = p.auth_user_id
  AND hm.user_id <> p.id
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm2
    WHERE hm2.household_id = hm.household_id
      AND hm2.user_id = p.id
  );

-- 2) Update any remaining legacy rows to the correct profile id.
UPDATE public.household_members hm
SET user_id = p.id
FROM public.profiles p
WHERE hm.user_id = p.auth_user_id
  AND hm.user_id <> p.id
  AND NOT EXISTS (
    SELECT 1
    FROM public.household_members hm2
    WHERE hm2.household_id = hm.household_id
      AND hm2.user_id = p.id
  );
