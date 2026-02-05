'use client';

import type { MealSlot, CalendarEntry } from '@commontable/types';
import { Paper } from '@mui/material';

import { AddMealButton } from './AddMealButton';
import { CalendarEntryCard } from './CalendarEntryCard';

interface MealSlotCellProps {
  mealSlot: MealSlot;
  entry: CalendarEntry | null;
  onAddMeal: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewRecipe: (recipeId: string) => void;
  onMarkComplete: (id: string) => void;
}

/**
 * Single meal slot cell with entry or add button (no header)
 *
 * Design System Compliance:
 * - Paper with elevation={1}
 * - No meal icons or labels (moved to left column)
 * - Spacing: 16px padding (p: 2)
 * - Consistent minimum height
 */
export function MealSlotCell({
  mealSlot: _mealSlot,
  entry,
  onAddMeal,
  onEdit,
  onDelete,
  onViewRecipe,
  onMarkComplete,
}: MealSlotCellProps) {
  return (
    <Paper elevation={1} sx={{ p: 2, minHeight: 100 }}>
      {/* Show entry or add button */}
      {entry ? (
        <CalendarEntryCard
          entry={entry}
          onEdit={() => onEdit(entry.id)}
          onDelete={() => onDelete(entry.id)}
          onViewRecipe={
            entry.recipe_id
              ? () => {
                  const recipeId = entry.recipe_id;
                  if (recipeId) {
                    onViewRecipe(recipeId);
                  }
                }
              : undefined
          }
          onMarkComplete={() => onMarkComplete(entry.id)}
        />
      ) : (
        <AddMealButton onClick={onAddMeal} />
      )}
    </Paper>
  );
}
