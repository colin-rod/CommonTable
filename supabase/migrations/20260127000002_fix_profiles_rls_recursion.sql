-- =============================================================================
-- Migration: Fix profiles RLS infinite recursion + allow self-access on signup
-- =============================================================================
-- Root cause: profiles SELECT policy queried public.profiles in its own USING
-- clause, triggering 42P17 "infinite recursion detected".
-- Fix: Avoid querying profiles inside profiles policy; use security-definer
-- helper to get current profile id, and add a self-access policy for signup.
-- =============================================================================

-- Drop prior household visibility policy that self-referenced profiles
DROP POLICY IF EXISTS profiles_household_visibility ON public.profiles;

-- Allow users to always read their own profile (needed during signup before household exists)
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Allow users to view profiles of members in their household without
-- selecting from public.profiles inside the policy (prevents recursion)
CREATE POLICY profiles_household_visibility ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.household_members hm1
      INNER JOIN public.household_members hm2
        ON hm1.household_id = hm2.household_id
      WHERE hm1.user_id = public.get_user_profile_id()
        AND hm2.user_id = public.profiles.id
    )
  );

COMMENT ON POLICY profiles_select_own ON public.profiles IS
  'Allows authenticated users to read their own profile by auth_user_id (signup-safe).';
COMMENT ON POLICY profiles_household_visibility ON public.profiles IS
  'Allows users to read profiles of members in their household without recursive self-query.';
