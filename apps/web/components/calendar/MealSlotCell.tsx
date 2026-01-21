'use client';

import type { MealSlot, CalendarEntry } from '@commontable/types';
import {
  Coffee as BreakfastIcon,
  WbSunny as LunchIcon,
  NightsStay as DinnerIcon,
  Cookie as SnackIcon,
} from '@mui/icons-material';
import { Paper, Typography, Box } from '@mui/material';

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
 * Get icon for meal slot
 */
function getMealSlotIcon(slot: MealSlot) {
  switch (slot) {
    case 'breakfast':
      return <BreakfastIcon fontSize="small" />;
    case 'lunch':
      return <LunchIcon fontSize="small" />;
    case 'dinner':
      return <DinnerIcon fontSize="small" />;
    case 'snack':
      return <SnackIcon fontSize="small" />;
  }
}

/**
 * Get display name for meal slot
 */
function getMealSlotLabel(slot: MealSlot): string {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

/**
 * Single meal slot cell with entry or add button
 *
 * Design System Compliance:
 * - Paper with elevation={1}
 * - Typography: body1 for label
 * - Material Icons for meal slots
 * - Spacing: 8px base grid
 */
export function MealSlotCell({
  mealSlot,
  entry,
  onAddMeal,
  onEdit,
  onDelete,
  onViewRecipe,
  onMarkComplete,
}: MealSlotCellProps) {
  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      {/* Meal slot label with icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {getMealSlotIcon(mealSlot)}
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {getMealSlotLabel(mealSlot)}
        </Typography>
      </Box>

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
