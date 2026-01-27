import { Container, Typography, Stack, Box } from '@mui/material';

import { getCookingEventsByHousehold } from '@/app/actions/cookingEvent';
import {
  getUpcomingCalendarEntries,
  getPendingAiTagSuggestionsCount,
  getPendingMealRequestsCount,
} from '@/app/actions/dashboard';
import { HouseholdActivityFeed } from '@/components/cooking/HouseholdActivityFeed';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { UpcomingMeals } from '@/components/dashboard/UpcomingMeals';

/**
 * Dashboard Page
 * Protected route - requires authentication
 *
 * Shows user profile, household information, quick actions, upcoming meals, and recent cooking activity
 */
export default async function DashboardPage() {
  // Fetch household cooking events, upcoming calendar entries, and pending counts
  const cookingEventsResult = await getCookingEventsByHousehold(10);
  const upcomingMealsResult = await getUpcomingCalendarEntries();
  const pendingTagsCountResult = await getPendingAiTagSuggestionsCount();
  const pendingRequestsCountResult = await getPendingMealRequestsCount();

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4}>
        {/* Client component for user info and sign out */}
        <DashboardClient />

        {/* Quick Actions section */}
        <QuickActions
          pendingTagsCount={pendingTagsCountResult.success ? pendingTagsCountResult.data : 0}
          pendingRequestsCount={
            pendingRequestsCountResult.success ? pendingRequestsCountResult.data : 0
          }
        />

        {/* Upcoming Meals section */}
        <UpcomingMeals entries={upcomingMealsResult.success ? upcomingMealsResult.data : []} />

        {/* Recently Cooked section */}
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
      </Stack>
    </Container>
  );
}
