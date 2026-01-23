import type { RecipeImage, RecipeId, RecipeImageId, UserId } from '@commontable/types';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { useRecipeImages } from './useRecipeImages';

// Mock the RecipeImageService
vi.mock('@commontable/api-client', () => ({
  RecipeImageService: vi.fn().mockImplementation(() => ({
    getByRecipe: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    reorder: vi.fn(),
    getSignedUrl: vi.fn(),
    getPublicUrl: vi.fn(),
  })),
}));

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock image compression
vi.mock('@/lib/image/compress', () => ({
  compressImage: vi.fn((file) => Promise.resolve(file)),
  getImageDimensions: vi.fn(() => Promise.resolve({ width: 800, height: 600 })),
}));

describe('useRecipeImages Hook', () => {
  const mockRecipeId = 'recipe-123' as RecipeId;
  const mockUserId = 'user-456' as UserId;
  const mockImageId = 'image-789' as RecipeImageId;

  const mockImage: RecipeImage = {
    id: mockImageId,
    recipe_id: mockRecipeId,
    storage_path: 'household-123/recipe-123/image-789.jpg',
    display_order: 0,
    is_primary: true,
    is_public: false,
    alt_text: 'Test image',
    width: 800,
    height: 600,
    file_size_bytes: 1024,
    created_by: mockUserId,
    created_at: new Date(),
  };

  let mockGetByRecipe: ReturnType<typeof vi.fn>;
  let mockUpload: ReturnType<typeof vi.fn>;
  let mockDelete: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockReorder: ReturnType<typeof vi.fn>;
  let mockGetSignedUrl: ReturnType<typeof vi.fn>;
  let mockGetPublicUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get fresh mocks from the module
    const { RecipeImageService } = await import('@commontable/api-client');
    const MockService = RecipeImageService as unknown as ReturnType<typeof vi.fn>;

    mockGetByRecipe = vi.fn().mockResolvedValue([mockImage]);
    mockUpload = vi.fn().mockResolvedValue(mockImage);
    mockDelete = vi.fn().mockResolvedValue(undefined);
    mockUpdate = vi.fn().mockResolvedValue(mockImage);
    mockReorder = vi.fn().mockResolvedValue([mockImage]);
    mockGetSignedUrl = vi.fn().mockResolvedValue('https://signed-url.example.com');
    mockGetPublicUrl = vi.fn().mockReturnValue('https://public-url.example.com');

    MockService.mockImplementation(() => ({
      getByRecipe: mockGetByRecipe,
      upload: mockUpload,
      delete: mockDelete,
      update: mockUpdate,
      reorder: mockReorder,
      getSignedUrl: mockGetSignedUrl,
      getPublicUrl: mockGetPublicUrl,
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should load images on mount', async () => {
      const { result } = renderHook(() => useRecipeImages(mockRecipeId, mockUserId));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.images).toHaveLength(1);
      expect(result.current.images[0]!.id).toBe(mockImageId);
    });

    it('should set loading to false and empty array when recipeId is null', async () => {
      const { result } = renderHook(() => useRecipeImages(null, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.images).toEqual([]);
    });

    it('should expose primaryImage computed from images', async () => {
      const { result } = renderHook(() => useRecipeImages(mockRecipeId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.primaryImage).toEqual(mockImage);
    });
  });

  describe('upload', () => {
    it('should upload image and add to local state', async () => {
      const { result } = renderHook(() => useRecipeImages(mockRecipeId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.upload(file);
      });

      expect(mockUpload).toHaveBeenCalled();
    });

    it('should set uploading state during upload', async () => {
      // Make upload take some time
      mockUpload.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockImage), 100)),
      );

      const { result } = renderHook(() => useRecipeImages(mockRecipeId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      let uploadPromise: Promise<RecipeImage>;
      act(() => {
        uploadPromise = result.current.upload(file);
      });

      expect(result.current.uploading).toBe(true);

      await act(async () => {
        await uploadPromise;
      });

      expect(result.current.uploading).toBe(false);
    });

    it('should throw error when recipeId is null', async () => {
      const { result } = renderHook(() => useRecipeImages(null, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(result.current.upload(file)).rejects.toThrow(
        'Recipe ID and User ID are required for upload',
      );
    });

    it('should throw error when userId is null', async () => {
      const { result } = renderHook(() => useRecipeImages(mockRecipeId, null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(result.current.upload(file)).rejects.toThrow(
        'Recipe ID and User ID are required for upload',
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete image and remove from local state', async () => {
      const { result } = renderHook(() => useRecipeImages(mockRecipeId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.images).toHaveLength(1);

      await act(async () => {
        await result.current.deleteImage(mockImageId);
      });

      expect(mockDelete).toHaveBeenCalledWith(mockImageId);
      expect(result.current.images).toHaveLength(0);
    });

    it('should revert state on delete failure', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));
      mockGetByRecipe.mockResolvedValue([mockImage]); // For reload

      const { result } = renderHook(() => useRecipeImages(mockRecipeId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.deleteImage(mockImageId);
        }),
      ).rejects.toThrow('Delete failed');

      // Should have reloaded images
      expect(mockGetByRecipe).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateImage', () => {
    it('should update image metadata', async () => {
      const updatedImage = { ...mockImage, alt_text: 'Updated alt text' };
      mockUpdate.mockResolvedValue(updatedImage);

      const { result } = renderHook(() => useRecipeImages(mockRecipeId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateImage(mockImageId, { altText: 'Updated alt text' });
      });

      expect(mockUpdate).toHaveBeenCalledWith(mockImageId, { altText: 'Updated alt text' });
    });
  });

  describe('reorderImages', () => {
    it('should reorder images optimistically', async () => {
      const images: RecipeImage[] = [
        { ...mockImage, id: 'img-1' as RecipeImageId, display_order: 0 },
        { ...mockImage, id: 'img-2' as RecipeImageId, display_order: 1 },
        { ...mockImage, id: 'img-3' as RecipeImageId, display_order: 2 },
      ];
      mockGetByRecipe.mockResolvedValue(images);

      const { result } = renderHook(() => useRecipeImages(mockRecipeId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newOrder = ['img-3', 'img-1', 'img-2'] as RecipeImageId[];

      await act(async () => {
        await result.current.reorderImages(newOrder);
      });

      expect(mockReorder).toHaveBeenCalledWith(mockRecipeId, newOrder);
    });
  });

  describe('getSignedUrl', () => {
    it('should return signed URL for private image', async () => {
      const { result } = renderHook(() => useRecipeImages(mockRecipeId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const url = await result.current.getSignedUrl(mockImage.storage_path);

      expect(url).toBe('https://signed-url.example.com');
      expect(mockGetSignedUrl).toHaveBeenCalledWith(mockImage.storage_path);
    });
  });

  describe('getPublicUrl', () => {
    it('should return public URL for public image', async () => {
      const { result } = renderHook(() => useRecipeImages(mockRecipeId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const url = result.current.getPublicUrl(mockImage.storage_path);

      expect(url).toBe('https://public-url.example.com');
      expect(mockGetPublicUrl).toHaveBeenCalledWith(mockImage.storage_path);
    });
  });

  describe('refresh', () => {
    it('should reload images from server', async () => {
      const { result } = renderHook(() => useRecipeImages(mockRecipeId, mockUserId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetByRecipe).toHaveBeenCalledTimes(1);

      await act(async () => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(mockGetByRecipe).toHaveBeenCalledTimes(2);
      });
    });
  });
});
