import { Typography, Stack, Box, Paper, Divider } from '@mui/material';

import { getCookingEventsByHousehold } from '@/app/actions/cookingEvent';
import { getUpcomingCalendarEntries } from '@/app/actions/dashboard';
import { HouseholdActivityFeed } from '@/components/cooking/HouseholdActivityFeed';
import { UpcomingMeals } from '@/components/dashboard/UpcomingMeals';

/**
 * Dashboard Page
 * Protected route - requires authentication
 *
 * Shows upcoming meals and recent cooking activity
 * Quick actions are now accessible via navbar dropdown
 */
export default async function DashboardPage() {
  // Fetch household cooking events and upcoming calendar entries
  // Note: Pending counts removed - Tags and Requests are now in sidebar navigation
  const cookingEventsResult = await getCookingEventsByHousehold(10);
  const upcomingMealsResult = await getUpcomingCalendarEntries();

  return (
    <Stack spacing={4}>
      {/* Upcoming Meals card */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <UpcomingMeals entries={upcomingMealsResult.success ? upcomingMealsResult.data : []} />
      </Paper>

      <Divider />

      {/* Recently Cooked card */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Recently Cooked
          </Typography>
          {cookingEventsResult.success ? (
            <HouseholdActivityFeed events={cookingEventsResult.data} />
          ) : (
            <Typography variant="body2" color="error.main">
              Failed to load cooking history
            </Typography>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
