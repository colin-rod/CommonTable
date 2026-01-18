/* eslint-disable no-undef */
import { z } from 'zod';

// =============================================================================
// Recipe Image Constants
// =============================================================================

/**
 * Image constraints for recipe images
 */
export const IMAGE_CONSTRAINTS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_PER_RECIPE: 10,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  URL_EXPIRY_SECONDS: 3600, // 1 hour for signed URLs
} as const;

// =============================================================================
// Recipe Image Upload Schemas
// =============================================================================

/**
 * Upload recipe image options schema
 * Used when uploading a new image to a recipe
 */
export const UploadRecipeImageOptionsSchema = z.object({
  altText: z.string().max(500, 'Alt text must be 500 characters or less').trim().optional(),
  isPrimary: z.boolean().default(false),
  isPublic: z.boolean().default(false),
});

export type UploadRecipeImageOptions = z.infer<typeof UploadRecipeImageOptionsSchema>;

/**
 * Upload recipe image input schema (full input)
 * Includes recipe ID and options
 */
export const UploadRecipeImageInputSchema = z.object({
  recipeId: z.string().uuid('Invalid recipe ID'),
  options: UploadRecipeImageOptionsSchema.optional(),
});

export type UploadRecipeImageInput = z.infer<typeof UploadRecipeImageInputSchema>;

// =============================================================================
// Recipe Image Update Schemas
// =============================================================================

/**
 * Update recipe image schema
 * Used when updating image metadata (alt text, primary status, public status)
 */
export const UpdateRecipeImageSchema = z
  .object({
    altText: z
      .string()
      .max(500, 'Alt text must be 500 characters or less')
      .trim()
      .nullable()
      .optional(),
    isPrimary: z.boolean().optional(),
    isPublic: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateRecipeImageInput = z.infer<typeof UpdateRecipeImageSchema>;

// =============================================================================
// Recipe Image Reorder Schemas
// =============================================================================

/**
 * Reorder recipe images schema
 * Used when changing the display order of images
 * The order of image IDs in the array determines the new display order
 */
export const ReorderRecipeImagesSchema = z.object({
  recipeId: z.string().uuid('Invalid recipe ID'),
  imageIds: z
    .array(z.string().uuid('Invalid image ID'))
    .min(1, 'At least one image ID is required')
    .max(IMAGE_CONSTRAINTS.MAX_IMAGES_PER_RECIPE, 'Too many image IDs'),
});

export type ReorderRecipeImagesInput = z.infer<typeof ReorderRecipeImagesSchema>;

// =============================================================================
// Recipe Image ID Validation
// =============================================================================

/**
 * Recipe image ID schema
 */
export const RecipeImageIdSchema = z.string().uuid('Invalid recipe image ID');

// =============================================================================
// File Validation Schema (runtime validation)
// =============================================================================

/**
 * Validates file metadata before upload
 * Note: File object validation happens at runtime, not compile time
 */
export const FileMetadataSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z
    .number()
    .positive('File size must be positive')
    .max(IMAGE_CONSTRAINTS.MAX_FILE_SIZE_BYTES, 'File too large'),
  type: z.enum(IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES, {
    errorMap: () => ({
      message: `Invalid file type. Allowed: ${IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES.join(', ')}`,
    }),
  }),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

/**
 * Validates file metadata from a File object
 * Use this to validate before upload
 */
export function validateFileForUpload(file: File): FileMetadata {
  return FileMetadataSchema.parse({
    name: file.name,
    size: file.size,
    type: file.type,
  });
}
