/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import {
  AppError,
  NotFoundError,
  ImageLimitExceededError,
  InvalidFileTypeError,
  FileTooLargeError,
  StorageError,
  IMAGE_CONSTRAINTS,
  type RecipeId,
  type RecipeImageId,
  type UserId,
  type HouseholdId,
  type RecipeImage,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { RecipeImageService } from './RecipeImageService';

/**
 * Mock types for testing
 */
interface MockRecipeImage {
  id: string;
  recipe_id: string;
  storage_path: string;
  display_order: number;
  is_primary: boolean;
  is_public: boolean;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  created_by: string;
  created_at: string;
}

interface MockRecipe {
  id: string;
  household_id: string;
  title: string;
}

/**
 * Helper to create a mock File
 */
function createMockFile(
  name: string = 'test.jpg',
  size: number = 1024,
  type: string = 'image/jpeg',
): File {
  const blob = new Blob(['test content'], { type });
  Object.defineProperty(blob, 'size', { value: size });
  return new File([blob], name, { type });
}

// Mock data
const mockUserId = 'user-123' as UserId;
const mockRecipeId = 'recipe-456' as RecipeId;
const mockHouseholdId = 'household-789' as HouseholdId;
const mockImageId = 'image-001' as RecipeImageId;

const mockRecipe: MockRecipe = {
  id: mockRecipeId,
  household_id: mockHouseholdId,
  title: 'Test Recipe',
};

const mockRecipeImage: MockRecipeImage = {
  id: mockImageId,
  recipe_id: mockRecipeId,
  storage_path: `${mockHouseholdId}/${mockRecipeId}/${mockImageId}.jpg`,
  display_order: 0,
  is_primary: false,
  is_public: false,
  alt_text: null,
  width: 800,
  height: 600,
  file_size_bytes: 1024,
  created_by: mockUserId,
  created_at: new Date().toISOString(),
};

describe('RecipeImageService', () => {
  let service: RecipeImageService;
  let mockSupabase: any;
  let mockStorageFrom: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a fresh mock for storage
    mockStorageFrom = {
      upload: vi.fn(),
      remove: vi.fn(),
      createSignedUrl: vi.fn(),
      getPublicUrl: vi.fn(),
    };

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(),
      storage: {
        from: vi.fn().mockReturnValue(mockStorageFrom),
      },
    };

    service = new RecipeImageService(mockSupabase as unknown as SupabaseClient);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // upload() tests
  // ==========================================================================
  describe('upload', () => {
    it('should upload image and create database record', async () => {
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

      // Mock recipe lookup
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRecipe, error: null }),
          };
        }
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { ...mockRecipeImage, is_primary: true },
              error: null,
            }),
          };
        }
        return {};
      });

      // Mock storage upload
      mockStorageFrom.upload.mockResolvedValue({
        data: { path: `${mockHouseholdId}/${mockRecipeId}/new-image-id.jpg` },
        error: null,
      });

      const result = await service.upload(mockRecipeId, file, {
        userId: mockUserId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.recipe_id).toBe(mockRecipeId);
    });

    it('should reject files that exceed max size', async () => {
      const largeFile = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg'); // 10MB

      await expect(service.upload(mockRecipeId, largeFile, { userId: mockUserId })).rejects.toThrow(
        FileTooLargeError,
      );
    });

    it('should reject files with invalid mime type', async () => {
      const invalidFile = createMockFile('doc.pdf', 1024, 'application/pdf');

      await expect(
        service.upload(mockRecipeId, invalidFile, { userId: mockUserId }),
      ).rejects.toThrow(InvalidFileTypeError);
    });

    it('should reject upload when max images per recipe is reached', async () => {
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRecipe, error: null }),
          };
        }
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
              count: IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE,
            }),
          };
        }
        return {};
      });

      await expect(service.upload(mockRecipeId, file, { userId: mockUserId })).rejects.toThrow(
        ImageLimitExceededError,
      );
    });

    it('should throw NotFoundError when recipe does not exist', async () => {
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      await expect(service.upload(mockRecipeId, file, { userId: mockUserId })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should set is_primary to true when it is the first image', async () => {
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

      const insertMock = vi.fn().mockReturnThis();
      const selectAfterInsertMock = vi.fn().mockReturnThis();
      const singleAfterInsertMock = vi.fn().mockResolvedValue({
        data: { ...mockRecipeImage, is_primary: true },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRecipe, error: null }),
          };
        }
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
              count: 0, // No existing images
            }),
            insert: insertMock,
            single: singleAfterInsertMock,
          };
        }
        return {};
      });

      // Make insert chain work
      insertMock.mockReturnValue({
        select: selectAfterInsertMock,
      });
      selectAfterInsertMock.mockReturnValue({
        single: singleAfterInsertMock,
      });

      mockStorageFrom.upload.mockResolvedValue({
        data: { path: `${mockHouseholdId}/${mockRecipeId}/new-image.jpg` },
        error: null,
      });

      const result = await service.upload(mockRecipeId, file, {
        userId: mockUserId,
      });

      expect(result.is_primary).toBe(true);
    });

    it('should handle storage upload errors', async () => {
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRecipe, error: null }),
          };
        }
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
              count: 0,
            }),
          };
        }
        return {};
      });

      mockStorageFrom.upload.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' },
      });

      await expect(service.upload(mockRecipeId, file, { userId: mockUserId })).rejects.toThrow(
        StorageError,
      );
    });
  });

  // ==========================================================================
  // delete() tests
  // ==========================================================================
  describe('delete', () => {
    it('should delete image from storage and database', async () => {
      const deleteMock = vi.fn().mockReturnThis();
      const deleteEqMock = vi.fn().mockResolvedValue({ data: null, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRecipeImage, error: null }),
            delete: deleteMock,
          };
        }
        return {};
      });

      deleteMock.mockReturnValue({
        eq: deleteEqMock,
      });

      mockStorageFrom.remove.mockResolvedValue({
        data: [{ name: mockRecipeImage.storage_path }],
        error: null,
      });

      await service.delete(mockImageId);

      expect(mockStorageFrom.remove).toHaveBeenCalledWith([mockRecipeImage.storage_path]);
      expect(deleteMock).toHaveBeenCalled();
    });

    it('should throw NotFoundError when image does not exist', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      await expect(service.delete('nonexistent-id' as RecipeImageId)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw StorageError when storage delete fails', async () => {
      const deleteMock = vi.fn().mockReturnThis();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRecipeImage, error: null }),
            delete: deleteMock,
          };
        }
        return {};
      });

      mockStorageFrom.remove.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' },
      });

      await expect(service.delete(mockImageId)).rejects.toThrow(StorageError);
    });
  });

  // ==========================================================================
  // update() tests
  // ==========================================================================
  describe('update', () => {
    it('should update image alt_text', async () => {
      const updatedImage = { ...mockRecipeImage, alt_text: 'New alt text' };

      const updateMock = vi.fn().mockReturnThis();
      const updateEqMock = vi.fn().mockReturnThis();
      const updateSelectMock = vi.fn().mockReturnThis();
      const updateSingleMock = vi.fn().mockResolvedValue({
        data: updatedImage,
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRecipeImage, error: null }),
            update: updateMock,
          };
        }
        return {};
      });

      updateMock.mockReturnValue({ eq: updateEqMock });
      updateEqMock.mockReturnValue({ select: updateSelectMock });
      updateSelectMock.mockReturnValue({ single: updateSingleMock });

      const result = await service.update(mockImageId, { altText: 'New alt text' });

      expect(result.alt_text).toBe('New alt text');
    });

    it('should update is_primary and unset other primary images', async () => {
      const updatedImage = { ...mockRecipeImage, is_primary: true };

      const updateMock = vi.fn().mockReturnThis();
      const updateEqMock = vi.fn().mockReturnThis();
      const updateNeqMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const updateSelectMock = vi.fn().mockReturnThis();
      const updateSingleMock = vi.fn().mockResolvedValue({
        data: updatedImage,
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: updateNeqMock,
            single: vi.fn().mockResolvedValue({ data: mockRecipeImage, error: null }),
            update: updateMock,
          };
        }
        return {};
      });

      updateMock.mockReturnValue({ eq: updateEqMock, neq: updateNeqMock });
      updateEqMock.mockReturnValue({ select: updateSelectMock, neq: updateNeqMock });
      updateSelectMock.mockReturnValue({ single: updateSingleMock });

      const result = await service.update(mockImageId, { isPrimary: true });

      expect(result.is_primary).toBe(true);
    });

    it('should throw NotFoundError when image does not exist', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      await expect(
        service.update('nonexistent-id' as RecipeImageId, { altText: 'test' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ==========================================================================
  // getByRecipe() tests
  // ==========================================================================
  describe('getByRecipe', () => {
    it('should return all images for a recipe ordered by display_order', async () => {
      const images: MockRecipeImage[] = [
        { ...mockRecipeImage, display_order: 0 },
        { ...mockRecipeImage, id: 'image-002', display_order: 1 },
        { ...mockRecipeImage, id: 'image-003', display_order: 2 },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: images, error: null }),
          };
        }
        return {};
      });

      const result = await service.getByRecipe(mockRecipeId);

      expect(result).toHaveLength(3);
      expect(result[0]?.display_order).toBe(0);
      expect(result[1]?.display_order).toBe(1);
      expect(result[2]?.display_order).toBe(2);
    });

    it('should return empty array when no images exist', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      const result = await service.getByRecipe(mockRecipeId);

      expect(result).toEqual([]);
    });
  });

  // ==========================================================================
  // reorder() tests
  // ==========================================================================
  describe('reorder', () => {
    it('should update display_order for all images in the provided order', async () => {
      const imageIds = ['image-003', 'image-001', 'image-002'] as RecipeImageId[];

      const existingImages: MockRecipeImage[] = [
        { ...mockRecipeImage, id: 'image-001', display_order: 0 },
        { ...mockRecipeImage, id: 'image-002', display_order: 1 },
        { ...mockRecipeImage, id: 'image-003', display_order: 2 },
      ];

      // Reordered images (after update)
      const reorderedImages: MockRecipeImage[] = [
        { ...mockRecipeImage, id: 'image-003', display_order: 0 },
        { ...mockRecipeImage, id: 'image-001', display_order: 1 },
        { ...mockRecipeImage, id: 'image-002', display_order: 2 },
      ];

      let fetchCount = 0;
      const updateMock = vi.fn().mockReturnThis();
      const updateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockImplementation(() => {
              fetchCount++;
              // First call returns existing, second returns reordered
              if (fetchCount === 1) {
                return Promise.resolve({ data: existingImages, error: null });
              }
              return Promise.resolve({ data: reorderedImages, error: null });
            }),
            update: updateMock,
          };
        }
        return {};
      });

      updateMock.mockReturnValue({ eq: updateEqMock });

      const result = await service.reorder(mockRecipeId, imageIds);

      expect(result[0]?.id).toBe('image-003');
      expect(result[0]?.display_order).toBe(0);
    });

    it('should throw error when imageIds do not match recipe images', async () => {
      const imageIds = ['image-999'] as RecipeImageId[];

      const existingImages: MockRecipeImage[] = [
        { ...mockRecipeImage, id: 'image-001', display_order: 0 },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'recipe_images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: existingImages, error: null }),
          };
        }
        return {};
      });

      await expect(service.reorder(mockRecipeId, imageIds)).rejects.toThrow(AppError);
    });
  });

  // ==========================================================================
  // getSignedUrl() tests
  // ==========================================================================
  describe('getSignedUrl', () => {
    it('should return signed URL for private image', async () => {
      const expectedUrl = 'https://storage.example.com/signed-url';

      mockStorageFrom.createSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      });

      const result = await service.getSignedUrl(mockRecipeImage.storage_path);

      expect(result).toBe(expectedUrl);
      expect(mockStorageFrom.createSignedUrl).toHaveBeenCalledWith(
        mockRecipeImage.storage_path,
        IMAGE_CONSTRAINTS.URL_EXPIRY_SECONDS,
      );
    });

    it('should throw StorageError when signed URL creation fails', async () => {
      mockStorageFrom.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Error creating signed URL' },
      });

      await expect(service.getSignedUrl(mockRecipeImage.storage_path)).rejects.toThrow(
        StorageError,
      );
    });
  });

  // ==========================================================================
  // getPublicUrl() tests
  // ==========================================================================
  describe('getPublicUrl', () => {
    it('should return public URL for public image', async () => {
      const expectedUrl = 'https://storage.example.com/public/image.jpg';

      mockStorageFrom.getPublicUrl.mockReturnValue({
        data: { publicUrl: expectedUrl },
      });

      const result = service.getPublicUrl(mockRecipeImage.storage_path);

      expect(result).toBe(expectedUrl);
    });
  });
});
