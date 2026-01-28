import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import DiscoveryPage from './page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useShortlistStore
const mockUseShortlistStore = vi.fn();
vi.mock('@/stores/useShortlistStore', () => ({
  useShortlistStore: () => mockUseShortlistStore(),
}));

// Mock useRecipes hook
const mockUseRecipes = vi.fn();
vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: () => mockUseRecipes(),
}));

// Mock useRecipeFilters hook
const mockUseRecipeFilters = vi.fn();
vi.mock('@/hooks/useRecipeFilters', () => ({
  useRecipeFilters: () => mockUseRecipeFilters(),
}));

describe('DiscoveryPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock router
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    } as any);

    // Mock auth with household
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123' },
      household: { id: 'household-456', name: 'Test Household' },
      loading: false,
    });

    // Mock empty shortlist
    mockUseShortlistStore.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      getCount: () => 0,
    });

    // Mock empty recipes
    mockUseRecipes.mockReturnValue({
      recipes: [],
      loading: false,
      error: null,
    });

    // Mock useRecipeFilters
    mockUseRecipeFilters.mockReturnValue({
      filteredRecipes: [],
      selectedTags: [],
      availableTags: [],
      showFavoritesOnly: false,
      sortBy: 'last_cooked',
      toggleTag: vi.fn(),
      toggleFavorites: vi.fn(),
      setSortBy: vi.fn(),
      clearFilters: vi.fn(),
    });
  });

  describe('Basic Rendering', () => {
    it('should render page title', () => {
      render(<DiscoveryPage />);

      expect(screen.getByRole('heading', { name: /what can i cook/i })).toBeInTheDocument();
    });

    it('should render WhatCanICookPanel', () => {
      render(<DiscoveryPage />);

      // WhatCanICookPanel should be visible (check for its title)
      expect(screen.getByRole('heading', { name: /what can i cook/i })).toBeInTheDocument();
    });

    it('should render ShortlistFAB', () => {
      render(<DiscoveryPage />);

      // ShortlistFAB should be visible
      const fab = screen.getByRole('button', { name: /shortlist/i });
      expect(fab).toBeInTheDocument();
    });

    it('should not render ShortlistDrawer initially', () => {
      render(<DiscoveryPage />);

      // Drawer should be closed initially
      expect(screen.queryByRole('heading', { name: /^shortlist/i })).not.toBeInTheDocument();
    });
  });

  describe('Shortlist Drawer Interaction', () => {
    it('should open drawer when FAB is clicked', async () => {
      const user = userEvent.setup();

      render(<DiscoveryPage />);

      // Initially drawer is closed
      expect(screen.queryByRole('heading', { name: /^shortlist/i })).not.toBeInTheDocument();

      // Click FAB to open drawer
      const fab = screen.getByRole('button', { name: /shortlist/i });
      await user.click(fab);

      // Drawer should now be visible
      expect(screen.getByRole('heading', { name: /^shortlist/i })).toBeInTheDocument();
    });

    it('should close drawer when close button is clicked', async () => {
      const user = userEvent.setup();

      render(<DiscoveryPage />);

      // Open drawer
      const fab = screen.getByRole('button', { name: /shortlist/i });
      await user.click(fab);

      // Drawer is visible
      expect(screen.getByRole('heading', { name: /^shortlist/i })).toBeInTheDocument();

      // Close drawer
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Drawer should be closed
      expect(screen.queryByRole('heading', { name: /^shortlist/i })).not.toBeInTheDocument();
    });
  });

  describe('Material Design Compliance', () => {
    it('should use Container with maxWidth', () => {
      const { container } = render(<DiscoveryPage />);

      // Container should be used for page layout
      const containerElement = container.querySelector('[class*="MuiContainer"]');
      expect(containerElement).toBeTruthy();
    });

    it('should use Stack for layout', () => {
      const { container } = render(<DiscoveryPage />);

      // Stack should be used for vertical layout
      const stackElement = container.querySelector('[class*="MuiStack"]');
      expect(stackElement).toBeTruthy();
    });

    it('should use h5 typography for page title', () => {
      render(<DiscoveryPage />);

      const title = screen.getByRole('heading', { name: /what can i cook/i });
      expect(title).toHaveClass('MuiTypography-h5');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible page title', () => {
      render(<DiscoveryPage />);

      const title = screen.getByRole('heading', { name: /what can i cook/i });
      expect(title).toBeInTheDocument();
    });

    it('should have accessible FAB', () => {
      render(<DiscoveryPage />);

      const fab = screen.getByRole('button', { name: /shortlist/i });
      expect(fab).toHaveAttribute('aria-label');
    });
  });

  describe('Component Integration', () => {
    it('should render all three components together', () => {
      render(<DiscoveryPage />);

      // WhatCanICookPanel (check for its title)
      expect(screen.getByRole('heading', { name: /what can i cook/i })).toBeInTheDocument();

      // ShortlistFAB
      expect(screen.getByRole('button', { name: /shortlist/i })).toBeInTheDocument();

      // ShortlistDrawer (closed initially)
      expect(screen.queryByRole('heading', { name: /^shortlist/i })).not.toBeInTheDocument();
    });

    it('should maintain drawer state across interactions', async () => {
      const user = userEvent.setup();

      render(<DiscoveryPage />);

      // Open and close drawer multiple times
      const fab = screen.getByRole('button', { name: /shortlist/i });

      // Open
      await user.click(fab);
      expect(screen.getByRole('heading', { name: /^shortlist/i })).toBeInTheDocument();

      // Close
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      expect(screen.queryByRole('heading', { name: /^shortlist/i })).not.toBeInTheDocument();

      // Open again
      await user.click(fab);
      expect(screen.getByRole('heading', { name: /^shortlist/i })).toBeInTheDocument();
    });
  });
});
