import type { RecipeSuggestion, Recipe, RecipeId, HouseholdId } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SuggestedRecipesList } from './SuggestedRecipesList';

describe('SuggestedRecipesList Component', () => {
  const mockOnSelectRecipe = vi.fn();

  const mockRecipe: Recipe = {
    id: 'recipe-1' as RecipeId,
    household_id: 'household-1' as HouseholdId,
    title: 'Pasta Carbonara',
    description: null,
    tags: ['italian', 'pasta', 'dinner'],
    is_favorite: false,
    rolling_score: 4.0,
    created_by: 'user-1' as any,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    last_cooked_at: null,
    current_version_id: 'version-1' as any,
    // Phase 3 metadata fields
    cuisine: null,
    meal_type: null,
    key_ingredients: [],
    priority: null,
    status: 'suggested',
    source_url: null,
  };

  const mockSuggestions: RecipeSuggestion[] = [
    {
      recipe: mockRecipe,
      score: 0.85,
      badge: 'Favorite',
      matchingTags: ['dinner'],
    },
    {
      recipe: { ...mockRecipe, id: 'recipe-2' as RecipeId, title: 'Caesar Salad' },
      score: 0.72,
      badge: 'Top Rated',
      matchingTags: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render list of suggestions', () => {
      render(
        <SuggestedRecipesList suggestions={mockSuggestions} onSelectRecipe={mockOnSelectRecipe} />,
      );

      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
    });

    it('should display badge for each suggestion', () => {
      render(
        <SuggestedRecipesList suggestions={mockSuggestions} onSelectRecipe={mockOnSelectRecipe} />,
      );

      expect(screen.getByText('Favorite')).toBeInTheDocument();
      expect(screen.getByText('Top Rated')).toBeInTheDocument();
    });

    it('should display matching tags as secondary text', () => {
      render(
        <SuggestedRecipesList suggestions={mockSuggestions} onSelectRecipe={mockOnSelectRecipe} />,
      );

      expect(screen.getByText(/Matches: dinner/i)).toBeInTheDocument();
    });

    it('should show "No matches" when no matching tags', () => {
      render(
        <SuggestedRecipesList suggestions={mockSuggestions} onSelectRecipe={mockOnSelectRecipe} />,
      );

      // Caesar Salad has no matching tags
      const items = screen.getAllByRole('button');
      const caesarSaladItem = items[1]; // Second item

      // Check that the parent element contains "No matches"
      expect(caesarSaladItem).toHaveTextContent(/No matches/i);
    });

    it('should show loading spinner when loading=true', () => {
      render(
        <SuggestedRecipesList
          suggestions={[]}
          onSelectRecipe={mockOnSelectRecipe}
          loading={true}
        />,
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show empty message when no suggestions', () => {
      const emptyMessage = 'No suggestions found';
      render(
        <SuggestedRecipesList
          suggestions={[]}
          onSelectRecipe={mockOnSelectRecipe}
          emptyMessage={emptyMessage}
        />,
      );

      expect(screen.getByText(emptyMessage)).toBeInTheDocument();
    });

    it('should show default empty message when not provided', () => {
      render(<SuggestedRecipesList suggestions={[]} onSelectRecipe={mockOnSelectRecipe} />);

      expect(screen.getByText('No suggestions available')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onSelectRecipe when recipe clicked', async () => {
      const user = userEvent.setup();
      render(
        <SuggestedRecipesList suggestions={mockSuggestions} onSelectRecipe={mockOnSelectRecipe} />,
      );

      // Click on the first recipe button
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]!);

      expect(mockOnSelectRecipe).toHaveBeenCalledWith('recipe-1');
    });

    it('should not call onSelectRecipe when loading', async () => {
      render(
        <SuggestedRecipesList
          suggestions={mockSuggestions}
          onSelectRecipe={mockOnSelectRecipe}
          loading={true}
        />,
      );

      // Loading spinner is displayed, no recipe buttons
      expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
      expect(mockOnSelectRecipe).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button elements', () => {
      render(
        <SuggestedRecipesList suggestions={mockSuggestions} onSelectRecipe={mockOnSelectRecipe} />,
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2); // Two suggestions
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <SuggestedRecipesList suggestions={mockSuggestions} onSelectRecipe={mockOnSelectRecipe} />,
      );

      const firstButton = screen.getAllByRole('button')[0]!;
      firstButton.focus();

      // Press Enter to select
      await user.keyboard('{Enter}');

      expect(mockOnSelectRecipe).toHaveBeenCalledWith('recipe-1');
    });
  });
});
