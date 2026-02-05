import { CookingEventService } from '@commontable/api-client';
import type { CookingEvent, HouseholdId } from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuth } from './useAuth';

import { createClient } from '@/lib/supabase/client';

interface UseHistoricalCalendarReturn {
  events: CookingEvent[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for loading historical cooking events for a specific month
 *
 * @param year - Year to load events for
 * @param month - Month to load events for (1-12)
 * @returns Historical calendar state and methods
 */
export function useHistoricalCalendar(year: number, month: number): UseHistoricalCalendarReturn {
  const [events, setEvents] = useState<CookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { household } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const cookingEventService = useMemo(() => new CookingEventService(supabase), [supabase]);

  const loadEvents = useCallback(async () => {
    if (!household?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const monthEvents = await cookingEventService.getEventsForMonth(
        household.id as HouseholdId,
        year,
        month,
      );
      setEvents(monthEvents);
    } catch (err) {
      console.error('useHistoricalCalendar.loadEvents failed:', err);
      setError(err instanceof Error ? err : new Error('Failed to load events'));
    } finally {
      setLoading(false);
    }
  }, [year, month, household?.id, cookingEventService]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    refresh: loadEvents,
  };
}
