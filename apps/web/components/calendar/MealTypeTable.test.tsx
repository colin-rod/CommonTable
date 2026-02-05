import type { CalendarEntry, CalendarEntryId } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { MealTypeTable } from './MealTypeTable';

describe('MealTypeTable', () => {
  const mockWeekStart = new Date('2026-02-01'); // Sunday Feb 1, 2026

  const mockEntry: CalendarEntry = {
    id: 'entry-1' as CalendarEntryId,
    household_id: 'household-1' as any,
    recipe_id: 'recipe-1' as any,
    planned_date: new Date('2026-02-01'), // Sunday
    meal_slot: 'breakfast',
    status: 'planned',
    notes: null,
    created_by: 'user-1' as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const defaultProps = {
    weekStart: mockWeekStart,
    entries: [],
    onAddMeal: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewRecipe: vi.fn(),
    onMarkComplete: vi.fn(),
  };

  it('should render 7 day headers', () => {
    render(<MealTypeTable {...defaultProps} />);

    expect(screen.getByText('Sun 1')).toBeInTheDocument();
    expect(screen.getByText('Mon 2')).toBeInTheDocument();
    expect(screen.getByText('Tue 3')).toBeInTheDocument();
    expect(screen.getByText('Wed 4')).toBeInTheDocument();
    expect(screen.getByText('Thu 5')).toBeInTheDocument();
    expect(screen.getByText('Fri 6')).toBeInTheDocument();
    expect(screen.getByText('Sat 7')).toBeInTheDocument();
  });

  it('should render 4 meal type labels', () => {
    render(<MealTypeTable {...defaultProps} />);

    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Snack')).toBeInTheDocument();
  });

  it('should render 28 meal slot cells (7 days × 4 meals)', () => {
    render(<MealTypeTable {...defaultProps} />);

    const addMealButtons = screen.getAllByRole('button', { name: /add meal/i });

    // 7 days × 4 meal slots = 28 cells
    expect(addMealButtons).toHaveLength(28);
  });

  it('should display existing entry in correct cell', () => {
    render(<MealTypeTable {...defaultProps} entries={[mockEntry]} />);

    // Entry is for Sunday breakfast
    expect(screen.getByText('Recipe assigned')).toBeInTheDocument();

    // Other cells should show "Add meal"
    const addMealButtons = screen.getAllByRole('button', { name: /add meal/i });
    expect(addMealButtons).toHaveLength(27); // 28 - 1 (entry exists)
  });

  it('should call onAddMeal with correct date and meal slot', async () => {
    const user = userEvent.setup();
    const onAddMeal = vi.fn();

    render(<MealTypeTable {...defaultProps} onAddMeal={onAddMeal} />);

    const addMealButtons = screen.getAllByRole('button', { name: /add meal/i });

    // Click first button (Sunday breakfast)
    await user.click(addMealButtons[0]!);

    expect(onAddMeal).toHaveBeenCalledTimes(1);
    expect(onAddMeal).toHaveBeenCalledWith(
      expect.any(Date), // Sunday Feb 1
      'breakfast',
    );
  });

  it('should handle empty week (all cells show AddMealButton)', () => {
    render(<MealTypeTable {...defaultProps} entries={[]} />);

    const addMealButtons = screen.getAllByRole('button', { name: /add meal/i });

    expect(addMealButtons).toHaveLength(28);
  });

  it('should handle multiple entries on different days', () => {
    const entries: CalendarEntry[] = [
      {
        ...mockEntry,
        id: 'entry-1' as CalendarEntryId,
        planned_date: new Date('2026-02-01'), // Sunday
        meal_slot: 'breakfast',
      },
      {
        ...mockEntry,
        id: 'entry-2' as CalendarEntryId,
        planned_date: new Date('2026-02-02'), // Monday
        meal_slot: 'lunch',
      },
      {
        ...mockEntry,
        id: 'entry-3' as CalendarEntryId,
        planned_date: new Date('2026-02-03'), // Tuesday
        meal_slot: 'dinner',
      },
    ];

    render(<MealTypeTable {...defaultProps} entries={entries} />);

    const recipeAssignedTexts = screen.getAllByText('Recipe assigned');
    expect(recipeAssignedTexts).toHaveLength(3);

    const addMealButtons = screen.getAllByRole('button', { name: /add meal/i });
    expect(addMealButtons).toHaveLength(25); // 28 - 3
  });
});
