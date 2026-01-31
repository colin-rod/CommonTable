'use client';

import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

/**
 * QuickActions component
 * Displays 3 core action buttons: Add Recipe (primary), Plan Meals, and Browse (secondary)
 *
 * Removed buttons (now accessible via sidebar navigation):
 * - Import Recipe → moved to Recipes page
 * - Recipe Suggestions → moved to Discovery page
 * - AI Tag Review → moved to Tags navigation item in sidebar
 * - Meal Requests → accessible via Requests navigation item in sidebar
 */
export function QuickActions() {
  const router = useRouter();

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Quick Actions</Typography>

      {/* Primary action - centered */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/recipes/new')}
        >
          Add Recipe
        </Button>
      </Box>

      {/* Secondary actions - 2-column grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          color="primary"
          startIcon={<CalendarTodayIcon />}
          onClick={() => router.push('/calendar')}
        >
          Plan This Week's Meals
        </Button>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<RestaurantIcon />}
          onClick={() => router.push('/recipes')}
        >
          Browse All Recipes
        </Button>
      </Box>
    </Stack>
  );
}
