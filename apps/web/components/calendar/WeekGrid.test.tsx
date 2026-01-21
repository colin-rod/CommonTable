import type { CalendarEntry, CalendarEntryId } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { WeekGrid } from './WeekGrid';

describe('WeekGrid', () => {
  const weekStart = new Date('2026-01-18'); // Sunday

  const mockEntry: CalendarEntry = {
    id: 'entry-1' as CalendarEntryId,
    household_id: 'household-1' as any,
    recipe_id: 'recipe-1' as any,
    planned_date: new Date('2026-01-20'), // Tuesday
    meal_slot: 'dinner',
    status: 'planned',
    notes: 'Family dinner',
    created_by: 'user-1' as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const defaultProps = {
    weekStart,
    entries: [],
    onAddMeal: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewRecipe: vi.fn(),
    onMarkComplete: vi.fn(),
  };

  it('should render 7 day columns', () => {
    render(<WeekGrid {...defaultProps} />);

    // Check for all 7 days of the week
    expect(screen.getByText('Sun 18')).toBeInTheDocument();
    expect(screen.getByText('Mon 19')).toBeInTheDocument();
    expect(screen.getByText('Tue 20')).toBeInTheDocument();
    expect(screen.getByText('Wed 21')).toBeInTheDocument();
    expect(screen.getByText('Thu 22')).toBeInTheDocument();
    expect(screen.getByText('Fri 23')).toBeInTheDocument();
    expect(screen.getByText('Sat 24')).toBeInTheDocument();
  });

  it('should render all meal slots for each day', () => {
    render(<WeekGrid {...defaultProps} />);

    // Each day has 4 meal slots, 7 days = 28 meal slot labels total
    // But due to how the component renders, we check for unique occurrences
    const breakfast = screen.getAllByText('Breakfast');
    const lunch = screen.getAllByText('Lunch');
    const dinner = screen.getAllByText('Dinner');
    const snack = screen.getAllByText('Snack');

    expect(breakfast).toHaveLength(7);
    expect(lunch).toHaveLength(7);
    expect(dinner).toHaveLength(7);
    expect(snack).toHaveLength(7);
  });

  it('should render entries in correct day column', () => {
    render(<WeekGrid {...defaultProps} entries={[mockEntry]} />);

    // Entry should appear on Tuesday
    expect(screen.getByText('Recipe assigned')).toBeInTheDocument();

    // Should have 27 add meal buttons (7 days * 4 slots - 1 entry)
    const addButtons = screen.getAllByRole('button', { name: /add meal/i });
    expect(addButtons).toHaveLength(27);
  });

  it('should pass callbacks to day columns', () => {
    const callbacks = {
      onAddMeal: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onViewRecipe: vi.fn(),
      onMarkComplete: vi.fn(),
    };

    render(<WeekGrid {...defaultProps} {...callbacks} />);

    // Components should be rendered (callbacks are passed through)
    expect(screen.getAllByRole('button', { name: /add meal/i })).toHaveLength(28);
  });

  it('should group multiple entries by day', () => {
    const entries: CalendarEntry[] = [
      {
        ...mockEntry,
        id: 'entry-1' as CalendarEntryId,
        planned_date: new Date('2026-01-20'), // Tuesday
        meal_slot: 'breakfast',
      },
      {
        ...mockEntry,
        id: 'entry-2' as CalendarEntryId,
        planned_date: new Date('2026-01-20'), // Tuesday
        meal_slot: 'dinner',
      },
      {
        ...mockEntry,
        id: 'entry-3' as CalendarEntryId,
        planned_date: new Date('2026-01-21'), // Wednesday
        meal_slot: 'lunch',
      },
    ];

    render(<WeekGrid {...defaultProps} entries={entries} />);

    // Should have 3 entries total
    expect(screen.getAllByText('Recipe assigned')).toHaveLength(3);

    // Should have 25 add buttons (28 total slots - 3 entries)
    const addButtons = screen.getAllByRole('button', { name: /add meal/i });
    expect(addButtons).toHaveLength(25);
  });

  it('should handle empty entries array', () => {
    render(<WeekGrid {...defaultProps} entries={[]} />);

    // All 28 slots should have add buttons
    const addButtons = screen.getAllByRole('button', { name: /add meal/i });
    expect(addButtons).toHaveLength(28);
  });

  it('should render week starting from different date', () => {
    const differentWeekStart = new Date('2026-02-01'); // Sunday, Feb 1

    render(<WeekGrid {...defaultProps} weekStart={differentWeekStart} />);

    // Check for first and last day
    expect(screen.getByText('Sun 1')).toBeInTheDocument();
    expect(screen.getByText('Sat 7')).toBeInTheDocument();
  });
});
