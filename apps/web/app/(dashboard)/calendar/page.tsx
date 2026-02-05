import { Typography, Stack } from '@mui/material';

import { HistoricalCalendarView } from '@/components/calendar/HistoricalCalendarView';

/**
 * Calendar page - Historical view for cooking events
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
    <Stack spacing={3}>
      {/* Page Title */}
      <Typography variant="h5">Cooking History</Typography>

      {/* Page Description */}
      <Typography variant="body2" color="text.secondary">
        View past cooking events for your household
      </Typography>

      {/* Historical Calendar View */}
      <HistoricalCalendarView />
    </Stack>
  );
}
