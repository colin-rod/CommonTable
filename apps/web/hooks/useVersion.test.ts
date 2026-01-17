import { RecipeService } from '@commontable/api-client';
import type { RecipeId, RecipeVersion, RecipeVersionId, UserId } from '@commontable/types';
import { NotFoundError } from '@commontable/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { useVersion } from './useVersion';

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}));

// Mock the RecipeService
vi.mock('@commontable/api-client', () => ({
  RecipeService: vi.fn().mockImplementation(() => ({
    getVersion: vi.fn(),
  })),
}));

describe('useVersion Hook', () => {
  const mockRecipeId = 'recipe-123' as RecipeId;
  const mockVersionNumber = 2;

  const mockVersion: RecipeVersion = {
    id: 'version-2' as RecipeVersionId,
    recipe_id: mockRecipeId,
    version_number: 2,
    ingredients_json: [
      { name: 'flour', quantity: 2, unit: 'cups' },
      { name: 'sugar', quantity: 1, unit: 'cup' },
    ],
    steps_json: [
      { position: 1, text: 'Mix flour and sugar' },
      { position: 2, text: 'Add wet ingredients' },
    ],
    servings: 4,
    prep_time_minutes: 10,
    cook_time_minutes: 30,
    notes: 'Version 2 notes',
    created_by: 'user-123' as UserId,
    created_at: new Date('2024-01-10T00:00:00Z'),
  };

  let mockGetVersion: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetVersion = vi.fn();
    vi.mocked(RecipeService).mockImplementation(
      () =>
        ({
          getVersion: mockGetVersion,
        }) as unknown as RecipeService,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should return loading state initially', () => {
      mockGetVersion.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useVersion(mockRecipeId, mockVersionNumber));

      expect(result.current.loading).toBe(true);
      expect(result.current.version).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should set loading to false after data loads', async () => {
      mockGetVersion.mockResolvedValue(mockVersion);

      const { result } = renderHook(() => useVersion(mockRecipeId, mockVersionNumber));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.version).toEqual(mockVersion);
    });
  });

  describe('Success State', () => {
    it('should return version on successful load', async () => {
      mockGetVersion.mockResolvedValue(mockVersion);

      const { result } = renderHook(() => useVersion(mockRecipeId, mockVersionNumber));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.version).not.toBeNull();
      expect(result.current.version?.version_number).toBe(2);
      expect(result.current.version?.ingredients_json).toHaveLength(2);
      expect(result.current.version?.steps_json).toHaveLength(2);
      expect(result.current.version?.servings).toBe(4);
      expect(result.current.error).toBeNull();
    });

    it('should call getVersion with correct parameters', async () => {
      mockGetVersion.mockResolvedValue(mockVersion);

      renderHook(() => useVersion(mockRecipeId, mockVersionNumber));

      await waitFor(() => {
        expect(mockGetVersion).toHaveBeenCalledWith(mockRecipeId, mockVersionNumber);
      });
    });
  });

  describe('Error State', () => {
    it('should return error state on failure', async () => {
      const mockError = new Error('Failed to fetch version');
      mockGetVersion.mockRejectedValue(mockError);

      const { result } = renderHook(() => useVersion(mockRecipeId, mockVersionNumber));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.version).toBeNull();
    });

    it('should handle NotFoundError', async () => {
      const notFoundError = new NotFoundError('RecipeVersion', `${mockRecipeId}:v999`);
      mockGetVersion.mockRejectedValue(notFoundError);

      const { result } = renderHook(() => useVersion(mockRecipeId, 999));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(NotFoundError);
      expect(result.current.version).toBeNull();
    });
  });

  describe('Null Parameters', () => {
    it('should not fetch when recipeId is null', () => {
      const { result } = renderHook(() => useVersion(null, mockVersionNumber));

      expect(result.current.loading).toBe(false);
      expect(result.current.version).toBeNull();
      expect(result.current.error).toBeNull();
      expect(mockGetVersion).not.toHaveBeenCalled();
    });

    it('should not fetch when versionNumber is 0', () => {
      const { result } = renderHook(() => useVersion(mockRecipeId, 0));

      expect(result.current.loading).toBe(false);
      expect(result.current.version).toBeNull();
      expect(result.current.error).toBeNull();
      expect(mockGetVersion).not.toHaveBeenCalled();
    });
  });

  describe('Parameter Changes', () => {
    it('should refetch when recipeId changes', async () => {
      mockGetVersion.mockResolvedValue(mockVersion);

      const { result, rerender } = renderHook(
        ({ recipeId, versionNumber }) => useVersion(recipeId, versionNumber),
        { initialProps: { recipeId: mockRecipeId, versionNumber: mockVersionNumber } },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newRecipeId = 'recipe-456' as RecipeId;
      rerender({ recipeId: newRecipeId, versionNumber: mockVersionNumber });

      await waitFor(() => {
        expect(mockGetVersion).toHaveBeenCalledTimes(2);
        expect(mockGetVersion).toHaveBeenLastCalledWith(newRecipeId, mockVersionNumber);
      });
    });

    it('should refetch when versionNumber changes', async () => {
      mockGetVersion.mockResolvedValue(mockVersion);

      const { result, rerender } = renderHook(
        ({ recipeId, versionNumber }) => useVersion(recipeId, versionNumber),
        { initialProps: { recipeId: mockRecipeId, versionNumber: mockVersionNumber } },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      rerender({ recipeId: mockRecipeId, versionNumber: 3 });

      await waitFor(() => {
        expect(mockGetVersion).toHaveBeenCalledTimes(2);
        expect(mockGetVersion).toHaveBeenLastCalledWith(mockRecipeId, 3);
      });
    });
  });
});
