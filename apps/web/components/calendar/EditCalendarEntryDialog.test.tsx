import type { Recipe, RecipeId, CalendarEntry, CalendarEntryId } from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { EditCalendarEntryDialog } from './EditCalendarEntryDialog';

describe('EditCalendarEntryDialog', () => {
  const mockRecipes: Recipe[] = [
    {
      id: 'recipe-1' as RecipeId,
      household_id: 'household-1' as any,
      title: 'Pasta Carbonara',
      description: null,
      current_version_id: 'version-1' as any,
      rolling_score: null,
      tags: [],
      is_favorite: false,
      last_cooked_at: null,
      created_by: 'user-1' as any,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'recipe-2' as RecipeId,
      household_id: 'household-1' as any,
      title: 'Chicken Curry',
      description: null,
      current_version_id: 'version-2' as any,
      rolling_score: null,
      tags: [],
      is_favorite: false,
      last_cooked_at: null,
      created_by: 'user-1' as any,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const mockEntry: CalendarEntry = {
    id: 'entry-1' as CalendarEntryId,
    household_id: 'household-1' as any,
    recipe_id: 'recipe-1' as RecipeId,
    planned_date: new Date('2026-01-20'),
    meal_slot: 'dinner',
    status: 'planned',
    notes: 'Family dinner',
    created_by: 'user-1' as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    recipes: mockRecipes,
    entry: mockEntry,
  };

  it('should render dialog when open', () => {
    render(<EditCalendarEntryDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit Meal')).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(<EditCalendarEntryDialog {...defaultProps} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should not render when entry is null', () => {
    render(<EditCalendarEntryDialog {...defaultProps} entry={null} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should pre-fill form with entry data', () => {
    render(<EditCalendarEntryDialog {...defaultProps} />);

    // Check recipe is selected
    const recipeInput = screen.getByLabelText(/recipe \(optional\)/i) as HTMLInputElement;
    expect(recipeInput.value).toBe('Pasta Carbonara');

    // Check date is filled
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    expect(dateInput.value).toBe('2026-01-20');

    // Check meal slot is selected
    const mealSlotSelect = screen.getByLabelText(/meal slot/i) as HTMLSelectElement;
    expect(mealSlotSelect.value).toBe('dinner');

    // Check notes are filled
    const notesInput = screen.getByLabelText(/notes \(optional\)/i) as HTMLTextAreaElement;
    expect(notesInput.value).toBe('Family dinner');
  });

  it('should pre-fill form when entry has no recipe', () => {
    const entryWithoutRecipe = { ...mockEntry, recipe_id: null };

    render(<EditCalendarEntryDialog {...defaultProps} entry={entryWithoutRecipe} />);

    const recipeInput = screen.getByLabelText(/recipe \(optional\)/i) as HTMLInputElement;
    expect(recipeInput.value).toBe('');
  });

  it('should pre-fill form when entry has no notes', () => {
    const entryWithoutNotes = { ...mockEntry, notes: null };

    render(<EditCalendarEntryDialog {...defaultProps} entry={entryWithoutNotes} />);

    const notesInput = screen.getByLabelText(/notes \(optional\)/i) as HTMLTextAreaElement;
    expect(notesInput.value).toBe('');
  });

  it('should render Cancel and Save buttons', () => {
    render(<EditCalendarEntryDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('should call onSubmit with updated data when Save clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EditCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} />);

    // Change date
    const dateInput = screen.getByLabelText(/date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2026-01-21');

    // Change meal slot
    const mealSlotSelect = screen.getByLabelText(/meal slot/i);
    await user.selectOptions(mealSlotSelect, 'breakfast');

    // Change notes
    const notesInput = screen.getByLabelText(/notes \(optional\)/i);
    await user.clear(notesInput);
    await user.type(notesInput, 'Updated notes');

    // Submit
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        recipe_id: 'recipe-1',
        planned_date: new Date('2026-01-21'),
        meal_slot: 'breakfast',
        notes: 'Updated notes',
      });
    });
  });

  it('should call onSubmit when changing recipe', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EditCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} />);

    // Change recipe
    const recipeInput = screen.getByLabelText(/recipe \(optional\)/i);
    await user.click(recipeInput);
    await user.clear(recipeInput);
    await user.type(recipeInput, 'Chicken');

    const option = await screen.findByText('Chicken Curry');
    await user.click(option);

    // Submit
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        recipe_id: 'recipe-2',
        planned_date: new Date('2026-01-20'),
        meal_slot: 'dinner',
        notes: 'Family dinner',
      });
    });
  });

  it('should call onSubmit with null recipe when cleared', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EditCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} />);

    // Clear recipe
    const recipeInput = screen.getByLabelText(/recipe \(optional\)/i);
    await user.click(recipeInput);
    await user.clear(recipeInput);

    // Submit
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          recipe_id: null,
        }),
      );
    });
  });

  it('should call onClose when Cancel clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<EditCalendarEntryDialog {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose after successful submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<EditCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} onClose={onClose} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should disable buttons while submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));

    render(<EditCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Check buttons are disabled
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('should trim whitespace from notes', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EditCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} />);

    // Change notes with whitespace
    const notesInput = screen.getByLabelText(/notes \(optional\)/i);
    await user.clear(notesInput);
    await user.type(notesInput, '  Updated notes  ');

    // Submit
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Updated notes',
        }),
      );
    });
  });

  it('should set notes to null when empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EditCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} />);

    // Clear notes
    const notesInput = screen.getByLabelText(/notes \(optional\)/i);
    await user.clear(notesInput);

    // Submit
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: null,
        }),
      );
    });
  });

  it('should update form when entry prop changes', () => {
    const { rerender } = render(<EditCalendarEntryDialog {...defaultProps} />);

    const newEntry: CalendarEntry = {
      ...mockEntry,
      id: 'entry-2' as CalendarEntryId,
      recipe_id: 'recipe-2' as RecipeId,
      planned_date: new Date('2026-01-21'),
      meal_slot: 'breakfast',
      notes: 'New notes',
    };

    rerender(<EditCalendarEntryDialog {...defaultProps} entry={newEntry} />);

    // Check form is updated
    const recipeInput = screen.getByLabelText(/recipe \(optional\)/i) as HTMLInputElement;
    expect(recipeInput.value).toBe('Chicken Curry');

    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    expect(dateInput.value).toBe('2026-01-21');

    const mealSlotSelect = screen.getByLabelText(/meal slot/i) as HTMLSelectElement;
    expect(mealSlotSelect.value).toBe('breakfast');

    const notesInput = screen.getByLabelText(/notes \(optional\)/i) as HTMLTextAreaElement;
    expect(notesInput.value).toBe('New notes');
  });
});
