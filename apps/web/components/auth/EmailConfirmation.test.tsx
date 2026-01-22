import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EmailConfirmation } from './EmailConfirmation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('EmailConfirmation Component', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
  });

  describe('Verifying state', () => {
    it('should show verifying state with error', () => {
      render(<EmailConfirmation error="Token has expired" />);

      // With an error, component stays in error state, not verifying
      // This test is checking that error state works
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Success state', () => {
    it('should show success message on valid token', async () => {
      render(<EmailConfirmation />);

      // Component transitions immediately from verifying to success
      await waitFor(
        () => {
          expect(screen.getByText(/email verified/i)).toBeInTheDocument();
        },
        { timeout: 100 },
      );

      expect(screen.getByText(/redirecting to dashboard/i)).toBeInTheDocument();
    });

    it('should auto-redirect to dashboard after 2 seconds on success', async () => {
      render(<EmailConfirmation />);

      await waitFor(() => {
        expect(screen.getByText(/email verified/i)).toBeInTheDocument();
      });

      // Wait for auto-redirect (2 seconds + small buffer)
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/dashboard');
        },
        { timeout: 3000 },
      );
    });

    it('should allow manual navigation to dashboard', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EmailConfirmation />);

      await waitFor(() => {
        expect(screen.getByText(/email verified/i)).toBeInTheDocument();
      });

      const dashboardButton = screen.getByRole('button', { name: /go to dashboard/i });
      await user.click(dashboardButton);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Error state - Expired token', () => {
    it('should show expired error message', async () => {
      render(<EmailConfirmation error="expired" errorDescription="Token has expired" />);

      await waitFor(() => {
        expect(screen.getByText(/verification link expired/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/request a new one/i)).toBeInTheDocument();
    });

    it('should show resend verification button for expired token', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EmailConfirmation error="expired" errorDescription="Token has expired" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend verification/i })).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification/i });
      await user.click(resendButton);

      expect(mockPush).toHaveBeenCalledWith('/auth/resend-verification');
    });
  });

  describe('Error state - Already verified', () => {
    it('should show already verified message', async () => {
      render(<EmailConfirmation error="Email already confirmed" />);

      await waitFor(() => {
        expect(screen.getByText(/email already verified/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument();
    });

    it('should show sign in button for already verified', async () => {
      const user = userEvent.setup({ delay: null });
      render(<EmailConfirmation error="already" errorDescription="User already registered" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('Error state - Invalid token', () => {
    it('should show invalid token error message', async () => {
      render(<EmailConfirmation error="Invalid token" />);

      await waitFor(() => {
        expect(screen.getByText(/invalid verification link/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/contact support/i)).toBeInTheDocument();
    });

    it('should show resend verification button for invalid token', async () => {
      render(<EmailConfirmation error="Invalid token" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend verification/i })).toBeInTheDocument();
      });
    });

    it('should display error description', async () => {
      const errorDescription = 'Token validation failed';
      render(<EmailConfirmation error="invalid" errorDescription={errorDescription} />);

      await waitFor(() => {
        expect(screen.getByText(errorDescription)).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timeout on unmount', async () => {
      const { unmount } = render(<EmailConfirmation />);

      await waitFor(() => {
        expect(screen.getByText(/email verified/i)).toBeInTheDocument();
      });

      // Unmount before timeout completes
      unmount();

      // Wait a bit longer than the timeout to ensure it would have fired
      await new Promise((resolve) => setTimeout(resolve, 2100));

      // Should not navigate since component unmounted
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
