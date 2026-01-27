import type { RecipeSuggestion, Recipe, RecipeId, HouseholdId, UserId } from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecipeSuggestionsPage } from './RecipeSuggestionsPage';

import * as recipeSuggestionActions from '@/app/actions/recipeSuggestion';

vi.mock('@/app/actions/recipeSuggestion');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('RecipeSuggestionsPage', () => {
  const mockRecipe1: Recipe = {
    id: 'recipe-1' as RecipeId,
    household_id: 'household-1' as HouseholdId,
    title: 'Pasta Carbonara',
    description: 'Classic Italian pasta',
    current_version_id: null,
    rolling_score: 4.5,
    tags: ['pasta', 'italian'],
    is_favorite: true,
    last_cooked_at: new Date('2024-01-15'),
    created_by: 'user-1' as UserId,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
  };

  const mockRecipe2: Recipe = {
    id: 'recipe-2' as RecipeId,
    household_id: 'household-1' as HouseholdId,
    title: 'Chicken Soup',
    description: 'Hearty chicken soup',
    current_version_id: null,
    rolling_score: 5.0,
    tags: ['soup', 'chicken'],
    is_favorite: false,
    last_cooked_at: new Date('2024-01-10'),
    created_by: 'user-1' as UserId,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-10'),
  };

  const mockSuggestions: RecipeSuggestion[] = [
    {
      recipe: mockRecipe1,
      score: 0.85,
      badge: 'Favorite',
      matchingTags: ['pasta'],
    },
    {
      recipe: mockRecipe2,
      score: 0.75,
      badge: 'Top Rated',
      matchingTags: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title and description', () => {
    vi.mocked(recipeSuggestionActions.getRecipeSuggestions).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<RecipeSuggestionsPage />);

    expect(screen.getByText('Recipe Suggestions')).toBeInTheDocument();
    expect(
      screen.getByText(/Personalized recipe recommendations based on your household/i),
    ).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    vi.mocked(recipeSuggestionActions.getRecipeSuggestions).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<RecipeSuggestionsPage />);

    expect(screen.getByText(/Loading suggestions/i)).toBeInTheDocument();
  });

  it('should display suggestions after loading', async () => {
    vi.mocked(recipeSuggestionActions.getRecipeSuggestions).mockResolvedValue({
      success: true,
      data: mockSuggestions,
    });

    render(<RecipeSuggestionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.getByText('Chicken Soup')).toBeInTheDocument();
    });
  });

  it('should display badges for suggestions', async () => {
    vi.mocked(recipeSuggestionActions.getRecipeSuggestions).mockResolvedValue({
      success: true,
      data: mockSuggestions,
    });

    render(<RecipeSuggestionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Favorite')).toBeInTheDocument();
      expect(screen.getByText('Top Rated')).toBeInTheDocument();
    });
  });

  it('should show empty state when no suggestions', async () => {
    vi.mocked(recipeSuggestionActions.getRecipeSuggestions).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<RecipeSuggestionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/No suggestions found/i)).toBeInTheDocument();
    });
  });

  it('should show error message when loading fails', async () => {
    vi.mocked(recipeSuggestionActions.getRecipeSuggestions).mockResolvedValue({
      success: false,
      error: { message: 'Failed to load suggestions' },
    });

    render(<RecipeSuggestionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load suggestions/i)).toBeInTheDocument();
    });
  });

  it('should call getRecipeSuggestions with empty context and limit 20', () => {
    vi.mocked(recipeSuggestionActions.getRecipeSuggestions).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<RecipeSuggestionsPage />);

    expect(recipeSuggestionActions.getRecipeSuggestions).toHaveBeenCalledWith({}, undefined, 20);
  });
});
