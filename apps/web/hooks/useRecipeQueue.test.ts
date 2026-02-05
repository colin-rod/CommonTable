import { RecipeQueueService, RecipeService, type QueueEntry } from '@commontable/api-client';
import type { Recipe, RecipeId } from '@commontable/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useRecipeQueue } from './useRecipeQueue';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock services
vi.mock('@commontable/api-client', () => ({
  RecipeQueueService: vi.fn(),
  RecipeService: vi.fn(),
}));

describe('useRecipeQueue Hook', () => {
  const mockRecipe1: Recipe = {
    id: 'recipe-1' as RecipeId,
    household_id: 'household-1' as any,
    title: 'Pasta Carbonara',
    description: null,
    current_version_id: 'version-1' as any,
    rolling_score: null,
    tags: [],
    is_favorite: false,
    last_cooked_at: null,
    created_by: 'user-1' as any,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    cuisine: 'italian',
    meal_type: 'main_dish',
    key_ingredients: [],
    priority: null,
    status: 'suggested',
    cooking_method: 'stovetop',
    dietary_categories: ['vegetarian'],
    dish_category: 'main',
    source_url: null,
  };

  const mockRecipe2: Recipe = {
    id: 'recipe-2' as RecipeId,
    household_id: 'household-1' as any,
    title: 'Caesar Salad',
    description: null,
    current_version_id: 'version-2' as any,
    rolling_score: null,
    tags: [],
    is_favorite: false,
    last_cooked_at: null,
    created_by: 'user-1' as any,
    created_at: new Date('2024-01-02T00:00:00Z'),
    updated_at: new Date('2024-01-02T00:00:00Z'),
    cuisine: 'american',
    meal_type: 'side_dish',
    key_ingredients: [],
    priority: null,
    status: 'suggested',
    cooking_method: 'no_cook',
    dietary_categories: [],
    dish_category: 'salad',
    source_url: null,
  };

  const mockQueueEntry1: QueueEntry = {
    id: 'entry-1',
    recipe_id: 'recipe-1' as RecipeId,
    added_by: 'user-1' as any,
    household_id: 'household-1' as any,
    status: 'queued',
    position: 1,
    notes: null,
    created_at: new Date('2024-01-10T00:00:00Z'),
    updated_at: new Date('2024-01-10T00:00:00Z'),
  };

  const mockQueueEntry2: QueueEntry = {
    id: 'entry-2',
    recipe_id: 'recipe-2' as RecipeId,
    added_by: 'user-1' as any,
    household_id: 'household-1' as any,
    status: 'queued',
    position: 2,
    notes: null,
    created_at: new Date('2024-01-11T00:00:00Z'),
    updated_at: new Date('2024-01-11T00:00:00Z'),
  };

  const mockQueueService = {
    list: vi.fn(),
    add: vi.fn(),
    reorder: vi.fn(),
    markAsCooked: vi.fn(),
    remove: vi.fn(),
  };

  const mockRecipeService = {
    getById: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(RecipeQueueService).mockImplementation(() => mockQueueService as any);
    vi.mocked(RecipeService).mockImplementation(() => mockRecipeService as any);
  });

  describe('loadQueue without laneType', () => {
    it('should load all queue entries when no laneType specified', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1, mockQueueEntry2]);
      mockRecipeService.getById
        .mockResolvedValueOnce(mockRecipe1)
        .mockResolvedValueOnce(mockRecipe2);

      const { result } = renderHook(() => useRecipeQueue());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(2);
      expect(result.current.entries[0]?.recipe).toEqual(mockRecipe1);
      expect(result.current.entries[1]?.recipe).toEqual(mockRecipe2);
      expect(result.current.lanes).toEqual({});
      expect(result.current.error).toBeNull();
    });

    it('should handle empty queue', async () => {
      mockQueueService.list.mockResolvedValue([]);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries).toEqual([]);
      expect(result.current.lanes).toEqual({});
      expect(result.current.error).toBeNull();
    });

    it('should handle errors during load', async () => {
      const error = new Error('Failed to fetch queue');
      mockQueueService.list.mockRejectedValue(error);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries).toEqual([]);
      expect(result.current.error).toBeTruthy();
      // Hook preserves original error if it's an Error instance
      expect(result.current.error?.message).toBe('Failed to fetch queue');
    });
  });

  describe('loadQueue with laneType', () => {
    it('should filter by laneType and group by meal_type', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1, mockQueueEntry2]);
      mockRecipeService.getById
        .mockResolvedValueOnce(mockRecipe1)
        .mockResolvedValueOnce(mockRecipe2);

      const { result } = renderHook(() => useRecipeQueue('meal_type'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(2);
      expect(result.current.lanes).toHaveProperty('main_dish');
      expect(result.current.lanes).toHaveProperty('side_dish');
      expect(result.current.lanes.main_dish).toHaveLength(1);
      expect(result.current.lanes.side_dish).toHaveLength(1);
    });

    it('should group by cuisine', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1, mockQueueEntry2]);
      mockRecipeService.getById
        .mockResolvedValueOnce(mockRecipe1)
        .mockResolvedValueOnce(mockRecipe2);

      const { result } = renderHook(() => useRecipeQueue('cuisine'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lanes).toHaveProperty('italian');
      expect(result.current.lanes).toHaveProperty('american');
    });

    it('should group by cooking_method', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1, mockQueueEntry2]);
      mockRecipeService.getById
        .mockResolvedValueOnce(mockRecipe1)
        .mockResolvedValueOnce(mockRecipe2);

      const { result } = renderHook(() => useRecipeQueue('cooking_method'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lanes).toHaveProperty('stovetop');
      expect(result.current.lanes).toHaveProperty('no_cook');
    });

    it('should group by dietary', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1, mockQueueEntry2]);
      mockRecipeService.getById
        .mockResolvedValueOnce(mockRecipe1)
        .mockResolvedValueOnce(mockRecipe2);

      const { result } = renderHook(() => useRecipeQueue('dietary'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lanes).toHaveProperty('vegetarian');
      expect(result.current.lanes).toHaveProperty('uncategorized');
    });

    it('should group by dish_category', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1, mockQueueEntry2]);
      mockRecipeService.getById
        .mockResolvedValueOnce(mockRecipe1)
        .mockResolvedValueOnce(mockRecipe2);

      const { result } = renderHook(() => useRecipeQueue('dish_category'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lanes).toHaveProperty('main');
      expect(result.current.lanes).toHaveProperty('salad');
    });

    it('should handle recipes without categorization', async () => {
      const uncategorizedRecipe: Recipe = {
        ...mockRecipe1,
        meal_type: null,
        cuisine: null,
        cooking_method: null,
        dietary_categories: null,
        dish_category: null,
        source_url: null,
      };

      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(uncategorizedRecipe);

      const { result } = renderHook(() => useRecipeQueue('meal_type'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lanes).toHaveProperty('uncategorized');
      expect(result.current.lanes.uncategorized).toHaveLength(1);
    });

    it('should sort entries within each lane by position', async () => {
      const entry3: QueueEntry = { ...mockQueueEntry1, id: 'entry-3', position: 3 };
      const entry1: QueueEntry = { ...mockQueueEntry1, id: 'entry-1', position: 1 };
      const entry2: QueueEntry = { ...mockQueueEntry1, id: 'entry-2', position: 2 };

      mockQueueService.list.mockResolvedValue([entry3, entry1, entry2]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue('meal_type'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mainDishLane = result.current.lanes.main_dish;
      expect(mainDishLane).toHaveLength(3);
      expect(mainDishLane?.[0]?.position).toBe(1);
      expect(mainDishLane?.[1]?.position).toBe(2);
      expect(mainDishLane?.[2]?.position).toBe(3);
    });
  });

  describe('addToQueue', () => {
    it('should add recipe to queue successfully', async () => {
      mockQueueService.list.mockResolvedValue([]);
      mockQueueService.add.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      await act(async () => {
        await result.current.addToQueue('recipe-1');
      });

      expect(mockQueueService.add).toHaveBeenCalledWith('recipe-1');
    });

    it('should refresh queue after adding', async () => {
      mockQueueService.list.mockResolvedValue([]);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialListCallCount = mockQueueService.list.mock.calls.length;

      mockQueueService.add.mockResolvedValue(undefined);
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      await act(async () => {
        await result.current.addToQueue('recipe-1');
      });

      expect(mockQueueService.list).toHaveBeenCalledTimes(initialListCallCount + 1);
    });

    it('should handle errors', async () => {
      mockQueueService.list.mockResolvedValue([]);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const error = new Error('Failed to add to queue');
      mockQueueService.add.mockRejectedValue(error);

      await act(async () => {
        await expect(result.current.addToQueue('recipe-1')).rejects.toThrow(error);
      });
    });
  });

  describe('reorder', () => {
    it('should reorder queue entries', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockQueueService.reorder.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.reorder('entry-1', 5);
      });

      expect(mockQueueService.reorder).toHaveBeenCalledWith('entry-1', 5);
    });

    it('should refresh queue after reordering', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialListCallCount = mockQueueService.list.mock.calls.length;

      mockQueueService.reorder.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.reorder('entry-1', 3);
      });

      expect(mockQueueService.list).toHaveBeenCalledTimes(initialListCallCount + 1);
    });

    it('should handle errors', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const error = new Error('Failed to reorder');
      mockQueueService.reorder.mockRejectedValue(error);

      await act(async () => {
        await expect(result.current.reorder('entry-1', 2)).rejects.toThrow(error);
      });
    });
  });

  describe('markAsCooked', () => {
    it('should mark entry as cooked without rating', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockQueueService.markAsCooked.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.markAsCooked('entry-1');
      });

      expect(mockQueueService.markAsCooked).toHaveBeenCalledWith('entry-1', { rating: undefined });
    });

    it('should mark entry as cooked with rating', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockQueueService.markAsCooked.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.markAsCooked('entry-1', 5);
      });

      expect(mockQueueService.markAsCooked).toHaveBeenCalledWith('entry-1', { rating: 5 });
    });

    it('should refresh queue after marking', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialListCallCount = mockQueueService.list.mock.calls.length;

      mockQueueService.markAsCooked.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.markAsCooked('entry-1', 4);
      });

      expect(mockQueueService.list).toHaveBeenCalledTimes(initialListCallCount + 1);
    });

    it('should handle errors', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const error = new Error('Failed to mark as cooked');
      mockQueueService.markAsCooked.mockRejectedValue(error);

      await act(async () => {
        await expect(result.current.markAsCooked('entry-1', 3)).rejects.toThrow(error);
      });
    });
  });

  describe('remove', () => {
    it('should remove entry from queue', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockQueueService.remove.mockResolvedValue(undefined);
      mockQueueService.list.mockResolvedValue([]);

      await act(async () => {
        await result.current.remove('entry-1');
      });

      expect(mockQueueService.remove).toHaveBeenCalledWith('entry-1');
    });

    it('should refresh queue after removal', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialListCallCount = mockQueueService.list.mock.calls.length;

      mockQueueService.remove.mockResolvedValue(undefined);
      mockQueueService.list.mockResolvedValue([]);

      await act(async () => {
        await result.current.remove('entry-1');
      });

      expect(mockQueueService.list).toHaveBeenCalledTimes(initialListCallCount + 1);
    });

    it('should handle errors', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const error = new Error('Failed to remove');
      mockQueueService.remove.mockRejectedValue(error);

      await act(async () => {
        await expect(result.current.remove('entry-1')).rejects.toThrow(error);
      });
    });
  });

  describe('refresh', () => {
    it('should reload queue data', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useRecipeQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialListCallCount = mockQueueService.list.mock.calls.length;

      mockQueueService.list.mockResolvedValue([mockQueueEntry1, mockQueueEntry2]);
      mockRecipeService.getById
        .mockResolvedValueOnce(mockRecipe1)
        .mockResolvedValueOnce(mockRecipe2);

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockQueueService.list).toHaveBeenCalledTimes(initialListCallCount + 1);
    });
  });
});
