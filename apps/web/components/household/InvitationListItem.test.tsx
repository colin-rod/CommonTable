import type { HouseholdInvitation } from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InvitationListItem } from './InvitationListItem';

describe('InvitationListItem Component', () => {
  const mockConfirm = vi.fn();
  const mockAlert = vi.fn();

  const mockInvitation: HouseholdInvitation = {
    id: 'invitation-123' as any,
    household_id: 'household-1' as any,
    invitee_email: 'john@example.com',
    role: 'member',
    invited_by: 'user-1' as any,
    invited_at: new Date('2024-01-15T10:00:00Z'),
    status: 'pending',
  };

  const mockAdminInvitation: HouseholdInvitation = {
    ...mockInvitation,
    id: 'invitation-456' as any,
    invitee_email: 'admin@example.com',
    role: 'admin',
    invited_at: new Date('2024-01-20T15:30:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.confirm and window.alert
    global.window.confirm = mockConfirm;
    global.window.alert = mockAlert;
  });

  describe('Rendering', () => {
    it('should render invitee email', () => {
      render(<InvitationListItem invitation={mockInvitation} />);

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should render role', () => {
      render(<InvitationListItem invitation={mockInvitation} />);

      expect(screen.getByText(/member/i)).toBeInTheDocument();
    });

    it('should render admin role', () => {
      render(<InvitationListItem invitation={mockAdminInvitation} />);

      expect(screen.getByText(/admin · invited/i)).toBeInTheDocument();
    });

    it('should render invitation date', () => {
      render(<InvitationListItem invitation={mockInvitation} />);

      expect(screen.getByText(/invited/i)).toBeInTheDocument();
    });

    it('should format invitation date correctly', () => {
      render(<InvitationListItem invitation={mockInvitation} />);

      const invitedDate = new Date('2024-01-15T10:00:00Z').toLocaleDateString();
      expect(screen.getByText(new RegExp(invitedDate, 'i'))).toBeInTheDocument();
    });

    it('should render pending status chip', () => {
      render(<InvitationListItem invitation={mockInvitation} />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(<InvitationListItem invitation={mockInvitation} />);

      // Icon-only button - use testid from icon
      const cancelButton = screen.getByTestId('CancelIcon').closest('button');
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Cancel invitation flow', () => {
    it('should show confirmation dialog when cancel clicked', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      render(<InvitationListItem invitation={mockInvitation} />);

      const cancelButton = screen.getByTestId('CancelIcon').closest('button')!;
      await user.click(cancelButton);

      expect(mockConfirm).toHaveBeenCalledWith('Cancel invitation for john@example.com?');
    });

    it('should not cancel when user declines confirmation', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      render(<InvitationListItem invitation={mockInvitation} />);

      const cancelButton = screen.getByTestId('CancelIcon').closest('button')!;
      await user.click(cancelButton);

      // Button should not be disabled if user declined
      expect(cancelButton).not.toBeDisabled();
    });

    it('should handle cancellation when user confirms', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);

      render(<InvitationListItem invitation={mockInvitation} />);

      const cancelButton = screen.getByTestId('CancelIcon').closest('button')!;
      await user.click(cancelButton);

      // Note: Component has TODO for actual implementation
      // The cancellation flow exists but no actual API call is made
      // Button state changes are synchronous, so no loading state is visible
      expect(mockConfirm).toHaveBeenCalledWith('Cancel invitation for john@example.com?');
    });

    it('should show confirmation for admin invitations', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      render(<InvitationListItem invitation={mockAdminInvitation} />);

      const cancelButton = screen.getByTestId('CancelIcon').closest('button')!;
      await user.click(cancelButton);

      expect(mockConfirm).toHaveBeenCalledWith('Cancel invitation for admin@example.com?');
    });
  });

  describe('Secondary text format', () => {
    it('should show role, invited date, and pending chip', () => {
      render(<InvitationListItem invitation={mockInvitation} />);

      // Check for role and "Invited" text
      expect(screen.getByText(/member · invited/i)).toBeInTheDocument();
      // Check for pending chip
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should show admin role correctly', () => {
      render(<InvitationListItem invitation={mockAdminInvitation} />);

      expect(screen.getByText(/admin · invited/i)).toBeInTheDocument();
    });

    it('should format date with separators', () => {
      render(<InvitationListItem invitation={mockInvitation} />);

      const invitedDate = new Date('2024-01-15T10:00:00Z').toLocaleDateString();
      // Should show "role · Invited date · Pending"
      const secondaryText = screen.getByText(/member · invited/i);
      expect(secondaryText.textContent).toContain('·');
      expect(secondaryText.textContent).toContain(invitedDate);
    });
  });

  describe('Status chip', () => {
    it('should render pending status chip with small size', () => {
      const { container } = render(<InvitationListItem invitation={mockInvitation} />);

      const chip = screen.getByText('Pending').closest('.MuiChip-root');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass('MuiChip-sizeSmall');
    });

    it('should render chip with correct label', () => {
      render(<InvitationListItem invitation={mockInvitation} />);

      const chip = screen.getByText('Pending');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Email display', () => {
    it('should display full email address', () => {
      render(<InvitationListItem invitation={mockInvitation} />);

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should display long email addresses', () => {
      const longEmailInvitation = {
        ...mockInvitation,
        invitee_email: 'very.long.email.address@example.com',
      };

      render(<InvitationListItem invitation={longEmailInvitation} />);

      expect(screen.getByText('very.long.email.address@example.com')).toBeInTheDocument();
    });
  });

  describe('Component TODO note', () => {
    it('should handle cancellation flow gracefully despite TODO', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockConfirm.mockReturnValue(true);

      render(<InvitationListItem invitation={mockInvitation} />);

      const cancelButton = screen.getByTestId('CancelIcon').closest('button')!;
      await user.click(cancelButton);

      // Component has TODO for actual implementation
      // This test verifies the UI behavior works even without backend implementation
      expect(mockConfirm).toHaveBeenCalled();

      // No console errors should be logged for unimplemented TODO
      // (Component handles this gracefully in try/catch)
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
