/**
 * Edge Function: suggest-tags-batch
 *
 * Generates AI-powered tag suggestions for a batch of recipes using OpenAI GPT-4-turbo.
 *
 * Input: Array of recipes (max 20) with title, ingredients, steps
 * Output: Map of recipe_id → suggested tags with confidence scores
 *
 * Authentication: Service role key (called from database via HTTP extension)
 * Rate limit: None (controlled by pg_cron schedule)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsPreflightResponse } from '../_shared/cors.ts';
import { errorResponse, successResponse, ValidationError } from '../_shared/errors.ts';
import { validateRequestBody } from '../_shared/validation.ts';

import { generateTagSuggestions } from './openai.ts';
import { RecipeBatchInputSchema, type TagSuggestionsResponse } from './schema.ts';

// =====================================================================
// MAIN HANDLER
// =====================================================================

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  try {
    // ---------------------------------------------------------------
    // 1. VALIDATE REQUEST BODY
    // ---------------------------------------------------------------

    const validated = await validateRequestBody(req, RecipeBatchInputSchema);

    console.log(`Processing batch of ${validated.recipes.length} recipes`);

    // ---------------------------------------------------------------
    // 2. INITIALIZE SUPABASE CLIENT
    // ---------------------------------------------------------------

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new ValidationError('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ---------------------------------------------------------------
    // 3. PROCESS EACH RECIPE
    // ---------------------------------------------------------------

    const suggestions: TagSuggestionsResponse = {};
    let successCount = 0;
    let failureCount = 0;

    for (const recipe of validated.recipes) {
      try {
        console.log(`Processing recipe: ${recipe.recipe_id} - "${recipe.title}"`);

        // Fetch household tags for context
        const { data: householdTags, error: tagsError } = await supabase
          .from('tags')
          .select('name')
          .eq('household_id', recipe.household_id)
          .order('name');

        if (tagsError) {
          console.error(`Failed to fetch household tags for ${recipe.household_id}:`, tagsError);
        }

        const existingTags = householdTags?.map((tag) => tag.name) || [];

        console.log(`Found ${existingTags.length} existing household tags`);

        // Generate tag suggestions via OpenAI
        const aiSuggestions = await generateTagSuggestions(
          recipe.title,
          recipe.ingredients,
          recipe.steps,
          existingTags,
        );

        console.log(
          `Generated ${aiSuggestions.length} tags: ${aiSuggestions.map((t) => t.name).join(', ')}`,
        );

        // Format response (include household_id and version_id for database insertion)
        suggestions[recipe.recipe_id] = aiSuggestions.map((tag) => ({
          name: tag.name,
          confidence: tag.confidence,
          household_id: recipe.household_id,
          version_id: recipe.version_id,
        }));

        successCount++;
      } catch (error) {
        // Log individual recipe failures but continue processing batch
        console.error(`Failed to generate tags for recipe ${recipe.recipe_id}:`, error);

        // Return empty array for failed recipes (database will skip them)
        suggestions[recipe.recipe_id] = [];
        failureCount++;
      }
    }

    // ---------------------------------------------------------------
    // 4. RETURN SUGGESTIONS
    // ---------------------------------------------------------------

    console.log(`Batch processing complete: ${successCount} succeeded, ${failureCount} failed`);

    return successResponse(suggestions);
  } catch (error) {
    return errorResponse(error);
  }
});
