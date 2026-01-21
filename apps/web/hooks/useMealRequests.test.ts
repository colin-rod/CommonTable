import { MealRequestService } from '@commontable/api-client';
import type {
  MealRequest,
  MealRequestId,
  MealRequestStatus,
  HouseholdId,
  Household,
  CalendarEntry,
} from '@commontable/types';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuth } from './useAuth';
import { useMealRequests } from './useMealRequests';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock MealRequestService
vi.mock('@commontable/api-client', () => ({
  MealRequestService: vi.fn(),
}));

// Mock useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('useMealRequests Hook', () => {
  const mockHouseholdId = 'household-123' as HouseholdId;

  const mockHousehold: Household = {
    id: mockHouseholdId,
    name: 'Test Household',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockRequests: MealRequest[] = [
    {
      id: 'request-1' as MealRequestId,
      household_id: mockHouseholdId,
      recipe_id: 'recipe-1' as any,
      requested_by: 'user-1' as any,
      requested_date: new Date('2026-01-25'),
      requested_meal_slot: 'dinner',
      notes: null,
      status: 'open',
      priority: 0,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'request-2' as MealRequestId,
      household_id: mockHouseholdId,
      recipe_id: null,
      requested_by: 'user-2' as any,
      requested_date: new Date('2026-01-26'),
      requested_meal_slot: 'lunch',
      notes: 'I want pasta',
      status: 'open',
      priority: 5,
      created_at: new Date('2024-01-02T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z'),
    },
  ];

  const mockMealRequestService = {
    list: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    updatePriority: vi.fn(),
    addToCalendar: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(MealRequestService).mockImplementation(() => mockMealRequestService as any);
    vi.mocked(useAuth).mockReturnValue({
      household: mockHousehold,
    } as any);
  });

  describe('Loading meal requests on mount', () => {
    it('should load meal requests on mount', async () => {
      mockMealRequestService.list.mockResolvedValue(mockRequests);

      const { result } = renderHook(() => useMealRequests());

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.requests).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.requests).toEqual(mockRequests);
      expect(result.current.error).toBeNull();
      expect(mockMealRequestService.list).toHaveBeenCalledWith(undefined);
    });

    it('should load meal requests with status filter', async () => {
      const plannedRequests = mockRequests.filter((r) => r.status === 'open');
      mockMealRequestService.list.mockResolvedValue(plannedRequests);

      const { result } = renderHook(() => useMealRequests({ status: 'open' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockMealRequestService.list).toHaveBeenCalledWith({ status: 'open' });
    });

    it('should handle empty request list', async () => {
      mockMealRequestService.list.mockResolvedValue([]);

      const { result } = renderHook(() => useMealRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.requests).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors', async () => {
      const fetchError = new Error('Failed to fetch meal requests');
      mockMealRequestService.list.mockRejectedValue(fetchError);

      const { result } = renderHook(() => useMealRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.requests).toEqual([]);
      expect(result.current.error).toEqual(fetchError);
    });
  });

  describe('createRequest', () => {
    it('should create a meal request', async () => {
      const newRequest: MealRequest = {
        id: 'request-3' as MealRequestId,
        household_id: mockHouseholdId,
        recipe_id: 'recipe-2' as any,
        requested_by: 'user-1' as any,
        requested_date: new Date('2026-01-27'),
        requested_meal_slot: 'breakfast',
        notes: null,
        status: 'open',
        priority: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockMealRequestService.list.mockResolvedValue(mockRequests);
      mockMealRequestService.create.mockResolvedValue(newRequest);

      const { result } = renderHook(() => useMealRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create request
      await act(async () => {
        await result.current.createRequest({
          recipe_id: 'recipe-2',
          requested_date: new Date('2026-01-27'),
          requested_meal_slot: 'breakfast',
          notes: null,
        });
      });

      // Check optimistic update
      await waitFor(() => {
        expect(result.current.requests).toContainEqual(newRequest);
      });
    });

    it('should handle create errors', async () => {
      const createError = new Error('Failed to create request');
      mockMealRequestService.list.mockResolvedValue(mockRequests);
      mockMealRequestService.create.mockRejectedValue(createError);

      const { result } = renderHook(() => useMealRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Attempt to create request (should throw)
      await expect(
        result.current.createRequest({
          recipe_id: null,
          requested_date: new Date('2026-01-27'),
          requested_meal_slot: 'breakfast',
          notes: 'Test',
        }),
      ).rejects.toThrow(createError);
    });
  });

  describe('updateStatus', () => {
    it('should update request status', async () => {
      const updatedRequest = { ...mockRequests[0], status: 'planned' as MealRequestStatus };
      mockMealRequestService.list.mockResolvedValue(mockRequests);
      mockMealRequestService.updateStatus.mockResolvedValue(updatedRequest);

      const { result } = renderHook(() => useMealRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Update status
      await act(async () => {
        await result.current.updateStatus('request-1' as MealRequestId, 'planned');
      });

      // Check optimistic update
      await waitFor(() => {
        const updated = result.current.requests.find((r) => r.id === 'request-1');
        expect(updated?.status).toBe('planned');
      });
    });
  });

  describe('updatePriority', () => {
    it('should update request priority', async () => {
      const updatedRequest = { ...mockRequests[0], priority: 10 };
      mockMealRequestService.list.mockResolvedValue(mockRequests);
      mockMealRequestService.updatePriority.mockResolvedValue(updatedRequest);

      const { result } = renderHook(() => useMealRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Update priority
      await act(async () => {
        await result.current.updatePriority('request-1' as MealRequestId, 10);
      });

      // Check optimistic update
      await waitFor(() => {
        const updated = result.current.requests.find((r) => r.id === 'request-1');
        expect(updated?.priority).toBe(10);
      });
    });
  });

  describe('addToCalendar', () => {
    it('should add request to calendar and update status', async () => {
      const updatedRequest = { ...mockRequests[0], status: 'planned' as MealRequestStatus };
      const calendarEntry: CalendarEntry = {
        id: 'cal-1' as any,
        household_id: mockHouseholdId,
        recipe_id: mockRequests[0].recipe_id,
        planned_date: mockRequests[0].requested_date,
        meal_slot: mockRequests[0].requested_meal_slot,
        status: 'planned',
        notes: null,
        created_by: 'user-1' as any,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockMealRequestService.list.mockResolvedValue(mockRequests);
      mockMealRequestService.addToCalendar.mockResolvedValue({
        request: updatedRequest,
        calendarEntry,
      });

      const { result } = renderHook(() => useMealRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Add to calendar
      let response: { request: MealRequest; calendarEntry: CalendarEntry };
      await act(async () => {
        response = await result.current.addToCalendar('request-1' as MealRequestId);
      });

      // Check return value
      expect(response!.request.status).toBe('planned');
      expect(response!.calendarEntry.id).toBe('cal-1');

      // Check optimistic update
      await waitFor(() => {
        const updated = result.current.requests.find((r) => r.id === 'request-1');
        expect(updated?.status).toBe('planned');
      });
    });
  });

  describe('refresh', () => {
    it('should reload meal requests', async () => {
      mockMealRequestService.list.mockResolvedValue(mockRequests);

      const { result } = renderHook(() => useMealRequests());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock calls
      mockMealRequestService.list.mockClear();

      // Refresh
      result.current.refresh();

      // Should call list again
      await waitFor(() => {
        expect(mockMealRequestService.list).toHaveBeenCalledTimes(1);
      });
    });
  });
});
