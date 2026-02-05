import { z } from 'zod';

// =============================================================================
// Recipe Metadata Enums
// =============================================================================

/**
 * Cuisine type enum (30 options)
 * Maps to database cuisine_type enum
 */
export const CuisineTypeSchema = z.enum([
  'african',
  'american',
  'asian',
  'brazilian',
  'breakfast',
  'chinese',
  'dessert',
  'french',
  'german',
  'greek',
  'hungarian',
  'indian',
  'italian',
  'japanese',
  'korean',
  'mediterranean',
  'mexican',
  'middle_eastern',
  'pastry',
  'persian',
  'peruvian',
  'salad',
  'sauce',
  'seafood',
  'spanish',
  'staple',
  'thai',
  'vegetable',
  'vietnamese',
]);

export type CuisineType = z.infer<typeof CuisineTypeSchema>;

/**
 * Meal type enum (6 options)
 * Maps to database meal_type enum
 */
export const MealTypeSchema = z.enum([
  'main_dish',
  'side_dish',
  'breakfast',
  'dessert',
  'snack',
  'beverage',
]);

export type MealType = z.infer<typeof MealTypeSchema>;

/**
 * Recipe status enum (4 lifecycle states)
 * Maps to database recipe_status enum
 */
export const RecipeStatusSchema = z.enum([
  'suggested', // New recipes or ideas (default)
  'to_buy', // Recipe is being considered for meal planning
  'to_cook', // Recipe is ready to schedule on calendar
  'cooked', // Recipe has been prepared (auto-set on cooking event)
]);

export type RecipeStatus = z.infer<typeof RecipeStatusSchema>;

/**
 * Cooking method enum (8 options)
 * Maps to database cooking_method enum
 */
export const CookingMethodSchema = z.enum([
  'quick',
  'slow_cook',
  'instant_pot',
  'bake',
  'grill',
  'stovetop',
  'air_fryer',
  'no_cook',
]);

export type CookingMethod = z.infer<typeof CookingMethodSchema>;

/**
 * Dietary category enum (10 options)
 * Maps to database dietary_category enum
 */
export const DietaryCategorySchema = z.enum([
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'keto',
  'paleo',
  'low_carb',
  'low_fat',
  'high_protein',
  'pescatarian',
]);

export type DietaryCategory = z.infer<typeof DietaryCategorySchema>;

/**
 * Dish category enum (7 options)
 * Maps to database dish_category enum
 */
export const DishCategorySchema = z.enum([
  'main',
  'side',
  'appetizer',
  'soup',
  'salad',
  'bread',
  'condiment',
]);

export type DishCategory = z.infer<typeof DishCategorySchema>;

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
  tags: z.array(z.string().min(1).max(50)).max(20, 'Maximum 20 tags allowed').default([]),

  // New metadata fields
  cuisine: CuisineTypeSchema.optional(),
  meal_type: MealTypeSchema.optional(),
  key_ingredients: z
    .array(z.string().min(1).max(50).trim())
    .max(50, 'Maximum 50 key ingredients allowed')
    .default([]),
  priority: z.number().int().min(1).max(5).optional(),
  status: RecipeStatusSchema.default('suggested'),

  // Additional metadata for queue lanes
  cooking_method: CookingMethodSchema.optional(),
  dietary_categories: z
    .array(DietaryCategorySchema)
    .max(10, 'Maximum 10 dietary categories allowed')
    .default([]),
  dish_category: DishCategorySchema.optional(),

  // Source URL for imported recipes (null for manually created)
  source_url: z.string().url('Invalid URL format').max(2000, 'URL too long').optional(),

  user_id: z.string().uuid('Invalid user ID'),
});

export type CreateRecipeInput = z.infer<typeof CreateRecipeInputSchema>;

// =============================================================================
// Recipe Update Schemas
// =============================================================================

/**
 * Update recipe metadata schema (does NOT create new version)
 * Used for updating title, description, tags, is_favorite, cuisine, meal_type, key_ingredients, priority, status
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

  // New metadata fields
  cuisine: CuisineTypeSchema.nullable().optional(),
  meal_type: MealTypeSchema.nullable().optional(),
  key_ingredients: z
    .array(z.string().min(1).max(50).trim())
    .max(50, 'Maximum 50 key ingredients allowed')
    .optional(),
  priority: z.number().int().min(1).max(5).nullable().optional(),
  status: RecipeStatusSchema.optional(),

  // NEW: Additional metadata for queue lanes
  cooking_method: CookingMethodSchema.nullable().optional(),
  dietary_categories: z
    .array(DietaryCategorySchema)
    .max(10, 'Maximum 10 dietary categories allowed')
    .optional(),
  dish_category: DishCategorySchema.nullable().optional(),
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

  // New metadata fields (do NOT create new version)
  cuisine: CuisineTypeSchema.nullable().optional(),
  meal_type: MealTypeSchema.nullable().optional(),
  key_ingredients: z
    .array(z.string().min(1).max(50).trim())
    .max(50, 'Maximum 50 key ingredients allowed')
    .optional(),
  priority: z.number().int().min(1).max(5).nullable().optional(),
  status: RecipeStatusSchema.optional(),

  // NEW: Additional metadata for queue lanes (do NOT create new version)
  cooking_method: CookingMethodSchema.nullable().optional(),
  dietary_categories: z
    .array(DietaryCategorySchema)
    .max(10, 'Maximum 10 dietary categories allowed')
    .optional(),
  dish_category: DishCategorySchema.nullable().optional(),

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

/**
 * Update recipe status schema
 * Used for updating recipe lifecycle status
 */
export const UpdateRecipeStatusSchema = z.object({
  status: RecipeStatusSchema,
});

export type UpdateRecipeStatusInput = z.infer<typeof UpdateRecipeStatusSchema>;

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

  // New metadata filters
  cuisine: CuisineTypeSchema.optional(),
  meal_type: MealTypeSchema.optional(),
  key_ingredients: z.array(z.string()).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  status: RecipeStatusSchema.optional(),

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

// =============================================================================
// Recipe Fork Schemas
// =============================================================================

/**
 * Fork recipe input schema
 * Used when forking (copying) a recipe to create a new recipe with the same content
 */
export const ForkRecipeInputSchema = z.object({
  parentRecipeId: z.string().uuid('Invalid parent recipe ID'),
  newTitle: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
});

export type ForkRecipeInput = z.infer<typeof ForkRecipeInputSchema>;
