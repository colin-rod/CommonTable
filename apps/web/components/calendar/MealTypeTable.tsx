'use client';

import type { CalendarEntry, MealSlot } from '@commontable/types';
import { Box, Typography } from '@mui/material';

import { MealSlotCell } from './MealSlotCell';
import { MealTypeLabel } from './MealTypeLabel';

import { getDaysInWeek, isSameDay } from '@/lib/dateUtils';

interface MealTypeTableProps {
  weekStart: Date;
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
 * Get entry for specific date and meal slot
 */
function getEntry(entries: CalendarEntry[], date: Date, mealSlot: MealSlot): CalendarEntry | null {
  return (
    entries.find((entry) => isSameDay(entry.planned_date, date) && entry.meal_slot === mealSlot) ??
    null
  );
}

/**
 * Day header component
 */
function DayHeader({ date }: { date: Date }) {
  return (
    <Box
      sx={{
        p: 1,
        textAlign: 'center',
        borderBottom: '2px solid',
        borderColor: 'divider',
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        {formatDayHeader(date)}
      </Typography>
    </Box>
  );
}

/**
 * Table layout with fixed left column showing meal types and grid of day columns
 *
 * Design System Compliance:
 * - CSS Grid layout (80px left column + 7 day columns)
 * - Gap: 16px (gap: 2)
 * - Horizontal scroll on mobile/tablet
 * - Fixed left column with meal type labels
 */
export function MealTypeTable({
  weekStart,
  entries,
  onAddMeal,
  onEdit,
  onDelete,
  onViewRecipe,
  onMarkComplete,
}: MealTypeTableProps) {
  const days = getDaysInWeek(weekStart);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '120px repeat(7, minmax(200px, 1fr))',
        gap: 2,
        overflowX: 'auto',
      }}
    >
      {/* Header row: Empty top-left corner + day headers */}
      <Box /> {/* Empty cell for top-left corner */}
      {days.map((day) => (
        <DayHeader key={day.toISOString()} date={day} />
      ))}
      {/* Breakfast row */}
      <MealTypeLabel mealSlot="breakfast" />
      {days.map((day) => (
        <MealSlotCell
          key={`${day.toISOString()}-breakfast`}
          mealSlot="breakfast"
          entry={getEntry(entries, day, 'breakfast')}
          onAddMeal={() => onAddMeal(day, 'breakfast')}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewRecipe={onViewRecipe}
          onMarkComplete={onMarkComplete}
        />
      ))}
      {/* Lunch row */}
      <MealTypeLabel mealSlot="lunch" />
      {days.map((day) => (
        <MealSlotCell
          key={`${day.toISOString()}-lunch`}
          mealSlot="lunch"
          entry={getEntry(entries, day, 'lunch')}
          onAddMeal={() => onAddMeal(day, 'lunch')}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewRecipe={onViewRecipe}
          onMarkComplete={onMarkComplete}
        />
      ))}
      {/* Dinner row */}
      <MealTypeLabel mealSlot="dinner" />
      {days.map((day) => (
        <MealSlotCell
          key={`${day.toISOString()}-dinner`}
          mealSlot="dinner"
          entry={getEntry(entries, day, 'dinner')}
          onAddMeal={() => onAddMeal(day, 'dinner')}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewRecipe={onViewRecipe}
          onMarkComplete={onMarkComplete}
        />
      ))}
      {/* Snack row */}
      <MealTypeLabel mealSlot="snack" />
      {days.map((day) => (
        <MealSlotCell
          key={`${day.toISOString()}-snack`}
          mealSlot="snack"
          entry={getEntry(entries, day, 'snack')}
          onAddMeal={() => onAddMeal(day, 'snack')}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewRecipe={onViewRecipe}
          onMarkComplete={onMarkComplete}
        />
      ))}
    </Box>
  );
}
