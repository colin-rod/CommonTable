'use client';

import type { UpdateCookingEventInput } from '@commontable/api-client';
import type { CookingEvent, CookingEventId } from '@commontable/types';
import { Stack, Typography } from '@mui/material';

import { CookingHistoryItem } from './CookingHistoryItem';

import { updateCookingEvent } from '@/app/actions/cookingEvent';

interface CookingHistoryListProps {
  events: CookingEvent[];
}

/**
 * CookingHistoryList - Displays cooking history for a recipe with inline editing
 *
 * Shows when the recipe was cooked, ratings, and notes.
 * Any household member can edit ratings and notes on cooking events.
 */
export function CookingHistoryList({ events }: CookingHistoryListProps) {
  if (events.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No cooking history yet. Log a meal to track your cooking!
      </Typography>
    );
  }

  const handleUpdate = async (id: CookingEventId, data: UpdateCookingEventInput) => {
    const result = await updateCookingEvent(id, data);
    if (!result.success) {
      throw new Error(result.error);
    }
    // Server action will handle revalidation
  };

  return (
    <Stack spacing={2}>
      {events.map((event) => (
        <CookingHistoryItem key={event.id} event={event} onUpdate={handleUpdate} />
      ))}
    </Stack>
  );
}
