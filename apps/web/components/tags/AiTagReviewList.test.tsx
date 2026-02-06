import type {
  AiTagSuggestionId,
  RecipeId,
  RecipeVersionId,
  RecipeWithPendingSuggestions,
  TagId,
  HouseholdId,
  UserId,
} from '@commontable/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AiTagReviewList } from './AiTagReviewList';

describe('AiTagReviewList', () => {
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
    {
      recipe_id: 'recipe-2' as RecipeId,
      recipe_title: 'Chicken Stir-Fry',
      recipe_version_id: 'version-2' as RecipeVersionId,
      suggestions: [
        {
          id: 'suggestion-3' as AiTagSuggestionId,
          recipe_version_id: 'version-2' as RecipeVersionId,
          tag_id: 'tag-3' as TagId,
          confidence_score: 0.9,
          user_accepted: null,
          accepted_at: null,
          model_version: 'gpt-4o-mini',
          created_at: new Date(),
          tag: {
            id: 'tag-3' as TagId,
            household_id: 'household-1' as HouseholdId,
            name: 'chicken',
            created_by: 'user-1' as UserId,
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
      ],
    },
  ];

  let mockOnAccept: ReturnType<typeof vi.fn>;
  let mockOnReject: ReturnType<typeof vi.fn>;
  let mockOnAcceptAll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnAccept = vi.fn().mockResolvedValue(undefined);
    mockOnReject = vi.fn().mockResolvedValue(undefined);
    mockOnAcceptAll = vi.fn().mockResolvedValue(undefined);
  });

  it('should render collapsed recipe list with titles and pending counts', () => {
    render(
      <AiTagReviewList
        recipes={mockRecipes}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('2 pending tags')).toBeInTheDocument();
    expect(screen.getByText('Chicken Stir-Fry')).toBeInTheDocument();
    expect(screen.getByText('1 pending tag')).toBeInTheDocument();

    // Tags should not be visible when collapsed
    expect(screen.queryByText('pasta')).not.toBeInTheDocument();
    expect(screen.queryByText('italian')).not.toBeInTheDocument();
    expect(screen.queryByText('chicken')).not.toBeInTheDocument();
  });

  it('should show singular "1 pending tag" for single suggestion', () => {
    const firstSuggestion = mockRecipes[0]?.suggestions[0];
    if (!firstSuggestion) throw new Error('Missing test data');

    const singleSuggestionRecipe: RecipeWithPendingSuggestions[] = [
      {
        recipe_id: 'recipe-3' as RecipeId,
        recipe_title: 'Test Recipe',
        recipe_version_id: 'version-3' as RecipeVersionId,
        suggestions: [firstSuggestion],
      },
    ];

    render(
      <AiTagReviewList
        recipes={singleSuggestionRecipe}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    expect(screen.getByText('1 pending tag')).toBeInTheDocument();
    expect(screen.queryByText('1 pending tags')).not.toBeInTheDocument();
  });

  it('should expand recipe when clicked and show tags', async () => {
    const user = userEvent.setup();

    render(
      <AiTagReviewList
        recipes={mockRecipes}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    // Initially tags are hidden
    expect(screen.queryByText('pasta')).not.toBeInTheDocument();

    // Click recipe to expand
    await user.click(screen.getByText('Pasta Carbonara'));

    // Tags should now be visible
    expect(screen.getByText('pasta')).toBeInTheDocument();
    expect(screen.getByText('italian')).toBeInTheDocument();
  });

  it('should collapse recipe when clicked again', async () => {
    const user = userEvent.setup();

    render(
      <AiTagReviewList
        recipes={mockRecipes}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    // Expand recipe
    await user.click(screen.getByText('Pasta Carbonara'));
    expect(screen.getByText('pasta')).toBeInTheDocument();

    // Collapse recipe
    await user.click(screen.getByText('Pasta Carbonara'));
    expect(screen.queryByText('pasta')).not.toBeInTheDocument();
  });

  it('should only allow one recipe expanded at a time', async () => {
    const user = userEvent.setup();

    render(
      <AiTagReviewList
        recipes={mockRecipes}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    // Expand first recipe
    await user.click(screen.getByText('Pasta Carbonara'));
    expect(screen.getByText('pasta')).toBeInTheDocument();

    // Expand second recipe (should collapse first)
    await user.click(screen.getByText('Chicken Stir-Fry'));
    expect(screen.getByText('chicken')).toBeInTheDocument();
    expect(screen.queryByText('pasta')).not.toBeInTheDocument();
  });

  it('should call onAccept when tag chip is clicked', async () => {
    const user = userEvent.setup();

    render(
      <AiTagReviewList
        recipes={mockRecipes}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    // Expand recipe
    await user.click(screen.getByText('Pasta Carbonara'));

    // Click tag chip
    await user.click(screen.getByText('pasta'));

    expect(mockOnAccept).toHaveBeenCalledWith('suggestion-1');
  });

  it('should call onReject when tag X is clicked', async () => {
    const user = userEvent.setup();

    render(
      <AiTagReviewList
        recipes={mockRecipes}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    // Expand recipe
    await user.click(screen.getByText('Pasta Carbonara'));

    // Find and click the delete button (X) on the first chip
    const deleteButtons = screen.getAllByTestId('CancelIcon');
    const firstDeleteButton = deleteButtons[0];
    if (!firstDeleteButton) throw new Error('Delete button not found');
    await user.click(firstDeleteButton);

    expect(mockOnReject).toHaveBeenCalledWith('suggestion-1');
  });

  it('should call onAcceptAll when "Accept All" button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <AiTagReviewList
        recipes={mockRecipes}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    // Expand recipe
    await user.click(screen.getByText('Pasta Carbonara'));

    // Click "Accept All" button
    await user.click(screen.getByText('Accept All'));

    expect(mockOnAcceptAll).toHaveBeenCalledWith('version-1');
  });
});
