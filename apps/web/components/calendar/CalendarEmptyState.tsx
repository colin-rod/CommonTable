'use client';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Stack, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

/**
 * CalendarEmptyState Component
 * Displays a friendly message when there are no planned meals
 *
 * Features:
 * - Calendar icon
 * - Friendly message
 * - CTA button to add first meal
 *
 * Design System Compliance:
 * - Typography: h6 for title, body2 for description
 * - Button: contained primary
 * - Stack spacing 2 (16px)
 * - Material Icon (CalendarToday)
 */
export function CalendarEmptyState() {
  const router = useRouter();

  const handleAddMeal = () => {
    router.push('/calendar');
  };

  return (
    <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
      <CalendarTodayIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
      <Typography variant="h6">No meals planned</Typography>
      <Typography variant="body2" color="text.secondary">
        Add meals to your calendar to plan the week
      </Typography>
      <Button variant="contained" color="primary" onClick={handleAddMeal}>
        Add Meal
      </Button>
    </Stack>
  );
}
