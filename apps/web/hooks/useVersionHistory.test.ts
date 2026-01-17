import { RecipeService } from '@commontable/api-client';
import type { RecipeId, VersionHistoryEntry, RecipeVersionId, UserId } from '@commontable/types';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { useVersionHistory } from './useVersionHistory';

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(),
  })),
}));

// Mock the RecipeService
vi.mock('@commontable/api-client', () => ({
  RecipeService: vi.fn().mockImplementation(() => ({
    getVersionHistory: vi.fn(),
  })),
}));

describe('useVersionHistory Hook', () => {
  const mockRecipeId = 'recipe-123' as RecipeId;

  const mockVersionHistory: VersionHistoryEntry[] = [
    {
      version_id: 'version-3' as RecipeVersionId,
      version_number: 3,
      created_by: 'user-123' as UserId,
      created_by_name: 'Sarah',
      created_at: new Date('2024-01-15T00:00:00Z'),
      is_current: true,
    },
    {
      version_id: 'version-2' as RecipeVersionId,
      version_number: 2,
      created_by: 'user-456' as UserId,
      created_by_name: 'John',
      created_at: new Date('2024-01-10T00:00:00Z'),
      is_current: false,
    },
    {
      version_id: 'version-1' as RecipeVersionId,
      version_number: 1,
      created_by: 'user-123' as UserId,
      created_by_name: 'Sarah',
      created_at: new Date('2024-01-01T00:00:00Z'),
      is_current: false,
    },
  ];

  let mockGetVersionHistory: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetVersionHistory = vi.fn();
    vi.mocked(RecipeService).mockImplementation(
      () =>
        ({
          getVersionHistory: mockGetVersionHistory,
        }) as unknown as RecipeService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should return loading state initially', () => {
      mockGetVersionHistory.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useVersionHistory(mockRecipeId));

      expect(result.current.loading).toBe(true);
      expect(result.current.versions).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should set loading to false after data loads', async () => {
      mockGetVersionHistory.mockResolvedValue(mockVersionHistory);

      const { result } = renderHook(() => useVersionHistory(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.versions).toEqual(mockVersionHistory);
    });
  });

  describe('Success State', () => {
    it('should return version history on successful load', async () => {
      mockGetVersionHistory.mockResolvedValue(mockVersionHistory);

      const { result } = renderHook(() => useVersionHistory(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.versions).toHaveLength(3);
      expect(result.current.versions[0].version_number).toBe(3);
      expect(result.current.versions[0].is_current).toBe(true);
      expect(result.current.versions[0].created_by_name).toBe('Sarah');
      expect(result.current.error).toBeNull();
    });

    it('should return empty array when no versions exist', async () => {
      mockGetVersionHistory.mockResolvedValue([]);

      const { result } = renderHook(() => useVersionHistory(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.versions).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle null display names gracefully', async () => {
      const versionsWithNullName: VersionHistoryEntry[] = [
        {
          version_id: 'version-1' as RecipeVersionId,
          version_number: 1,
          created_by: 'user-123' as UserId,
          created_by_name: null,
          created_at: new Date('2024-01-01T00:00:00Z'),
          is_current: true,
        },
      ];

      mockGetVersionHistory.mockResolvedValue(versionsWithNullName);

      const { result } = renderHook(() => useVersionHistory(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.versions[0].created_by_name).toBeNull();
    });
  });

  describe('Error State', () => {
    it('should return error state on failure', async () => {
      const mockError = new Error('Failed to fetch version history');
      mockGetVersionHistory.mockRejectedValue(mockError);

      const { result } = renderHook(() => useVersionHistory(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.versions).toEqual([]);
    });
  });

  describe('Null RecipeId', () => {
    it('should not fetch when recipeId is null', () => {
      const { result } = renderHook(() => useVersionHistory(null));

      expect(result.current.loading).toBe(false);
      expect(result.current.versions).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(mockGetVersionHistory).not.toHaveBeenCalled();
    });
  });

  describe('Refresh Function', () => {
    it('should refetch data when refresh is called', async () => {
      mockGetVersionHistory.mockResolvedValue(mockVersionHistory);

      const { result } = renderHook(() => useVersionHistory(mockRecipeId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetVersionHistory).toHaveBeenCalledTimes(1);

      // Call refresh
      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(mockGetVersionHistory).toHaveBeenCalledTimes(2);
      });
    });

    it('should update data after refresh', async () => {
      const initialVersions = [mockVersionHistory[0]];
      const updatedVersions = mockVersionHistory;

      mockGetVersionHistory
        .mockResolvedValueOnce(initialVersions)
        .mockResolvedValueOnce(updatedVersions);

      const { result } = renderHook(() => useVersionHistory(mockRecipeId));

      await waitFor(() => {
        expect(result.current.versions).toHaveLength(1);
      });

      // Call refresh
      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.versions).toHaveLength(3);
      });
    });
  });

  describe('RecipeId Changes', () => {
    it('should refetch when recipeId changes', async () => {
      mockGetVersionHistory.mockResolvedValue(mockVersionHistory);

      const { result, rerender } = renderHook(({ recipeId }) => useVersionHistory(recipeId), {
        initialProps: { recipeId: mockRecipeId },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newRecipeId = 'recipe-456' as RecipeId;
      rerender({ recipeId: newRecipeId });

      await waitFor(() => {
        expect(mockGetVersionHistory).toHaveBeenCalledTimes(2);
      });
    });
  });
});
