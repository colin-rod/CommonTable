/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ValidationError,
  NotFoundError,
  AppError,
  type RecipeId,
  type HouseholdId,
  type RecipeVersionId,
  type UserId,
  type Recipe,
  type RecipeVersion,
  type RecipeSearchResult,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { RecipeService } from './RecipeService';

/**
 * Mock types for Supabase responses in tests
 */
interface MockRecipe {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  current_version_id: string | null;
  rolling_score: number | null;
  tags: string[];
  is_favorite: boolean;
  last_cooked_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MockRecipeVersion {
  id: string;
  recipe_id: string;
  version_number: number;
  ingredients_json: Array<{ name: string; quantity?: number; unit?: string; notes?: string }>;
  steps_json: Array<{ position: number; text: string }>;
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  textSearch: ReturnType<typeof vi.fn>;
}

/**
 * Helper to create a mock query builder chain
 */
function createMockQueryBuilder<T>(resolvedValue?: {
  data: T | null;
  error: unknown;
}): MockQueryBuilder {
  const defaultValue = resolvedValue ?? { data: null, error: null };

  const builder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(defaultValue),
    maybeSingle: vi.fn().mockResolvedValue(defaultValue),
    limit: vi.fn().mockResolvedValue(defaultValue),
    textSearch: vi.fn().mockReturnThis(),
  };

  return builder;
}

/**
 * Create a mock Supabase client
 */
function createMockSupabaseClient(): SupabaseClient {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
  } as unknown as SupabaseClient;
}

// Mock Supabase client
const mockSupabase = createMockSupabaseClient();

describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(() => {
    service = new RecipeService(mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // =============================================================================
  // create
  // =============================================================================

  describe('create', () => {
    // Valid UUIDs for testing
    const validHouseholdId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const validUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const validRecipeId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
    const validVersionId = 'd4e5f6a7-b8c9-0123-def1-234567890123';

    it('should create recipe with initial version using database function', async () => {
      const input = {
        household_id: validHouseholdId,
        title: 'Pasta Carbonara',
        description: 'Classic Italian pasta',
        ingredients_json: [
          { name: 'pasta', quantity: 400, unit: 'g' },
          { name: 'eggs', quantity: 4 },
        ],
        steps_json: [
          { position: 1, text: 'Boil pasta' },
          { position: 2, text: 'Mix eggs with cheese' },
        ],
        servings: 4,
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        notes: 'Use guanciale if available',
        tags: [],
        user_id: validUserId,
        // New metadata fields (required)
        status: 'suggested' as const,
        key_ingredients: [],
      };

      const mockRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: input.household_id,
        title: input.title,
        description: input.description,
        current_version_id: validVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: input.user_id,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock RPC call to create_recipe_with_version
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: validRecipeId,
        error: null,
      } as any);

      // Mock fetching the created recipe
      const recipeBuilder = createMockQueryBuilder({ data: mockRecipe, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      const result = await service.create(input);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_recipe_with_version', {
        p_household_id: input.household_id,
        p_title: input.title,
        p_description: input.description,
        p_ingredients_json: input.ingredients_json,
        p_steps_json: input.steps_json,
        p_servings: input.servings,
        p_prep_time_minutes: input.prep_time_minutes,
        p_cook_time_minutes: input.cook_time_minutes,
        p_notes: input.notes,
        p_user_id: input.user_id,
        // New metadata fields (defaults when not provided)
        p_cuisine: null,
        p_meal_type: null,
        p_key_ingredients: [],
        p_priority: null,
        p_status: 'suggested',
      });

      expect(result.id).toBe(validRecipeId);
      expect(result.title).toBe(input.title);
    });

    it('should throw ValidationError for missing title', async () => {
      const input = {
        household_id: 'household-123',
        title: '', // Empty title
        user_id: 'user-123',
      };

      await expect(service.create(input as any)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for title exceeding max length', async () => {
      const input = {
        household_id: 'household-123',
        title: 'A'.repeat(201), // 201 characters, exceeds 200
        user_id: 'user-123',
      };

      await expect(service.create(input as any)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid household_id', async () => {
      const input = {
        household_id: 'not-a-uuid',
        title: 'Valid Title',
        user_id: 'user-123',
      };

      await expect(service.create(input as any)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for negative servings', async () => {
      const input = {
        household_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Valid Title',
        servings: -1,
        user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      await expect(service.create(input as any)).rejects.toThrow(ValidationError);
    });

    it('should handle database error gracefully', async () => {
      const input = {
        household_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Valid Title',
        tags: [],
        ingredients_json: [],
        steps_json: [],
        user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        // New metadata fields (required)
        status: 'suggested' as const,
        key_ingredients: [],
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      } as any);

      await expect(service.create(input)).rejects.toThrow(AppError);
    });

    it('should use default empty arrays for ingredients and steps when not provided', async () => {
      const input = {
        household_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Simple Recipe',
        tags: [],
        ingredients_json: [],
        steps_json: [],
        user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        // New metadata fields (required)
        status: 'suggested' as const,
        key_ingredients: [],
      };

      const mockRecipeId = 'recipe-new-123';

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockRecipeId,
        error: null,
      } as any);

      const recipeBuilder = createMockQueryBuilder({
        data: { id: mockRecipeId, title: input.title },
        error: null,
      });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      await service.create(input);

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_recipe_with_version',
        expect.objectContaining({
          p_ingredients_json: [],
          p_steps_json: [],
        }),
      );
    });
  });

  // =============================================================================
  // getById
  // =============================================================================

  describe('getById', () => {
    it('should return recipe when found', async () => {
      const recipeId = 'recipe-123' as RecipeId;
      const mockRecipe: MockRecipe = {
        id: recipeId,
        household_id: 'household-123',
        title: 'Test Recipe',
        description: 'A test recipe',
        current_version_id: 'version-1',
        rolling_score: 4.5,
        tags: ['italian', 'pasta'],
        is_favorite: false,
        last_cooked_at: '2024-01-15T00:00:00Z',
        created_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      };

      const recipeBuilder = createMockQueryBuilder({ data: mockRecipe, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      const result = await service.getById(recipeId);

      expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
      expect(recipeBuilder.select).toHaveBeenCalledWith('*');
      expect(recipeBuilder.eq).toHaveBeenCalledWith('id', recipeId);
      expect(result.id).toBe(recipeId);
      expect(result.title).toBe('Test Recipe');
    });

    it('should throw NotFoundError when recipe does not exist', async () => {
      const recipeId = 'nonexistent-recipe' as RecipeId;

      const recipeBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      await expect(service.getById(recipeId)).rejects.toThrow(NotFoundError);
    });

    it('should throw AppError when database query fails', async () => {
      const recipeId = 'recipe-123' as RecipeId;

      const recipeBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Database error' },
      });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      await expect(service.getById(recipeId)).rejects.toThrow(AppError);
    });
  });

  // =============================================================================
  // getByHousehold
  // =============================================================================

  describe('getByHousehold', () => {
    it('should return all recipes for a household', async () => {
      const householdId = 'household-123' as HouseholdId;
      const mockRecipes: MockRecipe[] = [
        {
          id: 'recipe-1',
          household_id: householdId,
          title: 'Recipe 1',
          description: null,
          current_version_id: 'version-1',
          rolling_score: null,
          tags: [],
          is_favorite: false,
          last_cooked_at: null,
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'recipe-2',
          household_id: householdId,
          title: 'Recipe 2',
          description: 'Description',
          current_version_id: 'version-2',
          rolling_score: 4.0,
          tags: ['quick'],
          is_favorite: false,
          last_cooked_at: '2024-01-10T00:00:00Z',
          created_by: 'user-123',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-10T00:00:00Z',
        },
      ];

      const recipeBuilder = createMockQueryBuilder({ data: mockRecipes, error: null });
      // Override order to return the resolved value since we're chaining
      recipeBuilder.order = vi.fn().mockResolvedValue({ data: mockRecipes, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      const result = await service.getByHousehold(householdId);

      expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
      expect(recipeBuilder.eq).toHaveBeenCalledWith('household_id', householdId);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no recipes exist', async () => {
      const householdId = 'household-empty' as HouseholdId;

      const recipeBuilder = createMockQueryBuilder({ data: [], error: null });
      recipeBuilder.order = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      const result = await service.getByHousehold(householdId);

      expect(result).toEqual([]);
    });

    it('should order recipes by updated_at descending', async () => {
      const householdId = 'household-123' as HouseholdId;

      const recipeBuilder = createMockQueryBuilder({ data: [], error: null });
      recipeBuilder.order = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      await service.getByHousehold(householdId);

      expect(recipeBuilder.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });
  });

  // =============================================================================
  // update
  // =============================================================================

  describe('update', () => {
    // Valid UUIDs for testing
    const validRecipeId = 'c3d4e5f6-a7b8-9012-cdef-123456789012' as RecipeId;
    const validHouseholdId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const validUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const validVersionId = 'd4e5f6a7-b8c9-0123-def1-234567890123';

    it('should create new version when updating ingredients', async () => {
      const input = {
        title: 'Updated Title',
        description: 'Updated description',
        ingredients_json: [{ name: 'new ingredient', quantity: 1, unit: 'cup' }],
        steps_json: [{ position: 1, text: 'New step' }],
        servings: 6,
        user_id: validUserId,
      };

      const mockVersionId = 'e5f6a7b8-c9d0-1234-ef12-345678901234';

      // First call: getById to check recipe exists
      const existingRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Original Title',
        description: 'Original description',
        current_version_id: validVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock RPC call to update_recipe_create_version
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockVersionId,
        error: null,
      } as any);

      // Mock fetching the recipe (for getById calls)
      const mockUpdatedRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: input.title,
        description: input.description,
        current_version_id: mockVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      const existingBuilder = createMockQueryBuilder({ data: existingRecipe, error: null });
      const updatedBuilder = createMockQueryBuilder({ data: mockUpdatedRecipe, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(existingBuilder as any) // getById (check exists)
        .mockReturnValueOnce(updatedBuilder as any); // getById (return updated)

      const result = await service.update(validRecipeId, input);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_recipe_create_version', {
        p_recipe_id: validRecipeId,
        p_title: input.title,
        p_description: input.description,
        p_ingredients_json: input.ingredients_json,
        p_steps_json: input.steps_json,
        p_servings: input.servings,
        p_prep_time_minutes: 0,
        p_cook_time_minutes: 0,
        p_notes: '',
        p_user_id: input.user_id,
      });

      expect(result.current_version_id).toBe(mockVersionId);
    });

    it('should update metadata only when no version fields are provided', async () => {
      const input = {
        title: 'New Title Only',
        tags: ['new-tag'],
        user_id: validUserId,
      };

      const existingRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Original Title',
        description: null,
        current_version_id: validVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockUpdatedRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: input.title,
        description: null,
        current_version_id: validVersionId, // Same version
        rolling_score: null,
        tags: input.tags,
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      const existingBuilder = createMockQueryBuilder({ data: existingRecipe, error: null });
      const updateBuilder = createMockQueryBuilder({ data: null, error: null });
      const updatedBuilder = createMockQueryBuilder({ data: mockUpdatedRecipe, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(existingBuilder as any) // getById (check exists)
        .mockReturnValueOnce(updateBuilder as any) // update call
        .mockReturnValueOnce(updatedBuilder as any); // getById (return updated)

      const result = await service.update(validRecipeId, input);

      // Should NOT call rpc for version creation
      expect(mockSupabase.rpc).not.toHaveBeenCalled();

      // Should update via direct query
      expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
      expect(result.title).toBe(input.title);
    });

    it('should throw ValidationError for invalid input', async () => {
      const input = {
        title: '', // Empty title is invalid
        user_id: validUserId,
      };

      await expect(service.update(validRecipeId, input)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when recipe does not exist', async () => {
      const recipeId = 'nonexistent' as RecipeId;
      const input = {
        title: 'New Title',
        user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      // Mock the fetch to return nothing
      const recipeBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      await expect(service.update(recipeId, input)).rejects.toThrow(NotFoundError);
    });
  });

  // =============================================================================
  // delete
  // =============================================================================

  describe('delete', () => {
    it('should delete recipe successfully', async () => {
      const recipeId = 'recipe-123' as RecipeId;

      // Mock checking recipe exists
      const checkBuilder = createMockQueryBuilder({
        data: { id: recipeId },
        error: null,
      });

      // Mock delete operation
      const deleteBuilder = createMockQueryBuilder({ data: null, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(checkBuilder as any) // Check exists
        .mockReturnValueOnce(deleteBuilder as any); // Delete

      await service.delete(recipeId);

      expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
      expect(deleteBuilder.delete).toHaveBeenCalled();
      expect(deleteBuilder.eq).toHaveBeenCalledWith('id', recipeId);
    });

    it('should throw NotFoundError when recipe does not exist', async () => {
      const recipeId = 'nonexistent' as RecipeId;

      const checkBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(checkBuilder as any);

      await expect(service.delete(recipeId)).rejects.toThrow(NotFoundError);
    });

    it('should handle database error gracefully', async () => {
      const recipeId = 'recipe-123' as RecipeId;

      // Mock check succeeds
      const checkBuilder = createMockQueryBuilder({
        data: { id: recipeId },
        error: null,
      });

      // Mock delete fails - chain returns error at the end
      const deleteBuilder: MockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } }),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } }),
        textSearch: vi.fn().mockReturnThis(),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(checkBuilder as any)
        .mockReturnValueOnce(deleteBuilder as any);

      await expect(service.delete(recipeId)).rejects.toThrow(AppError);
    });
  });

  // =============================================================================
  // search
  // =============================================================================

  describe('search', () => {
    // Valid UUIDs for testing
    const validHouseholdId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as HouseholdId;
    const validRecipeId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
    const validVersionId = 'd4e5f6a7-b8c9-0123-def1-234567890123';
    const validUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

    it('should search recipes by query', async () => {
      const query = 'pasta';

      const mockResults = [
        {
          id: validRecipeId,
          household_id: validHouseholdId,
          title: 'Pasta Carbonara',
          description: 'Italian pasta dish',
          current_version_id: validVersionId,
          rolling_score: 4.5,
          tags: ['italian'],
          is_favorite: false,
          last_cooked_at: null,
          created_by: validUserId,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // Mock RPC call to search function
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockResults,
        error: null,
      } as any);

      const result = await service.search(query, validHouseholdId);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_recipes', {
        p_query: query,
        p_household_id: validHouseholdId,
        p_limit: 20,
      });

      expect(result).toHaveLength(1);
      expect(result[0]!.title).toContain('Pasta');
    });

    it('should return empty array when no matches found', async () => {
      const query = 'nonexistent dish xyz';

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.search(query, validHouseholdId);

      expect(result).toEqual([]);
    });

    it('should throw ValidationError for empty query', async () => {
      const query = '';

      await expect(service.search(query, validHouseholdId)).rejects.toThrow(ValidationError);
    });

    it('should respect limit parameter', async () => {
      const query = 'recipe';
      const limit = 5;

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      await service.search(query, validHouseholdId, limit);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_recipes', {
        p_query: query,
        p_household_id: validHouseholdId,
        p_limit: limit,
      });
    });

    // =============================================================================
    // Tag Search Tests (Issue 4.2)
    // =============================================================================

    describe('tag search', () => {
      it('should find recipes by tag name', async () => {
        const query = 'italian';

        const mockResults = [
          {
            id: validRecipeId,
            household_id: validHouseholdId,
            title: 'Pasta Carbonara',
            description: 'Classic pasta',
            current_version_id: validVersionId,
            rolling_score: null,
            tags: ['italian', 'dinner'],
            is_favorite: false,
            last_cooked_at: null,
            created_by: validUserId,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockResults,
          error: null,
        } as any);

        const result = await service.search(query, validHouseholdId);

        expect(result).toHaveLength(1);
        expect(result[0]!.tags).toContain('italian');
        expect(result[0]!.title).toBe('Pasta Carbonara');
      });

      it('should find recipes with multi-word tags', async () => {
        const query = 'quick weeknight';

        const mockResults = [
          {
            id: validRecipeId,
            household_id: validHouseholdId,
            title: 'Simple Stir Fry',
            description: 'Fast dinner',
            current_version_id: validVersionId,
            rolling_score: null,
            tags: ['quick weeknight', 'asian'],
            is_favorite: false,
            last_cooked_at: null,
            created_by: validUserId,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockResults,
          error: null,
        } as any);

        const result = await service.search(query, validHouseholdId);

        expect(result).toHaveLength(1);
        expect(result[0]!.tags).toContain('quick weeknight');
      });

      it('should search tags case-insensitively', async () => {
        const query = 'ITALIAN';

        const mockResults = [
          {
            id: validRecipeId,
            household_id: validHouseholdId,
            title: 'Margherita Pizza',
            description: 'Classic pizza',
            current_version_id: validVersionId,
            rolling_score: null,
            tags: ['italian', 'vegetarian'],
            is_favorite: false,
            last_cooked_at: null,
            created_by: validUserId,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockResults,
          error: null,
        } as any);

        const result = await service.search(query, validHouseholdId);

        expect(result).toHaveLength(1);
        expect(result[0]!.tags).toContain('italian');
      });

      it('should combine title and tag search', async () => {
        const query = 'pasta italian';

        const mockResults = [
          {
            id: validRecipeId,
            household_id: validHouseholdId,
            title: 'Pasta Carbonara',
            description: 'Classic Italian pasta',
            current_version_id: validVersionId,
            rolling_score: null,
            tags: ['italian', 'dinner'],
            is_favorite: false,
            last_cooked_at: null,
            created_by: validUserId,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockResults,
          error: null,
        } as any);

        const result = await service.search(query, validHouseholdId);

        expect(result).toHaveLength(1);
        expect(result[0]!.title).toContain('Pasta');
        expect(result[0]!.tags).toContain('italian');
      });

      it('should return empty array when searching for tag with no matches', async () => {
        const query = 'nonexistent-tag';

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: [],
          error: null,
        } as any);

        const result = await service.search(query, validHouseholdId);

        expect(result).toEqual([]);
      });

      it('should find multiple recipes sharing the same tag', async () => {
        const query = 'vegetarian';

        const mockResults = [
          {
            id: validRecipeId,
            household_id: validHouseholdId,
            title: 'Veggie Burger',
            description: 'Plant-based burger',
            current_version_id: validVersionId,
            rolling_score: null,
            tags: ['vegetarian', 'american'],
            is_favorite: false,
            last_cooked_at: null,
            created_by: validUserId,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'd4e5f6a7-b8c9-0123-def1-234567890124',
            household_id: validHouseholdId,
            title: 'Greek Salad',
            description: 'Fresh salad',
            current_version_id: 'e5f6a7b8-c9d0-1234-ef12-345678901235',
            rolling_score: null,
            tags: ['vegetarian', 'greek'],
            is_favorite: false,
            last_cooked_at: null,
            created_by: validUserId,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ];

        vi.mocked(mockSupabase.rpc).mockResolvedValue({
          data: mockResults,
          error: null,
        } as any);

        const result = await service.search(query, validHouseholdId);

        expect(result).toHaveLength(2);
        expect(result[0]!.tags).toContain('vegetarian');
        expect(result[1]!.tags).toContain('vegetarian');
      });
    });
  });

  // =============================================================================
  // getVersionHistory
  // =============================================================================

  describe('getVersionHistory', () => {
    it('should return version history for a recipe', async () => {
      const recipeId = 'recipe-123' as RecipeId;
      const mockHistory = [
        {
          version_id: 'version-3',
          version_number: 3,
          created_by: 'user-123',
          created_at: '2024-01-15T00:00:00Z',
          is_current: true,
        },
        {
          version_id: 'version-2',
          version_number: 2,
          created_by: 'user-123',
          created_at: '2024-01-10T00:00:00Z',
          is_current: false,
        },
        {
          version_id: 'version-1',
          version_number: 1,
          created_by: 'user-456',
          created_at: '2024-01-01T00:00:00Z',
          is_current: false,
        },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockHistory,
        error: null,
      } as any);

      const result = await service.getVersionHistory(recipeId);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_recipe_version_history', {
        p_recipe_id: recipeId,
      });

      expect(result).toHaveLength(3);
      expect(result[0]!.version_number).toBe(3);
      expect(result[0]!.is_current).toBe(true);
    });

    it('should return empty array for recipe with no versions', async () => {
      const recipeId = 'recipe-no-versions' as RecipeId;

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.getVersionHistory(recipeId);

      expect(result).toEqual([]);
    });
  });

  // =============================================================================
  // getVersion
  // =============================================================================

  describe('getVersion', () => {
    it('should return specific version of a recipe', async () => {
      const recipeId = 'recipe-123' as RecipeId;
      const versionNumber = 2;

      const mockVersion: MockRecipeVersion = {
        id: 'version-2',
        recipe_id: recipeId,
        version_number: 2,
        ingredients_json: [{ name: 'flour', quantity: 2, unit: 'cups' }],
        steps_json: [{ position: 1, text: 'Mix flour' }],
        servings: 4,
        prep_time_minutes: 10,
        cook_time_minutes: 30,
        notes: 'Version 2 notes',
        created_by: 'user-123',
        created_at: '2024-01-10T00:00:00Z',
      };

      const versionBuilder = createMockQueryBuilder({ data: mockVersion, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(versionBuilder as any);

      const result = await service.getVersion(recipeId, versionNumber);

      expect(mockSupabase.from).toHaveBeenCalledWith('recipe_versions');
      expect(versionBuilder.eq).toHaveBeenCalledWith('recipe_id', recipeId);
      expect(versionBuilder.eq).toHaveBeenCalledWith('version_number', versionNumber);
      expect(result.version_number).toBe(2);
    });

    it('should throw NotFoundError when version does not exist', async () => {
      const recipeId = 'recipe-123' as RecipeId;
      const versionNumber = 999;

      const versionBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(versionBuilder as any);

      await expect(service.getVersion(recipeId, versionNumber)).rejects.toThrow(NotFoundError);
    });
  });

  // =============================================================================
  // toggleFavorite
  // =============================================================================

  describe('toggleFavorite', () => {
    const validRecipeId = 'c3d4e5f6-a7b8-9012-cdef-123456789012' as RecipeId;
    const validHouseholdId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const validUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const validVersionId = 'd4e5f6a7-b8c9-0123-def1-234567890123';

    it('should toggle favorite from false to true', async () => {
      const existingRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Test Recipe',
        description: null,
        current_version_id: validVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const updatedRecipe: MockRecipe = {
        ...existingRecipe,
        is_favorite: true,
        updated_at: '2024-01-15T00:00:00Z',
      };

      const existingBuilder = createMockQueryBuilder({ data: existingRecipe, error: null });
      const updateBuilder = createMockQueryBuilder({ data: null, error: null });
      const updatedBuilder = createMockQueryBuilder({ data: updatedRecipe, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(existingBuilder as any) // getById (check exists)
        .mockReturnValueOnce(updateBuilder as any) // update call
        .mockReturnValueOnce(updatedBuilder as any); // getById (return updated)

      const result = await service.toggleFavorite(validRecipeId);

      expect(result.is_favorite).toBe(true);
    });

    it('should toggle favorite from true to false', async () => {
      const existingRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Test Recipe',
        description: null,
        current_version_id: validVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: true,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const updatedRecipe: MockRecipe = {
        ...existingRecipe,
        is_favorite: false,
        updated_at: '2024-01-15T00:00:00Z',
      };

      const existingBuilder = createMockQueryBuilder({ data: existingRecipe, error: null });
      const updateBuilder = createMockQueryBuilder({ data: null, error: null });
      const updatedBuilder = createMockQueryBuilder({ data: updatedRecipe, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(existingBuilder as any)
        .mockReturnValueOnce(updateBuilder as any)
        .mockReturnValueOnce(updatedBuilder as any);

      const result = await service.toggleFavorite(validRecipeId);

      expect(result.is_favorite).toBe(false);
    });

    it('should throw NotFoundError when recipe does not exist', async () => {
      const nonexistentId = 'nonexistent' as RecipeId;

      const recipeBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      await expect(service.toggleFavorite(nonexistentId)).rejects.toThrow(NotFoundError);
    });
  });

  // =============================================================================
  // updateStatus
  // =============================================================================

  describe('updateStatus', () => {
    const validRecipeId = 'c3d4e5f6-a7b8-9012-cdef-123456789012' as RecipeId;
    const validHouseholdId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const validUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const validVersionId = 'd4e5f6a7-b8c9-0123-def1-234567890123';

    it('should update recipe status from suggested to to_buy', async () => {
      const existingRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Test Recipe',
        description: null,
        current_version_id: validVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const updatedRecipe: MockRecipe = {
        ...existingRecipe,
        updated_at: '2024-01-15T00:00:00Z',
      };

      const existingBuilder = createMockQueryBuilder({ data: existingRecipe, error: null });
      const updateBuilder = createMockQueryBuilder({ data: null, error: null });
      const updatedBuilder = createMockQueryBuilder({ data: updatedRecipe, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(existingBuilder as any)
        .mockReturnValueOnce(updateBuilder as any)
        .mockReturnValueOnce(updatedBuilder as any);

      const result = await service.updateStatus(validRecipeId, { status: 'to_buy' });

      expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
      expect(result).toEqual(updatedRecipe);
    });

    it('should update recipe status from to_cook to cooked', async () => {
      const existingRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Test Recipe',
        description: null,
        current_version_id: validVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const updatedRecipe: MockRecipe = {
        ...existingRecipe,
        updated_at: '2024-01-15T00:00:00Z',
      };

      const existingBuilder = createMockQueryBuilder({ data: existingRecipe, error: null });
      const updateBuilder = createMockQueryBuilder({ data: null, error: null });
      const updatedBuilder = createMockQueryBuilder({ data: updatedRecipe, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(existingBuilder as any)
        .mockReturnValueOnce(updateBuilder as any)
        .mockReturnValueOnce(updatedBuilder as any);

      const result = await service.updateStatus(validRecipeId, { status: 'cooked' });

      expect(result).toEqual(updatedRecipe);
    });

    it('should throw NotFoundError when recipe does not exist', async () => {
      const nonexistentId = 'nonexistent' as RecipeId;

      const recipeBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      await expect(service.updateStatus(nonexistentId, { status: 'to_buy' })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw ValidationError for invalid status', async () => {
      await expect(
        service.updateStatus(validRecipeId, { status: 'invalid_status' as any }),
      ).rejects.toThrow(ValidationError);
    });

    it('should handle database update errors', async () => {
      const existingRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Test Recipe',
        description: null,
        current_version_id: validVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const existingBuilder = createMockQueryBuilder({ data: existingRecipe, error: null });
      const updateBuilder = createMockQueryBuilder({
        data: null,
        error: { message: 'Database error', code: '500' },
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(existingBuilder as any)
        .mockReturnValueOnce(updateBuilder as any);

      await expect(service.updateStatus(validRecipeId, { status: 'to_buy' })).rejects.toThrow(
        AppError,
      );
    });
  });

  // =============================================================================
  // getWithVersion
  // =============================================================================

  describe('getWithVersion', () => {
    const validRecipeId = 'c3d4e5f6-a7b8-9012-cdef-123456789012' as RecipeId;
    const validHouseholdId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const validUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const validVersionId = 'd4e5f6a7-b8c9-0123-def1-234567890123';

    it('should return recipe with its current version', async () => {
      const mockRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Test Recipe',
        description: 'A test recipe',
        current_version_id: validVersionId,
        rolling_score: 4.0,
        tags: ['italian'],
        is_favorite: true,
        last_cooked_at: '2024-01-10T00:00:00Z',
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      };

      const mockVersion: MockRecipeVersion = {
        id: validVersionId,
        recipe_id: validRecipeId,
        version_number: 1,
        ingredients_json: [{ name: 'pasta', quantity: 400, unit: 'g' }],
        steps_json: [{ position: 1, text: 'Boil pasta' }],
        servings: 4,
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        notes: 'Test notes',
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
      };

      const recipeBuilder = createMockQueryBuilder({ data: mockRecipe, error: null });
      const versionBuilder = createMockQueryBuilder({ data: mockVersion, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(recipeBuilder as any) // getById
        .mockReturnValueOnce(versionBuilder as any); // fetch version

      const result = await service.getWithVersion(validRecipeId);

      expect(result.id).toBe(validRecipeId);
      expect(result.current_version).not.toBeNull();
      expect(result.current_version?.ingredients_json).toHaveLength(1);
      expect(result.current_version?.steps_json).toHaveLength(1);
    });

    it('should return recipe with null current_version when no version exists', async () => {
      const mockRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Empty Recipe',
        description: null,
        current_version_id: null,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const recipeBuilder = createMockQueryBuilder({ data: mockRecipe, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      const result = await service.getWithVersion(validRecipeId);

      expect(result.id).toBe(validRecipeId);
      expect(result.current_version).toBeNull();
    });

    it('should throw NotFoundError when recipe does not exist', async () => {
      const nonexistentId = 'nonexistent' as RecipeId;

      const recipeBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(recipeBuilder as any);

      await expect(service.getWithVersion(nonexistentId)).rejects.toThrow(NotFoundError);
    });
  });

  // =============================================================================
  // revertToVersion
  // =============================================================================

  describe('revertToVersion', () => {
    const validRecipeId = 'c3d4e5f6-a7b8-9012-cdef-123456789012' as RecipeId;
    const validHouseholdId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const validUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901' as UserId;
    const validVersionId = 'd4e5f6a7-b8c9-0123-def1-234567890123';
    const newVersionId = 'e5f6a7b8-c9d0-1234-ef12-345678901234';

    it('should revert to a previous version by creating a new version with old content', async () => {
      const targetVersionNumber = 2;

      // Mock target version (the version we're reverting to)
      const targetVersion: MockRecipeVersion = {
        id: 'version-2',
        recipe_id: validRecipeId,
        version_number: targetVersionNumber,
        ingredients_json: [{ name: 'old ingredient', quantity: 100, unit: 'g' }],
        steps_json: [{ position: 1, text: 'Old step from version 2' }],
        servings: 2,
        prep_time_minutes: 15,
        cook_time_minutes: 25,
        notes: 'Old notes from version 2',
        created_by: validUserId,
        created_at: '2024-01-10T00:00:00Z',
      };

      // Mock existing recipe
      const existingRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Test Recipe',
        description: 'Recipe description',
        current_version_id: validVersionId, // Currently on version 3
        rolling_score: null,
        tags: ['tag1'],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      // Mock updated recipe after revert
      const updatedRecipe: MockRecipe = {
        ...existingRecipe,
        current_version_id: newVersionId, // New version created
        updated_at: '2024-01-20T00:00:00Z',
      };

      // Setup mocks in order:
      // 1. getVersion (fetch target version)
      const versionBuilder = createMockQueryBuilder({ data: targetVersion, error: null });
      // 2. getById (fetch existing recipe for metadata)
      const existingRecipeBuilder = createMockQueryBuilder({ data: existingRecipe, error: null });
      // 3. getById (fetch updated recipe after revert)
      const updatedRecipeBuilder = createMockQueryBuilder({ data: updatedRecipe, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(versionBuilder as any) // getVersion
        .mockReturnValueOnce(existingRecipeBuilder as any) // getById (existing)
        .mockReturnValueOnce(updatedRecipeBuilder as any); // getById (after revert)

      // Mock RPC call to update_recipe_create_version
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: newVersionId,
        error: null,
      } as any);

      const result = await service.revertToVersion(validRecipeId, targetVersionNumber, validUserId);

      // Verify RPC was called with content from target version
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_recipe_create_version', {
        p_recipe_id: validRecipeId,
        p_title: existingRecipe.title,
        p_description: existingRecipe.description,
        p_ingredients_json: targetVersion.ingredients_json,
        p_steps_json: targetVersion.steps_json,
        p_servings: targetVersion.servings,
        p_prep_time_minutes: targetVersion.prep_time_minutes,
        p_cook_time_minutes: targetVersion.cook_time_minutes,
        p_notes: targetVersion.notes,
        p_user_id: validUserId,
      });

      expect(result.current_version_id).toBe(newVersionId);
    });

    it('should handle null values in target version when reverting', async () => {
      const targetVersionNumber = 1;

      // Mock target version with null optional fields
      const targetVersion: MockRecipeVersion = {
        id: 'version-1',
        recipe_id: validRecipeId,
        version_number: targetVersionNumber,
        ingredients_json: [{ name: 'ingredient' }],
        steps_json: [{ position: 1, text: 'Step' }],
        servings: null,
        prep_time_minutes: null,
        cook_time_minutes: null,
        notes: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
      };

      const existingRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Test Recipe',
        description: null,
        current_version_id: validVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      const updatedRecipe: MockRecipe = {
        ...existingRecipe,
        current_version_id: newVersionId,
        updated_at: '2024-01-20T00:00:00Z',
      };

      const versionBuilder = createMockQueryBuilder({ data: targetVersion, error: null });
      const existingRecipeBuilder = createMockQueryBuilder({ data: existingRecipe, error: null });
      const updatedRecipeBuilder = createMockQueryBuilder({ data: updatedRecipe, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(versionBuilder as any)
        .mockReturnValueOnce(existingRecipeBuilder as any)
        .mockReturnValueOnce(updatedRecipeBuilder as any);

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: newVersionId,
        error: null,
      } as any);

      await service.revertToVersion(validRecipeId, targetVersionNumber, validUserId);

      // Verify RPC was called with 0 for null numeric values and empty string for null notes
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_recipe_create_version', {
        p_recipe_id: validRecipeId,
        p_title: existingRecipe.title,
        p_description: '',
        p_ingredients_json: targetVersion.ingredients_json,
        p_steps_json: targetVersion.steps_json,
        p_servings: 0,
        p_prep_time_minutes: 0,
        p_cook_time_minutes: 0,
        p_notes: '',
        p_user_id: validUserId,
      });
    });

    it('should throw NotFoundError when target version does not exist', async () => {
      const nonExistentVersionNumber = 999;

      const versionBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(versionBuilder as any);

      await expect(
        service.revertToVersion(validRecipeId, nonExistentVersionNumber, validUserId),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when recipe does not exist', async () => {
      const nonExistentRecipeId = 'nonexistent-recipe' as RecipeId;
      const targetVersionNumber = 1;

      // First call succeeds (getVersion doesn't check recipe existence directly)
      // But when we try to get the recipe, it fails
      const versionBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(versionBuilder as any);

      await expect(
        service.revertToVersion(nonExistentRecipeId, targetVersionNumber, validUserId),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AppError when database RPC fails', async () => {
      const targetVersionNumber = 2;

      const targetVersion: MockRecipeVersion = {
        id: 'version-2',
        recipe_id: validRecipeId,
        version_number: targetVersionNumber,
        ingredients_json: [{ name: 'ingredient' }],
        steps_json: [{ position: 1, text: 'Step' }],
        servings: 4,
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        notes: 'Notes',
        created_by: validUserId,
        created_at: '2024-01-10T00:00:00Z',
      };

      const existingRecipe: MockRecipe = {
        id: validRecipeId,
        household_id: validHouseholdId,
        title: 'Test Recipe',
        description: 'Description',
        current_version_id: validVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      const versionBuilder = createMockQueryBuilder({ data: targetVersion, error: null });
      const existingRecipeBuilder = createMockQueryBuilder({ data: existingRecipe, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(versionBuilder as any)
        .mockReturnValueOnce(existingRecipeBuilder as any);

      // Mock RPC failure
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      } as any);

      await expect(
        service.revertToVersion(validRecipeId, targetVersionNumber, validUserId),
      ).rejects.toThrow(AppError);
    });
  });

  // =============================================================================
  // fork
  // =============================================================================

  describe('fork', () => {
    const validParentRecipeId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
    const validHouseholdId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const validUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const validVersionId = 'd4e5f6a7-b8c9-0123-def1-234567890123';
    const forkedRecipeId = 'f6a7b8c9-d0e1-2345-f012-345678901234';
    const forkedVersionId = 'a7b8c9d0-e1f2-3456-0123-456789012345';

    it('should fork a recipe and return the forked recipe with version', async () => {
      const input = {
        parentRecipeId: validParentRecipeId,
        newTitle: 'Copy of Pasta Carbonara',
      };

      // Mock forked recipe
      const mockForkedRecipe: MockRecipe = {
        id: forkedRecipeId,
        household_id: validHouseholdId,
        title: input.newTitle,
        description: 'Classic Italian pasta',
        current_version_id: forkedVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: validUserId,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      const mockForkedVersion: MockRecipeVersion = {
        id: forkedVersionId,
        recipe_id: forkedRecipeId,
        version_number: 1,
        ingredients_json: [{ name: 'pasta', quantity: 400, unit: 'g' }],
        steps_json: [{ position: 1, text: 'Boil pasta' }],
        servings: 4,
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        notes: 'Use guanciale if available',
        created_by: validUserId,
        created_at: '2024-01-15T00:00:00Z',
      };

      // Mock RPC call to fork_recipe
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: forkedRecipeId,
        error: null,
      } as any);

      // Mock fetching the forked recipe (getById)
      const recipeBuilder = createMockQueryBuilder({ data: mockForkedRecipe, error: null });
      // Mock fetching the version (getWithVersion)
      const versionBuilder = createMockQueryBuilder({ data: mockForkedVersion, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(recipeBuilder as any) // getById for forked recipe
        .mockReturnValueOnce(versionBuilder as any); // getWithVersion fetches version

      const result = await service.fork(input, validUserId as UserId);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('fork_recipe', {
        p_parent_recipe_id: input.parentRecipeId,
        p_new_title: input.newTitle,
        p_user_id: validUserId,
      });

      expect(result.id).toBe(forkedRecipeId);
      expect(result.title).toBe(input.newTitle);
      expect(result.current_version).not.toBeNull();
    });

    it('should throw ValidationError for empty newTitle', async () => {
      const input = {
        parentRecipeId: validParentRecipeId,
        newTitle: '',
      };

      await expect(service.fork(input, validUserId as UserId)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for newTitle exceeding max length', async () => {
      const input = {
        parentRecipeId: validParentRecipeId,
        newTitle: 'A'.repeat(201),
      };

      await expect(service.fork(input, validUserId as UserId)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid parentRecipeId', async () => {
      const input = {
        parentRecipeId: 'not-a-uuid',
        newTitle: 'Valid Title',
      };

      await expect(service.fork(input, validUserId as UserId)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when parent recipe does not exist', async () => {
      const input = {
        parentRecipeId: validParentRecipeId,
        newTitle: 'Copy of Recipe',
      };

      // Mock RPC call returning error for parent not found
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Parent recipe not found', code: 'P0001' },
      } as any);

      await expect(service.fork(input, validUserId as UserId)).rejects.toThrow(NotFoundError);
    });

    it('should throw AppError when database operation fails', async () => {
      const input = {
        parentRecipeId: validParentRecipeId,
        newTitle: 'Copy of Recipe',
      };

      // Mock RPC call returning generic error
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'XX000' },
      } as any);

      await expect(service.fork(input, validUserId as UserId)).rejects.toThrow(AppError);
    });
  });

  // =============================================================================
  // getPrimaryImage
  // =============================================================================

  describe('getPrimaryImage', () => {
    const validRecipeId = 'c3d4e5f6-a7b8-9012-cdef-123456789012' as RecipeId;
    const validUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
    const validImageId = 'e5f6a7b8-c9d0-1234-ef12-345678901234';

    it('should return primary image when it exists', async () => {
      const mockImage = {
        id: validImageId,
        recipe_id: validRecipeId,
        storage_path: 'recipes/test-recipe/cover.jpg',
        display_order: 0,
        is_primary: true,
        alt_text: 'Test recipe cover',
        width: 800,
        height: 600,
        file_size_bytes: 102400,
        created_by: validUserId,
        created_at: '2024-01-01T00:00:00Z',
      };

      const imageBuilder = createMockQueryBuilder({ data: mockImage, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(imageBuilder as any);

      const result = await service.getPrimaryImage(validRecipeId);

      expect(mockSupabase.from).toHaveBeenCalledWith('recipe_images');
      expect(imageBuilder.eq).toHaveBeenCalledWith('recipe_id', validRecipeId);
      expect(imageBuilder.eq).toHaveBeenCalledWith('is_primary', true);
      expect(result).not.toBeNull();
      expect(result?.storage_path).toBe('recipes/test-recipe/cover.jpg');
    });

    it('should return null when no primary image exists', async () => {
      const imageBuilder = createMockQueryBuilder({ data: null, error: null });
      imageBuilder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(imageBuilder as any);

      const result = await service.getPrimaryImage(validRecipeId);

      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // getAllTags (Issue 4.3 - Tag Filter)
  // =============================================================================

  describe('getAllTags', () => {
    const validHouseholdId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as HouseholdId;

    it('should return all unique tags from household recipes sorted alphabetically', async () => {
      const mockTagsWithUsage = [
        { tag_name: 'italian', usage_count: 2 },
        { tag_name: 'pasta', usage_count: 2 },
        { tag_name: 'dinner', usage_count: 2 },
        { tag_name: 'chicken', usage_count: 1 },
        { tag_name: 'asian', usage_count: 1 },
        { tag_name: 'vegetarian', usage_count: 1 },
        { tag_name: 'breakfast', usage_count: 1 },
        { tag_name: 'quick', usage_count: 1 },
      ];

      // Mock RPC call to get_household_tags
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockTagsWithUsage,
        error: null,
      } as any);

      const result = await service.getAllTags(validHouseholdId);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_household_tags', {
        p_household_id: validHouseholdId,
      });

      // Should return tag names sorted alphabetically
      expect(result).toEqual([
        'asian',
        'breakfast',
        'chicken',
        'dinner',
        'italian',
        'pasta',
        'quick',
        'vegetarian',
      ]);
    });

    it('should return empty array when household has no recipes', async () => {
      // Mock RPC call returning empty array
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.getAllTags(validHouseholdId);

      expect(result).toEqual([]);
    });

    it('should return empty array when all recipes have no tags', async () => {
      // Mock RPC call returning empty array (no tags in household)
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.getAllTags(validHouseholdId);

      expect(result).toEqual([]);
    });

    it('should handle duplicate tags correctly', async () => {
      const mockTagsWithUsage = [
        { tag_name: 'italian', usage_count: 2 },
        { tag_name: 'pasta', usage_count: 2 },
        { tag_name: 'dinner', usage_count: 1 },
        { tag_name: 'vegetarian', usage_count: 1 },
      ];

      // Mock RPC call
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockTagsWithUsage,
        error: null,
      } as any);

      const result = await service.getAllTags(validHouseholdId);

      // Database function already deduplicates, so each tag appears once
      expect(result).toEqual(['dinner', 'italian', 'pasta', 'vegetarian']);
      expect(result.filter((tag) => tag === 'italian')).toHaveLength(1);
    });

    it('should throw AppError when database query fails', async () => {
      // Mock RPC call with error
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      } as any);

      await expect(service.getAllTags(validHouseholdId)).rejects.toThrow(AppError);
    });
  });
});
