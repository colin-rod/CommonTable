import { Box, Stack, Skeleton } from '@mui/material';

/**
 * CalendarSkeleton Component
 * Loading skeleton that mimics WeekGrid structure
 *
 * Features:
 * - Grid layout matching WeekGrid
 * - 7 day columns (one per day of week)
 * - 4 meal slot skeletons per day (breakfast, lunch, dinner, snack)
 * - Rectangular skeletons for day headers and meal slots
 *
 * Design System Compliance:
 * - Box component for grid
 * - Stack for day columns
 * - Skeleton rectangular variant
 * - Spacing matches WeekGrid
 */
export function CalendarSkeleton() {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mealSlots = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <Box
      aria-label="Loading calendar"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2,
      }}
    >
      {daysOfWeek.map((day) => (
        <Box key={day} data-testid="day-column-skeleton">
          <Stack spacing={1}>
            {/* Day header skeleton */}
            <Skeleton variant="rectangular" height={48} />

            {/* Meal slot skeletons */}
            {mealSlots.map((slot) => (
              <Skeleton
                key={slot}
                variant="rectangular"
                height={80}
                data-testid="meal-slot-skeleton"
              />
            ))}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
