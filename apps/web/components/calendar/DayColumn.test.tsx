import type { CalendarEntry, CalendarEntryId } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { DayColumn } from './DayColumn';

describe('DayColumn', () => {
  const mockDate = new Date('2026-01-20'); // Tuesday

  const mockBreakfastEntry: CalendarEntry = {
    id: 'entry-1' as CalendarEntryId,
    household_id: 'household-1' as any,
    recipe_id: 'recipe-1' as any,
    planned_date: mockDate,
    meal_slot: 'breakfast',
    status: 'planned',
    notes: 'Morning meal',
    created_by: 'user-1' as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockDinnerEntry: CalendarEntry = {
    id: 'entry-2' as CalendarEntryId,
    household_id: 'household-1' as any,
    recipe_id: 'recipe-2' as any,
    planned_date: mockDate,
    meal_slot: 'dinner',
    status: 'planned',
    notes: 'Evening meal',
    created_by: 'user-1' as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const defaultProps = {
    date: mockDate,
    entries: [],
    onAddMeal: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewRecipe: vi.fn(),
    onMarkComplete: vi.fn(),
  };

  it('should render day header with correct format', () => {
    render(<DayColumn {...defaultProps} />);

    expect(screen.getByText('Tue 20')).toBeInTheDocument();
  });

  it('should render all 4 meal slot cells', () => {
    render(<DayColumn {...defaultProps} />);

    // Note: Meal type labels (Breakfast/Lunch/Dinner/Snack) are now in MealTypeTable's left column
    // DayColumn component is deprecated - MealTypeTable renders MealSlotCells directly
    // This test verifies that 4 meal slots are rendered (via add meal buttons)
    const addButtons = screen.getAllByRole('button', { name: /add meal/i });
    expect(addButtons).toHaveLength(4); // One for each meal slot
  });

  it('should render add meal buttons for empty slots', () => {
    render(<DayColumn {...defaultProps} />);

    const addButtons = screen.getAllByRole('button', { name: /add meal/i });
    expect(addButtons).toHaveLength(4); // All 4 slots empty
  });

  it('should render entries in correct meal slots', () => {
    render(<DayColumn {...defaultProps} entries={[mockBreakfastEntry, mockDinnerEntry]} />);

    // Should have 2 entries (breakfast and dinner)
    expect(screen.getAllByText('Recipe assigned')).toHaveLength(2);

    // Should have 2 add buttons (lunch and snack)
    const addButtons = screen.getAllByRole('button', { name: /add meal/i });
    expect(addButtons).toHaveLength(2);
  });

  it('should call onAddMeal with correct date and meal slot', async () => {
    const user = userEvent.setup();
    const onAddMeal = vi.fn();

    render(<DayColumn {...defaultProps} onAddMeal={onAddMeal} />);

    // Click add meal for breakfast
    const addButtons = screen.getAllByRole('button', { name: /add meal/i });
    await user.click(addButtons[0]!); // Breakfast is first

    expect(onAddMeal).toHaveBeenCalledWith(mockDate, 'breakfast');
  });

  it('should call onEdit when edit button clicked on entry', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(<DayColumn {...defaultProps} entries={[mockBreakfastEntry]} onEdit={onEdit} />);

    const editButton = screen.getByLabelText(/edit calendar entry/i);
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith('entry-1');
  });

  it('should call onDelete when delete button clicked on entry', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<DayColumn {...defaultProps} entries={[mockBreakfastEntry]} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText(/delete calendar entry/i);
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('entry-1');
  });

  // Note: Inline rating flow is tested comprehensively in CalendarEntryCard.test.tsx
  // DayColumn passes the onMarkComplete callback through to MealSlotCell -> CalendarEntryCard

  it('should call onViewRecipe when view recipe clicked on entry', async () => {
    const user = userEvent.setup();
    const onViewRecipe = vi.fn();

    render(
      <DayColumn {...defaultProps} entries={[mockBreakfastEntry]} onViewRecipe={onViewRecipe} />,
    );

    const viewButton = screen.getByLabelText(/view recipe/i);
    await user.click(viewButton);

    expect(onViewRecipe).toHaveBeenCalledWith('recipe-1');
  });

  it('should format Sunday correctly', () => {
    const sunday = new Date('2026-01-18');
    render(<DayColumn {...defaultProps} date={sunday} />);

    expect(screen.getByText('Sun 18')).toBeInTheDocument();
  });

  it('should format Saturday correctly', () => {
    const saturday = new Date('2026-01-24');
    render(<DayColumn {...defaultProps} date={saturday} />);

    expect(screen.getByText('Sat 24')).toBeInTheDocument();
  });
});
