/**
 * Schema definitions for suggest-tags-batch Edge Function
 * Validates input/output for AI-powered tag suggestions
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// =====================================================================
// INPUT SCHEMAS
// =====================================================================

/**
 * Schema for a single recipe ingredient
 */
export const IngredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().optional(),
  unit: z.string().optional(),
});

/**
 * Schema for a single recipe step
 */
export const StepSchema = z.object({
  position: z.number().int().positive(),
  text: z.string().min(1),
});

/**
 * Schema for a single recipe to process
 */
export const RecipeInputSchema = z.object({
  recipe_id: z.string().uuid('Invalid recipe_id UUID'),
  household_id: z.string().uuid('Invalid household_id UUID'),
  title: z.string().min(1).max(200),
  ingredients: z.array(IngredientSchema),
  steps: z.array(StepSchema),
  version_id: z.string().uuid('Invalid version_id UUID'),
});

/**
 * Main input schema: Batch of recipes to process
 * Maximum 20 recipes per batch to avoid timeout
 */
export const RecipeBatchInputSchema = z.object({
  recipes: z
    .array(RecipeInputSchema)
    .min(1, 'At least 1 recipe required')
    .max(20, 'Maximum 20 recipes per batch'),
});

export type RecipeBatchInput = z.infer<typeof RecipeBatchInputSchema>;
export type RecipeInput = z.infer<typeof RecipeInputSchema>;

// =====================================================================
// OPENAI SCHEMAS
// =====================================================================

/**
 * Schema for a single tag suggestion from OpenAI
 */
export const TagSuggestionSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name cannot be empty')
    .max(20, 'Tag name must be 20 characters or less')
    .transform((val) => val.toLowerCase().trim()),
  confidence: z.number().min(0, 'Confidence must be >= 0').max(1, 'Confidence must be <= 1'),
  reason: z.string().optional(),
});

/**
 * Schema for OpenAI structured output response
 * OpenAI returns exactly 3 tags per recipe
 */
export const OpenAITagResponseSchema = z.object({
  tags: z.array(TagSuggestionSchema).length(3, 'Exactly 3 tags required per recipe'),
});

export type TagSuggestion = z.infer<typeof TagSuggestionSchema>;
export type OpenAITagResponse = z.infer<typeof OpenAITagResponseSchema>;

// =====================================================================
// OUTPUT SCHEMAS
// =====================================================================

/**
 * Schema for a single tag suggestion with metadata for database insertion
 */
export const TagSuggestionWithMetadataSchema = z.object({
  name: z.string(),
  confidence: z.number(),
  household_id: z.string().uuid(),
  version_id: z.string().uuid(),
});

/**
 * Main output schema: Map of recipe_id → array of tag suggestions
 * Format: { "recipe_id": [{ name, confidence, household_id, version_id }, ...], ... }
 */
export const TagSuggestionsResponseSchema = z.record(
  z.string().uuid(), // recipe_id as key
  z.array(TagSuggestionWithMetadataSchema),
);

export type TagSuggestionWithMetadata = z.infer<typeof TagSuggestionWithMetadataSchema>;
export type TagSuggestionsResponse = z.infer<typeof TagSuggestionsResponseSchema>;
