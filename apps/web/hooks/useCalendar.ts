import { CalendarService, createClient } from '@commontable/api-client';
import type {
  CalendarEntry,
  CalendarEntryId,
  CreateCalendarEntryInput,
  UpdateCalendarEntryInput,
} from '@commontable/api-client';
import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook for managing calendar entries within a specific week
 *
 * @param weekStart - Start of the week (Sunday)
 * @param weekEnd - End of the week (Saturday)
 * @returns Calendar entries and mutation methods
 */
export function useCalendar(weekStart: Date, weekEnd: Date) {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create service instance (memoized to avoid recreating on every render)
  const supabase = useMemo(() => createClient(), []);
  const calendarService = useMemo(() => new CalendarService(supabase), [supabase]);

  /**
   * Fetch calendar entries for the current week
   */
  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await calendarService.getEntriesForWeek(weekStart, weekEnd);
      setEntries(data);
    } catch (err) {
      console.error('useCalendar.fetchEntries failed:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [calendarService, weekStart, weekEnd]);

  /**
   * Fetch entries on mount and when week changes
   */
  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  /**
   * Create a new calendar entry
   */
  const createEntry = useCallback(
    async (input: CreateCalendarEntryInput): Promise<CalendarEntry> => {
      try {
        const newEntry = await calendarService.create(input);

        // Optimistic update: add to local state immediately
        setEntries((prev) => [...prev, newEntry]);

        return newEntry;
      } catch (err) {
        console.error('useCalendar.createEntry failed:', err);
        throw err;
      }
    },
    [calendarService],
  );

  /**
   * Update an existing calendar entry
   */
  const updateEntry = useCallback(
    async (id: CalendarEntryId, input: UpdateCalendarEntryInput): Promise<CalendarEntry> => {
      try {
        const updatedEntry = await calendarService.update(id, input);

        // Optimistic update: update local state immediately
        setEntries((prev) => prev.map((entry) => (entry.id === id ? updatedEntry : entry)));

        return updatedEntry;
      } catch (err) {
        console.error('useCalendar.updateEntry failed:', err);
        throw err;
      }
    },
    [calendarService],
  );

  /**
   * Delete a calendar entry
   */
  const deleteEntry = useCallback(
    async (id: CalendarEntryId): Promise<void> => {
      try {
        await calendarService.delete(id);

        // Optimistic update: remove from local state immediately
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
      } catch (err) {
        console.error('useCalendar.deleteEntry failed:', err);
        throw err;
      }
    },
    [calendarService],
  );

  /**
   * Mark a calendar entry as completed
   */
  const markCompleted = useCallback(
    async (id: CalendarEntryId): Promise<CalendarEntry> => {
      try {
        const updatedEntry = await calendarService.updateStatus(id, 'completed');

        // Optimistic update: update status in local state
        setEntries((prev) => prev.map((entry) => (entry.id === id ? updatedEntry : entry)));

        return updatedEntry;
      } catch (err) {
        console.error('useCalendar.markCompleted failed:', err);
        throw err;
      }
    },
    [calendarService],
  );

  /**
   * Refresh calendar entries (refetch from server)
   */
  const refresh = useCallback(async () => {
    await fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    markCompleted,
    refresh,
  };
}
