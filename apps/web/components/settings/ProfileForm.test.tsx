import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ProfileForm } from './ProfileForm';

describe('ProfileForm', () => {
  const mockUser = {
    email: 'test@example.com',
    profile: {
      display_name: 'Test User',
    },
  };

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display Name', () => {
    it('should render display name field with current value', () => {
      render(
        <ProfileForm user={mockUser as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      );

      const displayNameInput = screen.getByRole('textbox', { name: /display name/i });
      expect(displayNameInput).toHaveValue('Test User');
    });

    it('should allow editing display name', () => {
      render(
        <ProfileForm user={mockUser as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      );

      const displayNameInput = screen.getByRole('textbox', { name: /display name/i });
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });

      expect(displayNameInput).toHaveValue('Updated Name');
    });
  });

  describe('Email Display', () => {
    it('should render email field as read-only', () => {
      render(
        <ProfileForm user={mockUser as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      );

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      expect(emailInput).toHaveValue('test@example.com');
      expect(emailInput).toBeDisabled();
    });
  });

  describe('Password Change', () => {
    it('should render password fields', () => {
      render(
        <ProfileForm user={mockUser as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      );

      // Query all password inputs
      const currentPasswordInput = screen.getByLabelText(/^current password$/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm new password$/i);

      expect(currentPasswordInput).toBeInTheDocument();
      expect(newPasswordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toBeInTheDocument();
    });

    it('should validate password minimum length', async () => {
      render(
        <ProfileForm user={mockUser as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      );

      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      fireEvent.change(newPasswordInput, { target: { value: 'short' } });
      fireEvent.blur(newPasswordInput);

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation matches', async () => {
      render(
        <ProfileForm user={mockUser as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      );

      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm new password$/i);

      fireEvent.change(newPasswordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with display name only if no password change', async () => {
      render(
        <ProfileForm user={mockUser as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      );

      const displayNameInput = screen.getByRole('textbox', { name: /display name/i });
      fireEvent.change(displayNameInput, { target: { value: 'New Name' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          display_name: 'New Name',
        });
      });
    });

    it('should call onSubmit with password if all password fields filled', async () => {
      render(
        <ProfileForm user={mockUser as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      );

      const currentPasswordInput = screen.getByLabelText(/^current password$/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm new password$/i);

      fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          display_name: 'Test User',
          current_password: 'oldpassword123',
          new_password: 'newpassword123',
        });
      });
    });

    it('should call onCancel when cancel button clicked', () => {
      render(
        <ProfileForm user={mockUser as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable submit button while submitting', async () => {
      const slowSubmit = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 1000)));
      render(<ProfileForm user={mockUser as any} onSubmit={slowSubmit} onCancel={mockOnCancel} />);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Design System Compliance', () => {
    it('should use allowed button variants', () => {
      render(
        <ProfileForm user={mockUser as any} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      );

      const saveButton = screen.getByText('Save Changes');
      const cancelButton = screen.getByText('Cancel');

      // Save button should be contained primary
      expect(saveButton.closest('button')).toHaveClass('MuiButton-contained');
      expect(saveButton.closest('button')).toHaveClass('MuiButton-colorPrimary');

      // Cancel button should be outlined
      expect(cancelButton.closest('button')).toHaveClass('MuiButton-outlined');
    });
  });
});
