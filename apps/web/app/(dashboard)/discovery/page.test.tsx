import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import DiscoveryPage from './page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock useMealPlan hook
const mockUseMealPlan = vi.fn();
vi.mock('@/hooks/useMealPlan', () => ({
  useMealPlan: () => mockUseMealPlan(),
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

    // Mock empty meal plan
    mockUseMealPlan.mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      count: 0,
      addToMealPlan: vi.fn(),
      removeFromMealPlan: vi.fn(),
      markAsCooked: vi.fn(),
      hasRecipe: () => false,
    });

    // Mock empty recipes
    mockUseRecipes.mockReturnValue({
      recipes: [],
      loading: false,
      error: null,
    });

    // Mock useRecipeFilters to return empty array (matches actual hook return type)
    mockUseRecipeFilters.mockReturnValue([]);
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
  });

  describe('Component Integration', () => {
    it('should render the recipe discovery panel', () => {
      render(<DiscoveryPage />);

      // WhatCanICookPanel (check for its title)
      expect(screen.getByRole('heading', { name: /what can i cook/i })).toBeInTheDocument();
    });
  });
});
