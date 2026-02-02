import type { CalendarEntry, CalendarEntryId } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { MealSlotCell } from './MealSlotCell';

describe('MealSlotCell', () => {
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
    mealSlot: 'dinner' as const,
    entry: null,
    onAddMeal: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewRecipe: vi.fn(),
    onMarkComplete: vi.fn(),
  };

  // Note: Meal slot labels and icons have been moved to the fixed left column (MealTypeLabel)
  // MealSlotCell now only shows the content (entry card or add button)

  it('should render AddMealButton when no entry', () => {
    render(<MealSlotCell {...defaultProps} />);

    expect(screen.getByRole('button', { name: /add meal/i })).toBeInTheDocument();
  });

  it('should call onAddMeal when AddMealButton clicked', async () => {
    const user = userEvent.setup();
    const onAddMeal = vi.fn();

    render(<MealSlotCell {...defaultProps} onAddMeal={onAddMeal} />);

    const button = screen.getByRole('button', { name: /add meal/i });
    await user.click(button);

    expect(onAddMeal).toHaveBeenCalledTimes(1);
  });

  it('should render CalendarEntryCard when entry exists', () => {
    render(<MealSlotCell {...defaultProps} entry={mockEntry} />);

    expect(screen.getByText('Recipe assigned')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add meal/i })).not.toBeInTheDocument();
  });

  it('should call onEdit with entry id when edit clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(<MealSlotCell {...defaultProps} entry={mockEntry} onEdit={onEdit} />);

    const editButton = screen.getByLabelText(/edit calendar entry/i);
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith('entry-1');
  });

  it('should call onDelete with entry id when delete clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<MealSlotCell {...defaultProps} entry={mockEntry} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText(/delete calendar entry/i);
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('entry-1');
  });

  // Note: Inline rating flow is tested comprehensively in CalendarEntryCard.test.tsx
  // MealSlotCell passes the onMarkComplete callback through to CalendarEntryCard

  it('should call onViewRecipe when entry has recipe_id and view clicked', async () => {
    const user = userEvent.setup();
    const onViewRecipe = vi.fn();

    render(<MealSlotCell {...defaultProps} entry={mockEntry} onViewRecipe={onViewRecipe} />);

    const viewButton = screen.getByLabelText(/view recipe/i);
    await user.click(viewButton);

    expect(onViewRecipe).toHaveBeenCalledWith('recipe-1');
  });

  it('should not show view recipe button when entry has no recipe_id', () => {
    const entryWithoutRecipe = { ...mockEntry, recipe_id: null };

    render(<MealSlotCell {...defaultProps} entry={entryWithoutRecipe} />);

    expect(screen.queryByLabelText(/view recipe/i)).not.toBeInTheDocument();
  });
});
