'use client';

import type {
  RecipeId,
  UserId,
  RecipeImage,
  RecipeImageId,
  UpdateRecipeImageInput,
} from '@commontable/types';
import { Stack, Typography, Divider } from '@mui/material';
import { useState, useCallback } from 'react';

import { ImageEditorDialog } from './ImageEditorDialog';
import { ImageGallery } from './ImageGallery';
import { ImageUploader } from './ImageUploader';

import { useRecipeImages } from '@/hooks/useRecipeImages';

/**
 * Props for the ImageManagement component
 */
export interface ImageManagementProps {
  /** Recipe ID (required) */
  recipeId: RecipeId;
  /** User ID (required for uploads) */
  userId: UserId;
}

/**
 * ImageManagement Component
 *
 * Comprehensive image management for recipes including:
 * - Uploading new images
 * - Viewing image gallery
 * - Editing image metadata
 * - Deleting images
 *
 * This component combines ImageUploader, ImageGallery, and ImageEditorDialog.
 */
export function ImageManagement({ recipeId, userId }: ImageManagementProps) {
  const {
    images,
    loading,
    uploading,
    error,
    upload,
    deleteImage,
    updateImage,
    getSignedUrl,
    getPublicUrl,
  } = useRecipeImages(recipeId, userId);

  const [editingImage, setEditingImage] = useState<RecipeImage | null>(null);

  /**
   * Handle file selection for upload
   */
  const handleFileSelect = useCallback(
    async (file: File) => {
      await upload(file);
    },
    [upload],
  );

  /**
   * Handle setting an image as primary
   */
  const handleSetPrimary = useCallback(
    async (imageId: RecipeImageId) => {
      await updateImage(imageId, { isPrimary: true });
    },
    [updateImage],
  );

  /**
   * Handle opening the edit dialog
   */
  const handleEdit = useCallback((image: RecipeImage) => {
    setEditingImage(image);
  }, []);

  /**
   * Handle closing the edit dialog
   */
  const handleCloseEditor = useCallback(() => {
    setEditingImage(null);
  }, []);

  /**
   * Handle saving image changes
   */
  const handleSave = useCallback(
    async (imageId: RecipeImageId, updates: UpdateRecipeImageInput) => {
      await updateImage(imageId, updates);
    },
    [updateImage],
  );

  /**
   * Handle deleting an image
   */
  const handleDelete = useCallback(
    async (imageId: RecipeImageId) => {
      await deleteImage(imageId);
    },
    [deleteImage],
  );

  /**
   * Get image URL (signed for private, public for public)
   */
  const getImageUrl = useCallback(
    async (image: RecipeImage): Promise<string> => {
      if (image.is_public) {
        return getPublicUrl(image.storage_path);
      }
      return await getSignedUrl(image.storage_path);
    },
    [getSignedUrl, getPublicUrl],
  );

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Images</Typography>

      {/* Error display */}
      {error && (
        <Typography variant="body2" color="error">
          {error.message}
        </Typography>
      )}

      {/* Image uploader */}
      <ImageUploader
        onFileSelect={handleFileSelect}
        uploading={uploading}
        currentImageCount={images.length}
      />

      <Divider />

      {/* Image gallery */}
      <ImageGallery
        images={images}
        loading={loading}
        getImageUrl={getImageUrl}
        onSetPrimary={handleSetPrimary}
        onEdit={handleEdit}
        onDelete={handleDelete}
        editMode
      />

      {/* Edit dialog */}
      <ImageEditorDialog
        image={editingImage}
        open={editingImage !== null}
        onClose={handleCloseEditor}
        onSave={handleSave}
        onDelete={handleDelete}
        getImageUrl={getImageUrl}
      />
    </Stack>
  );
}
