import { HouseholdService } from '@commontable/api-client';
import type {
  HouseholdMemberWithProfile,
  HouseholdInvitation,
  InviteAuthenticatedMemberInput,
  AddManagedMemberInput,
  ProfileId,
  InvitationId,
} from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuth } from './useAuth';

import {
  updateHouseholdName as updateHouseholdNameAction,
  updateMemberRole as updateMemberRoleAction,
  resendInvitation as resendInvitationAction,
  cancelInvitation as cancelInvitationAction,
} from '@/app/actions/household';
import { createClient } from '@/lib/supabase/client';

/**
 * useHousehold Hook
 *
 * Manages household member operations and state
 *
 * Provides:
 * - List of household members (authenticated + managed)
 * - List of pending invitations (admin only)
 * - Actions: invite member, add managed member, remove member
 * - Loading and error states
 */
export function useHousehold() {
  const { household, householdRole } = useAuth();
  const [members, setMembers] = useState<HouseholdMemberWithProfile[]>([]);
  const [invitations, setInvitations] = useState<HouseholdInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const householdService = useMemo(() => new HouseholdService(supabase), [supabase]);

  const isAdmin = householdRole === 'admin';

  /**
   * Load household members and invitations
   */
  const loadData = useCallback(async () => {
    if (!household?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [membersData, invitationsData] = await Promise.all([
        householdService.listMembers(household.id),
        isAdmin ? householdService.listInvitations(household.id) : Promise.resolve([]),
      ]);

      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (err) {
      setError(err as Error);
      console.error('useHousehold.loadData failed:', err);
    } finally {
      setLoading(false);
    }
  }, [household?.id, isAdmin, householdService]);

  // Load household data on mount and when household changes
  useEffect(() => {
    if (household?.id) {
      void loadData();
    }
  }, [household?.id, loadData]);

  /**
   * Invite authenticated user via email
   */
  const inviteMember = useCallback(
    async (input: InviteAuthenticatedMemberInput) => {
      if (!household?.id) {
        throw new Error('No household selected');
      }

      try {
        await householdService.inviteAuthenticatedMember(household.id, input);
        await loadData(); // Refresh data
      } catch (err) {
        console.error('useHousehold.inviteMember failed:', err);
        throw err;
      }
    },
    [household?.id, householdService, loadData],
  );

  /**
   * Add managed member (non-authenticated, e.g., kids)
   */
  const addManagedMember = useCallback(
    async (input: AddManagedMemberInput) => {
      if (!household?.id) {
        throw new Error('No household selected');
      }

      try {
        await householdService.addManagedMember(household.id, input);
        await loadData(); // Refresh data
      } catch (err) {
        console.error('useHousehold.addManagedMember failed:', err);
        throw err;
      }
    },
    [household?.id, householdService, loadData],
  );

  /**
   * Remove member from household
   */
  const removeMember = useCallback(
    async (profileId: string) => {
      if (!household?.id) {
        throw new Error('No household selected');
      }

      try {
        await householdService.removeMember(household.id, { profile_id: profileId });
        await loadData(); // Refresh data
      } catch (err) {
        console.error('useHousehold.removeMember failed:', err);
        throw err;
      }
    },
    [household?.id, householdService, loadData],
  );

  /**
   * Refresh household data
   */
  const refresh = useCallback(() => {
    void loadData();
  }, [loadData]);

  /**
   * Update household name
   */
  const updateHouseholdName = useCallback(
    async (name: string) => {
      if (!household?.id) {
        throw new Error('No household selected');
      }

      try {
        const result = await updateHouseholdNameAction(household.id, name);

        if (!result.success) {
          throw new Error(result.error.message);
        }

        // Update local household state optimistically (if needed via useAuth)
        await loadData();
      } catch (err) {
        console.error('useHousehold.updateHouseholdName failed:', err);
        throw err;
      }
    },
    [household?.id, loadData],
  );

  /**
   * Update member role (promote to admin or demote to member)
   */
  const updateMemberRole = useCallback(
    async (userId: ProfileId, newRole: 'admin' | 'member') => {
      if (!household?.id) {
        throw new Error('No household selected');
      }

      try {
        const result = await updateMemberRoleAction(household.id, userId, newRole);

        if (!result.success) {
          throw new Error(result.error.message);
        }

        // Update local members state optimistically
        setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m)));

        await loadData(); // Refresh to ensure consistency
      } catch (err) {
        console.error('useHousehold.updateMemberRole failed:', err);
        throw err;
      }
    },
    [household?.id, loadData],
  );

  /**
   * Resend invitation email
   */
  const resendInvitation = useCallback(async (invitationId: InvitationId) => {
    try {
      const result = await resendInvitationAction(invitationId);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      // Update local invitation timestamp optimistically
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId ? { ...inv, invited_at: new Date().toISOString() } : inv,
        ),
      );
    } catch (err) {
      console.error('useHousehold.resendInvitation failed:', err);
      throw err;
    }
  }, []);

  /**
   * Cancel invitation
   */
  const cancelInvitation = useCallback(async (invitationId: InvitationId) => {
    try {
      const result = await cancelInvitationAction(invitationId);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      // Remove invitation from local state
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (err) {
      console.error('useHousehold.cancelInvitation failed:', err);
      throw err;
    }
  }, []);

  return {
    household,
    members,
    invitations,
    loading,
    error,
    isAdmin,
    inviteMember,
    addManagedMember,
    removeMember,
    updateHouseholdName,
    updateMemberRole,
    resendInvitation,
    cancelInvitation,
    refresh,
  };
}
