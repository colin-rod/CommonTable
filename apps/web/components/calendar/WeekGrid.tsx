'use client';

import type { CalendarEntry, MealSlot } from '@commontable/types';

import { MealTypeTable } from './MealTypeTable';

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
 * 7-day grid layout for week view with fixed left column for meal types
 *
 * Design System Compliance:
 * - CSS Grid with fixed left column (80px)
 * - Spacing: 16px gap between cells
 * - Horizontal scroll on mobile/tablet
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
  return (
    <MealTypeTable
      weekStart={weekStart}
      entries={entries}
      onAddMeal={onAddMeal}
      onEdit={onEdit}
      onDelete={onDelete}
      onViewRecipe={onViewRecipe}
      onMarkComplete={onMarkComplete}
    />
  );
}
