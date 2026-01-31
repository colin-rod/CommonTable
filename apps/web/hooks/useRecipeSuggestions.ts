import type { RecipeSuggestion, SuggestionContext, SuggestionWeights } from '@commontable/types';
import { useState, useEffect, useCallback } from 'react';

import { getRecipeSuggestions } from '@/app/actions/recipeSuggestion';

/**
 * Options for useRecipeSuggestions hook
 */
export interface UseRecipeSuggestionsOptions {
  context: SuggestionContext;
  weights?: Partial<SuggestionWeights>;
  limit?: number;
  enabled?: boolean; // Optional: disable auto-fetch
}

/**
 * Return type for useRecipeSuggestions hook
 */
export interface UseRecipeSuggestionsReturn {
  suggestions: RecipeSuggestion[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * useRecipeSuggestions Hook
 *
 * Fetches recipe suggestions based on context (meal slot, date)
 *
 * @param options - Hook options (context, weights, limit, enabled)
 * @returns Suggestions, loading state, error, and refetch function
 */
export function useRecipeSuggestions(
  options: UseRecipeSuggestionsOptions,
): UseRecipeSuggestionsReturn {
  const { context, weights, limit, enabled = true } = options;

  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch suggestions from server action
   */
  const fetchSuggestions = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const result = await getRecipeSuggestions(context, weights, limit);

      if (result.success) {
        setSuggestions(result.data);
      } else {
        throw new Error(result.error.message);
      }
    } catch (err) {
      setError(err as Error);
      console.error('useRecipeSuggestions.fetchSuggestions failed:', err);
    } finally {
      setLoading(false);
    }
  }, [context, weights, limit, enabled]);

  /**
   * Fetch suggestions on mount and when context changes
   */
  useEffect(() => {
    if (enabled) {
      void fetchSuggestions();
    }
  }, [enabled, fetchSuggestions]);

  /**
   * Refetch suggestions manually
   */
  const refetch = useCallback(async () => {
    await fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    refetch,
  };
}
