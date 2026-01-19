import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SignUpForm } from './SignUpForm';

describe('SignUpForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<SignUpForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should render create account button', () => {
      render(<SignUpForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      render(<SignUpForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate password confirmation matches', async () => {
      const user = userEvent.setup();
      render(<SignUpForm onSubmit={mockOnSubmit} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      const emailInput = screen.getByLabelText(/^email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(displayNameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different-password');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate password strength requirements', async () => {
      const user = userEvent.setup();
      render(<SignUpForm onSubmit={mockOnSubmit} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      const emailInput = screen.getByLabelText(/^email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(displayNameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');
      await user.type(confirmPasswordInput, 'short');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<SignUpForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/^email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Form should not submit with invalid email
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should validate display name is required', async () => {
      const user = userEvent.setup();
      render(<SignUpForm onSubmit={mockOnSubmit} />);

      const emailInput = screen.getByLabelText(/^email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Form should not submit without display name
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Password strength indicator', () => {
    it('should show weak password strength', async () => {
      const user = userEvent.setup();
      render(<SignUpForm onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'short1');

      await waitFor(() => {
        expect(screen.getByText(/weak/i)).toBeInTheDocument();
      });
    });

    it('should show good password strength', async () => {
      const user = userEvent.setup();
      render(<SignUpForm onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'password123');

      await waitFor(() => {
        expect(screen.getByText(/good/i)).toBeInTheDocument();
      });
    });

    it('should show strong password strength', async () => {
      const user = userEvent.setup();
      render(<SignUpForm onSubmit={mockOnSubmit} />);

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'verylongpassword123');

      await waitFor(() => {
        expect(screen.getByText(/strong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    it('should call onSubmit with valid data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(<SignUpForm onSubmit={mockOnSubmit} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      const emailInput = screen.getByLabelText(/^email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(displayNameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          display_name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirm_password: 'password123',
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

      render(<SignUpForm onSubmit={mockOnSubmit} />);

      const displayNameInput = screen.getByLabelText(/display name/i);
      const emailInput = screen.getByLabelText(/^email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(displayNameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      // Fields should be disabled during submission
      await waitFor(() => {
        expect(displayNameInput).toBeDisabled();
        expect(emailInput).toBeDisabled();
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
        expect(displayNameInput).not.toBeDisabled();
        expect(emailInput).not.toBeDisabled();
        expect(passwordInput).not.toBeDisabled();
        expect(confirmPasswordInput).not.toBeDisabled();
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show success message after signup', () => {
      render(<SignUpForm onSubmit={mockOnSubmit} success={true} />);

      expect(screen.getByText(/check your email to verify your account/i)).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should display error message', () => {
      const error = new Error('Email already exists');

      render(<SignUpForm onSubmit={mockOnSubmit} error={error} />);

      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });

    it('should not display error when error is null', () => {
      render(<SignUpForm onSubmit={mockOnSubmit} error={null} />);

      // Should have no error alert (success alert might exist if success=true)
      const alerts = screen.queryAllByRole('alert');
      const errorAlerts = alerts.filter((alert) =>
        alert.className.includes('MuiAlert-filledError'),
      );
      expect(errorAlerts).toHaveLength(0);
    });
  });
});
