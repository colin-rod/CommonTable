'use client';

import type { CookingEventWithRecipeAndProfile } from '@commontable/types';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Rating,
  CircularProgress,
  Box,
  Button,
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
    <List>
      {events.map((event) => (
        <ListItem key={event.id} disablePadding>
          <ListItemText
            primary={event.recipe_title}
            secondary={
              <>
                {event.rating && (
                  <Rating
                    value={event.rating}
                    readOnly
                    size="small"
                    aria-label={`Rated ${event.rating} out of 5 stars`}
                    sx={{ display: 'block', mb: 0.5 }}
                  />
                )}
                <Typography variant="body2" color="text.secondary" component="span">
                  Cooked {formatRelativeDate(event.cooked_at)}
                </Typography>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
