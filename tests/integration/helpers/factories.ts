import { randomUUID } from 'crypto';

/**
 * Test data factories
 *
 * Provides factory functions to generate test data for integration tests.
 * All factories return objects with predictable structure for testing.
 */

/**
 * Create test household data
 */
export function createTestHousehold(
  overrides?: Partial<{
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
  }>,
) {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    name: 'Test Household',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Create test profile data
 */
export function createTestProfile(
  overrides?: Partial<{
    id: string;
    display_name: string;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  }>,
) {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    display_name: 'Test User',
    avatar_url: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Create test household member data
 */
export function createTestHouseholdMember(
  overrides?: Partial<{
    household_id: string;
    user_id: string;
    role: 'admin' | 'member';
    joined_at: string;
  }>,
) {
  return {
    household_id: randomUUID(),
    user_id: randomUUID(),
    role: 'admin' as const,
    joined_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create test recipe data
 */
export function createTestRecipe(
  overrides?: Partial<{
    id: string;
    household_id: string;
    title: string;
    current_version_id: string;
    source_url: string | null;
    tags: string[];
    last_cooked_at: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>,
) {
  const now = new Date().toISOString();
  const id = randomUUID();
  const versionId = randomUUID();

  return {
    id,
    household_id: randomUUID(),
    title: 'Test Recipe',
    current_version_id: versionId,
    source_url: null,
    tags: [],
    last_cooked_at: null,
    created_by: randomUUID(),
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Create test recipe version data
 */
export function createTestRecipeVersion(
  overrides?: Partial<{
    id: string;
    recipe_id: string;
    version_number: number;
    ingredients_json: unknown;
    steps_json: unknown;
    servings: number | null;
    prep_time_minutes: number | null;
    cook_time_minutes: number | null;
    notes: string | null;
    created_by: string;
    created_at: string;
  }>,
) {
  return {
    id: randomUUID(),
    recipe_id: randomUUID(),
    version_number: 1,
    ingredients_json: [{ name: 'Salt', quantity: 1, unit: 'tsp' }],
    steps_json: [{ position: 1, text: 'Add salt' }],
    servings: 4,
    prep_time_minutes: null,
    cook_time_minutes: null,
    notes: null,
    created_by: randomUUID(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create test calendar entry data
 */
export function createTestCalendarEntry(
  overrides?: Partial<{
    id: string;
    household_id: string;
    recipe_id: string | null;
    planned_date: string;
    meal_slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
    notes: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>,
) {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    household_id: randomUUID(),
    recipe_id: randomUUID(),
    planned_date: new Date().toISOString().split('T')[0],
    meal_slot: 'dinner' as const,
    status: 'planned' as const,
    notes: null,
    created_by: randomUUID(),
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Create test meal request data
 */
export function createTestMealRequest(
  overrides?: Partial<{
    id: string;
    household_id: string;
    recipe_id: string | null;
    requested_by: string;
    requested_date: string;
    requested_meal_slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    notes: string | null;
    status: 'open' | 'planned' | 'dismissed';
    priority: number;
    created_at: string;
    updated_at: string;
  }>,
) {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    household_id: randomUUID(),
    recipe_id: null,
    requested_by: randomUUID(),
    requested_date: new Date().toISOString().split('T')[0],
    requested_meal_slot: 'dinner' as const,
    notes: null,
    status: 'open' as const,
    priority: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Create test cooking event data
 */
export function createTestCookingEvent(
  overrides?: Partial<{
    id: string;
    recipe_id: string;
    household_id: string;
    cooked_by: string;
    cooked_at: string;
    servings: number | null;
    rating: number | null;
    notes: string | null;
    created_at: string;
  }>,
) {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    recipe_id: randomUUID(),
    household_id: randomUUID(),
    cooked_by: randomUUID(),
    cooked_at: now,
    servings: null,
    rating: null,
    notes: null,
    created_at: now,
    ...overrides,
  };
}

/**
 * Create complete test user with household
 * Returns data for user, household, and household membership
 */
export function createTestUserWithHousehold() {
  const userId = randomUUID();
  const householdId = randomUUID();

  return {
    user: createTestProfile({ id: userId }),
    household: createTestHousehold({ id: householdId }),
    membership: createTestHouseholdMember({
      household_id: householdId,
      user_id: userId,
      role: 'admin',
    }),
  };
}

/**
 * Create complete test recipe with version
 * Returns data for recipe and initial version
 */
export function createTestRecipeWithVersion(householdId: string, userId: string) {
  const recipeId = randomUUID();
  const versionId = randomUUID();

  return {
    recipe: createTestRecipe({
      id: recipeId,
      household_id: householdId,
      current_version_id: versionId,
      created_by: userId,
    }),
    version: createTestRecipeVersion({
      id: versionId,
      recipe_id: recipeId,
      version_number: 1,
      created_by: userId,
    }),
  };
}

/**
 * Create test user credentials
 */
export function createTestCredentials(
  overrides?: Partial<{
    email: string;
    password: string;
    display_name: string;
  }>,
) {
  const timestamp = Date.now();

  return {
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123!',
    display_name: 'Test User',
    ...overrides,
  };
}
