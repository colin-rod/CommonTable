import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
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

import { enrichRecipeData } from './parsers/ai-enricher.ts';
import type { AIEnrichmentResult } from './parsers/ai-enricher.ts';
import { parseHtmlFallback } from './parsers/html-fallback.ts';
import { downloadAndUploadImage } from './parsers/image-downloader.ts';
import { parseJsonLd } from './parsers/jsonld.ts';
import { normalizeRecipeData } from './parsers/normalizer.ts';
import { RecipeImportRequestSchema, type RecipeImportResponse } from './schema.ts';

function decodeJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    // eslint-disable-next-line no-undef
    const json = atob(padded);
    const claims = JSON.parse(json) as Record<string, unknown>;
    return claims;
  } catch {
    return null;
  }
}

/**
 * Recipe Import Edge Function
 *
 * Fetches HTML from a recipe URL and parses it into CommonTable recipe format.
 * Attempts JSON-LD parsing first, falls back to HTML pattern matching.
 *
 * Usage:
 *   POST /functions/v1/recipe-import
 *   Headers:
 *     - Authorization: Bearer <token>
 *     - Content-Type: application/json
 *   Body:
 *     {
 *       "url": "https://example.com/recipe"
 *     }
 *
 * Returns:
 *   {
 *     "data": {
 *       "preview": { ... recipe data ... },
 *       "validation_errors": [ ... ],
 *       "source": { url, parsed_via, fetched_at }
 *     }
 *   }
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  try {
    // Validate authentication token exists
    const token = getAuthToken(req);
    const claims = decodeJwtClaims(token);
    console.log('recipe-import auth diagnostics (edge)', {
      tokenRef: claims?.ref ?? claims?.iss,
      tokenExp: claims?.exp,
      tokenIat: claims?.iat,
    });

    // Create Supabase client
    // Note: SUPABASE_URL is auto-injected by Supabase Edge Runtime
    // For API key, prefer the key from request headers (sent by server action)
    // Fall back to auto-injected SUPABASE_ANON_KEY (may be stale after key migrations)
    // See: https://github.com/supabase/supabase/issues/37648
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const clientApiKey = req.headers.get('apikey');
    const envApiKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseApiKey = clientApiKey || envApiKey;

    console.log('API key source:', {
      fromHeader: !!clientApiKey,
      fromEnv: !!envApiKey,
      usingHeader: !!clientApiKey,
      headerKeyPrefix: clientApiKey?.substring(0, 20),
      headerKeyLength: clientApiKey?.length,
      envKeyPrefix: envApiKey?.substring(0, 20),
      envKeyLength: envApiKey?.length,
      selectedKeyPrefix: supabaseApiKey?.substring(0, 20),
    });

    if (!supabaseUrl || !supabaseApiKey) {
      throw new EdgeFunctionError('Missing Supabase configuration', 500, 'CONFIG_ERROR');
    }

    const supabase = createClient(supabaseUrl, supabaseApiKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Get authenticated user from context (Edge Runtime populates user from JWT)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError) {
      console.error('Token validation failed:', {
        message: authError.message,
        code: authError.code,
        status: authError.status,
        supabaseUrl: supabaseUrl, // Log to verify correct instance
        hasAnonKey: !!envApiKey, // Verify environment variable is set
      });
    }

    if (authError || !user) {
      throw new UnauthorizedError(
        `Invalid or expired token: ${authError?.message || 'No user found'}`,
      );
    }

    // Validate request body
    const validated = await validateRequestBody(req, RecipeImportRequestSchema);

    // Security: Validate URL scheme and prevent SSRF
    const url = new URL(validated.url);
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
      const response = await fetch(validated.url, {
        headers: {
          'User-Agent': 'CommonTableBot/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new EdgeFunctionError(
          `Failed to fetch URL (status: ${response.status})`,
          500,
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
    let parsed_via: 'jsonld' | 'html-fallback' = 'jsonld';
    let rawData = parseJsonLd(html);

    if (!rawData) {
      console.log('JSON-LD parsing failed, trying HTML fallback');
      parsed_via = 'html-fallback';
      rawData = parseHtmlFallback(html);
    }

    // Normalize parsed data
    const normalized = normalizeRecipeData(rawData);

    // Get household_id from user context
    const { data: membership } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single();

    const householdId = membership?.household_id;

    // AI enrichment (non-blocking)
    let aiResult: AIEnrichmentResult = {
      tags: [],
      cuisine: null,
      meal_type: null,
      key_ingredients: [],
      servings: null,
      prep_time_minutes: null,
      cook_time_minutes: null,
      ingredients: [],
      steps: [],
      status: 'skipped',
    };

    if (householdId) {
      try {
        aiResult = await enrichRecipeData(normalized.preview, householdId, supabase);
      } catch (error) {
        console.error('AI enrichment failed (non-critical):', error);
        aiResult.status = 'failed';
        aiResult.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Merge AI results (prefer AI-cleaned data, fallback to parser)
    const enrichedPreview = {
      ...normalized.preview,

      // Prefer AI-cleaned data (better formatting)
      servings: aiResult.servings ?? normalized.preview.servings,
      prep_time_minutes: aiResult.prep_time_minutes ?? normalized.preview.prep_time_minutes,
      cook_time_minutes: aiResult.cook_time_minutes ?? normalized.preview.cook_time_minutes,
      ingredients:
        aiResult.ingredients.length > 0 ? aiResult.ingredients : normalized.preview.ingredients,
      steps: aiResult.steps.length > 0 ? aiResult.steps : normalized.preview.steps,

      // Prefer AI tags if parser has none
      tags: normalized.preview.tags.length > 0 ? normalized.preview.tags : aiResult.tags,

      // Always use AI metadata (parsers never populate these)
      cuisine: aiResult.cuisine ?? undefined,
      meal_type: aiResult.meal_type ?? undefined,
      key_ingredients: aiResult.key_ingredients.length > 0 ? aiResult.key_ingredients : undefined,
    };

    // Try to download and upload image (non-critical)
    let coverImageStoragePath: string | null = null;

    if (normalized.preview.image_url) {
      try {
        console.log(`Attempting to download image from: ${normalized.preview.image_url}`);
        const imageResult = await downloadAndUploadImage(
          normalized.preview.image_url,
          user.id,
          supabase,
        );
        if (imageResult) {
          coverImageStoragePath = imageResult.storage_path;
          console.log(`Successfully uploaded image to: ${coverImageStoragePath}`);
        }
      } catch (error) {
        console.error('Image download failed (non-critical):', error);
      }
    }

    // Add source metadata
    const result: RecipeImportResponse = {
      ...normalized,
      preview: {
        ...enrichedPreview,
        cover_image_storage_path: coverImageStoragePath || undefined,
      },
      source: {
        url: validated.url,
        parsed_via,
        fetched_at: new Date().toISOString(),
        ai_enrichment_status: aiResult.status,
        ai_enrichment_error: aiResult.error,
      },
    };

    console.log(`Successfully parsed recipe from ${validated.url} via ${parsed_via}`);

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
