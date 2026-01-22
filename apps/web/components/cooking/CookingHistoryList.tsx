'use client';

import type { CookingEvent } from '@commontable/types';
import { List, ListItem, ListItemText, Typography, Rating, Stack } from '@mui/material';

interface CookingHistoryListProps {
  events: CookingEvent[];
}

/**
 * CookingHistoryList - Displays cooking history for a recipe
 *
 * Shows when the recipe was cooked, who cooked it, and ratings.
 */
export function CookingHistoryList({ events }: CookingHistoryListProps) {
  if (events.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No cooking history yet. Log a meal to track your cooking!
      </Typography>
    );
  }

  return (
    <List>
      {events.map((event) => (
        <ListItem key={event.id} disablePadding>
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body1">
                  {new Date(event.cooked_at).toLocaleDateString()}
                </Typography>
                {event.rating && <Rating value={event.rating} readOnly size="small" />}
              </Stack>
            }
            secondary={
              <>
                {event.servings_made && (
                  <Typography variant="body2" component="span">
                    {event.servings_made} servings
                  </Typography>
                )}
                {event.notes && (
                  <Typography variant="body2" component="span" sx={{ display: 'block', mt: 0.5 }}>
                    {event.notes}
                  </Typography>
                )}
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
