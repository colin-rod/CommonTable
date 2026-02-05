import { NotFoundError } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { RecipeQueueService } from './RecipeQueueService';

// Mock Supabase client
const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(),
    rpc: vi.fn(),
  } as unknown as SupabaseClient;

  return mockSupabase;
};

describe('RecipeQueueService', () => {
  let service: RecipeQueueService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new RecipeQueueService(mockSupabase);
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should return all queued recipes sorted by position', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          household_id: 'household-1',
          recipe_id: 'recipe-1',
          added_by: 'user-1',
          position: 0,
          status: 'queued',
          notes: null,
          created_at: '2026-02-03T10:00:00Z',
          updated_at: '2026-02-03T10:00:00Z',
        },
        {
          id: 'entry-2',
          household_id: 'household-1',
          recipe_id: 'recipe-2',
          added_by: 'user-1',
          position: 1,
          status: 'queued',
          notes: 'Need to buy ingredients',
          created_at: '2026-02-03T11:00:00Z',
          updated_at: '2026-02-03T11:00:00Z',
        },
      ];

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockEntries, error: null }),
      } as any);

      const result = await service.list();

      expect(result).toHaveLength(2);
      expect(result[0]!.position).toBe(0);
      expect(result[1]!.position).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('recipe_queue');
    });

    it('should filter by status when provided', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          household_id: 'household-1',
          recipe_id: 'recipe-1',
          added_by: 'user-1',
          position: 0,
          status: 'cooking',
          notes: null,
          created_at: '2026-02-03T10:00:00Z',
          updated_at: '2026-02-03T10:00:00Z',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockEntries, error: null }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const result = await service.list({ status: 'cooking' });

      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe('cooking');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'cooking');
    });

    it('should return empty array when no entries exist', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const result = await service.list();

      expect(result).toEqual([]);
    });
  });

  describe('add', () => {
    it('should add recipe to queue with auto-assigned position', async () => {
      const mockEntry = {
        id: 'entry-1',
        household_id: 'household-1',
        recipe_id: 'recipe-1',
        added_by: 'user-1',
        position: 0,
        status: 'queued',
        notes: null,
        created_at: '2026-02-03T10:00:00Z',
        updated_at: '2026-02-03T10:00:00Z',
      };

      // Mock count query (for calculating next position)
      const mockCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      // Mock insert query
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEntry, error: null }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockCountQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any);

      const result = await service.add('recipe-1' as any);

      expect(result.recipe_id).toBe('recipe-1');
      expect(result.position).toBe(0);
      expect(result.status).toBe('queued');
    });

    it('should throw error when adding duplicate recipe', async () => {
      const mockError = { code: '23505', message: 'duplicate key value' };

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      await expect(service.add('recipe-1' as any)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove entry from queue', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      await service.remove('entry-1' as any);

      expect(mockSupabase.from).toHaveBeenCalledWith('recipe_queue');
    });

    it('should throw NotFoundError when entry does not exist', async () => {
      const mockError = { code: 'PGRST116', message: 'not found' };

      vi.mocked(mockSupabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      } as any);

      await expect(service.remove('nonexistent-id' as any)).rejects.toThrow(NotFoundError);
    });
  });

  describe('reorder', () => {
    it('should update position for drag-and-drop', async () => {
      vi.mocked(mockSupabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      await service.reorder('entry-1' as any, 3);

      expect(mockSupabase.from).toHaveBeenCalledWith('recipe_queue');
    });

    it('should throw error for negative position', async () => {
      await expect(service.reorder('entry-1' as any, -1)).rejects.toThrow();
    });
  });

  describe('markAsCooked', () => {
    it('should remove from queue and create cooking event', async () => {
      const mockEntry = {
        id: 'entry-1',
        household_id: 'household-1',
        recipe_id: 'recipe-1',
        added_by: 'user-1',
        position: 0,
        status: 'queued',
        notes: null,
        created_at: '2026-02-03T10:00:00Z',
        updated_at: '2026-02-03T10:00:00Z',
      };

      const mockRecipe = {
        id: 'recipe-1',
        current_version_id: 'version-1',
        household_id: 'household-1',
      };

      // Mock getById
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEntry, error: null }),
      } as any);

      // Mock recipe fetch
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRecipe, error: null }),
      } as any);

      // Mock cooking event creation
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'event-1', recipe_id: 'recipe-1' },
          error: null,
        }),
      } as any);

      // Mock queue entry deletion
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      await service.markAsCooked('entry-1' as any, { rating: 5 });

      // Verify cooking event was created
      expect(mockSupabase.from).toHaveBeenCalledWith('cooking_events');
      // Verify queue entry was deleted
      expect(mockSupabase.from).toHaveBeenCalledWith('recipe_queue');
    });
  });

  describe('getByLaneType', () => {
    it('should group recipes by meal_type', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          household_id: 'household-1',
          recipe_id: 'recipe-1',
          added_by: 'user-1',
          position: 0,
          status: 'queued',
          notes: null,
          created_at: '2026-02-03T10:00:00Z',
          updated_at: '2026-02-03T10:00:00Z',
        },
        {
          id: 'entry-2',
          household_id: 'household-1',
          recipe_id: 'recipe-2',
          added_by: 'user-1',
          position: 1,
          status: 'queued',
          notes: null,
          created_at: '2026-02-03T11:00:00Z',
          updated_at: '2026-02-03T11:00:00Z',
        },
      ];

      const mockRecipes = [
        { id: 'recipe-1', meal_type: 'breakfast', title: 'Pancakes' },
        { id: 'recipe-2', meal_type: 'main_dish', title: 'Pasta' },
      ];

      // Mock list call
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockEntries, error: null }),
      } as any);

      // Mock recipe fetches
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockRecipes[0], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockRecipes[1], error: null }),
        } as any);

      const result = await service.getByLaneType('meal_type');

      expect(result).toHaveProperty('breakfast');
      expect(result).toHaveProperty('main_dish');
      expect(result.breakfast).toHaveLength(1);
      expect(result.main_dish).toHaveLength(1);
    });

    it('should group uncategorized recipes', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          household_id: 'household-1',
          recipe_id: 'recipe-1',
          added_by: 'user-1',
          position: 0,
          status: 'queued',
          notes: null,
          created_at: '2026-02-03T10:00:00Z',
          updated_at: '2026-02-03T10:00:00Z',
        },
      ];

      const mockRecipe = { id: 'recipe-1', meal_type: null, title: 'Unknown Recipe' };

      // Mock list call
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockEntries, error: null }),
      } as any);

      // Mock recipe fetch
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRecipe, error: null }),
      } as any);

      const result = await service.getByLaneType('meal_type');

      expect(result).toHaveProperty('uncategorized');
      expect(result.uncategorized).toHaveLength(1);
    });
  });
});
