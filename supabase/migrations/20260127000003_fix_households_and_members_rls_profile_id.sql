-- =============================================================================
-- Migration: Fix households + household_members RLS to use profile IDs
-- =============================================================================
-- Root cause: Policies referenced auth.uid(), but household_members.user_id
-- stores profiles.id (not auth.users.id). This blocked access for valid users.
-- Fix: Use helper functions that resolve profile/household correctly.
-- =============================================================================

-- Fix households SELECT policy to rely on profile-aware helper
DROP POLICY IF EXISTS "Users can view their household" ON public.households;
CREATE POLICY "Users can view their household" ON public.households
  FOR SELECT
  USING (id = public.get_user_household_id());

-- Fix household_members self-delete policy to match profiles.id
DROP POLICY IF EXISTS "Users can leave a household" ON public.household_members;
CREATE POLICY "Users can leave a household" ON public.household_members
  FOR DELETE
  USING (user_id = public.get_user_profile_id());
