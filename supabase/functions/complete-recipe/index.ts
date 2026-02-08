import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsPreflightResponse } from '../_shared/cors.ts';
import {
  EdgeFunctionError,
  errorResponse,
  successResponse,
  UnauthorizedError,
  ValidationError,
} from '../_shared/errors.ts';
import { getAuthToken, validateRequestBody } from '../_shared/validation.ts';
import { enrichRecipeData } from '../recipe-import/parsers/ai-enricher.ts';
import { parseHtmlFallback } from '../recipe-import/parsers/html-fallback.ts';
import { parseJsonLd } from '../recipe-import/parsers/jsonld.ts';
import { normalizeRecipeData } from '../recipe-import/parsers/normalizer.ts';

/**
 * Request schema for complete-recipe
 */
const CompleteRecipeRequestSchema = z.object({
  source_url: z
    .string()
    .url('Must be a valid URL')
    .max(2000, 'URL too long')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'Only HTTP and HTTPS protocols are allowed',
    ),
  household_id: z.string().uuid('Invalid household ID'),
});

type CompleteRecipeRequest = z.infer<typeof CompleteRecipeRequestSchema>;

/**
 * Complete Recipe Edge Function
 *
 * Re-fetches HTML from source URL and applies AI enrichment to clean and enrich recipe data.
 * Returns fully completed recipe data ready for form population.
 *
 * Usage:
 *   POST /functions/v1/complete-recipe
 *   Headers:
 *     - Authorization: Bearer <token>
 *     - Content-Type: application/json
 *   Body:
 *     {
 *       "source_url": "https://example.com/recipe",
 *       "household_id": "uuid"
 *     }
 *
 * Returns:
 *   {
 *     "data": {
 *       "title": "Recipe Title",
 *       "description": "...",
 *       "servings": 4,
 *       "prep_time_minutes": 15,
 *       "cook_time_minutes": 30,
 *       "ingredients": [...],
 *       "steps": [...],
 *       "tags": [...],
 *       "cuisine": "italian",
 *       "meal_type": "main_dish",
 *       "key_ingredients": [...]
 *     },
 *     "status": "success" | "failed",
 *     "error": "..." (if failed)
 *   }
 */
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
    const validated: CompleteRecipeRequest = await validateRequestBody(
      req,
      CompleteRecipeRequestSchema,
    );

    // Security: Validate URL scheme and prevent SSRF
    const url = new URL(validated.source_url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new ValidationError('Only HTTP and HTTPS protocols are allowed');
    }

    // Prevent SSRF attacks - reject internal/private IPs
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    ) {
      throw new ValidationError('Cannot fetch from localhost or private IP addresses');
    }

    // Fetch HTML from URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let html: string;
    try {
      const response = await fetch(validated.source_url, {
        headers: {
          'User-Agent': 'CommonTableBot/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new EdgeFunctionError(
          `Failed to fetch URL (status: ${response.status})`,
          response.status,
          'FETCH_ERROR',
          { status: response.status },
        );
      }

      // Check Content-Type
      const contentType = response.headers.get('Content-Type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new ValidationError('URL must return HTML content', {
          contentType,
        });
      }

      // Limit response size to 1MB
      const text = await response.text();
      if (text.length > 1024 * 1024) {
        throw new EdgeFunctionError('Response too large (max 1MB)', 413, 'PAYLOAD_TOO_LARGE');
      }

      html = text;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof EdgeFunctionError || error instanceof ValidationError) {
        throw error;
      }

      // Network error or timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new EdgeFunctionError('Request timed out after 10 seconds', 504, 'TIMEOUT');
      }

      throw new EdgeFunctionError('Failed to fetch URL', 500, 'FETCH_ERROR', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Parse HTML - try JSON-LD first, fall back to HTML patterns
    let rawData = parseJsonLd(html);

    if (!rawData) {
      console.log('JSON-LD parsing failed, trying HTML fallback');
      rawData = parseHtmlFallback(html);
    }

    // Normalize parsed data
    const normalized = normalizeRecipeData(rawData);

    // AI enrichment (required for this function)
    const aiResult = await enrichRecipeData(normalized.preview, validated.household_id, supabase);

    if (aiResult.status === 'failed' || aiResult.status === 'skipped') {
      return successResponse({
        data: null,
        status: aiResult.status,
        error: aiResult.error || 'AI enrichment was skipped or unavailable',
      });
    }

    // Return complete enriched data
    const completeData = {
      // Use AI-cleaned core fields (prefer AI over parser)
      title: normalized.preview.title || 'Untitled Recipe',
      description: normalized.preview.description,
      servings: aiResult.servings ?? normalized.preview.servings,
      prep_time_minutes: aiResult.prep_time_minutes ?? normalized.preview.prep_time_minutes,
      cook_time_minutes: aiResult.cook_time_minutes ?? normalized.preview.cook_time_minutes,
      ingredients:
        aiResult.ingredients.length > 0 ? aiResult.ingredients : normalized.preview.ingredients,
      steps: aiResult.steps.length > 0 ? aiResult.steps : normalized.preview.steps,

      // AI-enriched metadata
      tags: aiResult.tags,
      cuisine: aiResult.cuisine,
      meal_type: aiResult.meal_type,
      key_ingredients: aiResult.key_ingredients,
    };

    console.log(`Successfully completed recipe from ${validated.source_url} with AI enrichment`);

    return successResponse({
      data: completeData,
      status: 'success',
    });
  } catch (error) {
    return errorResponse(error);
  }
});
