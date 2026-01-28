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
      expect(screen.getAllByText('Calendar').length).toBeGreaterThanOrEqual(1);
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
