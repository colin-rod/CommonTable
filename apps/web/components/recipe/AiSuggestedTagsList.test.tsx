import type {
  AiTagSuggestionId,
  AiTagSuggestionWithTag,
  HouseholdId,
  RecipeVersionId,
  TagId,
  UserId,
} from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { AiSuggestedTagsList } from './AiSuggestedTagsList';

describe('AiSuggestedTagsList', () => {
  const mockVersionId = 'version-123' as RecipeVersionId;

  const mockSuggestions: AiTagSuggestionWithTag[] = [
    {
      id: 'suggestion-1' as AiTagSuggestionId,
      recipe_version_id: mockVersionId,
      tag_id: 'tag-1' as TagId,
      confidence_score: 0.95,
      user_accepted: null,
      accepted_at: null,
      model_version: 'gpt-4-turbo',
      created_at: new Date(),
      tag: {
        id: 'tag-1' as TagId,
        household_id: 'household-1' as HouseholdId,
        name: 'italian',
        created_by: 'user-123' as UserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    },
    {
      id: 'suggestion-2' as AiTagSuggestionId,
      recipe_version_id: mockVersionId,
      tag_id: 'tag-2' as TagId,
      confidence_score: 0.87,
      user_accepted: null,
      accepted_at: null,
      model_version: 'gpt-4-turbo',
      created_at: new Date(),
      tag: {
        id: 'tag-2' as TagId,
        household_id: 'household-1' as HouseholdId,
        name: 'pasta',
        created_by: 'user-123' as UserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    },
  ];

  it('should render suggestions with section header', () => {
    const mockOnAccept = vi.fn();
    const mockOnReject = vi.fn();
    const mockOnAcceptAll = vi.fn();

    render(
      <AiSuggestedTagsList
        suggestions={mockSuggestions}
        recipeVersionId={mockVersionId}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    expect(screen.getByText('AI Suggested Tags')).toBeInTheDocument();
    expect(
      screen.getByText('These tags were suggested based on the recipe content'),
    ).toBeInTheDocument();
    expect(screen.getByText('italian')).toBeInTheDocument();
    expect(screen.getByText('pasta')).toBeInTheDocument();
  });

  it('should call onAccept when clicking a suggestion chip', async () => {
    const user = userEvent.setup();
    const mockOnAccept = vi.fn().mockResolvedValue(undefined);
    const mockOnReject = vi.fn();
    const mockOnAcceptAll = vi.fn();

    render(
      <AiSuggestedTagsList
        suggestions={mockSuggestions}
        recipeVersionId={mockVersionId}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    const italianChip = screen.getByText('italian');
    await user.click(italianChip);

    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalledWith('suggestion-1');
    });
  });

  it('should call onReject when clicking the X on a suggestion chip', async () => {
    const user = userEvent.setup();
    const mockOnAccept = vi.fn();
    const mockOnReject = vi.fn().mockResolvedValue(undefined);
    const mockOnAcceptAll = vi.fn();

    render(
      <AiSuggestedTagsList
        suggestions={mockSuggestions}
        recipeVersionId={mockVersionId}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    // Find delete buttons by aria-label (MUI Chip adds this)
    const deleteButtons = screen.getAllByTestId('CancelIcon');
    await user.click(deleteButtons[0]!);

    await waitFor(() => {
      expect(mockOnReject).toHaveBeenCalledWith('suggestion-1');
    });
  });

  it('should show "Accept All" button when there are 2+ suggestions', () => {
    const mockOnAccept = vi.fn();
    const mockOnReject = vi.fn();
    const mockOnAcceptAll = vi.fn();

    render(
      <AiSuggestedTagsList
        suggestions={mockSuggestions}
        recipeVersionId={mockVersionId}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    expect(screen.getByText('Accept All')).toBeInTheDocument();
  });

  it('should not show "Accept All" button when there is only 1 suggestion', () => {
    const mockOnAccept = vi.fn();
    const mockOnReject = vi.fn();
    const mockOnAcceptAll = vi.fn();

    render(
      <AiSuggestedTagsList
        suggestions={[mockSuggestions[0]!]}
        recipeVersionId={mockVersionId}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    expect(screen.queryByText('Accept All')).not.toBeInTheDocument();
  });

  it('should call onAcceptAll when clicking "Accept All" button', async () => {
    const user = userEvent.setup();
    const mockOnAccept = vi.fn();
    const mockOnReject = vi.fn();
    const mockOnAcceptAll = vi.fn().mockResolvedValue(undefined);

    render(
      <AiSuggestedTagsList
        suggestions={mockSuggestions}
        recipeVersionId={mockVersionId}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    const acceptAllButton = screen.getByText('Accept All');
    await user.click(acceptAllButton);

    await waitFor(() => {
      expect(mockOnAcceptAll).toHaveBeenCalled();
    });
  });

  it('should disable chips during loading', async () => {
    const user = userEvent.setup();
    const mockOnAccept = vi
      .fn()
      .mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));
    const mockOnReject = vi.fn();
    const mockOnAcceptAll = vi.fn();

    render(
      <AiSuggestedTagsList
        suggestions={mockSuggestions}
        recipeVersionId={mockVersionId}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    const italianChip = screen.getByText('italian').closest('div');
    await user.click(screen.getByText('italian'));

    // Chips should be disabled during loading
    expect(italianChip).toHaveClass('Mui-disabled');
  });

  it('should not render when suggestions array is empty', () => {
    const mockOnAccept = vi.fn();
    const mockOnReject = vi.fn();
    const mockOnAcceptAll = vi.fn();

    const { container } = render(
      <AiSuggestedTagsList
        suggestions={[]}
        recipeVersionId={mockVersionId}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should have proper aria-labels for accessibility', () => {
    const mockOnAccept = vi.fn();
    const mockOnReject = vi.fn();
    const mockOnAcceptAll = vi.fn();

    render(
      <AiSuggestedTagsList
        suggestions={mockSuggestions}
        recipeVersionId={mockVersionId}
        onAccept={mockOnAccept}
        onReject={mockOnReject}
        onAcceptAll={mockOnAcceptAll}
      />,
    );

    expect(screen.getByLabelText('Accept italian')).toBeInTheDocument();
    expect(screen.getByLabelText('Accept pasta')).toBeInTheDocument();
    expect(screen.getByLabelText('Accept all suggestions')).toBeInTheDocument();
  });
});
