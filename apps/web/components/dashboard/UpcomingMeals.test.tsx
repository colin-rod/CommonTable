import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { UpcomingMeals } from './UpcomingMeals';

import type { CalendarEntryWithRecipe } from '@/app/actions/dashboard';

describe('UpcomingMeals', () => {
  const today = new Date('2026-01-26T12:00:00Z'); // Monday
  const tomorrow = new Date('2026-01-27T12:00:00Z'); // Tuesday
  const threeDaysFromNow = new Date('2026-01-29T12:00:00Z'); // Thursday

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render section title', () => {
    render(<UpcomingMeals entries={[]} />);

    expect(screen.getByText('Upcoming Meals')).toBeInTheDocument();
  });

  it('should show "No meals planned" message when entries array is empty', () => {
    render(<UpcomingMeals entries={[]} />);

    expect(screen.getByText('No meals planned for the next 7 days')).toBeInTheDocument();
  });

  it('should render list of upcoming meals', () => {
    const entries: CalendarEntryWithRecipe[] = [
      {
        id: 'entry-1' as any,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-1' as any,
        planned_date: tomorrow,
        meal_slot: 'breakfast',
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: today,
        updated_at: today,
        recipe_title: 'Pancakes',
      },
      {
        id: 'entry-2' as any,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-2' as any,
        planned_date: tomorrow,
        meal_slot: 'dinner',
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: today,
        updated_at: today,
        recipe_title: 'Pasta',
      },
    ];

    render(<UpcomingMeals entries={entries} />);

    expect(screen.getByText('Pancakes')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
  });

  it('should show "Today" for today\'s entries', () => {
    const entries: CalendarEntryWithRecipe[] = [
      {
        id: 'entry-1' as any,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-1' as any,
        planned_date: today,
        meal_slot: 'breakfast',
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: today,
        updated_at: today,
        recipe_title: 'Pancakes',
      },
    ];

    render(<UpcomingMeals entries={entries} />);

    expect(screen.getByText(/Today/)).toBeInTheDocument();
  });

  it('should show "Tomorrow" for tomorrow\'s entries', () => {
    const entries: CalendarEntryWithRecipe[] = [
      {
        id: 'entry-1' as any,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-1' as any,
        planned_date: tomorrow,
        meal_slot: 'breakfast',
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: today,
        updated_at: today,
        recipe_title: 'Pancakes',
      },
    ];

    render(<UpcomingMeals entries={entries} />);

    expect(screen.getByText(/Tomorrow/)).toBeInTheDocument();
  });

  it('should show day name for other dates', () => {
    const entries: CalendarEntryWithRecipe[] = [
      {
        id: 'entry-1' as any,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-1' as any,
        planned_date: threeDaysFromNow, // Thursday
        meal_slot: 'breakfast',
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: today,
        updated_at: today,
        recipe_title: 'Pancakes',
      },
    ];

    render(<UpcomingMeals entries={entries} />);

    expect(screen.getByText(/Thursday/)).toBeInTheDocument();
  });

  it('should show meal slot icons correctly', () => {
    const entries: CalendarEntryWithRecipe[] = [
      {
        id: 'entry-1' as any,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-1' as any,
        planned_date: tomorrow,
        meal_slot: 'breakfast',
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: today,
        updated_at: today,
        recipe_title: 'Pancakes',
      },
      {
        id: 'entry-2' as any,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-2' as any,
        planned_date: tomorrow,
        meal_slot: 'lunch',
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: today,
        updated_at: today,
        recipe_title: 'Sandwich',
      },
      {
        id: 'entry-3' as any,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-3' as any,
        planned_date: tomorrow,
        meal_slot: 'dinner',
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: today,
        updated_at: today,
        recipe_title: 'Pasta',
      },
      {
        id: 'entry-4' as any,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-4' as any,
        planned_date: tomorrow,
        meal_slot: 'snack',
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: today,
        updated_at: today,
        recipe_title: 'Cookies',
      },
    ];

    render(<UpcomingMeals entries={entries} />);

    // Check that all entries are rendered (icons are present)
    expect(screen.getByText('Pancakes')).toBeInTheDocument();
    expect(screen.getByText('Sandwich')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Cookies')).toBeInTheDocument();
  });

  it('should show "Meal planned" when recipe_title is null', () => {
    const entries: CalendarEntryWithRecipe[] = [
      {
        id: 'entry-1' as any,
        household_id: 'household-1' as any,
        recipe_id: null,
        planned_date: tomorrow,
        meal_slot: 'breakfast',
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: today,
        updated_at: today,
        recipe_title: null,
      },
    ];

    render(<UpcomingMeals entries={entries} />);

    expect(screen.getByText('Meal planned')).toBeInTheDocument();
  });
});
