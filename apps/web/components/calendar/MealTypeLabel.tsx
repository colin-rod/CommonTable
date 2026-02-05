'use client';

import type { MealSlot } from '@commontable/types';
import { Box, Typography } from '@mui/material';

interface MealTypeLabelProps {
  mealSlot: MealSlot;
}

/**
 * Meal type label for fixed left column
 *
 * Design System Compliance:
 * - Typography: body1 with fontWeight 500
 * - Background: background.default to distinguish from data cells
 * - Border: right border to separate from grid
 * - Spacing: 16px padding (p: 2)
 */
export function MealTypeLabel({ mealSlot }: MealTypeLabelProps) {
  const labels: Record<MealSlot, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        p: 2,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        minHeight: 100,
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {labels[mealSlot]}
      </Typography>
    </Box>
  );
}
