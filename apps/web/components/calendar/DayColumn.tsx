'use client';

import type { CalendarEntry, MealSlot } from '@commontable/types';
import { Box, Typography, Stack, Divider } from '@mui/material';

import { MealSlotCell } from './MealSlotCell';

interface DayColumnProps {
  date: Date;
  entries: CalendarEntry[];
  onAddMeal: (date: Date, mealSlot: MealSlot) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewRecipe: (recipeId: string) => void;
  onMarkComplete: (id: string) => void;
}

/**
 * Format day header (e.g., "Sun 18", "Mon 19")
 */
function formatDayHeader(date: Date): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[date.getDay()];
  const dayNumber = date.getDate();
  return `${dayName} ${dayNumber}`;
}

/**
 * Get entry for specific meal slot
 */
function getEntryForSlot(entries: CalendarEntry[], slot: MealSlot): CalendarEntry | null {
  return entries.find((entry) => entry.meal_slot === slot) || null;
}

/**
 * Single day column with 4 meal slots
 *
 * Design System Compliance:
 * - Stack for vertical layout
 * - Typography body1 for day header
 * - Divider for visual separation
 * - Spacing: 16px between slots
 */
export function DayColumn({
  date,
  entries,
  onAddMeal,
  onEdit,
  onDelete,
  onViewRecipe,
  onMarkComplete,
}: DayColumnProps) {
  const mealSlots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <Box>
      {/* Day header */}
      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
        {formatDayHeader(date)}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Meal slots */}
      <Stack spacing={2}>
        {mealSlots.map((slot) => (
          <MealSlotCell
            key={slot}
            mealSlot={slot}
            entry={getEntryForSlot(entries, slot)}
            onAddMeal={() => onAddMeal(date, slot)}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewRecipe={onViewRecipe}
            onMarkComplete={onMarkComplete}
          />
        ))}
      </Stack>
    </Box>
  );
}
