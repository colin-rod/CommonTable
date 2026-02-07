import type { Recipe, RecipeId, HouseholdId, UserId, RecipeVersionId } from '@commontable/types';

/**
 * Create a mock Recipe object with all required fields for testing
 */
export function createMockRecipe(overrides?: Partial<Recipe>): Recipe {
  const now = new Date();
  return {
    id: 'recipe-1' as RecipeId,
    household_id: 'household-1' as HouseholdId,
    title: 'Test Recipe',
    description: null,
    current_version_id: 'version-1' as RecipeVersionId,
    rolling_score: null,
    tags: [],
    is_favorite: false,
    last_cooked_at: null,
    created_by: 'user-1' as UserId,
    created_at: now,
    updated_at: now,
    cuisine: null,
    meal_type: null,
    key_ingredients: [],
    priority: null,
    status: 'suggested',
    source_url: null,
    ...overrides,
  };
}
