import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForgotPasswordForm } from './ForgotPasswordForm';

describe('ForgotPasswordForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render email field', () => {
      render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should render send reset link button', () => {
      render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should render back to sign in link', () => {
      render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
    });

    it('should render instruction text', () => {
      render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

      expect(
        screen.getByText(/enter your email address and we'll send you a link/i),
      ).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      // Form should not submit with invalid email
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should validate empty email', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      // Form should not submit with empty email
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form submission', () => {
    it('should call onSubmit with email', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
        });
      });
    });

    it('should show success message after submission', () => {
      render(<ForgotPasswordForm onSubmit={mockOnSubmit} success={true} />);

      expect(screen.getByText(/password reset link sent/i)).toBeInTheDocument();
    });

    it('should disable field during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);

      render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

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

    it('should disable field when success is true', () => {
      render(<ForgotPasswordForm onSubmit={mockOnSubmit} success={true} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error handling', () => {
    it('should display error message', () => {
      const error = new Error('Email not found');

      render(<ForgotPasswordForm onSubmit={mockOnSubmit} error={error} />);

      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });

    it('should not display error when error is null', () => {
      render(<ForgotPasswordForm onSubmit={mockOnSubmit} error={null} />);

      const alerts = screen.queryAllByRole('alert');
      const errorAlerts = alerts.filter((alert) => alert.className.includes('error'));
      expect(errorAlerts).toHaveLength(0);
    });
  });
});
