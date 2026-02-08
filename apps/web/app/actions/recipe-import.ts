'use server';

import { RecipeService, type Recipe, type CreateRecipeInput } from '@commontable/api-client';
import { AppError } from '@commontable/types';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

/**
 * Action result type for consistent error handling
 */
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Recipe import response from Edge Function
 */
export interface RecipeImportResponse {
  preview: {
    title?: string;
    description?: string;
    servings?: number;
    prep_time_minutes?: number;
    cook_time_minutes?: number;
    ingredients: Array<{
      name: string;
      quantity?: number;
      unit?: string;
      notes?: string;
    }>;
    steps: Array<{
      position: number;
      text: string;
    }>;
    image_url?: string;
    cover_image_storage_path?: string;
    tags: string[];
  };
  validation_errors: Array<{
    field: string;
    message: string;
  }>;
  source: {
    url: string;
    parsed_via: 'jsonld' | 'html-fallback';
    fetched_at: string;
  };
}

/**
 * Complete recipe response from complete-recipe Edge Function
 */
export interface CompleteRecipeResponse {
  title: string;
  description?: string;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  ingredients: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>;
  steps: Array<{
    position: number;
    text: string;
  }>;
  tags: string[];
  cuisine: string | null;
  meal_type: string | null;
  key_ingredients: string[];
}

/**
 * Format error for client consumption
 */
function formatError(error: unknown): { message: string; code?: string } {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code };
  }
  console.error('Unexpected error in recipe-import action:', error);
  return { message: 'An unexpected error occurred' };
}

function decodeJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    // parts[1] is guaranteed to exist due to length check above
    const payloadPart = parts[1];
    if (!payloadPart) {
      return null;
    }

    const payload = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const claims = JSON.parse(json) as Record<string, unknown>;
    return claims;
  } catch {
    return null;
  }
}

async function parseInvokeError(error: unknown): Promise<{
  message: string;
  status?: number;
  edgeCode?: string;
}> {
  const fallbackMessage = 'Import service request failed';

  if (!error || typeof error !== 'object') {
    return { message: fallbackMessage };
  }

  const errorWithContext = error as {
    message?: string;
    context?: {
      status?: number;
      statusText?: string;
      json?: () => Promise<unknown>;
    };
  };

  const status = errorWithContext.context?.status;
  let edgeCode: string | undefined;
  let message =
    errorWithContext.message ||
    (status
      ? `HTTP ${status}: ${errorWithContext.context?.statusText || 'Request failed'}`
      : null) ||
    fallbackMessage;

  if (typeof errorWithContext.context?.json === 'function') {
    const errorData = await errorWithContext.context.json().catch(() => null);
    if (errorData && typeof errorData === 'object') {
      const payload = errorData as { error?: string; message?: string; code?: string };
      message = payload.error || payload.message || message;
      edgeCode = payload.code;
    }
  }

  return { message, status, edgeCode };
}

/**
 * Fetch recipe preview from URL using the recipe-import Edge Function
 *
 * @param url - Recipe URL to import from
 * @returns Recipe preview data or error
 */
