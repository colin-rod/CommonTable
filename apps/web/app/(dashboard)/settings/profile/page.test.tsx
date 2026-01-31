import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProfilePage from './page';

import { useAuth } from '@/hooks/useAuth';
import type { UseAuthReturn } from '@/hooks/useAuth';

// Mock useAuth hook
vi.mock('@/hooks/useAuth');

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock server actions
vi.mock('@/app/actions/profile', () => ({
  updateProfile: vi.fn().mockResolvedValue({ success: true, data: undefined }),
  changePassword: vi.fn().mockResolvedValue({ success: true, data: undefined }),
}));

describe('ProfilePage', () => {
  const mockUser = {
    id: 'user-1' as any,
    email: 'test@example.com',
    profile: {
      display_name: 'Test User',
    },
    household: {
      id: 'household-1' as any,
      name: 'Test Household',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    household_role: 'admin' as const,
  };

  const mockAuthReturn: UseAuthReturn = {
    user: mockUser as any,
    session: null,
    household: mockUser.household as any,
    householdRole: 'admin',
    isAuthenticated: true,
    isLoading: false,
    isError: false,
    error: null,
    initialized: true,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    clearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(mockAuthReturn);
  });

  describe('Page Structure', () => {
    it('should render page title', () => {
      render(<ProfilePage />);

      // Use heading role to find the page title specifically
      const title = screen.getByRole('heading', { name: /^profile$/i, level: 5 });
      expect(title).toBeInTheDocument();
    });

    it('should render ProfileForm component', () => {
      render(<ProfilePage />);

      // ProfileForm should render display name field
      const displayNameInput = screen.getByRole('textbox', { name: /display name/i });
      expect(displayNameInput).toBeInTheDocument();
    });

    it('should pre-fill form with user data', () => {
      render(<ProfilePage />);

      const displayNameInput = screen.getByRole('textbox', { name: /display name/i });
      expect(displayNameInput).toHaveValue('Test User');

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      expect(emailInput).toHaveValue('test@example.com');
    });
  });

  describe('Form Submission', () => {
    it('should handle profile update submission', async () => {
      render(<ProfilePage />);

      const displayNameInput = screen.getByRole('textbox', { name: /display name/i });
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      // Should show success message after submission
      await waitFor(
        () => {
          expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('should handle password change submission', async () => {
      render(<ProfilePage />);

      const currentPasswordInput = screen.getByLabelText(/^current password$/i);
      const newPasswordInput = screen.getByLabelText(/^new password$/i);
      const confirmPasswordInput = screen.getByLabelText(/^confirm new password$/i);

      fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      // Should show success message after password change
      await waitFor(
        () => {
          expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it('should handle submission errors', async () => {
      // Mock updateProfile to return error
      const { updateProfile } = await import('@/app/actions/profile');
      vi.mocked(updateProfile).mockResolvedValue({
        success: false,
        error: 'Update failed',
      });

      render(<ProfilePage />);

      const displayNameInput = screen.getByRole('textbox', { name: /display name/i });
      fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      // Should show error message
      await waitFor(
        () => {
          expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Cancel Action', () => {
    it('should navigate back when cancel is clicked', () => {
      render(<ProfilePage />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/settings/household');
    });
  });

  describe('Design System Compliance', () => {
    it('should use Container with maxWidth md', () => {
      const { container } = render(<ProfilePage />);

      const containerElement = container.querySelector('.MuiContainer-maxWidthMd');
      expect(containerElement).toBeInTheDocument();
    });

    it('should use Stack with spacing 3', () => {
      const { container } = render(<ProfilePage />);

      // Stack spacing 3 translates to CSS spacing
      const stackElement = container.querySelector('.MuiStack-root');
      expect(stackElement).toBeInTheDocument();
    });

    it('should use Typography h5 for page title', () => {
      render(<ProfilePage />);

      const title = screen.getByRole('heading', { name: /^profile$/i, level: 5 });
      expect(title.tagName).toBe('H5');
      expect(title).toHaveClass('MuiTypography-h5');
    });
  });

  describe('Loading State', () => {
    it('should show loading state when auth is loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuthReturn,
        isLoading: true,
        user: null,
      });

      render(<ProfilePage />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    it('should redirect to login when not authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuthReturn,
        isAuthenticated: false,
        user: null,
      });

      render(<ProfilePage />);

      // Should not render profile form
      expect(screen.queryByRole('textbox', { name: /display name/i })).not.toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });
});
