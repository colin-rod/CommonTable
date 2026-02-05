import type { Recipe, RecipeId, RecipeVersionId, HouseholdId, UserId } from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecipeGrid } from './RecipeGrid';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();

// Mock recipe data
const createMockRecipe = (id: string, title: string): Recipe => ({
  id: id as RecipeId,
  household_id: 'household-456' as HouseholdId,
  title,
  description: `Description for ${title}`,
  current_version_id: 'version-1' as RecipeVersionId,
  rolling_score: 4.5,
  tags: ['tag1', 'tag2'],
  is_favorite: false,
  last_cooked_at: new Date('2026-01-20T10:00:00Z'),
  created_by: 'user-789' as UserId,
  created_at: new Date('2026-01-15T10:00:00Z'),
  updated_at: new Date('2026-01-15T10:00:00Z'),
  // Phase 3 metadata fields
  cuisine: null,
  meal_type: null,
  key_ingredients: [],
  priority: null,
  status: 'suggested',
  cooking_method: null,
  dietary_categories: null,
  dish_category: null,
});

const mockRecipes: Recipe[] = [
  createMockRecipe('recipe-1', 'Recipe 1'),
  createMockRecipe('recipe-2', 'Recipe 2'),
  createMockRecipe('recipe-3', 'Recipe 3'),
];

describe('RecipeGrid', () => {
  beforeEach(() => {
    // Setup IntersectionObserver mock before each test
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    });
    global.IntersectionObserver = mockIntersectionObserver as any;
  });

  describe('Basic Rendering', () => {
    it('should render empty state when no recipes provided', () => {
      render(<RecipeGrid recipes={[]} onAddToShortlist={vi.fn()} shortlistedRecipeIds={[]} />);

      expect(screen.getByText(/no recipes found/i)).toBeInTheDocument();
    });

    it('should render grid of recipe cards', () => {
      render(
        <RecipeGrid recipes={mockRecipes} onAddToShortlist={vi.fn()} shortlistedRecipeIds={[]} />,
      );

      expect(screen.getByText('Recipe 1')).toBeInTheDocument();
      expect(screen.getByText('Recipe 2')).toBeInTheDocument();
      expect(screen.getByText('Recipe 3')).toBeInTheDocument();
    });

    it('should render recipe cards with shortlist state', () => {
      render(
        <RecipeGrid
          recipes={mockRecipes}
          onAddToShortlist={vi.fn()}
          shortlistedRecipeIds={['recipe-1' as RecipeId]}
        />,
      );

      // First card should show "Added" button
      const buttons = screen.getAllByRole('button', { name: /shortlist/i });
      expect(buttons[0]).toHaveTextContent(/added/i);
      expect(buttons[1]).toHaveTextContent(/add to shortlist/i);
    });
  });

  describe('Shortlist Actions', () => {
    it('should call onAddToShortlist when card button clicked', async () => {
      const user = userEvent.setup();
      const onAddToShortlist = vi.fn();

      render(
        <RecipeGrid
          recipes={mockRecipes}
          onAddToShortlist={onAddToShortlist}
          shortlistedRecipeIds={[]}
        />,
      );

      const buttons = screen.getAllByRole('button', { name: /add to shortlist/i });
      await user.click(buttons[0]!);

      expect(onAddToShortlist).toHaveBeenCalledWith('recipe-1' as RecipeId);
    });

    it('should not call onAddToShortlist for already shortlisted recipes', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const onAddToShortlist = vi.fn();

      render(
        <RecipeGrid
          recipes={mockRecipes}
          onAddToShortlist={onAddToShortlist}
          shortlistedRecipeIds={['recipe-1' as RecipeId]}
        />,
      );

      const addedButton = screen.getByRole('button', { name: /added/i });
      await user.click(addedButton);

      expect(onAddToShortlist).not.toHaveBeenCalled();
    });
  });

  describe('Infinite Scroll', () => {
    it('should render loading indicator when loading', () => {
      render(
        <RecipeGrid
          recipes={mockRecipes}
          onAddToShortlist={vi.fn()}
          shortlistedRecipeIds={[]}
          loading={true}
        />,
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not render loading indicator when not loading', () => {
      render(
        <RecipeGrid
          recipes={mockRecipes}
          onAddToShortlist={vi.fn()}
          shortlistedRecipeIds={[]}
          loading={false}
        />,
      );

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should render sentinel element for intersection observer', () => {
      const { container } = render(
        <RecipeGrid
          recipes={mockRecipes}
          onAddToShortlist={vi.fn()}
          shortlistedRecipeIds={[]}
          hasMore={true}
        />,
      );

      // Sentinel div should exist
      const sentinel = container.querySelector('[data-testid="scroll-sentinel"]');
      expect(sentinel).toBeInTheDocument();
    });

    it('should not render sentinel when hasMore is false', () => {
      const { container } = render(
        <RecipeGrid
          recipes={mockRecipes}
          onAddToShortlist={vi.fn()}
          shortlistedRecipeIds={[]}
          hasMore={false}
        />,
      );

      const sentinel = container.querySelector('[data-testid="scroll-sentinel"]');
      expect(sentinel).not.toBeInTheDocument();
    });

    it('should call onLoadMore when sentinel intersects', async () => {
      const onLoadMore = vi.fn();

      render(
        <RecipeGrid
          recipes={mockRecipes}
          onAddToShortlist={vi.fn()}
          shortlistedRecipeIds={[]}
          hasMore={true}
          onLoadMore={onLoadMore}
        />,
      );

      // Get the observe callback from the mock
      const observeCallback = mockIntersectionObserver.mock.calls[0]?.[0];

      // Simulate intersection
      await waitFor(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      expect(onLoadMore).toHaveBeenCalled();
    });

    it('should not call onLoadMore when loading', async () => {
      const onLoadMore = vi.fn();

      render(
        <RecipeGrid
          recipes={mockRecipes}
          onAddToShortlist={vi.fn()}
          shortlistedRecipeIds={[]}
          hasMore={true}
          loading={true}
          onLoadMore={onLoadMore}
        />,
      );

      const observeCallback = mockIntersectionObserver.mock.calls[0]?.[0];

      await waitFor(() => {
        observeCallback([{ isIntersecting: true }]);
      });

      // Should not be called because loading is true
      expect(onLoadMore).not.toHaveBeenCalled();
    });
  });

  describe('Responsive Grid', () => {
    it('should use Material UI Grid for layout', () => {
      const { container } = render(
        <RecipeGrid recipes={mockRecipes} onAddToShortlist={vi.fn()} shortlistedRecipeIds={[]} />,
      );

      // Check for MUI Grid classes or data attributes
      const grid = container.querySelector('[class*="MuiGrid"]');
      expect(grid).toBeInTheDocument();
    });

    it('should render recipe cards in grid items', () => {
      render(
        <RecipeGrid recipes={mockRecipes} onAddToShortlist={vi.fn()} shortlistedRecipeIds={[]} />,
      );

      // All recipe cards should be rendered
      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible loading indicator', () => {
      render(
        <RecipeGrid
          recipes={mockRecipes}
          onAddToShortlist={vi.fn()}
          shortlistedRecipeIds={[]}
          loading={true}
        />,
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Loading more recipes');
    });

    it('should have accessible empty state', () => {
      render(<RecipeGrid recipes={[]} onAddToShortlist={vi.fn()} shortlistedRecipeIds={[]} />);

      const emptyMessage = screen.getByText(/no recipes found/i);
      expect(emptyMessage).toBeInTheDocument();
    });
  });
});
