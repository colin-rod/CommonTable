/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  NotFoundError,
  AppError,
  type RecipeId,
  type HouseholdId,
  type UserId,
  type ShortlistItem,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { ShortlistService } from './ShortlistService';

/**
 * Mock types for Supabase responses in tests
 */
interface MockShortlist {
  id: string;
  household_id: string;
  recipe_id: string;
  added_by_user_id: string;
  added_at: string;
}

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
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
    single: vi.fn().mockResolvedValue(defaultValue),
    maybeSingle: vi.fn().mockResolvedValue(defaultValue),
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

describe('ShortlistService', () => {
  let service: ShortlistService;

  beforeEach(() => {
    service = new ShortlistService(mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // =============================================================================
  // add
  // =============================================================================

  describe('add', () => {
    // Valid UUIDs for testing
    const validRecipeId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as RecipeId;
    const validUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901' as UserId;
    const validHouseholdId = 'd4e5f6a7-b8c9-0123-def1-234567890123' as HouseholdId;
    const validShortlistId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

    it('should add recipe to household shortlist with household_id', async () => {
      const mockShortlist: MockShortlist = {
        id: validShortlistId,
        household_id: validHouseholdId,
        recipe_id: validRecipeId,
        added_by_user_id: validUserId,
        added_at: new Date().toISOString(),
      };

      // Mock RPC call to get household_id
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({
        data: validHouseholdId,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      } as any);

      const insertBuilder = createMockQueryBuilder<MockShortlist>({
        data: mockShortlist,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue(insertBuilder as any);

      await service.add(validRecipeId, validUserId);

      // Verify RPC call to get household_id
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_household_id');

      // Verify database insert call
      expect(mockSupabase.from).toHaveBeenCalledWith('recipe_shortlists');
      expect(insertBuilder.insert).toHaveBeenCalledWith({
        recipe_id: validRecipeId,
        household_id: validHouseholdId,
        added_by_user_id: validUserId,
      });
      expect(insertBuilder.single).toHaveBeenCalled();
    });

    it('should throw AppError if household_id cannot be retrieved', async () => {
      // Mock RPC error
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: {
          message: 'Not authenticated',
          details: '',
          hint: '',
          code: '401',
        },
        count: null,
        status: 401,
        statusText: 'Unauthorized',
      } as any);

      await expect(service.add(validRecipeId, validUserId)).rejects.toThrow(AppError);
      await expect(service.add(validRecipeId, validUserId)).rejects.toThrow(
        'Failed to get current household ID',
      );
    });

    it('should be idempotent (no error if recipe already in shortlist)', async () => {
      const duplicateError = {
        code: '23505', // PostgreSQL unique constraint violation
        message: 'duplicate key value violates unique constraint',
      };

      // Mock RPC call to get household_id
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({
        data: validHouseholdId,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      } as any);

      const insertBuilder = createMockQueryBuilder<MockShortlist>({
        data: null,
        error: duplicateError,
      });

      vi.mocked(mockSupabase.from).mockReturnValue(insertBuilder as any);

      // Should NOT throw error for duplicate
      await expect(service.add(validRecipeId, validUserId)).resolves.toBeUndefined();
    });

    it('should throw AppError if database operation fails with non-duplicate error', async () => {
      const dbError = {
        code: 'OTHER_ERROR',
        message: 'Database connection failed',
      };

      // Mock RPC call to get household_id
      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({
        data: validHouseholdId,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK',
      } as any);

      const insertBuilder = createMockQueryBuilder<MockShortlist>({
        data: null,
        error: dbError,
      });

      vi.mocked(mockSupabase.from).mockReturnValue(insertBuilder as any);

      await expect(service.add(validRecipeId, validUserId)).rejects.toThrow(AppError);
      await expect(service.add(validRecipeId, validUserId)).rejects.toThrow(
        'Failed to add recipe to shortlist',
      );
    });
  });

  // =============================================================================
  // remove
  // =============================================================================

  describe('remove', () => {
    const validRecipeId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as RecipeId;

    it('should remove recipe from household shortlist', async () => {
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      await service.remove(validRecipeId);

      // Verify database delete call
      expect(mockSupabase.from).toHaveBeenCalledWith('recipe_shortlists');
      expect(mockBuilder.delete).toHaveBeenCalled();
      expect(mockBuilder.eq).toHaveBeenCalledWith('recipe_id', validRecipeId);
    });

    it('should be idempotent (no error if recipe not in shortlist)', async () => {
      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      // Should NOT throw error if recipe doesn't exist
      await expect(service.remove(validRecipeId)).resolves.toBeUndefined();
    });

    it('should throw AppError if database operation fails', async () => {
      const dbError = {
        code: 'DELETE_ERROR',
        message: 'Database connection failed',
      };

      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: dbError }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.remove(validRecipeId)).rejects.toThrow(AppError);
      await expect(service.remove(validRecipeId)).rejects.toThrow(
        'Failed to remove recipe from shortlist',
      );
    });
  });

  // =============================================================================
  // getAll
  // =============================================================================

  describe('getAll', () => {
    const validHouseholdId = 'd4e5f6a7-b8c9-0123-def1-234567890123' as HouseholdId;

    it('should return all shortlisted recipes with user attribution', async () => {
      const mockData = [
        {
          id: 'shortlist-1',
          recipe_id: 'recipe-123',
          added_by_user_id: 'user-456',
          added_at: '2026-01-28T10:00:00Z',
          recipes: {
            id: 'recipe-123',
            title: 'Pasta Carbonara',
            household_id: validHouseholdId,
            description: 'Classic Italian pasta',
            current_version_id: 'version-1',
            rolling_score: null,
            tags: ['pasta', 'italian'],
            is_favorite: false,
            last_cooked_at: null,
            created_by: 'user-456',
            created_at: '2026-01-20T10:00:00Z',
            updated_at: '2026-01-20T10:00:00Z',
          },
        },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.getAll(validHouseholdId);

      expect(result).toHaveLength(1);
      expect(result[0]?.recipe.title).toBe('Pasta Carbonara');
      expect(result[0]?.addedBy.name).toBe('User');
      expect(result[0]?.addedBy.id).toBe('user-456');
      expect(result[0]?.addedAt).toBeInstanceOf(Date);
      expect(mockSupabase.from).toHaveBeenCalledWith('recipe_shortlists');
      expect(mockBuilder.select).toHaveBeenCalledWith('*, recipes(*)');
      expect(mockBuilder.eq).toHaveBeenCalledWith('household_id', validHouseholdId);
    });

    it('should return empty array if no recipes shortlisted', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.getAll(validHouseholdId);

      expect(result).toEqual([]);
    });

    it('should throw AppError if database operation fails', async () => {
      const dbError = {
        code: 'FETCH_ERROR',
        message: 'Database connection failed',
      };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: dbError }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.getAll(validHouseholdId)).rejects.toThrow(AppError);
      await expect(service.getAll(validHouseholdId)).rejects.toThrow(
        'Failed to get shortlisted recipes',
      );
    });
  });
});
