'use client';

import type { CookingEventWithRecipeAndProfile } from '@commontable/types';
import {
  Typography,
  Rating,
  CircularProgress,
  Box,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import { formatRelativeDate } from '@/lib/dateUtils';

export interface HouseholdActivityFeedProps {
  events: CookingEventWithRecipeAndProfile[];
  loading?: boolean;
}

export function HouseholdActivityFeed({ events, loading = false }: HouseholdActivityFeedProps) {
  const router = useRouter();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          No cooking history yet
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => router.push('/recipes')}
          sx={{ mt: 2 }}
        >
          Browse recipes
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        pb: 1,
      }}
      aria-label="Household cooking activity carousel"
    >
      {events.map((event) => (
        <Card
          key={event.id}
          variant="outlined"
          sx={{
            minWidth: 220,
            scrollSnapAlign: 'start',
          }}
        >
          <CardContent>
            <Typography variant="subtitle1" component="div">
              {event.recipe_title}
            </Typography>
            {event.rating && (
              <Rating
                value={event.rating}
                readOnly
                size="small"
                aria-label={`Rated ${event.rating} out of 5 stars`}
                sx={{ display: 'inline-flex', mb: 0.5 }}
              />
            )}
            <Typography variant="body2" color="text.secondary">
              Cooked {formatRelativeDate(event.cooked_at)}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
