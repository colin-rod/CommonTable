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
} from '@mui/material';

import { formatRelativeDate } from '@/lib/dateUtils';

export interface HouseholdActivityFeedProps {
  events: CookingEventWithRecipeAndProfile[];
  loading?: boolean;
}

export function HouseholdActivityFeed({ events, loading = false }: HouseholdActivityFeedProps) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography variant="body2" color="text.secondary">
          No cooking history yet
        </Typography>
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
