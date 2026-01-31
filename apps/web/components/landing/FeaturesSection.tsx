'use client';

import { Stack, Typography, Card, CardContent } from '@mui/material';

export function FeaturesSection() {
  return (
    <Stack spacing={3} sx={{ py: 6 }}>
      {/* Section Header - h6 per DESIGN_SYSTEM.md */}
      <Typography variant="h6" sx={{ textAlign: 'center' }}>
        What you can do
      </Typography>

      {/* Feature Cards */}
      <Stack spacing={3}>
        {/* Feature 1: Recipes */}
        <Card elevation={1}>
          <CardContent>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Organize your recipes
            </Typography>
            <Typography variant="body1">
              Store recipes with ingredients, steps, and notes. Every edit creates a new version so
              nothing is lost. Mark favorites and let AI suggest tags.
            </Typography>
          </CardContent>
        </Card>

        {/* Feature 2: Calendar */}
        <Card elevation={1}>
          <CardContent>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Plan your meals
            </Typography>
            <Typography variant="body1">
              Add recipes to your weekly calendar. See what&apos;s coming up. Leave notes for your
              household.
            </Typography>
          </CardContent>
        </Card>

        {/* Feature 3: Requests */}
        <Card elevation={1}>
          <CardContent>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Manage meal requests
            </Typography>
            <Typography variant="body1">
              Family members request meals. Cooks review and plan them. Everyone&apos;s preferences
              are visible.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
