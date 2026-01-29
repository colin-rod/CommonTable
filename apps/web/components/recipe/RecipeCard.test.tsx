import type { Recipe, RecipeId, HouseholdId, UserId, RecipeVersionId } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { RecipeCard } from './RecipeCard';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock recipe data
const mockRecipe: Recipe = {
  id: 'recipe-123' as RecipeId,
  household_id: 'household-456' as HouseholdId,
  title: 'Pasta Carbonara',
  description: 'Classic Italian pasta dish',
  current_version_id: 'version-1' as RecipeVersionId,
  rolling_score: 4.5,
  tags: ['pasta', 'italian', 'quick'],
  is_favorite: false,
  last_cooked_at: new Date('2026-01-20T10:00:00Z'),
  created_by: 'user-789' as UserId,
  created_at: new Date('2026-01-15T10:00:00Z'),
  updated_at: new Date('2026-01-15T10:00:00Z'),
};

const mockRecipeNeverCooked: Recipe = {
  ...mockRecipe,
  id: 'recipe-456' as RecipeId,
  title: 'Pizza Margherita',
  rolling_score: null,
  last_cooked_at: null,
};

describe('RecipeCard', () => {
  describe('Basic Rendering', () => {
    it('should render recipe title', () => {
      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    it('should render recipe rating when available', () => {
      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

      expect(screen.getByText(/4.5/)).toBeInTheDocument();
    });

    it('should render first 3 tags', () => {
      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

      expect(screen.getByText(/pasta/)).toBeInTheDocument();
      expect(screen.getByText(/italian/)).toBeInTheDocument();
      expect(screen.getByText(/quick/)).toBeInTheDocument();
    });

    it('should render last cooked date', () => {
      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

      // Should show relative date like "8 days ago"
      expect(screen.getByText(/days ago/)).toBeInTheDocument();
    });

    it('should render "Never cooked" when last_cooked_at is null', () => {
      render(
        <RecipeCard
          recipe={mockRecipeNeverCooked}
          onAddToShortlist={vi.fn()}
          isInShortlist={false}
        />,
      );

      expect(screen.getByText(/never cooked/i)).toBeInTheDocument();
    });

    it('should render placeholder image when no image provided', () => {
      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

      const img = screen.getByRole('img', { name: /pasta carbonara/i });
      expect(img).toBeInTheDocument();
      // Should have placeholder src
      expect(img).toHaveAttribute('src', expect.stringContaining('placeholder'));
    });

    it('should render recipe image when imageUrl provided', () => {
      render(
        <RecipeCard
          recipe={mockRecipe}
          imageUrl="https://example.com/pasta.jpg"
          onAddToShortlist={vi.fn()}
          isInShortlist={false}
        />,
      );

      const img = screen.getByRole('img', { name: /pasta carbonara/i });
      expect(img).toHaveAttribute('src', expect.stringContaining('pasta.jpg'));
    });
  });

  describe('Shortlist Button', () => {
    it('should render "Add to Shortlist" button when not in shortlist', () => {
      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

      expect(screen.getByRole('button', { name: /add to shortlist/i })).toBeInTheDocument();
    });

    it('should render "Added" button when in shortlist', () => {
      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={true} />);

      expect(screen.getByRole('button', { name: /added/i })).toBeInTheDocument();
    });

    it('should call onAddToShortlist when button clicked', async () => {
      const user = userEvent.setup();
      const onAddToShortlist = vi.fn();

      render(
        <RecipeCard
          recipe={mockRecipe}
          onAddToShortlist={onAddToShortlist}
          isInShortlist={false}
        />,
      );

      const button = screen.getByRole('button', { name: /add to shortlist/i });
      await user.click(button);

      expect(onAddToShortlist).toHaveBeenCalledWith(mockRecipe.id);
    });

    it('should not call onAddToShortlist when already in shortlist', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 }); // Skip pointer-events check for disabled button
      const onAddToShortlist = vi.fn();

      render(
        <RecipeCard recipe={mockRecipe} onAddToShortlist={onAddToShortlist} isInShortlist={true} />,
      );

      const button = screen.getByRole('button', { name: /added/i });
      await user.click(button);

      expect(onAddToShortlist).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to recipe detail when card clicked', async () => {
      const user = userEvent.setup();
      mockPush.mockClear(); // Clear previous calls

      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

      // Click anywhere on the card except the button
      const card = screen.getByRole('article');
      await user.click(card);

      expect(mockPush).toHaveBeenCalledWith('/recipes/recipe-123');
    });

    it('should not navigate when shortlist button clicked', async () => {
      const user = userEvent.setup();
      mockPush.mockClear(); // Clear previous calls

      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

      const button = screen.getByRole('button', { name: /add to shortlist/i });
      await user.click(button);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible image alt text', () => {
      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

      const img = screen.getByRole('img', { name: /pasta carbonara/i });
      expect(img).toHaveAttribute('alt', expect.stringContaining('Pasta Carbonara'));
    });

    it('should have accessible button labels', () => {
      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

      const button = screen.getByRole('button', { name: /add to shortlist/i });
      expect(button).toBeInTheDocument();
    });

    it('should use semantic HTML for card structure', () => {
      render(<RecipeCard recipe={mockRecipe} onAddToShortlist={vi.fn()} isInShortlist={false} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });
});
