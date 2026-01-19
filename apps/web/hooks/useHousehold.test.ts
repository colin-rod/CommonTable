import { HouseholdService } from '@commontable/api-client';
import type {
  HouseholdMemberWithProfile,
  HouseholdInvitation,
  InviteAuthenticatedMemberInput,
  AddManagedMemberInput,
  Household,
  HouseholdId,
} from '@commontable/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuth } from './useAuth';
import { useHousehold } from './useHousehold';

import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock HouseholdService
vi.mock('@commontable/api-client', () => ({
  HouseholdService: vi.fn(),
}));

// Mock useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('useHousehold Hook', () => {
  const mockHouseholdId = 'household-123' as HouseholdId;

  const mockHousehold: Household = {
    id: mockHouseholdId,
    name: 'Test Household',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockMembers: HouseholdMemberWithProfile[] = [
    {
      profile_id: 'user-1',
      household_id: mockHouseholdId,
      role: 'admin',
      joined_at: '2024-01-01T00:00:00Z',
      profile: {
        id: 'user-1',
        display_name: 'Admin User',
        member_type: 'authenticated',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      profile_id: 'user-2',
      household_id: mockHouseholdId,
      role: 'member',
      joined_at: '2024-01-02T00:00:00Z',
      profile: {
        id: 'user-2',
        display_name: 'Regular Member',
        member_type: 'authenticated',
        avatar_url: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    },
  ];

  const mockInvitations: HouseholdInvitation[] = [
    {
      id: 'invitation-1',
      household_id: mockHouseholdId,
      email: 'newuser@example.com',
      role: 'member',
      invited_by: 'user-1',
      invited_at: '2024-01-10T00:00:00Z',
      status: 'pending',
    },
  ];

  const mockHouseholdService = {
    listMembers: vi.fn(),
    listInvitations: vi.fn(),
    inviteAuthenticatedMember: vi.fn(),
    addManagedMember: vi.fn(),
    removeMember: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(HouseholdService).mockImplementation(() => mockHouseholdService as any);
  });

  describe('Admin user', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
        householdRole: 'admin',
      } as any);
    });

    it('should load members and invitations on mount', async () => {
      mockHouseholdService.listMembers.mockResolvedValue(mockMembers);
      mockHouseholdService.listInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useHousehold());

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.members).toEqual([]);
      expect(result.current.invitations).toEqual([]);
      expect(result.current.isAdmin).toBe(true);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.members).toEqual(mockMembers);
      expect(result.current.invitations).toEqual(mockInvitations);
      expect(result.current.error).toBeNull();
      expect(mockHouseholdService.listMembers).toHaveBeenCalledWith(mockHouseholdId);
      expect(mockHouseholdService.listInvitations).toHaveBeenCalledWith(mockHouseholdId);
    });

    it('should invite authenticated member', async () => {
      mockHouseholdService.listMembers.mockResolvedValue(mockMembers);
      mockHouseholdService.listInvitations.mockResolvedValue(mockInvitations);
      mockHouseholdService.inviteAuthenticatedMember.mockResolvedValue(undefined);

      const { result } = renderHook(() => useHousehold());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const inviteInput: InviteAuthenticatedMemberInput = {
        email: 'newmember@example.com',
        role: 'member',
      };

      // Mock updated data after invite
      const updatedInvitations: HouseholdInvitation[] = [
        ...mockInvitations,
        {
          id: 'invitation-2',
          household_id: mockHouseholdId,
          email: 'newmember@example.com',
          role: 'member',
          invited_by: 'user-1',
          invited_at: '2024-01-11T00:00:00Z',
          status: 'pending',
        },
      ];

      mockHouseholdService.listInvitations.mockResolvedValue(updatedInvitations);

      await result.current.inviteMember(inviteInput);

      expect(mockHouseholdService.inviteAuthenticatedMember).toHaveBeenCalledWith(
        mockHouseholdId,
        inviteInput,
      );

      // Should refresh data
      await waitFor(() => {
        expect(result.current.invitations).toEqual(updatedInvitations);
      });
    });

    it('should add managed member', async () => {
      mockHouseholdService.listMembers.mockResolvedValue(mockMembers);
      mockHouseholdService.listInvitations.mockResolvedValue(mockInvitations);
      mockHouseholdService.addManagedMember.mockResolvedValue(undefined);

      const { result } = renderHook(() => useHousehold());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const addInput: AddManagedMemberInput = {
        display_name: 'Kid Member',
      };

      // Mock updated data after add
      const updatedMembers: HouseholdMemberWithProfile[] = [
        ...mockMembers,
        {
          profile_id: 'profile-3',
          household_id: mockHouseholdId,
          role: 'member',
          joined_at: '2024-01-11T00:00:00Z',
          profile: {
            id: 'profile-3',
            display_name: 'Kid Member',
            member_type: 'managed',
            avatar_url: null,
            created_at: '2024-01-11T00:00:00Z',
            updated_at: '2024-01-11T00:00:00Z',
          },
        },
      ];

      mockHouseholdService.listMembers.mockResolvedValue(updatedMembers);

      await result.current.addManagedMember(addInput);

      expect(mockHouseholdService.addManagedMember).toHaveBeenCalledWith(mockHouseholdId, addInput);

      // Should refresh data
      await waitFor(() => {
        expect(result.current.members).toEqual(updatedMembers);
      });
    });
  });

  describe('Regular member user', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
        householdRole: 'member',
      } as any);
    });

    it('should load members but not invitations', async () => {
      mockHouseholdService.listMembers.mockResolvedValue(mockMembers);

      const { result } = renderHook(() => useHousehold());

      expect(result.current.isAdmin).toBe(false);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.members).toEqual(mockMembers);
      expect(result.current.invitations).toEqual([]); // No invitations for non-admin
      expect(mockHouseholdService.listMembers).toHaveBeenCalledWith(mockHouseholdId);
      expect(mockHouseholdService.listInvitations).not.toHaveBeenCalled();
    });
  });

  describe('Remove member', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
        householdRole: 'admin',
      } as any);
    });

    it('should remove member and refresh data', async () => {
      mockHouseholdService.listMembers.mockResolvedValue(mockMembers);
      mockHouseholdService.listInvitations.mockResolvedValue(mockInvitations);
      mockHouseholdService.removeMember.mockResolvedValue(undefined);

      const { result } = renderHook(() => useHousehold());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const profileIdToRemove = 'user-2';

      // Mock updated data after removal
      const updatedMembers = mockMembers.filter((m) => m.profile_id !== profileIdToRemove);
      mockHouseholdService.listMembers.mockResolvedValue(updatedMembers);

      await result.current.removeMember(profileIdToRemove);

      expect(mockHouseholdService.removeMember).toHaveBeenCalledWith(mockHouseholdId, {
        profile_id: profileIdToRemove,
      });

      // Should refresh data
      await waitFor(() => {
        expect(result.current.members).toEqual(updatedMembers);
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
        householdRole: 'admin',
      } as any);
    });

    it('should handle fetch errors', async () => {
      const fetchError = new Error('Failed to fetch members');
      mockHouseholdService.listMembers.mockRejectedValue(fetchError);
      mockHouseholdService.listInvitations.mockResolvedValue([]);

      const { result } = renderHook(() => useHousehold());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.members).toEqual([]);
      expect(result.current.error).toEqual(fetchError);
    });

    it('should throw error when inviting without household', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: null,
        householdRole: null,
      } as any);

      const { result } = renderHook(() => useHousehold());

      const inviteInput: InviteAuthenticatedMemberInput = {
        email: 'test@example.com',
        role: 'member',
      };

      await expect(result.current.inviteMember(inviteInput)).rejects.toThrow(
        'No household selected',
      );
    });

    it('should throw error when adding managed member without household', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: null,
        householdRole: null,
      } as any);

      const { result } = renderHook(() => useHousehold());

      const addInput: AddManagedMemberInput = {
        display_name: 'Test Member',
      };

      await expect(result.current.addManagedMember(addInput)).rejects.toThrow(
        'No household selected',
      );
    });

    it('should throw error when removing member without household', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: null,
        householdRole: null,
      } as any);

      const { result } = renderHook(() => useHousehold());

      await expect(result.current.removeMember('user-1')).rejects.toThrow('No household selected');
    });

    it('should propagate invite member errors', async () => {
      mockHouseholdService.listMembers.mockResolvedValue(mockMembers);
      mockHouseholdService.listInvitations.mockResolvedValue(mockInvitations);

      const inviteError = new Error('Failed to invite member');
      mockHouseholdService.inviteAuthenticatedMember.mockRejectedValue(inviteError);

      const { result } = renderHook(() => useHousehold());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const inviteInput: InviteAuthenticatedMemberInput = {
        email: 'test@example.com',
        role: 'member',
      };

      await expect(result.current.inviteMember(inviteInput)).rejects.toThrow(
        'Failed to invite member',
      );
    });

    it('should propagate remove member errors', async () => {
      mockHouseholdService.listMembers.mockResolvedValue(mockMembers);
      mockHouseholdService.listInvitations.mockResolvedValue(mockInvitations);

      const removeError = new Error('Failed to remove member');
      mockHouseholdService.removeMember.mockRejectedValue(removeError);

      const { result } = renderHook(() => useHousehold());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.removeMember('user-2')).rejects.toThrow(
        'Failed to remove member',
      );
    });
  });

  describe('No household', () => {
    it('should not load data when household is null', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: null,
        householdRole: null,
      } as any);

      const { result } = renderHook(() => useHousehold());

      expect(result.current.loading).toBe(true);
      expect(result.current.members).toEqual([]);
      expect(result.current.invitations).toEqual([]);
      expect(result.current.isAdmin).toBe(false);
      expect(mockHouseholdService.listMembers).not.toHaveBeenCalled();
      expect(mockHouseholdService.listInvitations).not.toHaveBeenCalled();
    });
  });

  describe('Household changes', () => {
    it('should refetch when household changes', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
        householdRole: 'admin',
      } as any);

      mockHouseholdService.listMembers.mockResolvedValue(mockMembers);
      mockHouseholdService.listInvitations.mockResolvedValue(mockInvitations);

      const { rerender } = renderHook(() => useHousehold());

      await waitFor(() => {
        expect(mockHouseholdService.listMembers).toHaveBeenCalledWith(mockHouseholdId);
      });

      expect(mockHouseholdService.listMembers).toHaveBeenCalledTimes(1);

      // Change household
      const newHouseholdId = 'household-456' as HouseholdId;
      const newHousehold: Household = { ...mockHousehold, id: newHouseholdId };
      const newMembers: HouseholdMemberWithProfile[] = [mockMembers[0]];

      vi.mocked(useAuth).mockReturnValue({
        household: newHousehold,
        householdRole: 'admin',
      } as any);

      mockHouseholdService.listMembers.mockResolvedValue(newMembers);
      mockHouseholdService.listInvitations.mockResolvedValue([]);

      rerender();

      await waitFor(() => {
        expect(mockHouseholdService.listMembers).toHaveBeenCalledWith(newHouseholdId);
      });
    });
  });

  describe('Refresh', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
        householdRole: 'admin',
      } as any);
    });

    it('should reload data when refresh is called', async () => {
      mockHouseholdService.listMembers.mockResolvedValue(mockMembers);
      mockHouseholdService.listInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useHousehold());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockHouseholdService.listMembers).toHaveBeenCalledTimes(1);

      // Update mock to return new data
      const newMembers: HouseholdMemberWithProfile[] = [
        ...mockMembers,
        {
          profile_id: 'user-3',
          household_id: mockHouseholdId,
          role: 'member',
          joined_at: '2024-01-12T00:00:00Z',
          profile: {
            id: 'user-3',
            display_name: 'New Member',
            member_type: 'authenticated',
            avatar_url: null,
            created_at: '2024-01-12T00:00:00Z',
            updated_at: '2024-01-12T00:00:00Z',
          },
        },
      ];

      mockHouseholdService.listMembers.mockResolvedValue(newMembers);

      result.current.refresh();

      await waitFor(() => {
        expect(result.current.members).toEqual(newMembers);
      });

      expect(mockHouseholdService.listMembers).toHaveBeenCalledTimes(2);
    });
  });

  describe('Type safety', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
        householdRole: 'admin',
      } as any);
    });

    it('should have correct TypeScript types for all return values', async () => {
      mockHouseholdService.listMembers.mockResolvedValue(mockMembers);
      mockHouseholdService.listInvitations.mockResolvedValue(mockInvitations);

      const { result } = renderHook(() => useHousehold());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Type assertions (compile-time checks)
      const members: HouseholdMemberWithProfile[] = result.current.members;
      const invitations: HouseholdInvitation[] = result.current.invitations;
      const loading: boolean = result.current.loading;
      const error: Error | null = result.current.error;
      const isAdmin: boolean = result.current.isAdmin;
      const inviteMember: (input: InviteAuthenticatedMemberInput) => Promise<void> =
        result.current.inviteMember;
      const addManagedMember: (input: AddManagedMemberInput) => Promise<void> =
        result.current.addManagedMember;
      const removeMember: (profileId: string) => Promise<void> = result.current.removeMember;
      const refresh: () => void = result.current.refresh;

      expect(Array.isArray(members)).toBe(true);
      expect(Array.isArray(invitations)).toBe(true);
      expect(typeof loading).toBe('boolean');
      expect(error).toBeNull();
      expect(typeof isAdmin).toBe('boolean');
      expect(typeof inviteMember).toBe('function');
      expect(typeof addManagedMember).toBe('function');
      expect(typeof removeMember).toBe('function');
      expect(typeof refresh).toBe('function');
    });
  });
});
