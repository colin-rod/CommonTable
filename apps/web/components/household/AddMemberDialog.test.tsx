import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AddMemberDialog } from './AddMemberDialog';

// Mock useHousehold hook
vi.mock('@/hooks/useHousehold', () => ({
  useHousehold: vi.fn(),
}));

import { useHousehold } from '@/hooks/useHousehold';

describe('AddMemberDialog Component', () => {
  const mockAddManagedMember = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useHousehold).mockReturnValue({
      addManagedMember: mockAddManagedMember,
    } as any);
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(<AddMemberDialog open={false} onClose={mockOnClose} />);

      expect(screen.queryByText(/add household member/i)).not.toBeInTheDocument();
    });

    it('should render dialog when open is true', () => {
      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByText(/add household member/i)).toBeInTheDocument();
    });

    it('should render name input field', () => {
      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('should render instruction text', () => {
      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      expect(
        screen.getByText(/add a family member without requiring email or login/i),
      ).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render add member button', () => {
      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument();
    });
  });

  describe('Form interaction', () => {
    it('should allow typing name', async () => {
      const user = userEvent.setup();
      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      expect(nameInput).toHaveValue('John Doe');
    });
  });

  describe('Form validation', () => {
    it('should disable add button when name is empty', () => {
      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const addButton = screen.getByRole('button', { name: /add member/i });
      expect(addButton).toBeDisabled();
    });

    it('should disable add button when name is only whitespace', async () => {
      const user = userEvent.setup();
      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, '   ');

      const addButton = screen.getByRole('button', { name: /add member/i });
      expect(addButton).toBeDisabled();
    });

    it('should enable add button when name is provided', async () => {
      const user = userEvent.setup();
      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John');

      const addButton = screen.getByRole('button', { name: /add member/i });
      expect(addButton).not.toBeDisabled();
    });
  });

  describe('Form submission', () => {
    it('should call addManagedMember with trimmed name', async () => {
      const user = userEvent.setup();
      mockAddManagedMember.mockResolvedValue(undefined);

      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      const addButton = screen.getByRole('button', { name: /add member/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockAddManagedMember).toHaveBeenCalledWith({
          display_name: 'John Doe',
        });
      });
    });

    it('should trim whitespace from name', async () => {
      const user = userEvent.setup();
      mockAddManagedMember.mockResolvedValue(undefined);

      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, '  John Doe  ');

      const addButton = screen.getByRole('button', { name: /add member/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockAddManagedMember).toHaveBeenCalledWith({
          display_name: 'John Doe',
        });
      });
    });

    it('should close dialog and reset form on success', async () => {
      const user = userEvent.setup();
      mockAddManagedMember.mockResolvedValue(undefined);

      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      const addButton = screen.getByRole('button', { name: /add member/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable fields during submission', async () => {
      const user = userEvent.setup();
      let resolveAdd: () => void;
      const addPromise = new Promise<void>((resolve) => {
        resolveAdd = resolve;
      });
      mockAddManagedMember.mockReturnValue(addPromise);

      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      const addButton = screen.getByRole('button', { name: /add member/i });
      await user.click(addButton);

      // Fields should be disabled during submission
      await waitFor(() => {
        expect(nameInput).toBeDisabled();
        expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      });

      // Resolve submission
      resolveAdd!();

      // Dialog should close
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveAdd: () => void;
      const addPromise = new Promise<void>((resolve) => {
        resolveAdd = resolve;
      });
      mockAddManagedMember.mockReturnValue(addPromise);

      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      const addButton = screen.getByRole('button', { name: /add member/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /adding/i })).toBeInTheDocument();
      });

      resolveAdd!();
    });
  });

  describe('Error handling', () => {
    it('should display error message on failure', async () => {
      const user = userEvent.setup();
      mockAddManagedMember.mockRejectedValue(new Error('Member limit reached'));

      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      const addButton = screen.getByRole('button', { name: /add member/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/member limit reached/i)).toBeInTheDocument();
      });

      // Dialog should remain open
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should show generic error message for unknown errors', async () => {
      const user = userEvent.setup();
      mockAddManagedMember.mockRejectedValue('Unknown error');

      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      const addButton = screen.getByRole('button', { name: /add member/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to add member/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dialog close behavior', () => {
    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should reset form when dialog closed', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Reopen dialog
      rerender(<AddMemberDialog open={false} onClose={mockOnClose} />);
      rerender(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const newNameInput = screen.getByLabelText(/name/i);
      expect(newNameInput).toHaveValue('');
    });

    it('should not close dialog during loading', async () => {
      const user = userEvent.setup();
      let resolveAdd: () => void;
      const addPromise = new Promise<void>((resolve) => {
        resolveAdd = resolve;
      });
      mockAddManagedMember.mockReturnValue(addPromise);

      render(<AddMemberDialog open={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');

      const addButton = screen.getByRole('button', { name: /add member/i });
      await user.click(addButton);

      // Try to cancel while loading
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();

      resolveAdd!();
    });
  });
});
