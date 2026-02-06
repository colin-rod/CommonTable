import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

/**
 * Request schema for recipe-import
 */
export const RecipeImportRequestSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .max(2000, 'URL too long')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'Only HTTP and HTTPS protocols are allowed',
    ),
});

export type RecipeImportRequest = z.infer<typeof RecipeImportRequestSchema>;

/**
 * Ingredient schema for preview
 */
export const IngredientPreviewSchema = z.object({
  name: z.string(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export type IngredientPreview = z.infer<typeof IngredientPreviewSchema>;

/**
 * Step schema for preview
 */
export const StepPreviewSchema = z.object({
  position: z.number().int().positive(),
  text: z.string(),
});

export type StepPreview = z.infer<typeof StepPreviewSchema>;

/**
 * Validation error schema
 */
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

/**
 * Recipe preview schema (partial data, may have validation errors)
 */
export const RecipePreviewSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  servings: z.number().int().positive().optional(),
  prep_time_minutes: z.number().int().nonnegative().optional(),
  cook_time_minutes: z.number().int().nonnegative().optional(),
  ingredients: z.array(IngredientPreviewSchema).default([]),
  steps: z.array(StepPreviewSchema).default([]),
  image_url: z.string().url().optional(),
  cover_image_storage_path: z.string().optional(), // Path to image in Supabase Storage
  tags: z.array(z.string()).default([]),
  // NEW: AI-enriched fields
  cuisine: z.string().optional(), // Will be validated as CuisineType in recipe creation
  meal_type: z.string().optional(), // Will be validated as MealType in recipe creation
  key_ingredients: z.array(z.string()).optional(),
});

export type RecipePreview = z.infer<typeof RecipePreviewSchema>;

/**
 * Source metadata schema
 */
export const SourceMetadataSchema = z.object({
  url: z.string().url(),
  parsed_via: z.enum(['jsonld', 'html-fallback']),
  fetched_at: z.string().datetime(),
  // NEW: AI enrichment metadata
  ai_enrichment_status: z.enum(['success', 'failed', 'skipped']).optional(),
  ai_enrichment_error: z.string().optional(),
});

export type SourceMetadata = z.infer<typeof SourceMetadataSchema>;

/**
 * Response schema for recipe-import
 */
export const RecipeImportResponseSchema = z.object({
  preview: RecipePreviewSchema,
  validation_errors: z.array(ValidationErrorSchema).default([]),
  source: SourceMetadataSchema,
});

export type RecipeImportResponse = z.infer<typeof RecipeImportResponseSchema>;
