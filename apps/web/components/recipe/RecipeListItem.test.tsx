import type { Recipe } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecipeListItem } from './RecipeListItem';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('RecipeListItem Component', () => {
  const mockPush = vi.fn();
  const mockOnToggleFavorite = vi.fn();

  const mockRecipe: Recipe = {
    id: 'recipe-123' as any,
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
    cuisine: 'italian',
    meal_type: 'main_dish',
    key_ingredients: ['pasta', 'eggs', 'cheese'],
    priority: 1,
    status: 'suggested',
    cooking_method: null,
    dietary_categories: null,
    dish_category: null,
    source_url: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as any);
  });

  describe('Rendering', () => {
    it('should render recipe title', () => {
      render(<RecipeListItem recipe={mockRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    it('should render last cooked date', () => {
      render(<RecipeListItem recipe={mockRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      // Date formatting varies, just check for presence
      expect(screen.getByText(/cooked/i)).toBeInTheDocument();
    });

    it('should render tags in secondary text', () => {
      render(<RecipeListItem recipe={mockRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText(/italian, pasta/i)).toBeInTheDocument();
    });

    it('should show empty star for non-favorite recipes', () => {
      render(<RecipeListItem recipe={mockRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      const favoriteButton = screen.getByLabelText(/add to favorites/i);
      expect(favoriteButton).toBeInTheDocument();
    });

    it('should show filled star for favorite recipes', () => {
      const favoriteRecipe = { ...mockRecipe, is_favorite: true };
      render(<RecipeListItem recipe={favoriteRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      const favoriteButton = screen.getByLabelText(/remove from favorites/i);
      expect(favoriteButton).toBeInTheDocument();
    });
  });

  describe('Last cooked formatting', () => {
    it('should display "Never cooked" when last_cooked_at is null', () => {
      const recipe = { ...mockRecipe, last_cooked_at: null };
      render(<RecipeListItem recipe={recipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText(/never cooked/i)).toBeInTheDocument();
    });

    it('should display "Cooked today" for recipes cooked today', () => {
      const today = new Date();
      const recipe = { ...mockRecipe, last_cooked_at: today };
      render(<RecipeListItem recipe={recipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText(/cooked today/i)).toBeInTheDocument();
    });

    it('should display "Cooked yesterday" for recipes cooked yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recipe = { ...mockRecipe, last_cooked_at: yesterday };
      render(<RecipeListItem recipe={recipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText(/cooked yesterday/i)).toBeInTheDocument();
    });

    it('should display days ago for recipes cooked within a week', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const recipe = { ...mockRecipe, last_cooked_at: threeDaysAgo };
      render(<RecipeListItem recipe={recipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText(/cooked 3 days ago/i)).toBeInTheDocument();
    });

    it('should display weeks ago for recipes cooked within a month', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const recipe = { ...mockRecipe, last_cooked_at: twoWeeksAgo };
      render(<RecipeListItem recipe={recipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText(/cooked 2 weeks ago/i)).toBeInTheDocument();
    });

    it('should display months ago for recipes cooked within a year', () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
      const recipe = { ...mockRecipe, last_cooked_at: twoMonthsAgo };
      render(<RecipeListItem recipe={recipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText(/cooked 2 months ago/i)).toBeInTheDocument();
    });

    it('should display years ago for old recipes', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const recipe = { ...mockRecipe, last_cooked_at: twoYearsAgo };
      render(<RecipeListItem recipe={recipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText(/cooked 2 years ago/i)).toBeInTheDocument();
    });
  });

  describe('Tags display', () => {
    it('should display up to 3 tags', () => {
      const recipe = { ...mockRecipe, tags: ['italian', 'pasta', 'quick', 'dinner'] };
      render(<RecipeListItem recipe={recipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByText(/italian, pasta, quick/i)).toBeInTheDocument();
      expect(screen.queryByText(/dinner/i)).not.toBeInTheDocument();
    });

    it('should not show tags if empty', () => {
      const recipe = { ...mockRecipe, tags: [] };
      render(<RecipeListItem recipe={recipe} onToggleFavorite={mockOnToggleFavorite} />);

      // Should only show last cooked text, no tags
      const secondaryText = screen.getByText(/cooked/i).textContent;
      expect(secondaryText).not.toContain('·'); // No separator if no tags
    });
  });

  describe('User interaction', () => {
    it('should navigate to recipe detail when row clicked', async () => {
      const user = userEvent.setup();
      render(<RecipeListItem recipe={mockRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      const listItem = screen.getByRole('button', { name: /pasta carbonara/i });
      await user.click(listItem);

      expect(mockPush).toHaveBeenCalledWith('/recipes/recipe-123');
    });

    it('should call onToggleFavorite when star icon clicked', async () => {
      const user = userEvent.setup();
      render(<RecipeListItem recipe={mockRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      const favoriteButton = screen.getByLabelText(/add to favorites/i);
      await user.click(favoriteButton);

      expect(mockOnToggleFavorite).toHaveBeenCalledWith('recipe-123');
    });

    it('should not navigate when favorite button clicked', async () => {
      const user = userEvent.setup();
      render(<RecipeListItem recipe={mockRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      const favoriteButton = screen.getByLabelText(/add to favorites/i);
      await user.click(favoriteButton);

      // Should call onToggleFavorite but NOT navigate
      expect(mockOnToggleFavorite).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible favorite button label for non-favorite', () => {
      render(<RecipeListItem recipe={mockRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument();
    });

    it('should have accessible favorite button label for favorite', () => {
      const favoriteRecipe = { ...mockRecipe, is_favorite: true };
      render(<RecipeListItem recipe={favoriteRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument();
    });

    it('should have clickable list item button', () => {
      render(<RecipeListItem recipe={mockRecipe} onToggleFavorite={mockOnToggleFavorite} />);

      const listItemButton = screen.getByRole('button', { name: /pasta carbonara/i });
      expect(listItemButton).toBeInTheDocument();
    });
  });

  describe('Secondary text separator', () => {
    it('should separate last cooked and tags with middot', () => {
      const recipe = {
        ...mockRecipe,
        last_cooked_at: new Date('2024-01-15'),
        tags: ['italian', 'pasta'],
      };
      render(<RecipeListItem recipe={recipe} onToggleFavorite={mockOnToggleFavorite} />);

      const secondaryText = screen.getByText(/·/).textContent;
      expect(secondaryText).toContain('·');
    });
  });
});
