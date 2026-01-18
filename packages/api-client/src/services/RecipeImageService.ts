/* eslint-disable no-undef */
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
  type UpdateRecipeImageInput,
} from '@commontable/types';

import { BaseService } from './BaseService';

/**
 * Options for uploading a recipe image
 */
export interface UploadImageOptions {
  userId: UserId;
  altText?: string;
  isPrimary?: boolean;
  isPublic?: boolean;
}

/**
 * Service for managing recipe images
 * Handles uploads to Supabase Storage and metadata in recipe_images table
 */
export class RecipeImageService extends BaseService {
  private readonly BUCKET_NAME = 'recipe-images';

  /**
   * Upload an image for a recipe
   *
   * @param recipeId - The recipe to attach the image to
   * @param file - The image file to upload
   * @param options - Upload options including userId
   * @returns The created RecipeImage record
   * @throws {FileTooLargeError} If file exceeds max size
   * @throws {InvalidFileTypeError} If file type is not allowed
   * @throws {ImageLimitExceededError} If recipe already has max images
   * @throws {NotFoundError} If recipe does not exist
   * @throws {StorageError} If storage upload fails
   */
  async upload(recipeId: RecipeId, file: File, options: UploadImageOptions): Promise<RecipeImage> {
    // Validate file size
    if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE_BYTES) {
      throw new FileTooLargeError(file.size, IMAGE_CONSTRAINTS.MAX_FILE_SIZE_BYTES);
    }

    // Validate file type
    if (
      !IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(
        file.type as (typeof IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new InvalidFileTypeError(file.type, IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES);
    }

    // Get recipe to verify it exists and get household_id
    const { data: recipe, error: recipeError } = await this.supabase
      .from('recipes')
      .select('id, household_id')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      throw new NotFoundError('Recipe', recipeId);
    }

    const householdId = recipe.household_id as HouseholdId;

    // Check current image count
    const { count, error: countError } = await this.supabase
      .from('recipe_images')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId);

    if (countError) {
      console.error('RecipeImageService.upload count check failed:', countError);
      throw new AppError('Failed to check image count', 'COUNT_ERROR', 500);
    }

    const currentCount = count ?? 0;
    if (currentCount >= IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE) {
      throw new ImageLimitExceededError(
        recipeId,
        currentCount,
        IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE,
      );
    }

    // Generate unique image ID
    const imageId = crypto.randomUUID() as RecipeImageId;

    // Determine file extension from mime type
    const extension = this.getExtensionFromMimeType(file.type);

    // Build storage path: {household_id}/{recipe_id}/{image_id}.{ext}
    const storagePath = `${householdId}/${recipeId}/${imageId}.${extension}`;

