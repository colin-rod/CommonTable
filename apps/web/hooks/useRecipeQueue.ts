import { RecipeQueueService, RecipeService, type QueueEntry } from '@commontable/api-client';
import type { LaneType, Recipe, RecipeId } from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { createClient } from '@/lib/supabase/client';

interface QueueEntryWithRecipe extends QueueEntry {
  recipe: Recipe;
}

interface UseRecipeQueueReturn {
  entries: QueueEntryWithRecipe[];
  lanes: Record<string, QueueEntryWithRecipe[]>;
  loading: boolean;
  error: Error | null;
  addToQueue: (recipeId: string) => Promise<void>;
  reorder: (entryId: string, newPosition: number) => Promise<void>;
  markAsCooked: (entryId: string, rating?: number) => Promise<void>;
  remove: (entryId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRecipeQueue(laneType?: LaneType): UseRecipeQueueReturn {
  const [entries, setEntries] = useState<QueueEntryWithRecipe[]>([]);
  const [lanes, setLanes] = useState<Record<string, QueueEntryWithRecipe[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const queueService = useMemo(() => new RecipeQueueService(supabase), [supabase]);
  const recipeService = useMemo(() => new RecipeService(supabase), [supabase]);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (laneType) {
        // Load entries grouped by lane type
        const queueEntries = await queueService.list({ status: 'queued' });

        // Fetch recipes for all entries
        const entriesWithRecipes = await Promise.all(
          queueEntries.map(async (entry) => {
            const recipe = await recipeService.getById(entry.recipe_id as RecipeId);
            return { ...entry, recipe };
          }),
        );

        // Group by lane type
        const grouped: Record<string, QueueEntryWithRecipe[]> = {};

        for (const entry of entriesWithRecipes) {
          let laneKey: string;

          switch (laneType) {
            case 'meal_type':
              laneKey = entry.recipe.meal_type || 'uncategorized';
              break;
            case 'cuisine':
              laneKey = entry.recipe.cuisine || 'uncategorized';
              break;
            case 'cooking_method':
              laneKey = entry.recipe.cooking_method || 'uncategorized';
              break;
            case 'dietary':
              laneKey = entry.recipe.dietary_categories?.[0] || 'uncategorized';
              break;
            case 'dish_category':
              laneKey = entry.recipe.dish_category || 'uncategorized';
              break;
            default:
              laneKey = 'uncategorized';
          }

          if (!grouped[laneKey]) {
            grouped[laneKey] = [];
          }
          const lane = grouped[laneKey];
          if (lane) lane.push(entry);
        }

        // Sort entries within each lane by position
        Object.keys(grouped).forEach((key) => {
          const lane = grouped[key];
          if (lane) grouped[key] = lane.sort((a, b) => a.position - b.position);
        });

        setLanes(grouped);
        setEntries(entriesWithRecipes);
      } else {
        // Load all entries without grouping
        const queueEntries = await queueService.list();

        const entriesWithRecipes = await Promise.all(
          queueEntries.map(async (entry) => {
            const recipe = await recipeService.getById(entry.recipe_id as RecipeId);
            return { ...entry, recipe };
          }),
        );

        setEntries(entriesWithRecipes);
        setLanes({});
      }
    } catch (err) {
      console.error('useRecipeQueue.loadQueue failed:', err);
      setError(err instanceof Error ? err : new Error('Failed to load queue'));
    } finally {
      setLoading(false);
    }
  }, [laneType, queueService, recipeService]);

  const addToQueue = useCallback(
    async (recipeId: string) => {
      try {
        await queueService.add(recipeId);
        await loadQueue();
      } catch (err) {
        console.error('useRecipeQueue.addToQueue failed:', err);
        throw err;
      }
    },
    [queueService, loadQueue],
  );

  const reorder = useCallback(
    async (entryId: string, newPosition: number) => {
      try {
        await queueService.reorder(entryId, newPosition);
        await loadQueue();
      } catch (err) {
        console.error('useRecipeQueue.reorder failed:', err);
        throw err;
      }
    },
    [queueService, loadQueue],
  );

  const markAsCooked = useCallback(
    async (entryId: string, rating?: number) => {
      try {
        await queueService.markAsCooked(entryId, { rating });
        await loadQueue();
      } catch (err) {
        console.error('useRecipeQueue.markAsCooked failed:', err);
        throw err;
      }
    },
    [queueService, loadQueue],
  );

  const remove = useCallback(
    async (entryId: string) => {
      try {
        await queueService.remove(entryId);
        await loadQueue();
      } catch (err) {
        console.error('useRecipeQueue.remove failed:', err);
        throw err;
      }
    },
    [queueService, loadQueue],
  );

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  return {
    entries,
    lanes,
    loading,
    error,
    addToQueue,
    reorder,
    markAsCooked,
    remove,
    refresh: loadQueue,
  };
}
