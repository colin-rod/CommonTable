import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ResetPasswordForm } from './ResetPasswordForm';

describe('ResetPasswordForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render password and confirm password fields', () => {
      render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    });

    it('should render update password button', () => {
      render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    });

    it('should render instruction text', () => {
      render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate passwords match', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByLabelText(/^new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different-password');

      const submitButton = screen.getByRole('button', { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate password strength', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByLabelText(/^new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, 'short');
      await user.type(confirmPasswordInput, 'short');

      const submitButton = screen.getByRole('button', { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Password strength indicator', () => {
    it('should show weak password strength', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByLabelText(/^new password/i);
      await user.type(passwordInput, 'short1');

      await waitFor(() => {
        expect(screen.getByText(/weak/i)).toBeInTheDocument();
      });
    });

    it('should show good password strength', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByLabelText(/^new password/i);
      await user.type(passwordInput, 'password123');

      await waitFor(() => {
        expect(screen.getByText(/good/i)).toBeInTheDocument();
      });
    });

    it('should show strong password strength', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByLabelText(/^new password/i);
      await user.type(passwordInput, 'verylongpassword123');

      await waitFor(() => {
        expect(screen.getByText(/strong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    it('should call onSubmit with new password', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByLabelText(/^new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');

      const submitButton = screen.getByRole('button', { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          password: 'newpassword123',
          confirm_password: 'newpassword123',
        });
      });
    });

    it('should disable fields during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);

      render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByLabelText(/^new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /update password/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      await user.click(submitButton);

      // Fields should be disabled during submission
      await waitFor(() => {
        expect(passwordInput).toBeDisabled();
        expect(confirmPasswordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });

      // Show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Resolve submission
      resolveSubmit!();

      // Fields should be enabled after submission
      await waitFor(() => {
        expect(passwordInput).not.toBeDisabled();
        expect(confirmPasswordInput).not.toBeDisabled();
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Error handling', () => {
    it('should display error message', () => {
      const error = new Error('Failed to reset password');

      render(<ResetPasswordForm onSubmit={mockOnSubmit} error={error} />);

      expect(screen.getByText(/failed to reset password/i)).toBeInTheDocument();
    });

    it('should not display error when error is null', () => {
      render(<ResetPasswordForm onSubmit={mockOnSubmit} error={null} />);

      const alerts = screen.queryAllByRole('alert');
      expect(alerts).toHaveLength(0);
    });
  });
});
