-- =============================================================================
-- Migration: Create household_invitations table
-- =============================================================================
-- This migration creates the household_invitations table for managing email-based
-- invitations to households. Admins can invite new members via email, and invitees
-- can accept invitations via a secure token link.
--
-- Features:
-- - Unique invitation per email per household
-- - Token-based acceptance flow
-- - Status tracking (pending, accepted, declined, expired)
-- - Audit trail (invited_at, accepted_at timestamps)
-- =============================================================================

-- Step 1: Create household_invitations table
CREATE TABLE IF NOT EXISTS public.household_invitations (
  id UUID DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  inviter_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token TEXT NOT NULL UNIQUE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (household_id, invitee_email)
);

-- Step 2: Create indexes for common queries

-- Index for token-based lookup (invitation acceptance flow)
CREATE INDEX IF NOT EXISTS idx_household_invitations_token
  ON public.household_invitations(token);

-- Index for listing household's invitations
CREATE INDEX IF NOT EXISTS idx_household_invitations_household
  ON public.household_invitations(household_id);

-- Index for finding invitations by email (check if user already invited)
CREATE INDEX IF NOT EXISTS idx_household_invitations_email
  ON public.household_invitations(invitee_email);

-- Index for filtering by status (pending invitations query)
CREATE INDEX IF NOT EXISTS idx_household_invitations_status
  ON public.household_invitations(household_id, status);

-- Step 3: Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_household_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_household_invitations_updated_at
  BEFORE UPDATE ON public.household_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_household_invitations_updated_at();

-- Step 4: Add comment for documentation
COMMENT ON TABLE public.household_invitations IS 'Stores email-based invitations to households. Admins can invite new members, who can accept via secure token links.';
COMMENT ON COLUMN public.household_invitations.token IS 'Secure random token for invitation acceptance link. Must be unique across all invitations.';
COMMENT ON COLUMN public.household_invitations.status IS 'Invitation status: pending (sent, not yet accepted), accepted (user joined household), declined (user rejected), expired (invitation expired)';
