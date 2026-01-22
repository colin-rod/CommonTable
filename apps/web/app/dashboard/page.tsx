import { Container, Typography, Stack, Box } from '@mui/material';

import { getCookingEventsByHousehold } from '@/app/actions/cookingEvent';
import { HouseholdActivityFeed } from '@/components/cooking/HouseholdActivityFeed';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

/**
 * Dashboard Page
 * Protected route - requires authentication
 *
 * Shows user profile, household information, and recent cooking activity
 */
export default async function DashboardPage() {
  // Fetch household cooking events
  const result = await getCookingEventsByHousehold(10);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4}>
        {/* Client component for user info and sign out */}
        <DashboardClient />

        {/* Recently Cooked section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Recently Cooked
          </Typography>
          {result.success ? (
            <HouseholdActivityFeed events={result.data} />
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
