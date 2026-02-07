import type {
  AiTagSuggestionId,
  RecipeId,
  RecipeVersionId,
  RecipeWithPendingSuggestions,
  TagId,
  HouseholdId,
  UserId,
} from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AiTagReviewPage } from './AiTagReviewPage';

// Mock server actions
vi.mock('@/app/actions/aiTagSuggestion', () => ({
  getPendingTagSuggestionsForReview: vi.fn(),
  acceptAiTagSuggestion: vi.fn(),
  rejectAiTagSuggestion: vi.fn(),
  acceptAllAiTagSuggestionsForRecipe: vi.fn(),
}));

import {
  getPendingTagSuggestionsForReview,
  acceptAiTagSuggestion,
  rejectAiTagSuggestion,
  acceptAllAiTagSuggestionsForRecipe,
} from '@/app/actions/aiTagSuggestion';

describe('AiTagReviewPage', () => {
  const mockRecipes: RecipeWithPendingSuggestions[] = [
    {
      recipe_id: 'recipe-1' as RecipeId,
      recipe_title: 'Pasta Carbonara',
      recipe_version_id: 'version-1' as RecipeVersionId,
      suggestions: [
        {
          id: 'suggestion-1' as AiTagSuggestionId,
          recipe_version_id: 'version-1' as RecipeVersionId,
          tag_id: 'tag-1' as TagId,
          confidence_score: 0.95,
          user_accepted: null,
          accepted_at: null,
          model_version: 'gpt-4o-mini',
          created_at: new Date(),
          tag: {
            id: 'tag-1' as TagId,
            household_id: 'household-1' as HouseholdId,
            name: 'pasta',
            created_by: 'user-1' as UserId,
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
        {
          id: 'suggestion-2' as AiTagSuggestionId,
          recipe_version_id: 'version-1' as RecipeVersionId,
          tag_id: 'tag-2' as TagId,
          confidence_score: 0.88,
          user_accepted: null,
          accepted_at: null,
          model_version: 'gpt-4o-mini',
          created_at: new Date(),
          tag: {
            id: 'tag-2' as TagId,
            household_id: 'household-1' as HouseholdId,
            name: 'italian',
            created_by: 'user-1' as UserId,
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    vi.mocked(getPendingTagSuggestionsForReview).mockReturnValue(new Promise(() => {}) as any);

    render(<AiTagReviewPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display recipes after successful load', async () => {
    vi.mocked(getPendingTagSuggestionsForReview).mockResolvedValue({
      success: true,
      data: mockRecipes,
    });

    render(<AiTagReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
      expect(screen.getByText('2 pending tags')).toBeInTheDocument();
    });
  });

  it('should show error message on fetch failure', async () => {
    vi.mocked(getPendingTagSuggestionsForReview).mockResolvedValue({
      success: false,
      error: { message: 'Failed to load suggestions', code: 'FETCH_ERROR' },
    });

    render(<AiTagReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load suggestions')).toBeInTheDocument();
    });
  });

  it('should show empty state when no pending suggestions', async () => {
    vi.mocked(getPendingTagSuggestionsForReview).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<AiTagReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('No pending tag suggestions')).toBeInTheDocument();
      expect(screen.getByText('AI-suggested tags will appear here for review')).toBeInTheDocument();
    });
  });

  it('should remove suggestion from list after accepting individual tag', async () => {
    const user = userEvent.setup();

    vi.mocked(getPendingTagSuggestionsForReview).mockResolvedValue({
      success: true,
      data: mockRecipes,
    });

    vi.mocked(acceptAiTagSuggestion).mockResolvedValue({
      success: true,
      data: {} as any,
    });

    render(<AiTagReviewPage />);

    // Wait for recipes to load
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Expand recipe
    await user.click(screen.getByText('Pasta Carbonara'));

    // Accept tag
    await user.click(screen.getByText('pasta'));

    await waitFor(() => {
      expect(acceptAiTagSuggestion).toHaveBeenCalledWith('suggestion-1');
      // Recipe should still be visible (1 tag remaining)
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
  });

  it('should remove recipe from list after accepting all tags', async () => {
    const user = userEvent.setup();

    vi.mocked(getPendingTagSuggestionsForReview).mockResolvedValue({
      success: true,
      data: mockRecipes,
    });

    vi.mocked(acceptAllAiTagSuggestionsForRecipe).mockResolvedValue({
      success: true,
      data: undefined,
    });

    render(<AiTagReviewPage />);

    // Wait for recipes to load
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Expand recipe
    await user.click(screen.getByText('Pasta Carbonara'));

    // Accept all
    await user.click(screen.getByText('Accept All'));

    await waitFor(() => {
      expect(acceptAllAiTagSuggestionsForRecipe).toHaveBeenCalledWith('version-1');
      // Recipe should be removed from list
      expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
    });
  });

  it('should remove suggestion from list after rejecting individual tag', async () => {
    const user = userEvent.setup();

    vi.mocked(getPendingTagSuggestionsForReview).mockResolvedValue({
      success: true,
      data: mockRecipes,
    });

    vi.mocked(rejectAiTagSuggestion).mockResolvedValue({
      success: true,
      data: {} as any,
    });

    render(<AiTagReviewPage />);

    // Wait for recipes to load
    await waitFor(() => {
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });

    // Expand recipe
    await user.click(screen.getByText('Pasta Carbonara'));

    // Reject tag (click X button)
    const deleteButtons = screen.getAllByTestId('CancelIcon');
    const firstDeleteButton = deleteButtons[0];
    if (!firstDeleteButton) throw new Error('Delete button not found');
    await user.click(firstDeleteButton);

    await waitFor(() => {
      expect(rejectAiTagSuggestion).toHaveBeenCalledWith('suggestion-1');
      // Recipe should still be visible (1 tag remaining)
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
  });
});
