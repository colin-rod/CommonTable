import { RecipeService, RecipeImageService } from '@commontable/api-client';
import type { Recipe, RecipeId, HouseholdId, Household, RecipeImage } from '@commontable/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuth } from './useAuth';
import { useRecipesWithImages } from './useRecipesWithImages';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock RecipeService and RecipeImageService
vi.mock('@commontable/api-client', () => ({
  RecipeService: vi.fn(),
  RecipeImageService: vi.fn(),
}));

// Mock useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('useRecipesWithImages Hook', () => {
  const mockHouseholdId = 'household-123' as HouseholdId;

  const mockHousehold: Household = {
    id: mockHouseholdId,
    name: 'Test Household',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockRecipes: Recipe[] = [
    {
      id: 'recipe-1' as RecipeId,
      household_id: mockHouseholdId,
      title: 'Pasta Carbonara',
      description: 'Classic Italian pasta',
      tags: [],
      key_ingredients: [],
      is_favorite: false,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    } as Recipe,
  ];

  const mockImageMap = new Map<RecipeId, RecipeImage>([
    [
      'recipe-1' as RecipeId,
      {
        id: 'img-1',
        recipe_id: 'recipe-1',
        storage_path: 'path/to/image.jpg',
        is_primary: true,
        is_public: false,
      } as RecipeImage,
    ],
  ]);

  const mockRecipeService = {
    getByHousehold: vi.fn(),
    getPrimaryImagesForRecipes: vi.fn(),
    toggleFavorite: vi.fn(),
  };

  const mockImageService = {
    getSignedUrl: vi.fn(),
    getPublicUrl: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(RecipeService).mockImplementation(() => mockRecipeService as any);
    vi.mocked(RecipeImageService).mockImplementation(() => mockImageService as any);
    vi.mocked(useAuth).mockReturnValue({
      household: mockHousehold,
    } as any);
  });

  it('should load recipes and their primary images', async () => {
    mockRecipeService.getByHousehold.mockResolvedValue(mockRecipes);
    mockRecipeService.getPrimaryImagesForRecipes.mockResolvedValue(mockImageMap);
    mockImageService.getSignedUrl.mockResolvedValue('https://example.com/signed-url.jpg');

    const { result } = renderHook(() => useRecipesWithImages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recipes).toHaveLength(1);
    expect(result.current.imageUrls.size).toBe(1);
    expect(result.current.imageUrls.get('recipe-1' as RecipeId)).toBe(
      'https://example.com/signed-url.jpg',
    );
  });

  it('should handle recipes without images gracefully', async () => {
    const recipesWithoutImages: Recipe[] = [
      {
        id: 'recipe-no-image' as RecipeId,
        household_id: mockHouseholdId,
        title: 'Simple Salad',
        tags: [],
        key_ingredients: [],
        is_favorite: false,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      } as Recipe,
    ];

    mockRecipeService.getByHousehold.mockResolvedValue(recipesWithoutImages);
    mockRecipeService.getPrimaryImagesForRecipes.mockResolvedValue(new Map());

    const { result } = renderHook(() => useRecipesWithImages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recipes).toHaveLength(1);
    expect(result.current.imageUrls.size).toBe(0);
    expect(result.current.imagesLoading).toBe(false);
  });

  it('should handle image URL generation failures gracefully', async () => {
    mockRecipeService.getByHousehold.mockResolvedValue(mockRecipes);
    mockRecipeService.getPrimaryImagesForRecipes.mockResolvedValue(mockImageMap);
    mockImageService.getSignedUrl.mockRejectedValue(new Error('Failed to generate URL'));

    const { result } = renderHook(() => useRecipesWithImages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Recipe loaded successfully even though image URL failed
    expect(result.current.recipes).toHaveLength(1);
    expect(result.current.imageUrls.size).toBe(0); // No URL added due to error
  });
});
