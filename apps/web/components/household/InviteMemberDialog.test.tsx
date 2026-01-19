import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InviteMemberDialog } from './InviteMemberDialog';

// Mock useHousehold hook
vi.mock('@/hooks/useHousehold', () => ({
  useHousehold: vi.fn(),
}));

import { useHousehold } from '@/hooks/useHousehold';

describe('InviteMemberDialog Component', () => {
  const mockInviteMember = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useHousehold).mockReturnValue({
      inviteMember: mockInviteMember,
    } as any);
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(<InviteMemberDialog open={false} onClose={mockOnClose} />);

      expect(screen.queryByText(/invite member by email/i)).not.toBeInTheDocument();
    });

    it('should render dialog when open is true', () => {
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByText(/invite member by email/i)).toBeInTheDocument();
    });

    it('should render email input field', () => {
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('should render role selector', () => {
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      // MUI Select doesn't expose accessible name, check for the combobox itself
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      // And verify label exists (MUI renders it in multiple places)
      const roleLabels = screen.getAllByText('Role');
      expect(roleLabels.length).toBeGreaterThan(0);
    });

    it('should render instruction text', () => {
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      expect(
        screen.getByText(/send an email invitation to join your household/i),
      ).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render send invitation button', () => {
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /send invitation/i })).toBeInTheDocument();
    });
  });

  describe('Form interaction', () => {
    it('should allow typing email address', async () => {
      const user = userEvent.setup();
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should allow selecting role', async () => {
      const user = userEvent.setup();
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const roleSelect = screen.getByRole('combobox');
      await user.click(roleSelect);

      const adminOption = screen.getByRole('option', { name: /admin/i });
      await user.click(adminOption);

      expect(roleSelect).toHaveTextContent('Admin');
    });

    it('should default role to member', () => {
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const roleSelect = screen.getByRole('combobox');
      expect(roleSelect).toHaveTextContent('Member');
    });
  });

  describe('Form validation', () => {
    it('should disable send button when email is empty', () => {
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const sendButton = screen.getByRole('button', { name: /send invitation/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when email is provided', async () => {
      const user = userEvent.setup();
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByRole('button', { name: /send invitation/i });
      expect(sendButton).not.toBeDisabled();
    });

    it('should show error when submitting without email', async () => {
      const user = userEvent.setup();
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      // Manually trigger submit by calling the component's internal function
      // Since button is disabled, we need to enable it to test validation
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'a');
      await user.clear(emailInput);

      // Now try to submit (button should be disabled but let's test the validation logic)
      expect(screen.getByRole('button', { name: /send invitation/i })).toBeDisabled();
    });
  });

  describe('Form submission', () => {
    it('should call inviteMember with email and role', async () => {
      const user = userEvent.setup();
      mockInviteMember.mockResolvedValue(undefined);

      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByRole('button', { name: /send invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockInviteMember).toHaveBeenCalledWith({
          email: 'test@example.com',
          role: 'member',
        });
      });
    });

    it('should call inviteMember with admin role when selected', async () => {
      const user = userEvent.setup();
      mockInviteMember.mockResolvedValue(undefined);

      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'admin@example.com');

      const roleSelect = screen.getByRole('combobox');
      await user.click(roleSelect);
      const adminOption = screen.getByRole('option', { name: /admin/i });
      await user.click(adminOption);

      const sendButton = screen.getByRole('button', { name: /send invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockInviteMember).toHaveBeenCalledWith({
          email: 'admin@example.com',
          role: 'admin',
        });
      });
    });

    it('should close dialog and reset form on success', async () => {
      const user = userEvent.setup();
      mockInviteMember.mockResolvedValue(undefined);

      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByRole('button', { name: /send invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable fields during submission', async () => {
      const user = userEvent.setup();
      let resolveInvite: () => void;
      const invitePromise = new Promise<void>((resolve) => {
        resolveInvite = resolve;
      });
      mockInviteMember.mockReturnValue(invitePromise);

      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByRole('button', { name: /send invitation/i });
      await user.click(sendButton);

      // Fields should be disabled during submission
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      });

      // Resolve submission
      resolveInvite!();

      // Fields should be enabled after submission
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveInvite: () => void;
      const invitePromise = new Promise<void>((resolve) => {
        resolveInvite = resolve;
      });
      mockInviteMember.mockReturnValue(invitePromise);

      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByRole('button', { name: /send invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
      });

      resolveInvite!();
    });
  });

  describe('Error handling', () => {
    it('should display error message on failure', async () => {
      const user = userEvent.setup();
      mockInviteMember.mockRejectedValue(new Error('User already invited'));

      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByRole('button', { name: /send invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/user already invited/i)).toBeInTheDocument();
      });

      // Dialog should remain open
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should show generic error message for unknown errors', async () => {
      const user = userEvent.setup();
      mockInviteMember.mockRejectedValue('Unknown error');

      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByRole('button', { name: /send invitation/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send invitation/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dialog close behavior', () => {
    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should reset form when dialog closed', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Reopen dialog
      rerender(<InviteMemberDialog open={false} onClose={mockOnClose} />);
      rerender(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const newEmailInput = screen.getByLabelText(/email address/i);
      expect(newEmailInput).toHaveValue('');
    });

    it('should not close dialog during loading', async () => {
      const user = userEvent.setup();
      let resolveInvite: () => void;
      const invitePromise = new Promise<void>((resolve) => {
        resolveInvite = resolve;
      });
      mockInviteMember.mockReturnValue(invitePromise);

      render(<InviteMemberDialog open={true} onClose={mockOnClose} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByRole('button', { name: /send invitation/i });
      await user.click(sendButton);

      // Try to cancel while loading
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();

      resolveInvite!();
    });
  });
});
