import type { HouseholdMemberWithProfile } from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MemberListItem } from './MemberListItem';

// Mock useHousehold hook
vi.mock('@/hooks/useHousehold', () => ({
  useHousehold: vi.fn(),
}));

import { useHousehold } from '@/hooks/useHousehold';

describe('MemberListItem Component', () => {
  const mockRemoveMember = vi.fn();
  const mockUpdateMemberRole = vi.fn();
  const mockConfirm = vi.fn();
  const mockAlert = vi.fn();

  const mockAuthenticatedMember: HouseholdMemberWithProfile = {
    user_id: 'profile-123' as any,
    household_id: 'household-1' as any,
    role: 'member',
    joined_at: '2024-01-15T10:00:00Z',
    profile: {
      id: 'profile-123' as any,
      auth_user_id: 'user-123' as any,
      display_name: 'John Doe',
      avatar_url: null,
      member_type: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  };

  const mockManagedMember: HouseholdMemberWithProfile = {
    user_id: 'profile-456' as any,
    household_id: 'household-1' as any,
    role: 'member',
    joined_at: '2024-01-20T10:00:00Z',
    profile: {
      id: 'profile-456' as any,
      auth_user_id: null,
      display_name: 'Little Jane',
      avatar_url: null,
      member_type: 'managed',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  };

  const mockAdminMember: HouseholdMemberWithProfile = {
    ...mockAuthenticatedMember,
    role: 'admin',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useHousehold).mockReturnValue({
      removeMember: mockRemoveMember,
      updateMemberRole: mockUpdateMemberRole,
    } as any);

    // Mock window.confirm and window.alert
    global.window.confirm = mockConfirm;
    global.window.alert = mockAlert;
  });

  describe('Rendering', () => {
    it('should render member display name', () => {
      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={false} />);

      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });

    it('should render managed member with type label', () => {
      render(<MemberListItem member={mockManagedMember} isAdmin={false} />);

      expect(screen.getByText(/little jane \(managed\)/i)).toBeInTheDocument();
    });

    it('should not add type label for authenticated members', () => {
      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={false} />);

      const primaryText = screen.getByText(/john doe/i);
      expect(primaryText.textContent).toBe('John Doe');
      expect(primaryText.textContent).not.toContain('(managed)');
    });

    it('should render member role', () => {
      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={false} />);

      // Role appears in secondary text
      expect(screen.getByText(/member · joined/i)).toBeInTheDocument();
    });

    it('should render admin role', () => {
      render(<MemberListItem member={mockAdminMember} isAdmin={false} />);

      // Role appears in secondary text
      expect(screen.getByText(/admin · joined/i)).toBeInTheDocument();
    });

    it('should render join date', () => {
      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={false} />);

      // Date formatting may vary by locale
      expect(screen.getByText(/joined/i)).toBeInTheDocument();
    });

    it('should format join date correctly', () => {
      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={false} />);

      const joinDate = new Date('2024-01-15T10:00:00Z').toLocaleDateString();
      expect(screen.getByText(new RegExp(joinDate, 'i'))).toBeInTheDocument();
    });
  });

  describe('Delete button visibility', () => {
    it('should show delete button when isAdmin is true', () => {
      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

      const deleteButton = screen.getByTestId('DeleteIcon').closest('button')!;
      expect(deleteButton).toBeInTheDocument();
    });

    it('should not show delete button when isAdmin is false', () => {
      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={false} />);

      expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument();
    });
  });

  describe('Remove member flow', () => {
    it('should show confirmation dialog when delete clicked', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

      const deleteButton = screen.getByTestId('DeleteIcon').closest('button')!;
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith('Remove John Doe from household?');
    });

    it('should call removeMember when user confirms', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      mockRemoveMember.mockResolvedValue(undefined);

      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

      const deleteButton = screen.getByTestId('DeleteIcon').closest('button')!;
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockRemoveMember).toHaveBeenCalledWith('profile-123');
      });
    });

    it('should not call removeMember when user cancels', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

      const deleteButton = screen.getByTestId('DeleteIcon').closest('button')!;
      await user.click(deleteButton);

      expect(mockRemoveMember).not.toHaveBeenCalled();
    });

    it('should disable delete button during removal', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);

      let resolveRemove: () => void;
      const removePromise = new Promise<void>((resolve) => {
        resolveRemove = resolve;
      });
      mockRemoveMember.mockReturnValue(removePromise);

      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

      const deleteButton = screen.getByTestId('DeleteIcon').closest('button')!;
      await user.click(deleteButton);

      // Button should be disabled during removal
      await waitFor(() => {
        expect(deleteButton).toBeDisabled();
      });

      // Resolve removal
      resolveRemove!();
    });

    it('should handle managed member removal', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      mockRemoveMember.mockResolvedValue(undefined);

      render(<MemberListItem member={mockManagedMember} isAdmin={true} />);

      const deleteButton = screen.getByTestId('DeleteIcon').closest('button')!;
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith('Remove Little Jane from household?');

      await waitFor(() => {
        expect(mockRemoveMember).toHaveBeenCalledWith('profile-456');
      });
    });
  });

  describe('Error handling', () => {
    it('should show alert when removal fails', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      mockRemoveMember.mockRejectedValue(new Error('Network error'));

      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

      const deleteButton = screen.getByTestId('DeleteIcon').closest('button')!;
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to remove member. Please try again.');
      });
    });

    it('should re-enable button after error', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      mockRemoveMember.mockRejectedValue(new Error('Network error'));

      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

      const deleteButton = screen.getByTestId('DeleteIcon').closest('button')!;
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });

      // Button should be enabled again after error
      await waitFor(() => {
        expect(deleteButton).not.toBeDisabled();
      });
    });

    it('should log error to console', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockConfirm.mockReturnValue(true);
      const error = new Error('Network error');
      mockRemoveMember.mockRejectedValue(error);

      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

      const deleteButton = screen.getByTestId('DeleteIcon').closest('button')!;
      await user.click(deleteButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to remove member:', error);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Member type display', () => {
    it('should show managed type for managed members', () => {
      render(<MemberListItem member={mockManagedMember} isAdmin={false} />);

      expect(screen.getByText(/little jane \(managed\)/i)).toBeInTheDocument();
    });

    it('should not show type for authenticated members', () => {
      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={false} />);

      const text = screen.getByText(/john doe/i);
      expect(text.textContent).not.toContain('(managed)');
      expect(text.textContent).not.toContain('(authenticated)');
    });
  });

  describe('Secondary text format', () => {
    it('should show role and join date with separator', () => {
      render(<MemberListItem member={mockAuthenticatedMember} isAdmin={false} />);

      // Check for role, separator, and "Joined" text
      expect(screen.getByText(/member · joined/i)).toBeInTheDocument();
    });

    it('should show admin role correctly', () => {
      render(<MemberListItem member={mockAdminMember} isAdmin={false} />);

      expect(screen.getByText(/admin · joined/i)).toBeInTheDocument();
    });
  });

  describe('Role management', () => {
    describe('Role chip display', () => {
      it('should show admin role chip for admin members', () => {
        render(<MemberListItem member={mockAdminMember} isAdmin={true} />);

        const chip = screen.getByText('admin');
        expect(chip).toBeInTheDocument();
        expect(chip.tagName).toBe('SPAN'); // MUI Chip renders as span
      });

      it('should show member role chip for regular members', () => {
        render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

        const chip = screen.getByText('member');
        expect(chip).toBeInTheDocument();
      });
    });

    describe('Role management menu', () => {
      it('should show menu button for admins', () => {
        render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        expect(menuButton).toBeInTheDocument();
      });

      it('should not show menu button for non-admins', () => {
        render(<MemberListItem member={mockAuthenticatedMember} isAdmin={false} />);

        expect(screen.queryByLabelText(/manage member/i)).not.toBeInTheDocument();
      });

      it('should open menu when menu button clicked', async () => {
        const user = userEvent.setup();

        render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        // Menu should be open with options
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      it('should show "Promote to Admin" option for regular members', async () => {
        const user = userEvent.setup();

        render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        expect(screen.getByText(/promote to admin/i)).toBeInTheDocument();
      });

      it('should show "Demote to Member" option for admin members', async () => {
        const user = userEvent.setup();

        render(<MemberListItem member={mockAdminMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        expect(screen.getByText(/demote to member/i)).toBeInTheDocument();
      });

      it('should show remove option in menu', async () => {
        const user = userEvent.setup();

        render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        expect(screen.getByText(/remove from household/i)).toBeInTheDocument();
      });
    });

    describe('Promote to admin', () => {
      it('should show confirmation dialog when promote clicked', async () => {
        const user = userEvent.setup();
        mockConfirm.mockReturnValue(false);

        render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        const promoteOption = screen.getByText(/promote to admin/i);
        await user.click(promoteOption);

        expect(mockConfirm).toHaveBeenCalledWith(
          'Promote John Doe to admin? They will have full access to household settings.',
        );
      });

      it('should call updateMemberRole when user confirms promotion', async () => {
        const user = userEvent.setup();
        mockConfirm.mockReturnValue(true);
        mockUpdateMemberRole.mockResolvedValue(undefined);

        render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        const promoteOption = screen.getByText(/promote to admin/i);
        await user.click(promoteOption);

        await waitFor(() => {
          expect(mockUpdateMemberRole).toHaveBeenCalledWith('profile-123', 'admin');
        });
      });

      it('should not promote managed members to admin', async () => {
        const user = userEvent.setup();

        render(<MemberListItem member={mockManagedMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        // Promote option should be disabled for managed members
        const promoteOption = screen.getByText(/promote to admin/i).closest('li')!;
        expect(promoteOption).toHaveAttribute('aria-disabled', 'true');
      });
    });

    describe('Demote to member', () => {
      it('should show confirmation dialog when demote clicked', async () => {
        const user = userEvent.setup();
        mockConfirm.mockReturnValue(false);

        render(<MemberListItem member={mockAdminMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        const demoteOption = screen.getByText(/demote to member/i);
        await user.click(demoteOption);

        expect(mockConfirm).toHaveBeenCalledWith(
          'Demote John Doe to member? They will lose access to household settings.',
        );
      });

      it('should call updateMemberRole when user confirms demotion', async () => {
        const user = userEvent.setup();
        mockConfirm.mockReturnValue(true);
        mockUpdateMemberRole.mockResolvedValue(undefined);

        render(<MemberListItem member={mockAdminMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        const demoteOption = screen.getByText(/demote to member/i);
        await user.click(demoteOption);

        await waitFor(() => {
          expect(mockUpdateMemberRole).toHaveBeenCalledWith('profile-123', 'member');
        });
      });

      it('should show error alert when demotion fails (last admin)', async () => {
        const user = userEvent.setup();
        mockConfirm.mockReturnValue(true);
        mockUpdateMemberRole.mockRejectedValue(new Error('Cannot demote the last admin'));

        render(<MemberListItem member={mockAdminMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        const demoteOption = screen.getByText(/demote to member/i);
        await user.click(demoteOption);

        await waitFor(() => {
          expect(mockAlert).toHaveBeenCalledWith('Cannot demote the last admin');
        });
      });
    });

    describe('Error handling for role updates', () => {
      it('should show alert when promotion fails', async () => {
        const user = userEvent.setup();
        mockConfirm.mockReturnValue(true);
        mockUpdateMemberRole.mockRejectedValue(new Error('Network error'));

        render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        const promoteOption = screen.getByText(/promote to admin/i);
        await user.click(promoteOption);

        await waitFor(() => {
          expect(mockAlert).toHaveBeenCalledWith('Network error');
        });
      });

      it('should log error to console on role update failure', async () => {
        const user = userEvent.setup();
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        mockConfirm.mockReturnValue(true);
        const error = new Error('Network error');
        mockUpdateMemberRole.mockRejectedValue(error);

        render(<MemberListItem member={mockAuthenticatedMember} isAdmin={true} />);

        const menuButton = screen.getByLabelText(/manage member/i);
        await user.click(menuButton);

        const promoteOption = screen.getByText(/promote to admin/i);
        await user.click(promoteOption);

        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update member role:', error);
        });

        consoleErrorSpy.mockRestore();
      });
    });
  });
});
