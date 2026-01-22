/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ValidationError,
  NotFoundError,
  AppError,
  type CookingEventId,
  type RecipeId,
  type RecipeVersionId,
  type HouseholdId,
  type UserId,
  type CookingEvent,
  type CreateCookingEventInput,
  type UpdateCookingEventInput,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { CookingEventService } from './CookingEventService';

/**
 * Mock types for Supabase responses in tests
 */
interface MockCookingEvent {
  id: string;
  recipe_id: string;
  recipe_version_id: string;
  household_id: string;
  cooked_at: string;
  servings_made: number | null;
  rating: number | null;
  notes: string | null;
  cooked_by: string;
}

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

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
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
    order: vi.fn().mockResolvedValue(defaultValue), // order() resolves with data
    single: vi.fn().mockResolvedValue(defaultValue),
    maybeSingle: vi.fn().mockResolvedValue(defaultValue),
    range: vi.fn().mockResolvedValue(defaultValue),
  };

  return builder;
}

/**
 * Create a mock Supabase client
 */
function createMockSupabase(): SupabaseClient {
  return {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  } as unknown as SupabaseClient;
}

describe('CookingEventService', () => {
  let service: CookingEventService;
  let mockSupabase: SupabaseClient;

  const mockUserId = '00000000-0000-0000-0000-000000000001' as UserId;
  const mockHouseholdId = '00000000-0000-0000-0000-000000000002' as HouseholdId;
  const mockRecipeId = '00000000-0000-0000-0000-000000000003' as RecipeId;
  const mockRecipeVersionId = '00000000-0000-0000-0000-000000000004' as RecipeVersionId;
  const mockCookingEventId = '00000000-0000-0000-0000-000000000005' as CookingEventId;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new CookingEventService(mockSupabase);

    // Default: mock authenticated user
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create cooking event with all fields', async () => {
      const input = {
        recipe_id: mockRecipeId as string,
        recipe_version_id: mockRecipeVersionId as string,
        servings_made: 4,
        rating: 5,
        notes: 'Delicious!',
      };

      const mockRecipe: MockRecipe = {
        id: mockRecipeId,
        household_id: mockHouseholdId,
        title: 'Test Recipe',
        description: null,
        current_version_id: mockRecipeVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: mockUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockCookingEvent: MockCookingEvent = {
        id: mockCookingEventId,
        recipe_id: mockRecipeId,
        recipe_version_id: mockRecipeVersionId,
        household_id: mockHouseholdId,
        cooked_at: '2024-01-15T12:00:00Z',
        servings_made: 4,
        rating: 5,
        notes: 'Delicious!',
        cooked_by: mockUserId,
      };

      // Mock recipe lookup
      const recipeBuilder = createMockQueryBuilder({ data: mockRecipe, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(recipeBuilder as any);

      // Mock cooking event insert
      const insertBuilder = createMockQueryBuilder({ data: mockCookingEvent, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(insertBuilder as any);

      const result = await service.create(input);

      expect(result.id).toBe(mockCookingEventId);
      expect(result.recipe_id).toBe(mockRecipeId);
      expect(result.rating).toBe(5);
      expect(result.servings_made).toBe(4);
      expect(result.notes).toBe('Delicious!');
      expect(result.cooked_by).toBe(mockUserId);
    });

    it('should create cooking event with minimal fields', async () => {
      const input = {
        recipe_id: mockRecipeId as string,
        recipe_version_id: mockRecipeVersionId as string,
      };

      const mockRecipe: MockRecipe = {
        id: mockRecipeId,
        household_id: mockHouseholdId,
        title: 'Test Recipe',
        description: null,
        current_version_id: mockRecipeVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: mockUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockCookingEvent: MockCookingEvent = {
        id: mockCookingEventId,
        recipe_id: mockRecipeId,
        recipe_version_id: mockRecipeVersionId,
        household_id: mockHouseholdId,
        cooked_at: new Date().toISOString(),
        servings_made: null,
        rating: null,
        notes: null,
        cooked_by: mockUserId,
      };

      const recipeBuilder = createMockQueryBuilder({ data: mockRecipe, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(recipeBuilder as any);

      const insertBuilder = createMockQueryBuilder({ data: mockCookingEvent, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(insertBuilder as any);

      const result = await service.create(input);

      expect(result.id).toBe(mockCookingEventId);
      expect(result.rating).toBeNull();
      expect(result.servings_made).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should throw ValidationError for invalid rating (< 1)', async () => {
      const input: CreateCookingEventInput = {
        recipe_id: mockRecipeId,
        recipe_version_id: mockRecipeVersionId,
        rating: 0, // Invalid
      };

      await expect(service.create(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid rating (> 5)', async () => {
      const input: CreateCookingEventInput = {
        recipe_id: mockRecipeId,
        recipe_version_id: mockRecipeVersionId,
        rating: 6, // Invalid
      };

      await expect(service.create(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for negative servings_made', async () => {
      const input: CreateCookingEventInput = {
        recipe_id: mockRecipeId,
        recipe_version_id: mockRecipeVersionId,
        servings_made: -1, // Invalid
      };

      await expect(service.create(input)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if recipe does not exist', async () => {
      const input = {
        recipe_id: mockRecipeId as string,
        recipe_version_id: mockRecipeVersionId as string,
      };

      const recipeBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(recipeBuilder as any);

      await expect(service.create(input)).rejects.toThrow(NotFoundError);
    });

    it('should update calendar entry status to completed if calendar_entry_id provided', async () => {
      const input = {
        recipe_id: mockRecipeId as string,
        recipe_version_id: mockRecipeVersionId as string,
        calendar_entry_id: '00000000-0000-0000-0000-000000000008',
      };

      const mockRecipe: MockRecipe = {
        id: mockRecipeId,
        household_id: mockHouseholdId,
        title: 'Test Recipe',
        description: null,
        current_version_id: mockRecipeVersionId,
        rolling_score: null,
        tags: [],
        is_favorite: false,
        last_cooked_at: null,
        created_by: mockUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockCookingEvent: MockCookingEvent = {
        id: mockCookingEventId,
        recipe_id: mockRecipeId,
        recipe_version_id: mockRecipeVersionId,
        household_id: mockHouseholdId,
        cooked_at: new Date().toISOString(),
        servings_made: null,
        rating: null,
        notes: null,
        cooked_by: mockUserId,
      };

      const recipeBuilder = createMockQueryBuilder({ data: mockRecipe, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(recipeBuilder as any);

      const insertBuilder = createMockQueryBuilder({ data: mockCookingEvent, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(insertBuilder as any);

      // Mock calendar entry update
      const updateBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(updateBuilder as any);

      const result = await service.create(input);

      expect(result.id).toBe(mockCookingEventId);
      expect(updateBuilder.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(updateBuilder.eq).toHaveBeenCalledWith('id', '00000000-0000-0000-0000-000000000008');
    });
  });

  describe('getById', () => {
    it('should return cooking event by ID', async () => {
      const mockCookingEvent: MockCookingEvent = {
        id: mockCookingEventId,
        recipe_id: mockRecipeId,
        recipe_version_id: mockRecipeVersionId,
        household_id: mockHouseholdId,
        cooked_at: '2024-01-15T12:00:00Z',
        servings_made: 4,
        rating: 5,
        notes: 'Great!',
        cooked_by: mockUserId,
      };

      const builder = createMockQueryBuilder({ data: mockCookingEvent, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(builder as any);

      const result = await service.getById(mockCookingEventId);

      expect(result.id).toBe(mockCookingEventId);
      expect(result.rating).toBe(5);
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('id', mockCookingEventId);
    });

    it('should throw NotFoundError if cooking event does not exist', async () => {
      const builder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(builder as any);

      await expect(service.getById(mockCookingEventId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByRecipeId', () => {
    it('should return all cooking events for a recipe sorted by date DESC', async () => {
      const mockEvents: MockCookingEvent[] = [
        {
          id: '00000000-0000-0000-0000-000000000006',
          recipe_id: mockRecipeId,
          recipe_version_id: mockRecipeVersionId,
          household_id: mockHouseholdId,
          cooked_at: '2024-01-20T12:00:00Z',
          servings_made: 4,
          rating: 5,
          notes: null,
          cooked_by: mockUserId,
        },
        {
          id: '00000000-0000-0000-0000-000000000007',
          recipe_id: mockRecipeId,
          recipe_version_id: mockRecipeVersionId,
          household_id: mockHouseholdId,
          cooked_at: '2024-01-10T12:00:00Z',
          servings_made: 2,
          rating: 4,
          notes: null,
          cooked_by: mockUserId,
        },
      ];

      const builder = createMockQueryBuilder({ data: mockEvents, error: null });
      // order() should return a Promise with the data
      builder.order.mockReturnValue(Promise.resolve({ data: mockEvents, error: null }));
      vi.mocked(mockSupabase.from).mockReturnValueOnce(builder as any);

      const result = await service.getByRecipeId(mockRecipeId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('00000000-0000-0000-0000-000000000006' as CookingEventId);
      expect(result[1].id).toBe('00000000-0000-0000-0000-000000000007' as CookingEventId);
      expect(builder.eq).toHaveBeenCalledWith('recipe_id', mockRecipeId);
      expect(builder.order).toHaveBeenCalledWith('cooked_at', { ascending: false });
    });

    it('should return empty array if no events exist', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      builder.order.mockReturnValue(Promise.resolve({ data: [], error: null }));
      vi.mocked(mockSupabase.from).mockReturnValueOnce(builder as any);

      const result = await service.getByRecipeId(mockRecipeId);

      expect(result).toEqual([]);
    });
  });

  describe('getByHouseholdId', () => {
    it('should return all cooking events for a household sorted by date DESC', async () => {
      const mockEvents: MockCookingEvent[] = [
        {
          id: '00000000-0000-0000-0000-000000000006',
          recipe_id: mockRecipeId,
          recipe_version_id: mockRecipeVersionId,
          household_id: mockHouseholdId,
          cooked_at: '2024-01-20T12:00:00Z',
          servings_made: 4,
          rating: 5,
          notes: null,
          cooked_by: mockUserId,
        },
      ];

      const builder = createMockQueryBuilder({ data: mockEvents, error: null });
      // order() returns this to allow chaining .range()
      builder.order.mockReturnThis();
      builder.range.mockReturnValue(Promise.resolve({ data: mockEvents, error: null }));
      vi.mocked(mockSupabase.from).mockReturnValueOnce(builder as any);

      const result = await service.getByHouseholdId(mockHouseholdId);

      expect(result).toHaveLength(1);
      expect(builder.eq).toHaveBeenCalledWith('household_id', mockHouseholdId);
      expect(builder.order).toHaveBeenCalledWith('cooked_at', { ascending: false });
    });

    it('should support pagination with limit and offset', async () => {
      const mockEvents: MockCookingEvent[] = [];

      const builder = createMockQueryBuilder({ data: mockEvents, error: null });
      builder.order.mockReturnThis();
      builder.range.mockReturnValue(Promise.resolve({ data: mockEvents, error: null }));
      vi.mocked(mockSupabase.from).mockReturnValueOnce(builder as any);

      await service.getByHouseholdId(mockHouseholdId, 10, 5);

      expect(builder.range).toHaveBeenCalledWith(5, 14); // offset 5, limit 10 → range(5, 14)
    });

    it('should return empty array if no events exist', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      builder.order.mockReturnThis();
      builder.range.mockReturnValue(Promise.resolve({ data: [], error: null }));
      vi.mocked(mockSupabase.from).mockReturnValueOnce(builder as any);

      const result = await service.getByHouseholdId(mockHouseholdId);

      expect(result).toEqual([]);
    });

    it('should join with recipe title and cooked_by name', async () => {
      const mockEventsWithJoin = [
        {
          id: '00000000-0000-0000-0000-000000000006',
          recipe_id: mockRecipeId,
          recipe_version_id: mockRecipeVersionId,
          household_id: mockHouseholdId,
          cooked_at: '2024-01-20T12:00:00Z',
          servings_made: 4,
          rating: 5,
          notes: null,
          cooked_by: mockUserId,
          recipes: { title: 'Pasta Carbonara' }, // Supabase returns joined data as nested objects
          profiles: { display_name: 'John Doe' },
        },
      ];

      const builder = createMockQueryBuilder({ data: mockEventsWithJoin, error: null });
      builder.order.mockReturnThis();
      builder.range.mockReturnValue(Promise.resolve({ data: mockEventsWithJoin, error: null }));
      vi.mocked(mockSupabase.from).mockReturnValueOnce(builder as any);

      const result = await service.getByHouseholdId(mockHouseholdId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '00000000-0000-0000-0000-000000000006',
        recipe_title: 'Pasta Carbonara',
        cooked_by_name: 'John Doe',
      });
    });

    it('should handle missing profile data gracefully (LEFT JOIN)', async () => {
      const mockEventsWithMissingProfile = [
        {
          id: '00000000-0000-0000-0000-000000000006',
          recipe_id: mockRecipeId,
          recipe_version_id: mockRecipeVersionId,
          household_id: mockHouseholdId,
          cooked_at: '2024-01-20T12:00:00Z',
          servings_made: 4,
          rating: 5,
          notes: null,
          cooked_by: mockUserId,
          recipes: { title: 'Pasta Carbonara' },
          profiles: null, // Profile not found (LEFT JOIN returns null)
        },
      ];

      const builder = createMockQueryBuilder({ data: mockEventsWithMissingProfile, error: null });
      builder.order.mockReturnThis();
      builder.range.mockReturnValue(
        Promise.resolve({ data: mockEventsWithMissingProfile, error: null }),
      );
      vi.mocked(mockSupabase.from).mockReturnValueOnce(builder as any);

      const result = await service.getByHouseholdId(mockHouseholdId);

      expect(result).toHaveLength(1);
      expect(result[0].cooked_by_name).toBe('Unknown member');
    });
  });

  describe('update', () => {
    it('should update rating and notes', async () => {
      const input: UpdateCookingEventInput = {
        rating: 4,
        notes: 'Updated notes',
      };

      const mockExistingEvent: MockCookingEvent = {
        id: mockCookingEventId,
        recipe_id: mockRecipeId,
        recipe_version_id: mockRecipeVersionId,
        household_id: mockHouseholdId,
        cooked_at: '2024-01-15T12:00:00Z',
        servings_made: 4,
        rating: 5,
        notes: 'Original notes',
        cooked_by: mockUserId,
      };

      const mockUpdatedEvent: MockCookingEvent = {
        ...mockExistingEvent,
        rating: 4,
        notes: 'Updated notes',
      };

      // Mock getById (called first to check if event exists)
      const getBuilder = createMockQueryBuilder({ data: mockExistingEvent, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(getBuilder as any);

      // Mock update
      const updateBuilder = createMockQueryBuilder({ data: mockUpdatedEvent, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(updateBuilder as any);

      const result = await service.update(mockCookingEventId, input);

      expect(result.rating).toBe(4);
      expect(result.notes).toBe('Updated notes');
      expect(updateBuilder.update).toHaveBeenCalledWith({
        rating: 4,
        notes: 'Updated notes',
      });
    });

    it('should update servings_made', async () => {
      const input: UpdateCookingEventInput = {
        servings_made: 6,
      };

      const mockExistingEvent: MockCookingEvent = {
        id: mockCookingEventId,
        recipe_id: mockRecipeId,
        recipe_version_id: mockRecipeVersionId,
        household_id: mockHouseholdId,
        cooked_at: '2024-01-15T12:00:00Z',
        servings_made: 4,
        rating: 5,
        notes: null,
        cooked_by: mockUserId,
      };

      const mockUpdatedEvent: MockCookingEvent = {
        ...mockExistingEvent,
        servings_made: 6,
      };

      const getBuilder = createMockQueryBuilder({ data: mockExistingEvent, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(getBuilder as any);

      const updateBuilder = createMockQueryBuilder({ data: mockUpdatedEvent, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(updateBuilder as any);

      const result = await service.update(mockCookingEventId, input);

      expect(result.servings_made).toBe(6);
    });

    it('should throw NotFoundError if event does not exist', async () => {
      const input: UpdateCookingEventInput = {
        rating: 4,
      };

      const getBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(getBuilder as any);

      await expect(service.update(mockCookingEventId, input)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid rating', async () => {
      const input: UpdateCookingEventInput = {
        rating: 10, // Invalid
      };

      await expect(service.update(mockCookingEventId, input)).rejects.toThrow(ValidationError);
    });
  });

  describe('delete', () => {
    it('should delete cooking event by ID', async () => {
      const mockExistingEvent: MockCookingEvent = {
        id: mockCookingEventId,
        recipe_id: mockRecipeId,
        recipe_version_id: mockRecipeVersionId,
        household_id: mockHouseholdId,
        cooked_at: '2024-01-15T12:00:00Z',
        servings_made: 4,
        rating: 5,
        notes: null,
        cooked_by: mockUserId,
      };

      // Mock getById
      const getBuilder = createMockQueryBuilder({ data: mockExistingEvent, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(getBuilder as any);

      // Mock delete
      const deleteBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(deleteBuilder as any);

      await service.delete(mockCookingEventId);

      expect(deleteBuilder.delete).toHaveBeenCalled();
      expect(deleteBuilder.eq).toHaveBeenCalledWith('id', mockCookingEventId);
      // Database triggers handle rolling_score and last_cooked_at automatically
      // No RPC call expected
    });

    it('should throw NotFoundError if event does not exist', async () => {
      const getBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValueOnce(getBuilder as any);

      await expect(service.delete(mockCookingEventId)).rejects.toThrow(NotFoundError);
    });
  });
});