export async function fetchRecipePreview(url: string): Promise<ActionResult<RecipeImportResponse>> {
  try {
    const supabase = await createClient();

    // Get current user for authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: { message: 'Not authenticated', code: 'UNAUTHORIZED' },
      };
    }

    // Get auth session to extract JWT token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: { message: 'No active session', code: 'UNAUTHORIZED' },
      };
    }

    // Always use publishable key (new Supabase key system)
    // The Edge Function will use this key from the request headers
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: { message: 'Missing Supabase API key configuration', code: 'CONFIG_ERROR' },
      };
    }

    const claims = decodeJwtClaims(session.access_token);
    console.warn('recipe-import auth diagnostics (server action)', {
      hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      publishableKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20),
      apiKeyLength: apiKey?.length,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      tokenRef: claims?.ref ?? claims?.iss,
      tokenExp: claims?.exp,
      tokenIat: claims?.iat,
      tokenLength: session.access_token?.length,
    });

    // Call recipe-import Edge Function via Supabase client.
    const { data, error } = await supabase.functions.invoke('recipe-import', {
      body: { url },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: apiKey,
      },
    });

    if (error) {
      const parsedError = await parseInvokeError(error);
      const errorCode =
        parsedError.edgeCode ||
        (parsedError.status === 401 ? 'UNAUTHORIZED' : 'EDGE_FUNCTION_ERROR');

      console.error('recipe-import invoke failed', {
        status: parsedError.status,
        code: errorCode,
        message: parsedError.message,
      });

      return {
        success: false,
        error: {
          message: parsedError.message,
          code: errorCode,
        },
      };
    }

    // supabase.functions.invoke returns the function payload body.
    const result = data as { data?: RecipeImportResponse } | null;
    if (!result?.data) {
      return {
        success: false,
        error: { message: 'Invalid response from import service', code: 'INVALID_RESPONSE' },
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Create a recipe from imported data with optional image and source URL
 *
 * @param input - Recipe creation input (without user_id)
 * @param coverImageStoragePath - Optional path to image in temp storage
 * @param sourceUrl - Original URL the recipe was imported from
 * @returns Created recipe or error
 */
export async function createImportedRecipe(
  input: Omit<CreateRecipeInput, 'user_id' | 'source_url'>,
  coverImageStoragePath?: string,
  sourceUrl?: string,
): Promise<ActionResult<Recipe>> {
  try {
    const supabase = await createClient();
    const service = new RecipeService(supabase);

    // Get current user ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: { message: 'Not authenticated', code: 'UNAUTHORIZED' },
      };
    }

    // Create recipe (use auth.users.id directly)
    const recipe = await service.create({
      ...input,
      user_id: user.id,
      source_url: sourceUrl,
    });

    // If cover image provided, move from temp to permanent storage (non-critical)
    if (coverImageStoragePath) {
      try {
        await moveImageToPermanentStorage(
          coverImageStoragePath,
          recipe.id,
          recipe.household_id,
          user.id,
          supabase,
        );
      } catch (imageError) {
        // Log but don't fail recipe creation
        console.error('Image move failed (non-critical):', imageError);
      }
    }

    revalidatePath('/recipes');

    return { success: true, data: recipe };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Move image from temporary storage to permanent recipe storage
 *
 * @param tempStoragePath - Path to image in temp storage (imports/{user_id}/...)
 * @param recipeId - Recipe ID
 * @param householdId - Household ID
 * @param userId - Auth user ID (created_by) from auth.users.id
 * @param supabase - Supabase client
 */
async function moveImageToPermanentStorage(
  tempStoragePath: string,
  recipeId: string,
  householdId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  // 1. Download from temp location
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('recipe-images')
    .download(tempStoragePath);

  if (downloadError) {
    throw new Error(`Failed to download temp image: ${downloadError.message}`);
  }

  // 2. Generate permanent path
  const extension = tempStoragePath.split('.').pop() || 'jpg';
  // eslint-disable-next-line no-undef
  const permanentPath = `${householdId}/${recipeId}/${crypto.randomUUID()}.${extension}`;

  // 3. Upload to permanent location
  const { error: uploadError } = await supabase.storage
    .from('recipe-images')
    .upload(permanentPath, fileData, {
      contentType: fileData.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload to permanent storage: ${uploadError.message}`);
  }

  // 4. Create recipe_images record
  const { error: dbError } = await supabase.from('recipe_images').insert({
    recipe_id: recipeId,
    storage_path: permanentPath,
    created_by: userId,
    is_primary: true,
    alt_text: 'Imported recipe cover image',
  });

  if (dbError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from('recipe-images').remove([permanentPath]);
    throw new Error(`Failed to create image metadata record: ${dbError.message}`);
  }

  // 5. Optionally delete temp file (leaving it for manual cleanup as per plan)
  // await supabase.storage.from('recipe-images').remove([tempStoragePath]);
}

/**
 * Complete recipe with AI enrichment
 *
 * Re-fetches source URL and applies AI cleaning + metadata extraction.
 * Returns fully enriched recipe data ready for form population.
 *
 * @param sourceUrl - Original recipe URL
 * @param householdId - Household ID for fetching household tags
 * @returns Complete recipe data with AI enrichment or error
 */
export async function completeRecipePreview(
  sourceUrl: string,
  householdId: string,
): Promise<ActionResult<CompleteRecipeResponse>> {
  try {
    const supabase = await createClient();

    // Get current user for authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: { message: 'Not authenticated', code: 'UNAUTHORIZED' },
      };
    }

    // Get auth session to extract JWT token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: { message: 'No active session', code: 'UNAUTHORIZED' },
      };
    }

    // Use publishable key
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: { message: 'Missing Supabase API key configuration', code: 'CONFIG_ERROR' },
      };
    }

    // Call complete-recipe Edge Function
    const { data, error } = await supabase.functions.invoke('complete-recipe', {
      body: {
        source_url: sourceUrl,
        household_id: householdId,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: apiKey,
      },
    });

    if (error) {
      const parsedError = await parseInvokeError(error);
      const errorCode =
        parsedError.edgeCode ||
        (parsedError.status === 401 ? 'UNAUTHORIZED' : 'EDGE_FUNCTION_ERROR');

      console.error('complete-recipe invoke failed', {
        status: parsedError.status,
        code: errorCode,
        message: parsedError.message,
      });

      return {
        success: false,
        error: {
          message: parsedError.message,
          code: errorCode,
        },
      };
    }

    // Parse response
    const result = data as
      | { data: CompleteRecipeResponse; status: 'success' }
      | { data: null; status: 'failed' | 'skipped'; error?: string }
      | null;

    if (!result) {
      return {
        success: false,
        error: {
          message: 'Invalid response from complete-recipe service',
          code: 'INVALID_RESPONSE',
        },
      };
    }

    if (result.status !== 'success' || !result.data) {
      return {
        success: false,
        error: {
          message: result.error || 'AI enrichment unavailable',
          code: 'AI_ENRICHMENT_FAILED',
        },
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}
