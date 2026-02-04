import type { Recipe } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecipeList } from './RecipeList';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('RecipeList Component', () => {
  const mockPush = vi.fn();
  const mockOnToggleFavorite = vi.fn();

  const mockRecipes: Recipe[] = [
    {
      id: 'recipe-1' as any,
      household_id: 'household-1' as any,
      title: 'Pasta Carbonara',
      description: null,
      tags: ['italian', 'pasta'],
      last_cooked_at: new Date('2024-01-15'),
      is_favorite: false,
      current_version_id: 'version-1' as any,
      created_by: 'user-1' as any,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      rolling_score: null,
      // New metadata fields
      cuisine: 'italian',
      meal_type: 'main_dish',
      key_ingredients: ['pasta', 'eggs', 'cheese'],
      priority: 1,
      status: 'suggested',
      cooking_method: null,
      dietary_categories: null,
      dish_category: null,
    },
    {
      id: 'recipe-2' as any,
      household_id: 'household-1' as any,
      title: 'Chicken Curry',
      description: null,
      tags: ['indian', 'curry'],
      last_cooked_at: new Date('2024-01-10'),
      is_favorite: true,
      current_version_id: 'version-2' as any,
      created_by: 'user-1' as any,
      created_at: new Date('2024-01-05'),
      updated_at: new Date('2024-01-05'),
      rolling_score: null,
      // New metadata fields
      cuisine: 'indian',
      meal_type: 'main_dish',
      key_ingredients: ['chicken', 'curry', 'coconut milk'],
      priority: 2,
      status: 'to_cook',
      cooking_method: null,
      dietary_categories: null,
      dish_category: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
  });

  describe('Empty state', () => {
    it('should render empty state with message when no recipes', () => {
      render(<RecipeList recipes={[]} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText(/no recipes yet/i)).toBeInTheDocument();
      expect(screen.getByText(/add your first recipe to get started/i)).toBeInTheDocument();
    });

    it('should not render list when empty', () => {
      const { container } = render(
        <RecipeList recipes={[]} onToggleFavorite={mockOnToggleFavorite} />,
      );

      const list = container.querySelector('.MuiList-root');
      expect(list).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner during load', () => {
      render(<RecipeList recipes={[]} loading={true} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not render empty state while loading', () => {
      render(<RecipeList recipes={[]} loading={true} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.queryByText(/no recipes yet/i)).not.toBeInTheDocument();
    });

    it('should not render list while loading', () => {
      render(
        <RecipeList recipes={mockRecipes} loading={true} onToggleFavorite={mockOnToggleFavorite} />,
      );

      expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Recipe list rendering', () => {
    it('should render list of recipes', () => {
      render(<RecipeList recipes={mockRecipes} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.getByText('Chicken Curry')).toBeInTheDocument();
    });

    it('should render correct number of recipe items', () => {
      render(<RecipeList recipes={mockRecipes} onToggleFavorite={mockOnToggleFavorite} />);

      // Each recipe has a ListItemButton role
      const listItems = screen.getAllByRole('button', { name: /carbonara|curry/i });
      expect(listItems).toHaveLength(2);
    });

    it('should render single recipe', () => {
      const singleRecipe = [mockRecipes[0]!];
      render(<RecipeList recipes={singleRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.queryByText('Chicken Curry')).not.toBeInTheDocument();
    });
  });

  describe('User interaction', () => {
    it('should call onToggleFavorite when star icon clicked', async () => {
      const user = userEvent.setup();
      render(<RecipeList recipes={mockRecipes} onToggleFavorite={mockOnToggleFavorite} />);

      // Find favorite button for first recipe
      const favoriteButtons = screen.getAllByLabelText(/favorites/i);
      await user.click(favoriteButtons[0]!);

      expect(mockOnToggleFavorite).toHaveBeenCalledWith('recipe-1');
    });

    it('should navigate to recipe detail on row click', async () => {
      const user = userEvent.setup();
      render(<RecipeList recipes={mockRecipes} onToggleFavorite={mockOnToggleFavorite} />);

      const firstRecipe = screen.getByRole('button', { name: /pasta carbonara/i });
      await user.click(firstRecipe);

      expect(mockPush).toHaveBeenCalledWith('/recipes/recipe-1');
    });
  });

  describe('Recipe order', () => {
    it('should render recipes in order provided', () => {
      render(<RecipeList recipes={mockRecipes} onToggleFavorite={mockOnToggleFavorite} />);

      const listItems = screen.getAllByRole('button', { name: /carbonara|curry/i });
      expect(listItems[0]).toHaveTextContent('Pasta Carbonara');
      expect(listItems[1]).toHaveTextContent('Chicken Curry');
    });

    it('should render recipes in reverse order if provided reversed', () => {
      const reversedRecipes = [...mockRecipes].reverse();
      render(<RecipeList recipes={reversedRecipes} onToggleFavorite={mockOnToggleFavorite} />);

      const listItems = screen.getAllByRole('button', { name: /carbonara|curry/i });
      expect(listItems[0]).toHaveTextContent('Chicken Curry');
      expect(listItems[1]).toHaveTextContent('Pasta Carbonara');
    });
  });

  describe('Integration with RecipeListItem', () => {
    it('should pass recipe data to RecipeListItem', () => {
      render(<RecipeList recipes={mockRecipes} onToggleFavorite={mockOnToggleFavorite} />);

      // Check that recipe details are rendered (handled by RecipeListItem)
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.getByText(/italian, pasta/i)).toBeInTheDocument();
    });

    it('should pass onToggleFavorite callback to each item', async () => {
      const user = userEvent.setup();
      render(<RecipeList recipes={mockRecipes} onToggleFavorite={mockOnToggleFavorite} />);

      const favoriteButtons = screen.getAllByLabelText(/favorites/i);

      // Click first recipe's favorite button
      await user.click(favoriteButtons[0]!);
      expect(mockOnToggleFavorite).toHaveBeenCalledWith('recipe-1');

      // Click second recipe's favorite button
      await user.click(favoriteButtons[1]!);
      expect(mockOnToggleFavorite).toHaveBeenCalledWith('recipe-2');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined loading prop', () => {
      render(<RecipeList recipes={mockRecipes} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    it('should transition from loading to loaded state', () => {
      const { rerender } = render(
        <RecipeList recipes={[]} loading={true} onToggleFavorite={mockOnToggleFavorite} />,
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      rerender(
        <RecipeList
          recipes={mockRecipes}
          loading={false}
          onToggleFavorite={mockOnToggleFavorite}
        />,
      );

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    it('should transition from empty to populated state', () => {
      const { rerender } = render(
        <RecipeList recipes={[]} onToggleFavorite={mockOnToggleFavorite} />,
      );

      expect(screen.getByText(/no recipes yet/i)).toBeInTheDocument();

      rerender(<RecipeList recipes={mockRecipes} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.queryByText(/no recipes yet/i)).not.toBeInTheDocument();
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
  });
});
