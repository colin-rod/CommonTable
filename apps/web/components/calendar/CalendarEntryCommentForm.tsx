'use client';

import type { CreateCalendarEntryCommentInput } from '@commontable/types';
import { Stack, TextField, Button } from '@mui/material';
import type React from 'react';
import { useState } from 'react';

interface CalendarEntryCommentFormProps {
  onSubmit: (input: CreateCalendarEntryCommentInput) => Promise<void>;
  calendarEntryId: string;
}

/**
 * CalendarEntryCommentForm Component
 *
 * Form for adding a new comment to a calendar entry
 *
 * Features:
 * - Multiline text field (2 rows default)
 * - Submit button disabled when empty or submitting
 * - Clears input on successful submit
 * - Displays submitting state
 */
export function CalendarEntryCommentForm({
  onSubmit,
  calendarEntryId,
}: CalendarEntryCommentFormProps) {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        calendar_entry_id: calendarEntryId,
        comment_text: commentText,
      });
      setCommentText(''); // Clear input on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      <TextField
        label="Add a comment"
        multiline
        rows={2}
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        fullWidth
        disabled={submitting}
        error={!!error}
        helperText={error}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!commentText.trim() || submitting}
      >
        {submitting ? 'Posting...' : 'Post Comment'}
      </Button>
    </Stack>
  );
}
