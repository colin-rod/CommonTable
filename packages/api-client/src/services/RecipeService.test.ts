/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
        user_id: validUserId,
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
        user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
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
        user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
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
      expect(result[0].title).toContain('Pasta');
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
      expect(result[0].version_number).toBe(3);
      expect(result[0].is_current).toBe(true);
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
});
