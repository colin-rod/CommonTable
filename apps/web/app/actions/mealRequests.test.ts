import type { MealRequest, MealRequestId, CalendarEntry } from '@commontable/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createMealRequest,
  updateMealRequestStatus,
  updateMealRequestPriority,
  addMealRequestToCalendar,
  deleteMealRequest,
} from './mealRequests';

const {
  mockSupabaseClient,
  mockMealRequestService,
  mockMealRequestsTable,
  mealRequestServiceClients,
} = vi.hoisted(() => ({
  mockSupabaseClient: {},
  mockMealRequestService: {
    create: vi.fn(),
    updateStatus: vi.fn(),
    updatePriority: vi.fn(),
    addToCalendar: vi.fn(),
  },
  mockMealRequestsTable: {
    delete: vi.fn(() => mockMealRequestsTable),
    eq: vi.fn(),
  },
  mealRequestServiceClients: [] as unknown[],
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    ...mockSupabaseClient,
    from: (table: string) => {
      if (table === 'meal_requests') return mockMealRequestsTable;
      return {};
    },
  })),
}));

vi.mock('@commontable/api-client', () => ({
  MealRequestService: vi.fn((client: unknown) => {
    mealRequestServiceClients.push(client);
    return mockMealRequestService;
  }),
}));

vi.mock('@/lib/utils/server-actions', () => ({
  formatError: vi.fn((error) => {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }),
}));

describe('mealRequests server actions', () => {
  const mockMealRequest: MealRequest = {
    id: 'request-1' as MealRequestId,
    household_id: 'household-1' as any,
    requested_by: 'user-1' as any,
    recipe_id: 'recipe-1' as any,
    requested_date: new Date(),
    requested_meal_slot: 'dinner',
    notes: 'Want pasta',
    status: 'open',
    priority: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mealRequestServiceClients.length = 0;
  });

  describe('createMealRequest', () => {
    it('should create a meal request and return success', async () => {
      mockMealRequestService.create.mockResolvedValue(mockMealRequest);

      const input = {
        recipe_id: 'recipe-1' as any,
        notes: 'Want pasta',
        requested_date: new Date(),
        requested_meal_slot: 'dinner' as const,
      };

      const result = await createMealRequest(input);

      expect(result).toEqual({ success: true, data: mockMealRequest });
      expect(mockMealRequestService.create).toHaveBeenCalledWith(input);
      expect(mealRequestServiceClients.length).toBeGreaterThan(0);
    });

    it('should handle errors from service', async () => {
      const error = new Error('Create failed');
      mockMealRequestService.create.mockRejectedValue(error);

      const input = {
        recipe_id: null,
        notes: 'Want pasta',
        requested_date: new Date(),
        requested_meal_slot: 'dinner' as const,
      };

      const result = await createMealRequest(input);

      expect(result).toEqual({
        success: false,
        error: 'Create failed',
      });
    });
  });

  describe('updateMealRequestStatus', () => {
    it('should update meal request status and return success', async () => {
      const updatedRequest = { ...mockMealRequest, status: 'planned' as const };
      mockMealRequestService.updateStatus.mockResolvedValue(updatedRequest);

      const result = await updateMealRequestStatus('request-1' as MealRequestId, 'planned');

      expect(result).toEqual({ success: true, data: updatedRequest });
      expect(mockMealRequestService.updateStatus).toHaveBeenCalledWith('request-1', 'planned');
    });

    it('should handle errors from service', async () => {
      const error = new Error('Update failed');
      mockMealRequestService.updateStatus.mockRejectedValue(error);

      const result = await updateMealRequestStatus('request-1' as MealRequestId, 'planned');

      expect(result).toEqual({
        success: false,
        error: 'Update failed',
      });
    });
  });

  describe('updateMealRequestPriority', () => {
    it('should update meal request priority and return success', async () => {
      const updatedRequest = { ...mockMealRequest, priority: 5 };
      mockMealRequestService.updatePriority.mockResolvedValue(updatedRequest);

      const result = await updateMealRequestPriority('request-1' as MealRequestId, 5);

      expect(result).toEqual({ success: true, data: updatedRequest });
      expect(mockMealRequestService.updatePriority).toHaveBeenCalledWith('request-1', 5);
    });

    it('should handle errors from service', async () => {
      const error = new Error('Update failed');
      mockMealRequestService.updatePriority.mockRejectedValue(error);

      const result = await updateMealRequestPriority('request-1' as MealRequestId, 5);

      expect(result).toEqual({
        success: false,
        error: 'Update failed',
      });
    });
  });

  describe('addMealRequestToCalendar', () => {
    it('should add meal request to calendar and return success', async () => {
      const mockCalendarEntry: CalendarEntry = {
        id: 'entry-1' as any,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'dinner',
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = {
        request: { ...mockMealRequest, status: 'planned' as const },
        calendarEntry: mockCalendarEntry,
      };

      mockMealRequestService.addToCalendar.mockResolvedValue(result);

      const response = await addMealRequestToCalendar('request-1' as MealRequestId);

      expect(response).toEqual({ success: true, data: result });
      expect(mockMealRequestService.addToCalendar).toHaveBeenCalledWith('request-1');
    });

    it('should handle errors from service', async () => {
      const error = new Error('Add to calendar failed');
      mockMealRequestService.addToCalendar.mockRejectedValue(error);

      const result = await addMealRequestToCalendar('request-1' as MealRequestId);

      expect(result).toEqual({
        success: false,
        error: 'Add to calendar failed',
      });
    });
  });

  describe('deleteMealRequest', () => {
    it('should delete a meal request and return success', async () => {
      mockMealRequestsTable.eq.mockResolvedValue({
        error: null,
      });

      const result = await deleteMealRequest('request-1' as MealRequestId);

      expect(result).toEqual({ success: true, data: undefined });
      expect(mockMealRequestsTable.delete).toHaveBeenCalled();
      expect(mockMealRequestsTable.eq).toHaveBeenCalledWith('id', 'request-1');
    });

    it('should handle errors from database', async () => {
      mockMealRequestsTable.eq.mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      const result = await deleteMealRequest('request-1' as MealRequestId);

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      });
    });
  });
});
