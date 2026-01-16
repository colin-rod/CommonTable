'use client';

import { RecipeService } from '@commontable/api-client';
import type { RecipeSearchResult, HouseholdId } from '@commontable/types';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useAuth } from './useAuth';

import { createClient } from '@/lib/supabase/client';

/**
 * useRecipeSearch Hook
 *
 * Manages recipe search with debouncing
 *
 * Provides:
 * - Search results with relevance ranking
 * - Debounced search (300ms)
 * - Loading and error states
 */
export function useRecipeSearch(query: string, debounceMs: number = 300) {
  const { household } = useAuth();
  const [results, setResults] = useState<RecipeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const recipeService = useMemo(() => new RecipeService(supabase), [supabase]);

  // Track latest query to avoid race conditions
  const latestQueryRef = useRef(query);

  /**
   * Perform search
   */
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!household?.id || !searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await recipeService.search(searchQuery, household.id as HouseholdId);

        // Only update if this is still the latest query
        if (latestQueryRef.current === searchQuery) {
          setResults(data);
        }
      } catch (err) {
        // Only update error if this is still the latest query
        if (latestQueryRef.current === searchQuery) {
          setError(err as Error);
          console.error('useRecipeSearch.performSearch failed:', err);
        }
      } finally {
        // Only update loading if this is still the latest query
        if (latestQueryRef.current === searchQuery) {
          setLoading(false);
        }
      }
    },
    [household?.id, recipeService],
  );

  // Debounced search effect
  useEffect(() => {
    latestQueryRef.current = query;

    // Clear results immediately if query is empty
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Start loading indicator immediately
    setLoading(true);

    const timeoutId = globalThis.setTimeout(() => {
      void performSearch(query);
    }, debounceMs);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [query, debounceMs, performSearch]);

  return {
    results,
    loading,
    error,
  };
}
