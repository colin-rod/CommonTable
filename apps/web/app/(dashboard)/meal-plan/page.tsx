import { Container, Stack, Typography } from '@mui/material';

import { QueueView } from '@/components/queue/QueueView';

/**
 * Meal Plan Page
 *
 * Full-page view for managing the household's meal plan.
 * Uses lane-based organization with drag-and-drop reordering.
 * Recipes can be marked as cooked, which logs them to cooking history.
 *
 * Note: Uses QueueView component (database table is still recipe_queue,
 * but UI terminology is "Meal Plan")
 */
export default function MealPlanPage() {
  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Typography variant="h5">Meal Plan</Typography>
        <Typography variant="body2" color="text.secondary">
          Organize recipes you want to cook. Mark as cooked to log to history.
        </Typography>
        <QueueView />
      </Stack>
    </Container>
  );
}
