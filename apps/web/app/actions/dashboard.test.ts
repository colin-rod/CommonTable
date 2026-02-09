import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  getUpcomingCalendarEntries,
  getPendingAiTagSuggestionsCount,
  getPendingMealRequestsCount,
} from './dashboard';

const { mockSupabaseClient, mockGetCurrentUserHouseholdId } = vi.hoisted(() => ({
  mockSupabaseClient: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
  mockGetCurrentUserHouseholdId: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
}));

vi.mock('@/lib/server/household', () => ({
  getCurrentUserHouseholdId: mockGetCurrentUserHouseholdId,
}));

describe('dashboard server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUpcomingCalendarEntries', () => {
    const mockHouseholdId = 'household-1';

    const today = new Date('2026-01-26T12:00:00Z');
    const tomorrow = new Date('2026-01-27T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(today);
      mockGetCurrentUserHouseholdId.mockResolvedValue(mockHouseholdId);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should fetch calendar entries for next 7 days with recipe titles', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          household_id: 'household-1',
          recipe_id: 'recipe-1',
          planned_date: tomorrow.toISOString(),
          meal_slot: 'breakfast',
          status: 'planned',
          notes: null,
          created_by: 'user-1',
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
          recipes: { title: 'Pancakes' },
        },
        {
          id: 'entry-2',
          household_id: 'household-1',
          recipe_id: 'recipe-2',
          planned_date: tomorrow.toISOString(),
          meal_slot: 'dinner',
          status: 'planned',
          notes: null,
          created_by: 'user-1',
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
          recipes: { title: 'Pasta' },
        },
      ];

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      // Second order call resolves with data
      mockQueryChain.order
        .mockReturnValueOnce(mockQueryChain)
        .mockResolvedValueOnce({ data: mockEntries, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getUpcomingCalendarEntries();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]!.recipe_title).toBe('Pancakes');
        expect(result.data[1]!.recipe_title).toBe('Pasta');
      }

      expect(mockQueryChain.select).toHaveBeenCalledWith('*, recipes(title)');
      expect(mockQueryChain.neq).toHaveBeenCalledWith('status', 'cancelled');
    });

    it('should filter out cancelled entries', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          household_id: 'household-1',
          recipe_id: 'recipe-1',
          planned_date: tomorrow.toISOString(),
          meal_slot: 'breakfast',
          status: 'planned',
          notes: null,
          created_by: 'user-1',
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
          recipes: { title: 'Pancakes' },
        },
      ];

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      mockQueryChain.order
        .mockReturnValueOnce(mockQueryChain)
        .mockResolvedValueOnce({ data: mockEntries, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      await getUpcomingCalendarEntries();

      expect(mockQueryChain.neq).toHaveBeenCalledWith('status', 'cancelled');
    });

    it('should handle entries with null recipe_id', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          household_id: 'household-1',
          recipe_id: null,
          planned_date: tomorrow.toISOString(),
          meal_slot: 'breakfast',
          status: 'planned',
          notes: null,
          created_by: 'user-1',
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
          recipes: null,
        },
      ];

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      mockQueryChain.order
        .mockReturnValueOnce(mockQueryChain)
        .mockResolvedValueOnce({ data: mockEntries, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getUpcomingCalendarEntries();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]!.recipe_title).toBeNull();
      }
    });

    it('should sort entries by planned_date then meal_slot', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          household_id: 'household-1',
          recipe_id: 'recipe-1',
          planned_date: tomorrow.toISOString(),
          meal_slot: 'breakfast',
          status: 'planned',
          notes: null,
          created_by: 'user-1',
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
          recipes: { title: 'Pancakes' },
        },
        {
          id: 'entry-2',
          household_id: 'household-1',
          recipe_id: 'recipe-2',
          planned_date: tomorrow.toISOString(),
          meal_slot: 'dinner',
          status: 'planned',
          notes: null,
          created_by: 'user-1',
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
          recipes: { title: 'Pasta' },
        },
      ];

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      mockQueryChain.order
        .mockReturnValueOnce(mockQueryChain)
        .mockResolvedValueOnce({ data: mockEntries, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      await getUpcomingCalendarEntries();

      expect(mockQueryChain.order).toHaveBeenCalledWith('planned_date', { ascending: true });
      expect(mockQueryChain.order).toHaveBeenCalledWith('meal_slot', { ascending: true });
    });

    it('should return error when database query fails', async () => {
      const error = new Error('Database error');

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      mockQueryChain.order
        .mockReturnValueOnce(mockQueryChain)
        .mockResolvedValueOnce({ data: null, error });

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getUpcomingCalendarEntries();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database error');
      }
    });

    it('should return error when user is not authenticated', async () => {
      mockGetCurrentUserHouseholdId.mockRejectedValue(new Error('User not authenticated'));

      const result = await getUpcomingCalendarEntries();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not authenticated');
      }
    });

    it('should return error when user is not in a household', async () => {
      mockGetCurrentUserHouseholdId.mockRejectedValue(new Error('User not in a household'));

      const result = await getUpcomingCalendarEntries();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not in a household');
      }
    });
  });

  describe('getPendingAiTagSuggestionsCount', () => {
    const mockHouseholdId = 'household-1';

    beforeEach(() => {
      mockGetCurrentUserHouseholdId.mockResolvedValue(mockHouseholdId);
    });

    it('should return count of pending AI tag suggestions', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
      };

      // eq() for household_id via JOIN, is() for user_accepted null
      mockQueryChain.eq.mockReturnValueOnce(mockQueryChain);
      mockQueryChain.is.mockResolvedValueOnce({ count: 5, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getPendingAiTagSuggestionsCount();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(5);
      }

      expect(mockQueryChain.select).toHaveBeenCalledWith(
        'id, recipe_versions!inner(recipe_id, recipes!recipe_versions_recipe_id_fkey(household_id))',
        { count: 'exact', head: true },
      );
      expect(mockQueryChain.eq).toHaveBeenCalledWith(
        'recipe_versions.recipes.household_id',
        'household-1',
      );
      expect(mockQueryChain.is).toHaveBeenCalledWith('user_accepted', null);
    });

    it('should return 0 when no pending suggestions exist', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
      };

      mockQueryChain.eq.mockReturnValueOnce(mockQueryChain);
      mockQueryChain.is.mockResolvedValueOnce({ count: null, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getPendingAiTagSuggestionsCount();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0);
      }
    });

    it('should return error when user is not authenticated', async () => {
      mockGetCurrentUserHouseholdId.mockRejectedValue(new Error('User not authenticated'));

      const result = await getPendingAiTagSuggestionsCount();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not authenticated');
      }
    });

    it('should return error when user is not in a household', async () => {
      mockGetCurrentUserHouseholdId.mockRejectedValue(new Error('User not in a household'));

      const result = await getPendingAiTagSuggestionsCount();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not in a household');
      }
    });

    it('should return error when database query fails', async () => {
      const error = new Error('Database error');

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
      };

      mockQueryChain.eq.mockReturnValueOnce(mockQueryChain);
      mockQueryChain.is.mockResolvedValueOnce({ count: null, error });

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getPendingAiTagSuggestionsCount();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database error');
      }
    });
  });

  describe('getPendingMealRequestsCount', () => {
    const mockHouseholdId = 'household-1';

    beforeEach(() => {
      mockGetCurrentUserHouseholdId.mockResolvedValue(mockHouseholdId);
    });

    it('should return count of open meal requests', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      // First eq() for household_id, second eq() for status 'open'
      mockQueryChain.eq
        .mockReturnValueOnce(mockQueryChain)
        .mockResolvedValueOnce({ count: 3, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getPendingMealRequestsCount();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(3);
      }

      expect(mockQueryChain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockQueryChain.eq).toHaveBeenCalledWith('household_id', 'household-1');
      expect(mockQueryChain.eq).toHaveBeenCalledWith('status', 'open');
    });

    it('should return 0 when no open meal requests exist', async () => {
      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      mockQueryChain.eq
        .mockReturnValueOnce(mockQueryChain)
        .mockResolvedValueOnce({ count: null, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getPendingMealRequestsCount();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0);
      }
    });

    it('should return error when user is not authenticated', async () => {
      mockGetCurrentUserHouseholdId.mockRejectedValue(new Error('User not authenticated'));

      const result = await getPendingMealRequestsCount();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not authenticated');
      }
    });

    it('should return error when user is not in a household', async () => {
      mockGetCurrentUserHouseholdId.mockRejectedValue(new Error('User not in a household'));

      const result = await getPendingMealRequestsCount();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not in a household');
      }
    });

    it('should return error when database query fails', async () => {
      const error = new Error('Database error');

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      mockQueryChain.eq
        .mockReturnValueOnce(mockQueryChain)
        .mockResolvedValueOnce({ count: null, error });

      mockSupabaseClient.from.mockReturnValue(mockQueryChain);

      const result = await getPendingMealRequestsCount();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database error');
      }
    });
  });
});
