'use server';

import {
  RecipeSuggestionService,
  type RecipeSuggestion,
  type SuggestionContext,
  type SuggestionWeights,
  type HouseholdId,
} from '@commontable/api-client';
import { AppError } from '@commontable/types';

import { createClient } from '@/lib/supabase/server';

/**
 * Action result type for consistent error handling
 */
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Format error for client consumption
 */
function formatError(error: unknown): { message: string; code?: string } {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code };
  }
  console.error('Unexpected error in recipe suggestion action:', error);
  return { message: 'An unexpected error occurred' };
}

/**
 * Get recipe suggestions for a household based on context
 *
 * @param context - Suggestion context (meal slot, date)
 * @param weights - Optional custom weights (defaults to DEFAULT_WEIGHTS)
 * @param limit - Number of suggestions to return (default 5)
 * @returns Suggestions or error
 */
export async function getRecipeSuggestions(
  context: SuggestionContext,
  weights?: Partial<SuggestionWeights>,
  limit?: number,
): Promise<ActionResult<RecipeSuggestion[]>> {
  try {
    const supabase = await createClient();
    const service = new RecipeSuggestionService(supabase);

    // Get current user's household ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } };
    }

    // Get user's profile and household
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: { message: 'Profile not found', code: 'PROFILE_NOT_FOUND' } };
    }

    // Get user's household membership
    const { data: membership } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', profile.id)
      .single();

    if (!membership) {
      return {
        success: false,
        error: { message: 'No household found', code: 'NO_HOUSEHOLD' },
      };
    }

    const suggestions = await service.getSuggestions(
      membership.household_id as HouseholdId,
      context,
      weights,
      limit,
    );

    return { success: true, data: suggestions };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}
