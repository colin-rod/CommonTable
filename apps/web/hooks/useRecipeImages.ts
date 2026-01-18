import { RecipeImageService } from '@commontable/api-client';
import type {
  RecipeImage,
  RecipeId,
  RecipeImageId,
  UserId,
  UpdateRecipeImageInput,
} from '@commontable/types';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { compressImage, getImageDimensions } from '@/lib/image/compress';
import { createClient } from '@/lib/supabase/client';

/**
 * Options for image upload
 */
export interface UploadOptions {
  /** Alt text for accessibility */
  altText?: string;
  /** Set as primary/cover image */
  isPrimary?: boolean;
  /** Make image publicly accessible */
  isPublic?: boolean;
  /** Compress image before upload (default: true) */
  compress?: boolean;
}

/**
 * useRecipeImages Hook
 *
 * Manages recipe images including:
 * - Loading all images for a recipe
 * - Uploading new images with compression
 * - Deleting images
 * - Updating image metadata (alt text, primary status)
 * - Reordering images
 * - Getting signed URLs for private images
 */
export function useRecipeImages(recipeId: RecipeId | null, userId: UserId | null) {
  const [images, setImages] = useState<RecipeImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const imageService = useMemo(() => new RecipeImageService(supabase), [supabase]);

  /**
   * Load all images for the recipe
   */
  const loadImages = useCallback(async () => {
    if (!recipeId) {
      setImages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const imageData = await imageService.getByRecipe(recipeId);
      setImages(imageData);
    } catch (err) {
      setError(err as Error);
      console.error('useRecipeImages.loadImages failed:', err);
    } finally {
      setLoading(false);
    }
  }, [recipeId, imageService]);

  // Load images on mount and when recipeId changes
  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  /**
   * Upload a new image
   *
   * @param file - The image file to upload
   * @param options - Upload options
   * @returns The created RecipeImage
   */
  const upload = useCallback(
    async (file: File, options: UploadOptions = {}): Promise<RecipeImage> => {
      if (!recipeId || !userId) {
        throw new Error('Recipe ID and User ID are required for upload');
      }

      try {
        setUploading(true);
        setError(null);

        // Compress image by default
        const shouldCompress = options.compress !== false;
        const processedFile = shouldCompress ? await compressImage(file) : file;

        // Get dimensions for metadata (optional - fails gracefully)
        try {
          await getImageDimensions(processedFile);
        } catch {
          // Dimensions are optional, continue without them
        }

        // Upload to service
        const newImage = await imageService.upload(recipeId, processedFile, {
          userId,
          altText: options.altText,
          isPrimary: options.isPrimary,
          isPublic: options.isPublic,
        });

        // Update local state optimistically
        setImages((prev) => {
          // If this is set as primary, unset other primary images
          if (newImage.is_primary) {
            return [...prev.map((img) => ({ ...img, is_primary: false })), newImage];
          }
          return [...prev, newImage];
        });

        return newImage;
      } catch (err) {
        setError(err as Error);
        console.error('useRecipeImages.upload failed:', err);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [recipeId, userId, imageService],
  );

  /**
   * Delete an image
   *
   * @param imageId - The image to delete
   */
  const deleteImage = useCallback(
    async (imageId: RecipeImageId): Promise<void> => {
      try {
        setError(null);

        // Optimistically remove from local state
        setImages((prev) => prev.filter((img) => img.id !== imageId));

        await imageService.delete(imageId);
      } catch (err) {
        // Revert optimistic update on failure
        await loadImages();
        setError(err as Error);
        console.error('useRecipeImages.deleteImage failed:', err);
        throw err;
      }
    },
    [imageService, loadImages],
  );

  /**
   * Update image metadata
   *
   * @param imageId - The image to update
   * @param updates - Fields to update
   * @returns Updated RecipeImage
   */
  const updateImage = useCallback(
    async (imageId: RecipeImageId, updates: UpdateRecipeImageInput): Promise<RecipeImage> => {
      try {
        setError(null);

        const updatedImage = await imageService.update(imageId, updates);

        // Update local state
        setImages((prev) => {
          return prev.map((img) => {
            if (img.id === imageId) {
              return updatedImage;
            }
            // If setting new primary, unset others
            if (updatedImage.is_primary && img.is_primary) {
              return { ...img, is_primary: false };
            }
            return img;
          });
        });

        return updatedImage;
      } catch (err) {
        setError(err as Error);
        console.error('useRecipeImages.updateImage failed:', err);
        throw err;
      }
    },
    [imageService],
  );

  /**
   * Reorder images
   *
   * @param imageIds - Array of image IDs in desired order
   */
  const reorderImages = useCallback(
    async (imageIds: RecipeImageId[]): Promise<void> => {
      if (!recipeId) return;

      try {
        setError(null);

        // Optimistically reorder local state
        setImages((prev) => {
          const imageMap = new Map(prev.map((img) => [img.id, img]));
          return imageIds
            .map((id, index) => {
              const img = imageMap.get(id);
              return img ? { ...img, display_order: index } : null;
            })
            .filter((img): img is RecipeImage => img !== null);
        });

        await imageService.reorder(recipeId, imageIds);
      } catch (err) {
        // Revert on failure
        await loadImages();
        setError(err as Error);
        console.error('useRecipeImages.reorderImages failed:', err);
        throw err;
      }
    },
    [recipeId, imageService, loadImages],
  );

  /**
   * Get a signed URL for a private image
   *
   * @param storagePath - The storage path of the image
   * @returns Signed URL (valid for 1 hour)
   */
  const getSignedUrl = useCallback(
    async (storagePath: string): Promise<string> => {
      try {
        return await imageService.getSignedUrl(storagePath);
      } catch (err) {
        console.error('useRecipeImages.getSignedUrl failed:', err);
        throw err;
      }
    },
    [imageService],
  );

  /**
   * Get public URL for a public image
   *
   * @param storagePath - The storage path of the image
   * @returns Public URL
   */
  const getPublicUrl = useCallback(
    (storagePath: string): string => {
      return imageService.getPublicUrl(storagePath);
    },
    [imageService],
  );

  /**
   * Refresh images from server
   */
  const refresh = useCallback(() => {
    void loadImages();
  }, [loadImages]);

  /**
   * Get the primary image (if any)
   */
  const primaryImage = useMemo(() => {
    return images.find((img) => img.is_primary) ?? null;
  }, [images]);

  return {
    images,
    primaryImage,
    loading,
    uploading,
    error,
    upload,
    deleteImage,
    updateImage,
    reorderImages,
    getSignedUrl,
    getPublicUrl,
    refresh,
  };
}
