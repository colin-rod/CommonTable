import {
  CalendarEntryCommentService,
  type CreateCalendarEntryCommentInput,
} from '@commontable/api-client';
import type { CalendarEntryComment, CalendarEntryId } from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { createClient } from '@/lib/supabase/client';

/**
 * useCalendarEntryComments Hook
 *
 * Manages calendar entry comment operations and state
 *
 * Provides:
 * - List of comments for a calendar entry (chronological order, oldest first)
 * - Add comment action (optimistic updates)
 * - Loading and error states
 * - Refetch function
 *
 * Note: Comments are append-only (no edit/delete)
 */
export function useCalendarEntryComments(calendarEntryId: CalendarEntryId) {
  const [comments, setComments] = useState<CalendarEntryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const commentService = useMemo(() => new CalendarEntryCommentService(supabase), [supabase]);

  /**
   * Load comments for the calendar entry
   */
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await commentService.getByCalendarEntryId(calendarEntryId);
      setComments(data);
    } catch (err) {
      setError(err as Error);
      console.error('useCalendarEntryComments.loadComments failed:', err);
    } finally {
      setLoading(false);
    }
  }, [calendarEntryId, commentService]);

  // Load comments on mount and when calendarEntryId changes
  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  /**
   * Add a new comment to the calendar entry
   *
   * Performs optimistic update by adding the comment to local state immediately
   */
  const addComment = useCallback(
    async (input: CreateCalendarEntryCommentInput) => {
      try {
        const newComment = await commentService.create(input);

        // Optimistic update: add to local state (append to end)
        setComments((prev) => [...prev, newComment]);

        return newComment;
      } catch (err) {
        console.error('useCalendarEntryComments.addComment failed:', err);
        throw err;
      }
    },
    [commentService],
  );

  /**
   * Refetch comments from the server
   */
  const refetch = useCallback(() => {
    return loadComments();
  }, [loadComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    refetch,
  };
}
