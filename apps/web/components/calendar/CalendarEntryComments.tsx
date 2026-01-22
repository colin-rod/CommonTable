'use client';

import type { CalendarEntryId } from '@commontable/types';
import { Stack, Typography } from '@mui/material';

import { CalendarEntryCommentForm } from './CalendarEntryCommentForm';
import { CalendarEntryCommentList } from './CalendarEntryCommentList';

import { useCalendarEntryComments } from '@/hooks/useCalendarEntryComments';

interface CalendarEntryCommentsProps {
  calendarEntryId: CalendarEntryId;
}

/**
 * CalendarEntryComments Container Component
 *
 * Main container for the comments section on a calendar entry detail page
 *
 * Combines:
 * - Section header ("Discussion")
 * - Comment list (CalendarEntryCommentList)
 * - Add comment form (CalendarEntryCommentForm)
 *
 * Uses useCalendarEntryComments hook for data management
 */
export function CalendarEntryComments({ calendarEntryId }: CalendarEntryCommentsProps) {
  const { comments, loading, error, addComment } = useCalendarEntryComments(calendarEntryId);

  const handleSubmit = async (input: { calendar_entry_id: string; comment_text: string }) => {
    await addComment(input);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Discussion</Typography>

      {/* Comment List */}
      <CalendarEntryCommentList comments={comments} loading={loading} error={error} />

      {/* Add Comment Form */}
      <CalendarEntryCommentForm onSubmit={handleSubmit} calendarEntryId={calendarEntryId} />
    </Stack>
  );
}
