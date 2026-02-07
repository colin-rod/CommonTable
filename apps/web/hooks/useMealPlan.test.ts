import { RecipeQueueService, RecipeService, type QueueEntry } from '@commontable/api-client';
import type { Recipe, RecipeId } from '@commontable/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useMealPlan } from './useMealPlan';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock services
vi.mock('@commontable/api-client', () => ({
  RecipeQueueService: vi.fn(),
  RecipeService: vi.fn(),
}));

describe('useMealPlan Hook', () => {
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

  describe('basic functionality', () => {
    it('should load meal plan entries', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1, mockQueueEntry2]);
      mockRecipeService.getById
        .mockResolvedValueOnce(mockRecipe1)
        .mockResolvedValueOnce(mockRecipe2);

      const { result } = renderHook(() => useMealPlan());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(2);
      expect(result.current.error).toBeNull();
    });

    it('should provide count of entries', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1, mockQueueEntry2]);
      mockRecipeService.getById
        .mockResolvedValueOnce(mockRecipe1)
        .mockResolvedValueOnce(mockRecipe2);

      const { result } = renderHook(() => useMealPlan());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.count).toBe(2);
    });
  });

  describe('hasRecipe', () => {
    it('should return true when recipe is in meal plan', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useMealPlan());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasRecipe('recipe-1')).toBe(true);
    });

    it('should return false when recipe is not in meal plan', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useMealPlan());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasRecipe('recipe-99')).toBe(false);
    });

    it('should return false when meal plan is empty', async () => {
      mockQueueService.list.mockResolvedValue([]);

      const { result } = renderHook(() => useMealPlan());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasRecipe('recipe-1')).toBe(false);
    });
  });

  describe('addToMealPlan', () => {
    it('should add recipe to meal plan', async () => {
      mockQueueService.list.mockResolvedValue([]);

      const { result } = renderHook(() => useMealPlan());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockQueueService.add.mockResolvedValue(undefined);
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      await act(async () => {
        await result.current.addToMealPlan('recipe-1');
      });

      expect(mockQueueService.add).toHaveBeenCalledWith('recipe-1');
    });

    it('should handle errors', async () => {
      mockQueueService.list.mockResolvedValue([]);

      const { result } = renderHook(() => useMealPlan());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const error = new Error('Failed to add to meal plan');
      mockQueueService.add.mockRejectedValue(error);

      await act(async () => {
        await expect(result.current.addToMealPlan('recipe-1')).rejects.toThrow(error);
      });
    });
  });

  describe('removeFromMealPlan', () => {
    it('should remove entry from meal plan', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useMealPlan());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockQueueService.remove.mockResolvedValue(undefined);
      mockQueueService.list.mockResolvedValue([]);

      await act(async () => {
        await result.current.removeFromMealPlan('entry-1');
      });

      expect(mockQueueService.remove).toHaveBeenCalledWith('entry-1');
    });
  });

  describe('markAsCooked', () => {
    it('should mark entry as cooked', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useMealPlan());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockQueueService.markAsCooked.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.markAsCooked('entry-1', 5);
      });

      expect(mockQueueService.markAsCooked).toHaveBeenCalledWith('entry-1', { rating: 5 });
    });
  });

  describe('reorder', () => {
    it('should reorder entries', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useMealPlan());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockQueueService.reorder.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.reorder('entry-1', 5);
      });

      expect(mockQueueService.reorder).toHaveBeenCalledWith('entry-1', 5);
    });
  });

  describe('refresh', () => {
    it('should reload meal plan data', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1]);
      mockRecipeService.getById.mockResolvedValue(mockRecipe1);

      const { result } = renderHook(() => useMealPlan());

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

  describe('lanes support', () => {
    it('should support lane grouping when laneType provided', async () => {
      mockQueueService.list.mockResolvedValue([mockQueueEntry1, mockQueueEntry2]);
      mockRecipeService.getById
        .mockResolvedValueOnce(mockRecipe1)
        .mockResolvedValueOnce(mockRecipe2);

      const { result } = renderHook(() => useMealPlan('meal_type'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lanes).toHaveProperty('main_dish');
      expect(result.current.lanes).toHaveProperty('side_dish');
    });
  });
});
