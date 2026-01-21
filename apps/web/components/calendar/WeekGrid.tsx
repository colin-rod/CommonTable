'use client';

import type { CalendarEntry, MealSlot } from '@commontable/types';
import { Grid } from '@mui/material';

import { DayColumn } from './DayColumn';

import { getDaysInWeek, isSameDay } from '@/lib/dateUtils';

interface WeekGridProps {
  weekStart: Date;
  entries: CalendarEntry[];
  onAddMeal: (date: Date, mealSlot: MealSlot) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewRecipe: (recipeId: string) => void;
  onMarkComplete: (id: string) => void;
}

/**
 * Get entries for a specific date
 */
function getEntriesForDate(entries: CalendarEntry[], date: Date): CalendarEntry[] {
  return entries.filter((entry) => isSameDay(entry.planned_date, date));
}

/**
 * 7-day grid layout for week view
 *
 * Design System Compliance:
 * - MUI Grid for responsive layout
 * - Spacing: 16px gap between columns
 * - Stacks on mobile (xs: 12), side-by-side on desktop
 */
export function WeekGrid({
  weekStart,
  entries,
  onAddMeal,
  onEdit,
  onDelete,
  onViewRecipe,
  onMarkComplete,
}: WeekGridProps) {
  const days = getDaysInWeek(weekStart);

  return (
    <Grid container spacing={2}>
      {days.map((day) => (
        <Grid item xs={12} sm={6} md={3} lg key={day.toISOString()}>
          <DayColumn
            date={day}
            entries={getEntriesForDate(entries, day)}
            onAddMeal={onAddMeal}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewRecipe={onViewRecipe}
            onMarkComplete={onMarkComplete}
          />
        </Grid>
      ))}
    </Grid>
  );
}
