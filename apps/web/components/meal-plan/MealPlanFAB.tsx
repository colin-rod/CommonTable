'use client';

import { Restaurant as RestaurantIcon } from '@mui/icons-material';
import { Badge, Box, Fab } from '@mui/material';

import { useMealPlan } from '@/hooks/useMealPlan';

interface MealPlanFABProps {
  onClick: () => void;
}

export function MealPlanFAB({ onClick }: MealPlanFABProps) {
  const { count } = useMealPlan();

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
      }}
    >
      <Badge
        badgeContent={count}
        color="error"
        max={9}
        invisible={count === 0}
        overlap="circular"
        sx={{
          '& .MuiBadge-badge': {
            zIndex: 1,
          },
        }}
      >
        <Fab
          color="primary"
          onClick={onClick}
          aria-label={count > 0 ? `Meal Plan (${count} items)` : 'Meal Plan'}
        >
          <RestaurantIcon />
        </Fab>
      </Badge>
    </Box>
  );
}
