import { RecipeService } from '@commontable/api-client';
import type { HouseholdId } from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuth } from './useAuth';

import { createClient } from '@/lib/supabase/client';

/**
 * useTags Hook
 *
 * Manages tag list operations and state for a household
 *
 * Provides:
 * - List of all tag names for the current household
 * - Loading and error states
 */
export function useTags() {
  const { household } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const recipeService = useMemo(() => new RecipeService(supabase), [supabase]);

  /**
   * Load tags for the household
   */
  const loadTags = useCallback(async () => {
    if (!household?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await recipeService.getAllTags(household.id as HouseholdId);
      setTags(data);
    } catch (err) {
      setError(err as Error);
      console.error('useTags.loadTags failed:', err);
    } finally {
      setLoading(false);
    }
  }, [household?.id, recipeService]);

  // Load tags on mount and when household changes
  useEffect(() => {
    if (household?.id) {
      void loadTags();
    } else {
      setLoading(false);
    }
  }, [household?.id, loadTags]);

  return {
    tags,
    loading,
    error,
  };
}
