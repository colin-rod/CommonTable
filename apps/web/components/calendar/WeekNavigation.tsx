'use client';

import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

import { formatWeekRange } from '@/lib/dateUtils';

interface WeekNavigationProps {
  weekStart: Date;
  weekEnd: Date;
  onPrevious: () => void;
  onNext: () => void;
  isCurrentWeek: boolean;
}

/**
 * Week navigation with previous/next buttons and week range display
 *
 * Design System Compliance:
 * - IconButtons for navigation (secondary actions)
 * - Typography h6 for week range
 * - Material Icons (ChevronLeft, ChevronRight)
 * - Spacing: 8px base grid
 */
export function WeekNavigation({
  weekStart,
  weekEnd,
  onPrevious,
  onNext,
  isCurrentWeek,
}: WeekNavigationProps) {
  const weekRange = formatWeekRange(weekStart, weekEnd);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
      }}
    >
      <IconButton onClick={onPrevious} aria-label="Previous week" title="Previous week">
        <ChevronLeft />
      </IconButton>

      <Typography variant="h6" component="h2">
        {weekRange}
        {isCurrentWeek && (
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            (Current week)
          </Typography>
        )}
      </Typography>

      <IconButton onClick={onNext} aria-label="Next week" title="Next week">
        <ChevronRight />
      </IconButton>
    </Box>
  );
}
