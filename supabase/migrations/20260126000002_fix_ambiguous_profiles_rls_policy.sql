-- =============================================================================
-- Migration: Fix ambiguous column reference in profiles RLS policy
-- =============================================================================
-- This migration fixes the PostgreSQL error 42P17 (ambiguous column)
-- that occurs when querying profiles table after signup.
--
-- The profiles_household_visibility policy had an ambiguous reference to
-- "profiles.id" which could refer to either:
-- - The outer profiles table being queried
-- - The aliased "p" table in the subquery
--
-- Solution: Explicitly qualify the table reference as "public.profiles.id"
-- =============================================================================

-- Drop and recreate the policy with explicit table qualification
DROP POLICY IF EXISTS profiles_household_visibility ON public.profiles;

CREATE POLICY profiles_household_visibility ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm1
      INNER JOIN public.household_members hm2
        ON hm1.household_id = hm2.household_id
      INNER JOIN public.profiles p ON hm1.user_id = p.id
      WHERE p.auth_user_id = auth.uid()
        AND hm2.user_id = public.profiles.id  -- FIX: Explicitly qualify outer table
    )
  );

COMMENT ON POLICY profiles_household_visibility ON public.profiles IS
  'Allows users to view profiles of members in their household. Uses explicit table qualification to avoid ambiguous column references.';
