/**
 * Complete Recipe Edit Edge Function
 *
 * Applies AI enrichment to existing recipe form values.
 * Unlike complete-recipe (which fetches from URL), this function:
 * - Takes existing recipe data from the edit form
 * - Enriches missing/incomplete fields with AI
 * - Returns enriched form values ready for user review
 *
 * Usage:
 *   POST /functions/v1/complete-recipe-edit
 *   Headers:
 *     - Authorization: Bearer <token>
 *     - Content-Type: application/json
 *   Body:
 *     {
 *       "recipe_id": "uuid",
 *       "version_id": "uuid",
 *       "form_values": {
 *         "title": "Recipe Title",
 *         "ingredients": [...],
 *         "steps": [...],
 *         ...
 *       }
 *     }
 *
 * Returns:
 *   {
 *     "data": {
 *       "enriched_values": { ... },
 *       "status": "success" | "failed" | "skipped",
 *       "error": "..." (if failed/skipped)
 *     }
 *   }
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsPreflightResponse } from '../_shared/cors.ts';
import {
  EdgeFunctionError,
  errorResponse,
  successResponse,
  UnauthorizedError,
} from '../_shared/errors.ts';
import { getAuthToken, validateRequestBody } from '../_shared/validation.ts';
import { enrichRecipeData } from '../recipe-import/parsers/ai-enricher.ts';

// =====================================================================
// TYPES & SCHEMAS
// =====================================================================

/**
 * Form ingredient structure (matches RecipeFormValues)
 */
const FormIngredientSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Form step structure (matches RecipeFormValues)
 */
const FormStepSchema = z.object({
  id: z.string().optional(),
  position: z.number().int().positive(),
  text: z.string(),
});

/**
 * Recipe form values schema (partial - only fields that can be AI-enriched)
 */
const RecipeFormValuesSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  servings: z.number().optional(),
  prep_time_minutes: z.number().optional(),
  cook_time_minutes: z.number().optional(),
  cuisine: z.string().optional().nullable(),
  meal_type: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  ingredients: z.array(FormIngredientSchema).optional(),
  steps: z.array(FormStepSchema).optional(),
  // Fields that won't be enriched by AI (passed through)
  status: z.string().optional(),
  priority: z.number().optional().nullable(),
  key_ingredients: z.array(z.string()).optional(),
});

/**
 * Request schema for complete-recipe-edit
 */
const CompleteRecipeEditRequestSchema = z.object({
  recipe_id: z.string().uuid('Invalid recipe ID'),
  version_id: z.string().uuid('Invalid version ID'),
  form_values: RecipeFormValuesSchema,
});

type CompleteRecipeEditRequest = z.infer<typeof CompleteRecipeEditRequestSchema>;

// =====================================================================
// MAIN HANDLER
// =====================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  try {
    // Validate authentication token
    const token = getAuthToken(req);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const clientApiKey = req.headers.get('apikey');
    const envApiKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseApiKey = clientApiKey || envApiKey;

    if (!supabaseUrl || !supabaseApiKey) {
      throw new EdgeFunctionError('Missing Supabase configuration', 500, 'CONFIG_ERROR');
    }

    const supabase = createClient(supabaseUrl, supabaseApiKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Validate user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new UnauthorizedError(
        `Invalid or expired token: ${authError?.message || 'No user found'}`,
      );
    }

    // Validate request body
    const validated: CompleteRecipeEditRequest = await validateRequestBody(
      req,
      CompleteRecipeEditRequestSchema,
    );

    // Get household ID from user
    const { data: household, error: householdError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single();

    if (householdError || !household) {
      throw new EdgeFunctionError('User not in household', 403, 'FORBIDDEN', { userId: user.id });
    }

    // Verify recipe belongs to user's household (RLS will handle this, but explicit check for better errors)
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, household_id')
      .eq('id', validated.recipe_id)
      .single();

    if (recipeError || !recipe) {
      throw new EdgeFunctionError('Recipe not found', 404, 'NOT_FOUND', {
        recipeId: validated.recipe_id,
      });
    }

    // Transform form values to RecipePreview format for AI enricher
    const recipePreview = {
      title: validated.form_values.title,
      description: validated.form_values.description || '',
      servings: validated.form_values.servings || null,
      prep_time_minutes: validated.form_values.prep_time_minutes || null,
      cook_time_minutes: validated.form_values.cook_time_minutes || null,
      ingredients: (validated.form_values.ingredients || []).map((i) => ({
        name: i.name,
        quantity: i.quantity || null,
        unit: i.unit || null,
        notes: i.notes || null,
      })),
      steps: (validated.form_values.steps || []).map((s) => ({
        position: s.position,
        text: s.text,
      })),
      image_url: null,
      tags: validated.form_values.tags || [],
    };

    // Call AI enricher (reuse existing infrastructure)
    const aiResult = await enrichRecipeData(recipePreview, household.household_id, supabase);

    // If AI enrichment failed or was skipped, return early
    if (aiResult.status === 'failed' || aiResult.status === 'skipped') {
      return successResponse({
        enriched_values: validated.form_values,
        status: aiResult.status,
        error: aiResult.error || 'AI enrichment was skipped or unavailable',
      });
    }

    // Transform enrichment result back to form values format
    // Preserve existing values if AI returned null/empty
    const enrichedValues = {
      ...validated.form_values,
      // AI-enriched fields (only overwrite if AI returned a value)
      description:
        (aiResult.status === 'success' && aiResult.description) ||
        validated.form_values.description,
      servings:
        (aiResult.status === 'success' && aiResult.servings) || validated.form_values.servings,
      prep_time_minutes:
        (aiResult.status === 'success' && aiResult.prep_time_minutes) ||
        validated.form_values.prep_time_minutes,
      cook_time_minutes:
        (aiResult.status === 'success' && aiResult.cook_time_minutes) ||
        validated.form_values.cook_time_minutes,
      cuisine: (aiResult.status === 'success' && aiResult.cuisine) || validated.form_values.cuisine,
      meal_type:
        (aiResult.status === 'success' && aiResult.meal_type) || validated.form_values.meal_type,
      key_ingredients:
        (aiResult.status === 'success' && aiResult.key_ingredients.length > 0
          ? aiResult.key_ingredients
          : validated.form_values.key_ingredients) || [],
      tags:
        (aiResult.status === 'success' && aiResult.tags.length > 0
          ? aiResult.tags
          : validated.form_values.tags) || [],
      ingredients:
        aiResult.status === 'success' && aiResult.ingredients.length > 0
          ? aiResult.ingredients.map((i) => ({
              // eslint-disable-next-line no-undef
              id: crypto.randomUUID(),
              name: i.name,
              quantity: i.quantity || undefined,
              unit: i.unit || undefined,
              notes: i.notes || undefined,
            }))
          : validated.form_values.ingredients,
      steps:
        aiResult.status === 'success' && aiResult.steps.length > 0
          ? aiResult.steps.map((s) => ({
              // eslint-disable-next-line no-undef
              id: crypto.randomUUID(),
              position: s.position,
              text: s.text,
            }))
          : validated.form_values.steps,
    };

    console.log(
      `Successfully enriched recipe ${validated.recipe_id} for household ${household.household_id}`,
    );

    return successResponse({
      enriched_values: enrichedValues,
      status: 'success',
    });
  } catch (error) {
    return errorResponse(error);
  }
});
