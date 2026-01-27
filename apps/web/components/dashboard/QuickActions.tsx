'use client';

import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { Button, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

/**
 * QuickActions component
 * Displays three primary action buttons for common tasks
 */
export function QuickActions() {
  const router = useRouter();

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Quick Actions</Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/recipes/new')}
        >
          Add Recipe
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<CalendarTodayIcon />}
          onClick={() => router.push('/calendar')}
        >
          Plan This Week's Meals
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<RestaurantIcon />}
          onClick={() => router.push('/recipes')}
        >
          Browse All Recipes
        </Button>
      </Stack>
    </Stack>
  );
}
