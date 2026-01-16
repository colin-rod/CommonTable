import { z } from 'zod';

// =============================================================================
// Recipe Ingredient & Step Schemas
// =============================================================================

/**
 * Ingredient input schema
 * Validates ingredient structure for recipes
 */
export const IngredientInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Ingredient name is required')
    .max(200, 'Ingredient name must be 200 characters or less')
    .trim(),
  quantity: z.number().positive('Quantity must be positive').optional(),
  unit: z.string().max(50, 'Unit must be 50 characters or less').trim().optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').trim().optional(),
});

export type IngredientInputType = z.infer<typeof IngredientInputSchema>;

/**
 * Step input schema
 * Validates recipe step structure
 */
export const StepInputSchema = z.object({
  position: z.number().int('Position must be an integer').positive('Position must be positive'),
  text: z
    .string()
    .min(1, 'Step text is required')
    .max(2000, 'Step text must be 2000 characters or less')
    .trim(),
});

export type StepInputType = z.infer<typeof StepInputSchema>;

// =============================================================================
// Recipe Creation Schemas
// =============================================================================

/**
 * Create recipe input schema
 * Used when creating a new recipe with its initial version
 */
export const CreateRecipeInputSchema = z.object({
  household_id: z.string().uuid('Invalid household ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
    .optional(),
  ingredients_json: z.array(IngredientInputSchema).default([]),
  steps_json: z.array(StepInputSchema).default([]),
  servings: z
    .number()
    .int('Servings must be an integer')
    .positive('Servings must be positive')
    .optional(),
  prep_time_minutes: z
    .number()
    .int('Prep time must be an integer')
    .nonnegative('Prep time cannot be negative')
    .optional(),
  cook_time_minutes: z
    .number()
    .int('Cook time must be an integer')
    .nonnegative('Cook time cannot be negative')
    .optional(),
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').trim().optional(),
  user_id: z.string().uuid('Invalid user ID'),
});

export type CreateRecipeInput = z.infer<typeof CreateRecipeInputSchema>;

// =============================================================================
// Recipe Update Schemas
// =============================================================================

/**
 * Update recipe metadata schema (does NOT create new version)
 * Used for updating title, description, tags, is_favorite only
 */
export const UpdateRecipeMetadataSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
    .nullable()
    .optional(),
  tags: z
    .array(z.string().max(50, 'Tag must be 50 characters or less').trim())
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
  is_favorite: z.boolean().optional(),
});

export type UpdateRecipeMetadataInput = z.infer<typeof UpdateRecipeMetadataSchema>;

/**
 * Create new recipe version schema (creates new version)
 * Used when updating ingredients, steps, servings, or times
 */
export const CreateRecipeVersionSchema = z.object({
  ingredients_json: z.array(IngredientInputSchema),
  steps_json: z.array(StepInputSchema),
  servings: z
    .number()
    .int('Servings must be an integer')
    .positive('Servings must be positive')
    .optional(),
  prep_time_minutes: z
    .number()
    .int('Prep time must be an integer')
    .nonnegative('Prep time cannot be negative')
    .optional(),
  cook_time_minutes: z
    .number()
    .int('Cook time must be an integer')
    .nonnegative('Cook time cannot be negative')
    .optional(),
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').trim().optional(),
  user_id: z.string().uuid('Invalid user ID'),
});

export type CreateRecipeVersionInput = z.infer<typeof CreateRecipeVersionSchema>;

/**
 * Full recipe update schema (may create new version)
 * Combined schema for updating both metadata and version fields
 */
export const UpdateRecipeInputSchema = z.object({
  // Metadata fields (no version created)
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
    .nullable()
    .optional(),
  tags: z
    .array(z.string().max(50, 'Tag must be 50 characters or less').trim())
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
  is_favorite: z.boolean().optional(),

  // Version fields (creates new version if any of these change)
  ingredients_json: z.array(IngredientInputSchema).optional(),
  steps_json: z.array(StepInputSchema).optional(),
  servings: z
    .number()
    .int('Servings must be an integer')
    .positive('Servings must be positive')
    .nullable()
    .optional(),
  prep_time_minutes: z
    .number()
    .int('Prep time must be an integer')
    .nonnegative('Prep time cannot be negative')
    .nullable()
    .optional(),
  cook_time_minutes: z
    .number()
    .int('Cook time must be an integer')
    .nonnegative('Cook time cannot be negative')
    .nullable()
    .optional(),
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').trim().nullable().optional(),

  // Required for audit trail
  user_id: z.string().uuid('Invalid user ID'),
});

export type UpdateRecipeInput = z.infer<typeof UpdateRecipeInputSchema>;

// =============================================================================
// Recipe Query Schemas
// =============================================================================

/**
 * Recipe filter schema for querying recipes
 */
export const RecipeFilterSchema = z.object({
  household_id: z.string().uuid('Invalid household ID'),
  tags: z.array(z.string()).optional(),
  search_query: z
    .string()
    .max(200, 'Search query must be 200 characters or less')
    .trim()
    .optional(),
  last_cooked_after: z.date().optional(),
  last_cooked_before: z.date().optional(),
  min_rating: z.number().min(0).max(5).optional(),
  is_favorite: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type RecipeFilter = z.infer<typeof RecipeFilterSchema>;

/**
 * Recipe search schema
 */
export const RecipeSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must be 200 characters or less')
    .trim(),
  household_id: z.string().uuid('Invalid household ID'),
  limit: z.number().int().positive().max(50).default(20),
});

export type RecipeSearchInput = z.infer<typeof RecipeSearchSchema>;

// =============================================================================
// Recipe ID Validation
// =============================================================================

/**
 * Recipe ID schema
 */
export const RecipeIdSchema = z.string().uuid('Invalid recipe ID');

/**
 * Recipe version ID schema
 */
export const RecipeVersionIdSchema = z.string().uuid('Invalid recipe version ID');
