import { CookingEventService } from '@commontable/api-client';
import type {
  CookingEvent,
  CookingEventId,
  Household,
  HouseholdId,
  RecipeId,
} from '@commontable/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuth } from './useAuth';
import { useHistoricalCalendar } from './useHistoricalCalendar';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock CookingEventService
vi.mock('@commontable/api-client', () => ({
  CookingEventService: vi.fn(),
}));

// Mock useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('useHistoricalCalendar Hook', () => {
  const mockHouseholdId = 'household-123' as HouseholdId;

  const mockHousehold: Household = {
    id: mockHouseholdId,
    name: 'Test Household',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockCookingEvent1: CookingEvent = {
    id: 'event-1' as CookingEventId,
    recipe_id: 'recipe-1' as RecipeId,
    recipe_version_id: 'version-1' as any,
    household_id: mockHouseholdId,
    cooked_by: 'user-1' as any,
    cooked_at: new Date('2024-01-15T12:00:00Z'),
    servings_made: 4,
    rating: 5,
    notes: 'Delicious!',
  };

  const mockCookingEvent2: CookingEvent = {
    id: 'event-2' as CookingEventId,
    recipe_id: 'recipe-2' as RecipeId,
    recipe_version_id: 'version-2' as any,
    household_id: mockHouseholdId,
    cooked_by: 'user-2' as any,
    cooked_at: new Date('2024-01-20T18:00:00Z'),
    servings_made: 2,
    rating: 4,
    notes: null,
  };

  const mockCookingEventService = {
    getEventsForMonth: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CookingEventService).mockImplementation(() => mockCookingEventService as any);
  });

  describe('loadEvents', () => {
    it('should load events for specified month/year', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
      } as any);

      mockCookingEventService.getEventsForMonth.mockResolvedValue([
        mockCookingEvent1,
        mockCookingEvent2,
      ]);

      const { result } = renderHook(() => useHistoricalCalendar(2024, 1));

      expect(result.current.loading).toBe(true);
      expect(result.current.events).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toHaveLength(2);
      expect(result.current.events).toEqual([mockCookingEvent1, mockCookingEvent2]);
      expect(result.current.error).toBeNull();
      expect(mockCookingEventService.getEventsForMonth).toHaveBeenCalledWith(
        mockHouseholdId,
        2024,
        1,
      );
    });

    it('should return empty array when no household', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: null,
      } as any);

      const { result } = renderHook(() => useHistoricalCalendar(2024, 1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(mockCookingEventService.getEventsForMonth).not.toHaveBeenCalled();
    });

    it('should handle errors during fetch', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
      } as any);

      const error = new Error('Failed to fetch events');
      mockCookingEventService.getEventsForMonth.mockRejectedValue(error);

      const { result } = renderHook(() => useHistoricalCalendar(2024, 1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Failed to fetch events');
    });

    it('should set loading state correctly', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
      } as any);

      mockCookingEventService.getEventsForMonth.mockResolvedValue([mockCookingEvent1]);

      const { result } = renderHook(() => useHistoricalCalendar(2024, 1));

      // Initially loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not be loading after data fetch
      expect(result.current.loading).toBe(false);
    });

    it('should handle empty month (no events)', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
      } as any);

      mockCookingEventService.getEventsForMonth.mockResolvedValue([]);

      const { result } = renderHook(() => useHistoricalCalendar(2024, 2));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(mockCookingEventService.getEventsForMonth).toHaveBeenCalledWith(
        mockHouseholdId,
        2024,
        2,
      );
    });
  });

  describe('refresh', () => {
    it('should reload events when refresh is called', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
      } as any);

      mockCookingEventService.getEventsForMonth.mockResolvedValue([mockCookingEvent1]);

      const { result } = renderHook(() => useHistoricalCalendar(2024, 1));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCookingEventService.getEventsForMonth).toHaveBeenCalledTimes(1);

      // Add another event for the refresh
      mockCookingEventService.getEventsForMonth.mockResolvedValue([
        mockCookingEvent1,
        mockCookingEvent2,
      ]);

      // Call refresh
      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.events).toHaveLength(2);
      });

      expect(mockCookingEventService.getEventsForMonth).toHaveBeenCalledTimes(2);
    });
  });

  describe('month/year changes', () => {
    it('should reload events when month changes', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
      } as any);

      mockCookingEventService.getEventsForMonth.mockResolvedValue([mockCookingEvent1]);

      const { result, rerender } = renderHook(
        ({ year, month }) => useHistoricalCalendar(year, month),
        {
          initialProps: { year: 2024, month: 1 },
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCookingEventService.getEventsForMonth).toHaveBeenCalledWith(
        mockHouseholdId,
        2024,
        1,
      );

      // Change month
      mockCookingEventService.getEventsForMonth.mockResolvedValue([mockCookingEvent2]);

      rerender({ year: 2024, month: 2 });

      await waitFor(() => {
        expect(mockCookingEventService.getEventsForMonth).toHaveBeenCalledWith(
          mockHouseholdId,
          2024,
          2,
        );
      });

      expect(mockCookingEventService.getEventsForMonth).toHaveBeenCalledTimes(2);
    });

    it('should reload events when year changes', async () => {
      vi.mocked(useAuth).mockReturnValue({
        household: mockHousehold,
      } as any);

      mockCookingEventService.getEventsForMonth.mockResolvedValue([mockCookingEvent1]);

      const { result, rerender } = renderHook(
        ({ year, month }) => useHistoricalCalendar(year, month),
        {
          initialProps: { year: 2024, month: 1 },
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCookingEventService.getEventsForMonth).toHaveBeenCalledWith(
        mockHouseholdId,
        2024,
        1,
      );

      // Change year
      mockCookingEventService.getEventsForMonth.mockResolvedValue([]);

      rerender({ year: 2023, month: 1 });

      await waitFor(() => {
        expect(mockCookingEventService.getEventsForMonth).toHaveBeenCalledWith(
          mockHouseholdId,
          2023,
          1,
        );
      });

      expect(mockCookingEventService.getEventsForMonth).toHaveBeenCalledTimes(2);
    });
  });
});