    // Upload to storage
    const { error: uploadError } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('RecipeImageService.upload storage failed:', uploadError);
      throw new StorageError(uploadError.message, { storagePath });
    }

    // Determine if this should be primary (first image = primary)
    const shouldBePrimary = options.isPrimary ?? currentCount === 0;

    // If setting as primary, unset existing primary first
    if (shouldBePrimary && currentCount > 0) {
      await this.supabase
        .from('recipe_images')
        .update({ is_primary: false })
        .eq('recipe_id', recipeId)
        .eq('is_primary', true);
    }

    // Create database record
    const { data: imageRecord, error: insertError } = await this.supabase
      .from('recipe_images')
      .insert({
        id: imageId,
        recipe_id: recipeId,
        storage_path: storagePath,
        display_order: currentCount, // Append to end
        is_primary: shouldBePrimary,
        is_public: options.isPublic ?? false,
        alt_text: options.altText ?? null,
        width: null, // Could be set after upload via image processing
        height: null,
        file_size_bytes: file.size,
        created_by: options.userId,
      })
      .select()
      .single();

    if (insertError || !imageRecord) {
      // Attempt to clean up storage on database insert failure
      await this.supabase.storage.from(this.BUCKET_NAME).remove([storagePath]);

      console.error('RecipeImageService.upload insert failed:', insertError);
      throw new AppError('Failed to create image record', 'INSERT_ERROR', 500);
    }

    return imageRecord as unknown as RecipeImage;
  }

  /**
   * Delete an image from storage and database
   *
   * @param imageId - The image to delete
   * @throws {NotFoundError} If image does not exist
   * @throws {StorageError} If storage deletion fails
   */
  async delete(imageId: RecipeImageId): Promise<void> {
    // Get image record to find storage path
    const { data: image, error: fetchError } = await this.supabase
      .from('recipe_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      throw new NotFoundError('RecipeImage', imageId);
    }

    // Delete from storage
    const { error: storageError } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .remove([image.storage_path]);

    if (storageError) {
      console.error('RecipeImageService.delete storage failed:', storageError);
      throw new StorageError(storageError.message, { storagePath: image.storage_path });
    }

    // Delete from database
    const { error: deleteError } = await this.supabase
      .from('recipe_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      console.error('RecipeImageService.delete database failed:', deleteError);
      throw new AppError('Failed to delete image record', 'DELETE_ERROR', 500);
    }
  }

  /**
   * Update image metadata
   *
   * @param imageId - The image to update
   * @param input - Fields to update
   * @returns Updated RecipeImage
   * @throws {NotFoundError} If image does not exist
   */
  async update(imageId: RecipeImageId, input: UpdateRecipeImageInput): Promise<RecipeImage> {
    // Get current image to verify it exists
    const { data: existingImage, error: fetchError } = await this.supabase
      .from('recipe_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !existingImage) {
      throw new NotFoundError('RecipeImage', imageId);
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (input.altText !== undefined) {
      updateData.alt_text = input.altText;
    }

    if (input.isPublic !== undefined) {
      updateData.is_public = input.isPublic;
    }

    // Handle is_primary separately - need to unset other primary images
    if (input.isPrimary === true) {
      // Unset current primary image(s) for this recipe
      await this.supabase
        .from('recipe_images')
        .update({ is_primary: false })
        .eq('recipe_id', existingImage.recipe_id)
        .neq('id', imageId);

      updateData.is_primary = true;
    } else if (input.isPrimary === false) {
      updateData.is_primary = false;
    }

    // Perform update
    const { data: updatedImage, error: updateError } = await this.supabase
      .from('recipe_images')
      .update(updateData)
      .eq('id', imageId)
      .select()
      .single();

    if (updateError || !updatedImage) {
      console.error('RecipeImageService.update failed:', updateError);
      throw new AppError('Failed to update image', 'UPDATE_ERROR', 500);
    }

    return updatedImage as unknown as RecipeImage;
  }

  /**
   * Get all images for a recipe, ordered by display_order
   *
   * @param recipeId - The recipe to get images for
   * @returns Array of RecipeImage records
   */
  async getByRecipe(recipeId: RecipeId): Promise<RecipeImage[]> {
    const { data, error } = await this.supabase
      .from('recipe_images')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('RecipeImageService.getByRecipe failed:', error);
      throw new AppError('Failed to fetch recipe images', 'FETCH_ERROR', 500);
    }

    return (data ?? []) as unknown as RecipeImage[];
  }

  /**
   * Reorder images for a recipe
   *
   * @param recipeId - The recipe whose images to reorder
   * @param imageIds - Array of image IDs in desired order
   * @returns Updated RecipeImage array in new order
   * @throws {AppError} If imageIds don't match recipe's images
   */
  async reorder(recipeId: RecipeId, imageIds: RecipeImageId[]): Promise<RecipeImage[]> {
    // Get current images
    const { data: currentImages, error: fetchError } = await this.supabase
      .from('recipe_images')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('display_order', { ascending: true });

    if (fetchError) {
      console.error('RecipeImageService.reorder fetch failed:', fetchError);
      throw new AppError('Failed to fetch current images', 'FETCH_ERROR', 500);
    }

    // Validate that all provided IDs match existing images
    const existingIds = new Set((currentImages ?? []).map((img) => img.id));

    // Check all provided IDs exist
    for (const id of imageIds) {
      if (!existingIds.has(id)) {
        throw new AppError(`Image ${id} does not belong to this recipe`, 'INVALID_IMAGE_ID', 400);
      }
    }

    // Update display_order for each image
    const updates = imageIds.map(async (imageId, index) => {
      return this.supabase.from('recipe_images').update({ display_order: index }).eq('id', imageId);
    });

    await Promise.all(updates);

    // Return updated images in new order
    const { data: reorderedImages, error: refetchError } = await this.supabase
      .from('recipe_images')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('display_order', { ascending: true });

    if (refetchError) {
      console.error('RecipeImageService.reorder refetch failed:', refetchError);
      throw new AppError('Failed to fetch reordered images', 'FETCH_ERROR', 500);
    }

    return (reorderedImages ?? []) as unknown as RecipeImage[];
  }

  /**
   * Get a signed URL for a private image
   * URL expires after IMAGE_CONSTRAINTS.URL_EXPIRY_SECONDS (1 hour)
   *
   * @param storagePath - The storage path of the image
   * @returns Signed URL for accessing the image
   * @throws {StorageError} If URL creation fails
   */
  async getSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(storagePath, IMAGE_CONSTRAINTS.URL_EXPIRY_SECONDS);

    if (error || !data?.signedUrl) {
      console.error('RecipeImageService.getSignedUrl failed:', error);
      throw new StorageError('Failed to create signed URL', { storagePath });
    }

    return data.signedUrl;
  }

  /**
   * Get public URL for a public image
   *
   * @param storagePath - The storage path of the image
   * @returns Public URL for accessing the image
   */
  getPublicUrl(storagePath: string): string {
    const { data } = this.supabase.storage.from(this.BUCKET_NAME).getPublicUrl(storagePath);

    return data.publicUrl;
  }

  /**
   * Get file extension from mime type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    return extensions[mimeType] ?? 'jpg';
  }
}
