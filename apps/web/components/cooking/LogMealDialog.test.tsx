import type { CalendarEntryId, RecipeId, RecipeVersionId } from '@commontable/types';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LogMealDialog } from './LogMealDialog';

// Mock useCookingEvents hook
const mockLogMeal = vi.fn();
vi.mock('@/hooks/useCookingEvents', () => ({
  useCookingEvents: () => ({
    logMeal: mockLogMeal,
    loading: false,
    error: null,
  }),
}));

describe('LogMealDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    recipeId: 'recipe-1' as RecipeId,
    recipeVersionId: 'version-1' as RecipeVersionId,
    recipeTitle: 'Pasta Carbonara',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogMeal.mockResolvedValue({ success: true, data: {} });
  });

  it('should render with recipe title', () => {
    render(<LogMealDialog {...defaultProps} />);

    expect(screen.getByText(/log meal: pasta carbonara/i)).toBeInTheDocument();
  });

  it('should show rating component', () => {
    render(<LogMealDialog {...defaultProps} />);

    expect(screen.getByText(/how was it\?/i)).toBeInTheDocument();
    // Material UI Rating component renders 5 star buttons
    expect(screen.getAllByLabelText(/star/i)).toHaveLength(5);
  });

  it('should show servings made input field', () => {
    render(<LogMealDialog {...defaultProps} />);

    expect(screen.getByLabelText(/servings made/i)).toBeInTheDocument();
  });

  it('should show notes input field', () => {
    render(<LogMealDialog {...defaultProps} />);

    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('should allow submitting without rating (null rating)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<LogMealDialog {...defaultProps} onClose={onClose} />);

    // Don't select any rating - leave it as null
    const logButton = screen.getByRole('button', { name: /log meal/i });
    await user.click(logButton);

    await waitFor(() => {
      expect(mockLogMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          recipe_id: 'recipe-1',
          recipe_version_id: 'version-1',
          rating: null, // Null rating should be allowed
        }),
      );
    });
  });

  it('should submit with selected rating', async () => {
    const user = userEvent.setup();

    render(<LogMealDialog {...defaultProps} />);

    // Material UI Rating component - get the container and trigger change event
    const ratingInputs = screen.getAllByRole('radio');
    const fourStarInput = ratingInputs[3]!; // 4 stars (0-indexed)

    // Fire change event with value
    fireEvent.click(fourStarInput);

    const logButton = screen.getByRole('button', { name: /log meal/i });
    await user.click(logButton);

    await waitFor(() => {
      expect(mockLogMeal).toHaveBeenCalled();
    });

    expect(mockLogMeal).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 4,
      }),
    );
  });

  it('should submit with notes', async () => {
    const user = userEvent.setup();

    render(<LogMealDialog {...defaultProps} />);

    const notesField = screen.getByLabelText(/notes/i);
    await user.type(notesField, 'Delicious meal!');

    const logButton = screen.getByRole('button', { name: /log meal/i });
    await user.click(logButton);

    await waitFor(() => {
      expect(mockLogMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Delicious meal!',
        }),
      );
    });
  });

  it('should submit with servings made', async () => {
    const user = userEvent.setup();

    render(<LogMealDialog {...defaultProps} />);

    const servingsField = screen.getByLabelText(/servings made/i);
    await user.type(servingsField, '4');

    const logButton = screen.getByRole('button', { name: /log meal/i });
    await user.click(logButton);

    await waitFor(() => {
      expect(mockLogMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          servings_made: 4,
        }),
      );
    });
  });

  it('should close dialog and reset form after successful submission', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<LogMealDialog {...defaultProps} onClose={onClose} />);

    // Select rating (3 stars = index 2)
    const threeStarInput = screen.getAllByRole('radio')[2]!;
    fireEvent.click(threeStarInput);

    // Add notes
    const notesField = screen.getByLabelText(/notes/i);
    await user.type(notesField, 'Good');

    // Submit
    const logButton = screen.getByRole('button', { name: /log meal/i });
    await user.click(logButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onClose when Cancel button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<LogMealDialog {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should show helper text indicating fields are optional', () => {
    render(<LogMealDialog {...defaultProps} />);

    // Check that optional helper text is shown (servings and notes already say "Optional:")
    expect(screen.getByText(/optional: how many servings/i)).toBeInTheDocument();
    expect(screen.getByText(/optional: how did it turn out/i)).toBeInTheDocument();
  });

  it('should include calendar_entry_id when provided', async () => {
    const user = userEvent.setup();
    const calendarEntryId = 'calendar-entry-1' as CalendarEntryId;

    render(<LogMealDialog {...defaultProps} calendarEntryId={calendarEntryId} />);

    const logButton = screen.getByRole('button', { name: /log meal/i });
    await user.click(logButton);

    await waitFor(() => {
      expect(mockLogMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          calendar_entry_id: 'calendar-entry-1',
        }),
      );
    });
  });
});
