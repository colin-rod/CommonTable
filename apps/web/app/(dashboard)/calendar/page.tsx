import { Container, Typography, Stack } from '@mui/material';

import { CalendarWeekView } from '@/components/calendar/CalendarWeekView';

/**
 * Calendar page - Week view for meal planning
 *
 * Route: /calendar
 *
 * Design System Compliance:
 * - Container with maxWidth="lg"
 * - Stack for vertical spacing
 * - Typography h5 for page title
 * - Typography body2 for page description
 */
export default function CalendarPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3}>
        {/* Page Title */}
        <Typography variant="h5">Meal Calendar</Typography>

        {/* Page Description */}
        <Typography variant="body2" color="text.secondary">
          Plan your household's meals for the week
        </Typography>

        {/* Calendar Week View */}
        <CalendarWeekView />
      </Stack>
    </Container>
  );
}
