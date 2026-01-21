import { NotFoundError, ValidationError, AppError } from '@commontable/types';
import type { MealRequest, MealRequestId } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MealRequestService, type CreateMealRequestInput } from './MealRequestService';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const from = vi.fn();
  const select = vi.fn();
  const eq = vi.fn();
  const single = vi.fn();
  const insert = vi.fn();
  const update = vi.fn();
  const order = vi.fn();

  from.mockReturnValue({ select, insert, update, eq });
  select.mockReturnValue({ eq, order, single });
  eq.mockReturnValue({ eq, select, single });
  order.mockReturnValue({ eq, select, order });
  single.mockReturnValue({ single });

  return {
    from,
    select,
    eq,
    single,
    insert,
    update,
    order,
  } as unknown as SupabaseClient;
};

describe('MealRequestService', () => {
  let service: MealRequestService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new MealRequestService(mockSupabase as unknown as SupabaseClient);
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should fetch all meal requests when no filter provided', async () => {
      const mockRequests: MealRequest[] = [
        {
          id: 'request-1' as MealRequestId,
          household_id: 'household-1' as any,
          recipe_id: null,
          requested_by: 'user-1' as any,
          requested_date: new Date('2026-01-25'),
          requested_meal_slot: 'dinner',
          notes: 'Test request',
          status: 'open',
          priority: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockRequests,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.list();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('request-1');
      expect(mockSupabase.from).toHaveBeenCalledWith('meal_requests');
    });

    it('should filter by status when provided', async () => {
      const mockRequests: MealRequest[] = [
        {
          id: 'request-1' as MealRequestId,
          household_id: 'household-1' as any,
          recipe_id: null,
          requested_by: 'user-1' as any,
          requested_date: new Date('2026-01-25'),
          requested_meal_slot: 'dinner',
          notes: 'Test request',
          status: 'open',
          priority: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockRequests,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.list({ status: 'open' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('open');
    });

    it('should throw AppError on database error', async () => {
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Database error'),
              }),
            }),
          }),
        }),
      } as any);

      await expect(service.list()).rejects.toThrow(AppError);
    });
  });

  describe('getById', () => {
    it('should fetch a meal request by ID', async () => {
      const mockRequest: MealRequest = {
        id: 'request-1' as MealRequestId,
        household_id: 'household-1' as any,
        recipe_id: null,
        requested_by: 'user-1' as any,
        requested_date: new Date('2026-01-25'),
        requested_meal_slot: 'dinner',
        notes: 'Test request',
        status: 'open',
        priority: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockRequest,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await service.getById('request-1' as MealRequestId);

      expect(result.id).toBe('request-1');
      expect(result.status).toBe('open');
    });

    it('should throw NotFoundError when request does not exist', async () => {
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(service.getById('nonexistent' as MealRequestId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create a meal request with recipe', async () => {
      const recipeId = '123e4567-e89b-12d3-a456-426614174000';

      const input: CreateMealRequestInput = {
        recipe_id: recipeId,
        requested_date: new Date('2026-01-25'),
        requested_meal_slot: 'dinner',
        notes: null,
      };

      const mockCreatedRequest: MealRequest = {
        id: 'request-1' as MealRequestId,
        household_id: 'household-1' as any,
        recipe_id: recipeId as any,
        requested_by: 'user-1' as any,
        requested_date: new Date('2026-01-25'),
        requested_meal_slot: 'dinner',
        notes: null,
        status: 'open',
        priority: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedRequest,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await service.create(input);

      expect(result.id).toBe('request-1');
      expect(result.recipe_id).toBe(recipeId);
      expect(result.status).toBe('open');
    });

    it('should create a meal request with notes only', async () => {
      const input: CreateMealRequestInput = {
        recipe_id: null,
        requested_date: new Date('2026-01-25'),
        requested_meal_slot: 'dinner',
        notes: 'I want pasta carbonara',
      };

      const mockCreatedRequest: MealRequest = {
        id: 'request-1' as MealRequestId,
        household_id: 'household-1' as any,
        recipe_id: null,
        requested_by: 'user-1' as any,
        requested_date: new Date('2026-01-25'),
        requested_meal_slot: 'dinner',
        notes: 'I want pasta carbonara',
        status: 'open',
        priority: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedRequest,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await service.create(input);

      expect(result.id).toBe('request-1');
      expect(result.recipe_id).toBeNull();
      expect(result.notes).toBe('I want pasta carbonara');
    });

    it('should throw ValidationError when neither recipe nor notes provided', async () => {
      const input: CreateMealRequestInput = {
        recipe_id: null,
        requested_date: new Date('2026-01-25'),
        requested_meal_slot: 'dinner',
        notes: null,
      };

      await expect(service.create(input)).rejects.toThrow(ValidationError);
    });
  });

  describe('updateStatus', () => {
    it('should update meal request status', async () => {
      const mockRequest: MealRequest = {
        id: 'request-1' as MealRequestId,
        household_id: 'household-1' as any,
        recipe_id: null,
        requested_by: 'user-1' as any,
        requested_date: new Date('2026-01-25'),
        requested_meal_slot: 'dinner',
        notes: 'Test request',
        status: 'planned',
        priority: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockRequest,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.updateStatus('request-1' as MealRequestId, 'planned');

      expect(result.status).toBe('planned');
    });

    it('should throw ValidationError for invalid status', async () => {
      await expect(
        service.updateStatus('request-1' as MealRequestId, 'invalid' as any),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updatePriority', () => {
    it('should update meal request priority', async () => {
      const mockRequest: MealRequest = {
        id: 'request-1' as MealRequestId,
        household_id: 'household-1' as any,
        recipe_id: null,
        requested_by: 'user-1' as any,
        requested_date: new Date('2026-01-25'),
        requested_meal_slot: 'dinner',
        notes: 'Test request',
        status: 'open',
        priority: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockRequest,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.updatePriority('request-1' as MealRequestId, 10);

      expect(result.priority).toBe(10);
    });

    it('should throw ValidationError for non-integer priority', async () => {
      await expect(service.updatePriority('request-1' as MealRequestId, 10.5)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  // addToCalendar tests will be added after implementing CalendarService integration
});
