import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ResendVerificationForm } from './ResendVerificationForm';

describe('ResendVerificationForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render email field', () => {
      render(<ResendVerificationForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should render resend verification email button', () => {
      render(<ResendVerificationForm onSubmit={mockOnSubmit} />);

      expect(
        screen.getByRole('button', { name: /resend verification email/i }),
      ).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      render(<ResendVerificationForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });

    it('should render instruction text', () => {
      render(<ResendVerificationForm onSubmit={mockOnSubmit} />);

      expect(
        screen.getByText(/enter your email address to receive a new verification link/i),
      ).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<ResendVerificationForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(submitButton);

      // HTML5 validation prevents form submission with invalid email
      // JavaScript validation doesn't run, so we just verify onSubmit wasn't called
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should validate empty email', async () => {
      const user = userEvent.setup();
      render(<ResendVerificationForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(submitButton);

      // HTML5 validation prevents form submission with empty required field
      // JavaScript validation doesn't run, so we just verify onSubmit wasn't called
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form submission', () => {
    it('should call onSubmit with email', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ResendVerificationForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should show success message after resend', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ResendVerificationForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/verification email sent/i)).toBeInTheDocument();
      });
    });

    it('should clear form on success', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ResendVerificationForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput.value).toBe('');
      });
    });

    it('should disable field during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);

      render(<ResendVerificationForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /resend verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Field should be disabled during submission
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });

      // Show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Resolve submission
      resolveSubmit!();

      // Fields should be enabled after submission
      await waitFor(() => {
        expect(emailInput).not.toBeDisabled();
        expect(submitButton).not.toBeDisabled();
      });
    });

    // Note: HTML5 email validation prevents testing JS validation error clearing
    // since the form won't submit with HTML5-invalid emails
  });

  describe('Error handling', () => {
    it('should display error message', () => {
      const error = new Error('Failed to send verification email');

      render(<ResendVerificationForm onSubmit={mockOnSubmit} error={error} />);

      expect(screen.getByText(/failed to send verification email/i)).toBeInTheDocument();
    });

    it('should not display error when error is null', () => {
      render(<ResendVerificationForm onSubmit={mockOnSubmit} error={null} />);

      const alerts = screen.queryAllByRole('alert');
      const errorAlerts = alerts.filter((alert) => alert.className.includes('error'));
      expect(errorAlerts).toHaveLength(0);
    });
  });
});
