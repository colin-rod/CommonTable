import type {
  CookingEvent,
  CookingEventId,
  CreateCookingEventInput,
  UpdateCookingEventInput,
} from '@commontable/types';
import { useState, useCallback } from 'react';

import {
  createCookingEvent,
  updateCookingEvent,
  deleteCookingEvent,
} from '@/app/actions/cookingEvent';

/**
 * Hook for managing cooking events
 *
 * Provides methods for logging meals, updating ratings, and deleting events.
 */
export function useCookingEvents() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Log a meal (create cooking event)
   */
  const logMeal = useCallback(
    async (input: CreateCookingEventInput): Promise<CookingEvent | null> => {
      try {
        setLoading(true);
        setError(null);

        const result = await createCookingEvent(input);

        if (!result.success) {
          setError(result.error);
          return null;
        }

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to log meal';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Update cooking event rating/notes
   */
  const updateRating = useCallback(
    async (id: CookingEventId, input: UpdateCookingEventInput): Promise<CookingEvent | null> => {
      try {
        setLoading(true);
        setError(null);

        const result = await updateCookingEvent(id, input);

        if (!result.success) {
          setError(result.error);
          return null;
        }

        return result.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update rating';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Delete cooking event
   */
  const deleteEvent = useCallback(async (id: CookingEventId): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const result = await deleteCookingEvent(id);

      if (!result.success) {
        setError(result.error);
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logMeal,
    updateRating,
    deleteEvent,
    loading,
    error,
  };
}
