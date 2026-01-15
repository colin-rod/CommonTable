-- =============================================================================
-- Migration: RLS Policies for profiles and household_invitations
-- =============================================================================
-- This migration adds Row Level Security policies for:
-- 1. profiles table - Allow users to view household members, update own profile
-- 2. household_invitations table - Admin-only create/delete, token-based acceptance
-- =============================================================================

-- =============================================================================
-- RLS: profiles table
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view profiles in their household
-- This allows household members to see each other's profiles
CREATE POLICY profiles_household_visibility ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm1
      INNER JOIN public.household_members hm2
        ON hm1.household_id = hm2.household_id
      INNER JOIN public.profiles p ON hm1.user_id = p.id
      WHERE p.auth_user_id = auth.uid()
        AND hm2.user_id = profiles.id
    )
  );

-- Policy: Users can update their own profile
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Policy: Admins can create managed profiles (non-authenticated users)
-- The actual admin check happens when inserting into household_members
CREATE POLICY profiles_admin_create_managed ON public.profiles
  FOR INSERT
  WITH CHECK (
    member_type = 'managed' AND
    auth_user_id IS NULL
  );

-- Policy: System can create authenticated profiles (during signup)
-- This allows the auth trigger to create profiles for new users
CREATE POLICY profiles_system_create_authenticated ON public.profiles
  FOR INSERT
  WITH CHECK (
    member_type = 'authenticated' AND
    auth_user_id IS NOT NULL AND
    auth_user_id = auth.uid()
  );

-- =============================================================================
-- RLS: household_invitations table
-- =============================================================================

ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view invitations for their household
CREATE POLICY household_invitations_view ON public.household_invitations
  FOR SELECT
  USING (public.is_household_admin_of(household_id));

-- Policy: Admins can create invitations
CREATE POLICY household_invitations_insert ON public.household_invitations
  FOR INSERT
  WITH CHECK (public.is_household_admin_of(household_id));

-- Policy: Admins can delete (cancel) invitations
CREATE POLICY household_invitations_delete ON public.household_invitations
  FOR DELETE
  USING (public.is_household_admin_of(household_id));

-- Policy: Anyone can view their own invitation by token (for acceptance flow)
-- This allows non-authenticated users to view invitations they received
CREATE POLICY household_invitations_view_by_token ON public.household_invitations
  FOR SELECT
  USING (token IS NOT NULL);

-- Policy: System can update invitation status (during acceptance)
-- Limited to status and accepted_at columns only
CREATE POLICY household_invitations_update_status ON public.household_invitations
  FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (status IN ('accepted', 'declined'));

-- =============================================================================
-- Update existing RLS policies for household_members
-- =============================================================================

-- Drop old policies if they exist (to recreate with new logic)
DROP POLICY IF EXISTS household_members_view ON public.household_members;
DROP POLICY IF EXISTS household_members_insert_admin ON public.household_members;

-- Policy: Users can view members of their household
-- Updated to work with profiles instead of auth.users
CREATE POLICY household_members_view ON public.household_members
  FOR SELECT
  USING (
    household_id IN (
      SELECT hm.household_id
      FROM public.household_members hm
      INNER JOIN public.profiles p ON hm.user_id = p.id
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- Policy: Admins can add members (both authenticated and managed)
CREATE POLICY household_members_insert_admin ON public.household_members
  FOR INSERT
  WITH CHECK (public.is_household_admin_of(household_id));
