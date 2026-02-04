import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DashboardLayout } from './DashboardLayout';

import { useAuth } from '@/hooks/useAuth';
import type { UseAuthReturn } from '@/hooks/useAuth';

// Mock useAuth hook
vi.mock('@/hooks/useAuth');

// Mock next/navigation
vi.mock('next/navigation', () => {
  const mockPush = vi.fn();
  const mockUsePathname = vi.fn(() => '/recipes');

  return {
    useRouter: () => ({
      push: mockPush,
    }),
    usePathname: mockUsePathname,
  };
});

describe('DashboardLayout', () => {
  const mockUser = {
    id: 'user-1' as any, // UserId type
    email: 'test@example.com',
    profile: {
      display_name: 'Test User',
    },
    household: {
      id: 'household-1' as any, // HouseholdId type
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

  describe('Navigation', () => {
    it('should render navigation links', () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      // Both permanent drawer (desktop) and temporary drawer (mobile) render navigation
      expect(screen.getAllByText('Discovery').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Recipes').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('History').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Tags').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Requests').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
    });

    it('should render app title', () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      // App title appears in drawer
      const titles = screen.getAllByText('CommonTable');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should render children content', () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render badge on Tags when pending count > 0', async () => {
      render(
        <DashboardLayout pendingTagsCount={3}>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      await waitFor(() => {
        // Badge appears in both mobile and desktop drawers
        const badges = screen.getAllByText('3');
        expect(badges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should render badge on Requests when pending count > 0', async () => {
      render(
        <DashboardLayout pendingRequestsCount={5}>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      await waitFor(() => {
        // Badge appears in both mobile and desktop drawers
        const badges = screen.getAllByText('5');
        expect(badges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should not render visible badges when pending counts are 0', () => {
      render(
        <DashboardLayout pendingTagsCount={0} pendingRequestsCount={0}>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      // Badges with 0 content are rendered but invisible
      // MUI adds "MuiBadge-invisible" class when count is 0
      // eslint-disable-next-line no-undef
      const badges = document.querySelectorAll('.MuiBadge-badge');
      badges.forEach((badge) => {
        // All badges should have the invisible class when count is 0
        expect(badge.classList.contains('MuiBadge-invisible')).toBe(true);
      });
    });
  });

  describe('User Menu', () => {
    it('should render user menu button', () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const userButton = screen.getByLabelText('User menu');
      expect(userButton).toBeInTheDocument();
    });

    it('should open user menu when clicked', async () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Sign out')).toBeInTheDocument();
      });
    });

    it('should display user display name in menu', async () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });

    it('should display user email in menu with secondary color', async () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);

      await waitFor(() => {
        const emailElement = screen.getByText('test@example.com');
        expect(emailElement).toBeInTheDocument();
        // Check for text.secondary color
        expect(emailElement).toHaveStyle({ color: 'rgba(0, 0, 0, 0.6)' });
      });
    });

    it('should display household name in menu', async () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Test Household')).toBeInTheDocument();
      });
    });

    it('should display household role in menu', async () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Role: admin')).toBeInTheDocument();
      });
    });

    it('should display "Household" label in menu', async () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Household')).toBeInTheDocument();
      });
    });

    it('should have dividers separating sections in menu', async () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);

      await waitFor(() => {
        // Check for dividers (MUI Divider component)
        // Should have 2 dividers: after user info, after household info
        // eslint-disable-next-line no-undef
        const dividers = document.querySelectorAll('.MuiDivider-root');
        expect(dividers.length).toBe(2);
      });
    });

    it('should call signOut when Sign out is clicked', async () => {
      const mockSignOut = vi.fn();
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuthReturn,
        signOut: mockSignOut,
      });

      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);

      await waitFor(() => {
        const signOutButton = screen.getByText('Sign out');
        fireEvent.click(signOutButton);
      });

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle missing household gracefully', async () => {
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuthReturn,
        household: null,
      });

      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);

      await waitFor(() => {
        // User info should still display
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        // Household section should not appear
        expect(screen.queryByText('Household')).not.toBeInTheDocument();
      });
    });

    it('should handle missing household role gracefully', async () => {
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuthReturn,
        householdRole: null,
      });

      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const userButton = screen.getByLabelText('User menu');
      fireEvent.click(userButton);

      await waitFor(() => {
        // Should display "No role" when role is missing
        expect(screen.getByText('Role: No role')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Drawer', () => {
    it('should render hamburger menu button', () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      const menuButton = screen.getByLabelText('Open navigation menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('should render navigation in permanent drawer', () => {
      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      // Permanent drawer always renders navigation links
      const links = screen.getAllByText('Recipes');
      expect(links.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('No User State', () => {
    it('should not render user menu when no user', () => {
      vi.mocked(useAuth).mockReturnValue({
        ...mockAuthReturn,
        user: null,
        isAuthenticated: false,
      });

      render(
        <DashboardLayout>
          <div>Test Content</div>
        </DashboardLayout>,
      );

      expect(screen.queryByLabelText('User menu')).not.toBeInTheDocument();
    });
  });
});
