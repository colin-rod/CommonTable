import { ShortlistService } from '@commontable/api-client';
import type {
  RecipeId,
  RecipeVersionId,
  UserId,
  HouseholdId,
  ShortlistItem,
} from '@commontable/types';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { useShortlistStore } from './useShortlistStore';

// Mock ShortlistService
vi.mock('@commontable/api-client', () => ({
  ShortlistService: vi.fn(),
}));

// Mock data
const mockUserId = 'user-123' as UserId;
const mockHouseholdId = 'household-456' as HouseholdId;
const mockRecipeId1 = 'recipe-abc' as RecipeId;
const mockRecipeId2 = 'recipe-def' as RecipeId;

const mockShortlistItem1: ShortlistItem = {
  id: 'shortlist-1',
  recipe: {
    id: mockRecipeId1,
    title: 'Pasta Carbonara',
    household_id: mockHouseholdId,
    description: 'Classic Italian pasta',
    current_version_id: 'version-1' as RecipeVersionId,
    rolling_score: null,
    tags: ['pasta', 'italian'],
    is_favorite: false,
    last_cooked_at: null,
    created_by: mockUserId,
    created_at: new Date('2026-01-20T10:00:00Z'),
    updated_at: new Date('2026-01-20T10:00:00Z'),
    // Phase 3 metadata fields
    cuisine: null,
    meal_type: null,
    key_ingredients: [],
    priority: null,
    status: 'suggested',
  },
  addedBy: {
    id: mockUserId,
    name: 'John Doe',
  },
  addedAt: new Date('2026-01-28T10:00:00Z'),
};

const mockShortlistItem2: ShortlistItem = {
  id: 'shortlist-2',
  recipe: {
    id: mockRecipeId2,
    title: 'Pizza Margherita',
    household_id: mockHouseholdId,
    description: 'Simple pizza',
    current_version_id: 'version-2' as RecipeVersionId,
    rolling_score: null,
    tags: ['pizza', 'italian'],
    is_favorite: false,
    last_cooked_at: null,
    created_by: mockUserId,
    created_at: new Date('2026-01-21T10:00:00Z'),
    updated_at: new Date('2026-01-21T10:00:00Z'),
    // Phase 3 metadata fields
    cuisine: null,
    meal_type: null,
    key_ingredients: [],
    priority: null,
    status: 'suggested',
  },
  addedBy: {
    id: mockUserId,
    name: 'Jane Smith',
  },
  addedAt: new Date('2026-01-28T11:00:00Z'),
};

