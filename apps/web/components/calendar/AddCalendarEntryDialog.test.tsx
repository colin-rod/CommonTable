import type { Recipe, RecipeId } from '@commontable/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { AddCalendarEntryDialog } from './AddCalendarEntryDialog';

vi.mock('@/hooks/useRecipeSuggestions', () => ({
  useRecipeSuggestions: vi.fn(() => ({
    suggestions: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

describe('AddCalendarEntryDialog', () => {
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
      // Phase 3 metadata fields
      cuisine: null,
      meal_type: null,
      key_ingredients: [],
      priority: null,
      status: 'suggested',
      source_url: null,
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
      // Phase 3 metadata fields
      cuisine: null,
      meal_type: null,
      key_ingredients: [],
      priority: null,
      status: 'suggested',
      source_url: null,
    },
  ];

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    recipes: mockRecipes,
  };

  it('should render dialog when open', () => {
    render(<AddCalendarEntryDialog {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add Meal')).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(<AddCalendarEntryDialog {...defaultProps} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(<AddCalendarEntryDialog {...defaultProps} />);

    expect(screen.getByLabelText(/recipe \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/meal slot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes \(optional\)/i)).toBeInTheDocument();
  });

  it('should render Cancel and Add buttons', () => {
    render(<AddCalendarEntryDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('should pre-fill date when initialDate provided', () => {
    const initialDate = new Date('2026-01-20');
    render(<AddCalendarEntryDialog {...defaultProps} initialDate={initialDate} />);

    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    expect(dateInput.value).toBe('2026-01-20');
  });

  it('should pre-fill meal slot when initialMealSlot provided', () => {
    render(<AddCalendarEntryDialog {...defaultProps} initialMealSlot="breakfast" />);

    const mealSlotSelect = screen.getByLabelText(/meal slot/i) as HTMLSelectElement;
    expect(mealSlotSelect.value).toBe('breakfast');
  });

  it('should default to dinner meal slot when no initialMealSlot provided', () => {
    render(<AddCalendarEntryDialog {...defaultProps} />);

    const mealSlotSelect = screen.getByLabelText(/meal slot/i) as HTMLSelectElement;
    expect(mealSlotSelect.value).toBe('dinner');
  });

  it('should disable Add button when date is empty', () => {
    render(<AddCalendarEntryDialog {...defaultProps} />);

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
  });

  it('should enable Add button when date is filled', async () => {
    const user = userEvent.setup();
    render(<AddCalendarEntryDialog {...defaultProps} />);

    const dateInput = screen.getByLabelText(/date/i);
    await user.type(dateInput, '2026-01-20');

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeEnabled();
  });

  it('should call onSubmit with form data when Add clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} />);

    // Fill in date
    const dateInput = screen.getByLabelText(/date/i);
    await user.type(dateInput, '2026-01-20');

    // Select meal slot
    const mealSlotSelect = screen.getByLabelText(/meal slot/i);
    await user.selectOptions(mealSlotSelect, 'breakfast');

    // Add notes
    const notesInput = screen.getByLabelText(/notes \(optional\)/i);
    await user.type(notesInput, 'Morning meal');

    // Submit
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        recipe_id: null,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'breakfast',
        notes: 'Morning meal',
      });
    });
  });

  it('should call onSubmit with selected recipe', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} />);

    // Select recipe
    const recipeInput = screen.getByLabelText(/recipe \(optional\)/i);
    await user.click(recipeInput);
    await user.type(recipeInput, 'Pasta');

    const option = await screen.findByText('Pasta Carbonara');
    await user.click(option);

    // Fill in date
    const dateInput = screen.getByLabelText(/date/i);
    await user.type(dateInput, '2026-01-20');

    // Submit
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        recipe_id: 'recipe-1',
        planned_date: new Date('2026-01-20'),
        meal_slot: 'dinner',
        notes: null,
      });
    });
  });

  it('should call onClose when Cancel clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<AddCalendarEntryDialog {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should reset form after successful submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <AddCalendarEntryDialog
        {...defaultProps}
        onSubmit={onSubmit}
        initialDate={new Date('2026-01-20')}
      />,
    );

    // Add notes
    const notesInput = screen.getByLabelText(/notes \(optional\)/i);
    await user.type(notesInput, 'Some notes');

    // Submit
    const addButton = screen.getByRole('button', { name: /add/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    // Check notes field is reset
    expect(notesInput).toHaveValue('');
  });

  it('should disable buttons while submitting', async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(<AddCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} />);

    // Fill in date
    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.change(dateInput, { target: { value: '2026-01-20' } });

    // Submit
    const addButton = screen.getByRole('button', { name: /add/i });
    await waitFor(() => {
      expect(addButton).toBeEnabled();
    });
    await user.click(addButton);

    // Check buttons are disabled
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await waitFor(() => {
      expect(addButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    resolveSubmit!();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('should trim whitespace from notes', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} />);

    // Fill in date
    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.change(dateInput, { target: { value: '2026-01-20' } });

    // Add notes with whitespace
    const notesInput = screen.getByLabelText(/notes \(optional\)/i);
    await user.type(notesInput, '  Some notes  ');

    // Submit
    const addButton = screen.getByRole('button', { name: /add/i });
    await waitFor(() => {
      expect(addButton).toBeEnabled();
    });
    await user.click(addButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Some notes',
        }),
      );
    });
  });

  it('should set notes to null when empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddCalendarEntryDialog {...defaultProps} onSubmit={onSubmit} />);

    // Fill in date
    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.change(dateInput, { target: { value: '2026-01-20' } });

    // Submit without notes
    const addButton = screen.getByRole('button', { name: /add/i });
    await waitFor(() => {
      expect(addButton).toBeEnabled();
    });
    await user.click(addButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: null,
        }),
      );
    });
  });
});
