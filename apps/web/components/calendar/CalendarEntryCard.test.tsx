import type { CalendarEntry, CalendarEntryId } from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { CalendarEntryCard } from './CalendarEntryCard';

// Mock server actions
vi.mock('@/app/actions/cookingEvent', () => ({
  createCookingEvent: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'recipe-1',
          current_version_id: 'version-1',
          servings: 4,
        },
        error: null,
      }),
    })),
  })),
}));

// Mock RecipeService
vi.mock('@commontable/api-client', () => ({
  RecipeService: vi.fn().mockImplementation(() => ({
    getById: vi.fn().mockResolvedValue({
      id: 'recipe-1',
      current_version_id: 'version-1',
    }),
    getVersionById: vi.fn().mockResolvedValue({
      id: 'version-1',
      recipe_id: 'recipe-1',
      version_number: 1,
      servings: 4,
      ingredients_json: [],
      steps_json: [],
      prep_time_minutes: null,
      cook_time_minutes: null,
      notes: null,
      created_by: 'user-1' as any,
      created_at: new Date(),
    }),
  })),
}));

describe('CalendarEntryCard', () => {
  const mockEntry: CalendarEntry = {
    id: 'entry-1' as CalendarEntryId,
    household_id: 'household-1' as any,
    recipe_id: 'recipe-1' as any,
    planned_date: new Date('2026-01-20'),
    meal_slot: 'dinner',
    status: 'planned',
    notes: 'Family dinner',
    created_by: 'user-1' as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const defaultProps = {
    entry: mockEntry,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onMarkComplete: vi.fn(),
  };

  it('should render recipe assigned indicator when recipe_id exists', () => {
    render(<CalendarEntryCard {...defaultProps} />);

    expect(screen.getByText('Recipe assigned')).toBeInTheDocument();
  });

  it('should render notes-only indicator when no recipe_id', () => {
    const entryWithoutRecipe = { ...mockEntry, recipe_id: null };

    render(<CalendarEntryCard {...defaultProps} entry={entryWithoutRecipe} />);

    expect(screen.getByText('Notes only')).toBeInTheDocument();
  });

  it('should display notes when present', () => {
    render(<CalendarEntryCard {...defaultProps} />);

    expect(screen.getByText('Family dinner')).toBeInTheDocument();
  });

  it('should not display notes section when notes are null', () => {
    const entryWithoutNotes = { ...mockEntry, notes: null };

    render(<CalendarEntryCard {...defaultProps} entry={entryWithoutNotes} />);

    expect(screen.queryByText('Family dinner')).not.toBeInTheDocument();
  });

  it('should display status badge', () => {
    render(<CalendarEntryCard {...defaultProps} />);

    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(<CalendarEntryCard {...defaultProps} onEdit={onEdit} />);

    const editButton = screen.getByLabelText(/edit calendar entry/i);
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<CalendarEntryCard {...defaultProps} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText(/delete calendar entry/i);
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should show view recipe button when onViewRecipe provided', () => {
    const onViewRecipe = vi.fn();

    render(<CalendarEntryCard {...defaultProps} onViewRecipe={onViewRecipe} />);

    expect(screen.getByLabelText(/view recipe/i)).toBeInTheDocument();
  });

  it('should not show view recipe button when onViewRecipe not provided', () => {
    render(<CalendarEntryCard {...defaultProps} />);

    expect(screen.queryByLabelText(/view recipe/i)).not.toBeInTheDocument();
  });

  it('should call onViewRecipe when view button clicked', async () => {
    const user = userEvent.setup();
    const onViewRecipe = vi.fn();

    render(<CalendarEntryCard {...defaultProps} onViewRecipe={onViewRecipe} />);

    const viewButton = screen.getByLabelText(/view recipe/i);
    await user.click(viewButton);

    expect(onViewRecipe).toHaveBeenCalledTimes(1);
  });

  // These tests are replaced by the new "Mark as cooked" workflow tests below

  it('should display correct status colors', () => {
    const { rerender } = render(<CalendarEntryCard {...defaultProps} />);

    // Planned status
    expect(screen.getByText('Planned')).toBeInTheDocument();

    // Confirmed status
    rerender(<CalendarEntryCard {...defaultProps} entry={{ ...mockEntry, status: 'confirmed' }} />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();

    // Completed status
    rerender(<CalendarEntryCard {...defaultProps} entry={{ ...mockEntry, status: 'completed' }} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();

    // Cancelled status
    rerender(<CalendarEntryCard {...defaultProps} entry={{ ...mockEntry, status: 'cancelled' }} />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  describe('Inline rating UI', () => {
    it('should show "Mark as cooked" button for planned status', () => {
      render(<CalendarEntryCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /mark as cooked/i })).toBeInTheDocument();
    });

    it('should show "Mark as cooked" button for confirmed status', () => {
      const confirmedEntry = { ...mockEntry, status: 'confirmed' as const };

      render(<CalendarEntryCard {...defaultProps} entry={confirmedEntry} />);

      expect(screen.getByRole('button', { name: /mark as cooked/i })).toBeInTheDocument();
    });

    it('should not show "Mark as cooked" button for completed status', () => {
      const completedEntry = { ...mockEntry, status: 'completed' as const };

      render(<CalendarEntryCard {...defaultProps} entry={completedEntry} />);

      expect(screen.queryByRole('button', { name: /mark as cooked/i })).not.toBeInTheDocument();
    });

    it('should show rating UI when "Mark as cooked" button clicked', async () => {
      const user = userEvent.setup();

      render(<CalendarEntryCard {...defaultProps} />);

      const markAsCookedButton = screen.getByRole('button', { name: /mark as cooked/i });
      await user.click(markAsCookedButton);

      expect(screen.getByText(/rate this meal/i)).toBeInTheDocument();
    });

    it('should display 5 star buttons in rating UI', async () => {
      const user = userEvent.setup();

      render(<CalendarEntryCard {...defaultProps} />);

      const markAsCookedButton = screen.getByRole('button', { name: /mark as cooked/i });
      await user.click(markAsCookedButton);

      const starButtons = screen.getAllByRole('button', { name: /rate \d star/i });
      expect(starButtons).toHaveLength(5);
    });

    it('should update selected rating when star button clicked', async () => {
      const user = userEvent.setup();

      render(<CalendarEntryCard {...defaultProps} />);

      const markAsCookedButton = screen.getByRole('button', { name: /mark as cooked/i });
      await user.click(markAsCookedButton);

      const threeStarButton = screen.getByRole('button', { name: /rate 3 stars/i });
      await user.click(threeStarButton);

      // Filled stars should be visible for selected rating
      expect(screen.getAllByTestId('star-filled')).toHaveLength(3);
      expect(screen.getAllByTestId('star-border')).toHaveLength(2);
    });

    it('should enable Submit button when rating selected', async () => {
      const user = userEvent.setup();

      render(<CalendarEntryCard {...defaultProps} />);

      const markAsCookedButton = screen.getByRole('button', { name: /mark as cooked/i });
      await user.click(markAsCookedButton);

      // Submit button should be disabled initially
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();

      // Select rating
      const threeStarButton = screen.getByRole('button', { name: /rate 3 stars/i });
      await user.click(threeStarButton);

      // Submit button should be enabled
      expect(submitButton).toBeEnabled();
    });

    it('should hide rating UI when Cancel button clicked', async () => {
      const user = userEvent.setup();

      render(<CalendarEntryCard {...defaultProps} />);

      const markAsCookedButton = screen.getByRole('button', { name: /mark as cooked/i });
      await user.click(markAsCookedButton);

      expect(screen.getByText(/rate this meal/i)).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText(/rate this meal/i)).not.toBeInTheDocument();
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const { createCookingEvent } = await import('@/app/actions/cookingEvent');

      // Make the mock delay to capture loading state
      vi.mocked(createCookingEvent).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, data: {} as any }), 100);
          }),
      );

      render(<CalendarEntryCard {...defaultProps} />);

      const markAsCookedButton = screen.getByRole('button', { name: /mark as cooked/i });
      await user.click(markAsCookedButton);

      const threeStarButton = screen.getByRole('button', { name: /rate 3 stars/i });
      await user.click(threeStarButton);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Loading indicator should appear (CircularProgress)
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  describe('Submission flow', () => {
    it('should call createCookingEvent with correct params when submitted', async () => {
      const user = userEvent.setup();
      const { createCookingEvent } = await import('@/app/actions/cookingEvent');

      render(<CalendarEntryCard {...defaultProps} />);

      const markAsCookedButton = screen.getByRole('button', { name: /mark as cooked/i });
      await user.click(markAsCookedButton);

      const threeStarButton = screen.getByRole('button', { name: /rate 3 stars/i });
      await user.click(threeStarButton);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      expect(createCookingEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          recipe_id: mockEntry.recipe_id,
          rating: 3,
          calendar_entry_id: mockEntry.id,
        }),
      );
    });

    it('should call onMarkComplete callback after successful submission', async () => {
      const user = userEvent.setup();
      const onMarkComplete = vi.fn();

      render(<CalendarEntryCard {...defaultProps} onMarkComplete={onMarkComplete} />);

      const markAsCookedButton = screen.getByRole('button', { name: /mark as cooked/i });
      await user.click(markAsCookedButton);

      const threeStarButton = screen.getByRole('button', { name: /rate 3 stars/i });
      await user.click(threeStarButton);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Wait for async submission
      await vi.waitFor(() => {
        expect(onMarkComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should hide rating UI after successful submission', async () => {
      const user = userEvent.setup();

      render(<CalendarEntryCard {...defaultProps} />);

      const markAsCookedButton = screen.getByRole('button', { name: /mark as cooked/i });
      await user.click(markAsCookedButton);

      const threeStarButton = screen.getByRole('button', { name: /rate 3 stars/i });
      await user.click(threeStarButton);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Wait for async submission
      await vi.waitFor(() => {
        expect(screen.queryByText(/rate this meal/i)).not.toBeInTheDocument();
      });
    });

    it('should keep rating UI visible if submission fails', async () => {
      const user = userEvent.setup();
      const { createCookingEvent } = await import('@/app/actions/cookingEvent');
      vi.mocked(createCookingEvent).mockRejectedValueOnce(new Error('Network error'));

      render(<CalendarEntryCard {...defaultProps} />);

      const markAsCookedButton = screen.getByRole('button', { name: /mark as cooked/i });
      await user.click(markAsCookedButton);

      const threeStarButton = screen.getByRole('button', { name: /rate 3 stars/i });
      await user.click(threeStarButton);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Wait for async submission to fail
      await vi.waitFor(() => {
        expect(screen.getByText(/rate this meal/i)).toBeInTheDocument();
      });
    });
  });
});