describe('useShortlistStore', () => {
  let mockService: {
    getAll: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Create mock service instance
    mockService = {
      getAll: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
    };

    vi.mocked(ShortlistService).mockImplementation(() => mockService as any);
    vi.clearAllMocks();

    // Reset store state after mock is set up
    useShortlistStore.getState().clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('load', () => {
    it('should load shortlist items from service', async () => {
      mockService.getAll.mockResolvedValue([mockShortlistItem1, mockShortlistItem2]);

      const { result } = renderHook(() => useShortlistStore());

      expect(result.current.items).toEqual([]);
      expect(result.current.loading).toBe(false);

      await act(async () => {
        await result.current.load(mockHouseholdId);
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([mockShortlistItem1, mockShortlistItem2]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(mockService.getAll).toHaveBeenCalledWith(mockHouseholdId);
    });

    it('should set loading state while fetching', async () => {
      mockService.getAll.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );

      const { result } = renderHook(() => useShortlistStore());

      // Start loading without awaiting
      void result.current.load(mockHouseholdId);

      // Wait for state update to propagate
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle errors when loading fails', async () => {
      const error = new Error('Failed to load shortlist');
      mockService.getAll.mockRejectedValue(error);

      const { result } = renderHook(() => useShortlistStore());

      await act(async () => {
        await result.current.load(mockHouseholdId);
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Failed to load shortlist');
      });
    });
  });

  describe('add', () => {
    it('should add recipe to shortlist optimistically', async () => {
      mockService.add.mockResolvedValue(undefined);

      // Pre-load with one item
      useShortlistStore.setState({ items: [mockShortlistItem1] });

      const { result } = renderHook(() => useShortlistStore());

      await act(async () => {
        await result.current.add(mockRecipeId2, mockUserId);
      });

      await waitFor(() => {
        expect(result.current.items.length).toBe(2);
        expect(result.current.items.some((item) => item.recipe.id === mockRecipeId2)).toBe(true);
      });

      expect(mockService.add).toHaveBeenCalledWith(mockRecipeId2, mockUserId);
    });

    it('should not duplicate if recipe already in shortlist', async () => {
      mockService.add.mockResolvedValue(undefined);

      // Pre-load with one item
      useShortlistStore.setState({ items: [mockShortlistItem1] });

      const { result } = renderHook(() => useShortlistStore());

      await act(async () => {
        await result.current.add(mockRecipeId1, mockUserId);
      });

      await waitFor(() => {
        // Should still have only 1 item (no duplicate)
        expect(result.current.items.length).toBe(1);
      });

      // Service should NOT be called if recipe already in list
      expect(mockService.add).not.toHaveBeenCalled();
    });

    it('should handle errors when add fails', async () => {
      const error = new Error('Failed to add recipe');
      mockService.add.mockRejectedValue(error);

      const { result } = renderHook(() => useShortlistStore());

      await act(async () => {
        await result.current.add(mockRecipeId1, mockUserId);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to add recipe');
      });
    });
  });

  describe('remove', () => {
    it('should remove recipe from shortlist optimistically', async () => {
      mockService.remove.mockResolvedValue(undefined);

      // Pre-load with two items
      useShortlistStore.setState({ items: [mockShortlistItem1, mockShortlistItem2] });

      const { result } = renderHook(() => useShortlistStore());

      await act(async () => {
        await result.current.remove(mockRecipeId1);
      });

      await waitFor(() => {
        expect(result.current.items.length).toBe(1);
        expect(result.current.items[0]!.recipe.id).toBe(mockRecipeId2);
      });

      expect(mockService.remove).toHaveBeenCalledWith(mockRecipeId1);
    });

    it('should handle errors when remove fails', async () => {
      const error = new Error('Failed to remove recipe');
      mockService.remove.mockRejectedValue(error);

      // Pre-load with one item
      useShortlistStore.setState({ items: [mockShortlistItem1] });

      const { result } = renderHook(() => useShortlistStore());

      await act(async () => {
        await result.current.remove(mockRecipeId1);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to remove recipe');
        // Item should still be in list after error
        expect(result.current.items.length).toBe(1);
      });
    });
  });

  describe('clear', () => {
    it('should clear all items and reset state', () => {
      // Set some state
      useShortlistStore.setState({
        items: [mockShortlistItem1, mockShortlistItem2],
        loading: true,
        error: 'Some error',
      });

      const { result } = renderHook(() => useShortlistStore());

      act(() => {
        result.current.clear();
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('getCount', () => {
    it('should return count of shortlisted recipes', () => {
      const { result } = renderHook(() => useShortlistStore());

      expect(result.current.getCount()).toBe(0);

      useShortlistStore.setState({ items: [mockShortlistItem1, mockShortlistItem2] });

      expect(result.current.getCount()).toBe(2);
    });
  });

  describe('hasRecipe', () => {
    it('should return true if recipe is in shortlist', () => {
      useShortlistStore.setState({ items: [mockShortlistItem1] });

      const { result } = renderHook(() => useShortlistStore());

      expect(result.current.hasRecipe(mockRecipeId1)).toBe(true);
      expect(result.current.hasRecipe(mockRecipeId2)).toBe(false);
    });

    it('should return false for empty shortlist', () => {
      const { result } = renderHook(() => useShortlistStore());

      expect(result.current.hasRecipe(mockRecipeId1)).toBe(false);
    });
  });
});
