import { MealRequestService } from '@commontable/api-client';
import type {
  MealRequest,
  MealRequestId,
  MealRequestStatus,
  CalendarEntry,
  CreateMealRequestInput,
} from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuth } from './useAuth';

import { createClient } from '@/lib/supabase/client';

/**
 * useMealRequests Hook
 *
 * Manages meal request operations and state for a household
 *
 * Provides:
 * - List of meal requests (optionally filtered by status)
 * - Create request action
 * - Update status action
 * - Update priority action
 * - Add to calendar action
 * - Loading and error states
 * - Refresh function
 */
export function useMealRequests(filters?: { status?: MealRequestStatus }) {
  const { household: _household } = useAuth();
  const [requests, setRequests] = useState<MealRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const mealRequestService = useMemo(() => new MealRequestService(supabase), [supabase]);

  /**
   * Load meal requests
   */
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await mealRequestService.list(filters);
      setRequests(data);
    } catch (err) {
      setError(err as Error);
      console.error('useMealRequests.loadRequests failed:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, mealRequestService]);

  // Load requests on mount and when filters change
  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  /**
   * Create a new meal request
   */
  const createRequest = useCallback(
    async (input: CreateMealRequestInput) => {
      try {
        const newRequest = await mealRequestService.create(input);

        // Optimistic update: add to local state
        setRequests((prev) => [...prev, newRequest]);

        return newRequest;
      } catch (err) {
        console.error('useMealRequests.createRequest failed:', err);
        throw err;
      }
    },
    [mealRequestService],
  );

  /**
   * Update meal request status
   */
  const updateStatus = useCallback(
    async (id: MealRequestId, status: MealRequestStatus) => {
      try {
        const updatedRequest = await mealRequestService.updateStatus(id, status);

        // Optimistic update: update local state
        setRequests((prev) => prev.map((r) => (r.id === id ? updatedRequest : r)));

        return updatedRequest;
      } catch (err) {
        console.error('useMealRequests.updateStatus failed:', err);
        throw err;
      }
    },
    [mealRequestService],
  );

  /**
   * Update meal request priority
   */
  const updatePriority = useCallback(
    async (id: MealRequestId, priority: number) => {
      try {
        const updatedRequest = await mealRequestService.updatePriority(id, priority);

        // Optimistic update: update local state
        setRequests((prev) => prev.map((r) => (r.id === id ? updatedRequest : r)));

        return updatedRequest;
      } catch (err) {
        console.error('useMealRequests.updatePriority failed:', err);
        throw err;
      }
    },
    [mealRequestService],
  );

  /**
   * Add meal request to calendar
   * Creates a calendar entry and updates request status to 'planned'
   */
  const addToCalendar = useCallback(
    async (id: MealRequestId): Promise<{ request: MealRequest; calendarEntry: CalendarEntry }> => {
      try {
        const result = await mealRequestService.addToCalendar(id);

        // Optimistic update: update local state with planned status
        setRequests((prev) => prev.map((r) => (r.id === id ? result.request : r)));

        return result;
      } catch (err) {
        console.error('useMealRequests.addToCalendar failed:', err);
        throw err;
      }
    },
    [mealRequestService],
  );

  /**
   * Refresh meal requests
   */
  const refresh = useCallback(() => {
    void loadRequests();
  }, [loadRequests]);

  return {
    requests,
    loading,
    error,
    createRequest,
    updateStatus,
    updatePriority,
    addToCalendar,
    refresh,
  };
}
