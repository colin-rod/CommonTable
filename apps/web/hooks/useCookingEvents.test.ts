import type {
  CookingEvent,
  CookingEventId,
  CreateCookingEventInput,
  UpdateCookingEventInput,
  HouseholdId,
  RecipeId,
} from '@commontable/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useCookingEvents } from './useCookingEvents';

import * as cookingEventActions from '@/app/actions/cookingEvent';

// Mock server actions
vi.mock('@/app/actions/cookingEvent', () => ({
  createCookingEvent: vi.fn(),
  updateCookingEvent: vi.fn(),
  deleteCookingEvent: vi.fn(),
}));

describe('useCookingEvents Hook', () => {
  const mockCookingEvent: CookingEvent = {
    id: 'event-1' as CookingEventId,
    recipe_id: 'recipe-1' as RecipeId,
    household_id: 'household-1' as HouseholdId,
    cooked_by: 'user-1' as any,
    cooked_at: '2024-01-15T12:00:00Z',
    servings: 4,
    rating: 5,
    notes: 'Delicious!',
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logMeal', () => {
    it('should create cooking event successfully', async () => {
      const input: CreateCookingEventInput = {
        recipe_id: 'recipe-1' as RecipeId,
        cooked_at: '2024-01-15T12:00:00Z',
        servings: 4,
        rating: 5,
        notes: 'Delicious!',
      };

      vi.mocked(cookingEventActions.createCookingEvent).mockResolvedValue({
        success: true,
        data: mockCookingEvent,
      });

      const { result } = renderHook(() => useCookingEvents());

      let cookedEvent: CookingEvent | null = null;

      await act(async () => {
        cookedEvent = await result.current.logMeal(input);
      });

      expect(cookingEventActions.createCookingEvent).toHaveBeenCalledWith(input);
      expect(cookedEvent).toEqual(mockCookingEvent);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle errors', async () => {
      const input: CreateCookingEventInput = {
        recipe_id: 'recipe-1' as RecipeId,
        cooked_at: '2024-01-15T12:00:00Z',
        servings: 4,
      };

      const errorMessage = 'Failed to log meal';
      vi.mocked(cookingEventActions.createCookingEvent).mockResolvedValue({
        success: false,
        error: errorMessage,
      } as any);

      const { result } = renderHook(() => useCookingEvents());

      let cookedEvent: CookingEvent | null | undefined;

      await act(async () => {
        cookedEvent = await result.current.logMeal(input);
      });

      expect(cookedEvent).toBeNull();
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    it('should set loading state correctly', async () => {
      const input: CreateCookingEventInput = {
        recipe_id: 'recipe-1' as RecipeId,
        cooked_at: '2024-01-15T12:00:00Z',
        servings: 4,
      };

      vi.mocked(cookingEventActions.createCookingEvent).mockResolvedValue({
        success: true,
        data: mockCookingEvent,
      });

      const { result } = renderHook(() => useCookingEvents());

      expect(result.current.loading).toBe(false);

      await act(async () => {
        await result.current.logMeal(input);
      });

      expect(result.current.loading).toBe(false);
    });

    it('should handle thrown errors', async () => {
      const input: CreateCookingEventInput = {
        recipe_id: 'recipe-1' as RecipeId,
        cooked_at: '2024-01-15T12:00:00Z',
        servings: 4,
      };

      const error = new Error('Network error');
      vi.mocked(cookingEventActions.createCookingEvent).mockRejectedValue(error);

      const { result } = renderHook(() => useCookingEvents());

      let cookedEvent: CookingEvent | null | undefined;

      await act(async () => {
        cookedEvent = await result.current.logMeal(input);
      });

      expect(cookedEvent).toBeNull();
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('updateRating', () => {
    it('should update rating and notes', async () => {
      const eventId = 'event-1' as CookingEventId;
      const input: UpdateCookingEventInput = {
        rating: 4,
        notes: 'Updated notes',
      };

      const updatedEvent: CookingEvent = {
        ...mockCookingEvent,
        rating: 4,
        notes: 'Updated notes',
      };

      vi.mocked(cookingEventActions.updateCookingEvent).mockResolvedValue({
        success: true,
        data: updatedEvent,
      });

      const { result } = renderHook(() => useCookingEvents());

      let updated: CookingEvent | null | undefined;

      await act(async () => {
        updated = await result.current.updateRating(eventId, input);
      });

      expect(cookingEventActions.updateCookingEvent).toHaveBeenCalledWith(eventId, input);
      expect(updated).toEqual(updatedEvent);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle errors', async () => {
      const eventId = 'event-1' as CookingEventId;
      const input: UpdateCookingEventInput = {
        rating: 3,
      };

      const errorMessage = 'Failed to update event';
      vi.mocked(cookingEventActions.updateCookingEvent).mockResolvedValue({
        success: false,
        error: errorMessage,
      } as any);

      const { result } = renderHook(() => useCookingEvents());

      let updated: CookingEvent | null | undefined;

      await act(async () => {
        updated = await result.current.updateRating(eventId, input);
      });

      expect(updated).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle thrown errors', async () => {
      const eventId = 'event-1' as CookingEventId;
      const input: UpdateCookingEventInput = {
        rating: 2,
      };

      const error = new Error('Database error');
      vi.mocked(cookingEventActions.updateCookingEvent).mockRejectedValue(error);

      const { result } = renderHook(() => useCookingEvents());

      let updated: CookingEvent | null | undefined;

      await act(async () => {
        updated = await result.current.updateRating(eventId, input);
      });

      expect(updated).toBeNull();
      expect(result.current.error).toBe('Database error');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      const eventId = 'event-1' as CookingEventId;

      vi.mocked(cookingEventActions.deleteCookingEvent).mockResolvedValue({
        success: true,
        data: null,
      } as any);

      const { result } = renderHook(() => useCookingEvents());

      let deleted: boolean | undefined;

      await act(async () => {
        deleted = await result.current.deleteEvent(eventId);
      });

      expect(cookingEventActions.deleteCookingEvent).toHaveBeenCalledWith(eventId);
      expect(deleted).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle errors', async () => {
      const eventId = 'event-1' as CookingEventId;

      const errorMessage = 'Failed to delete event';
      vi.mocked(cookingEventActions.deleteCookingEvent).mockResolvedValue({
        success: false,
        error: errorMessage,
      } as any);

      const { result } = renderHook(() => useCookingEvents());

      let deleted: boolean | undefined;

      await act(async () => {
        deleted = await result.current.deleteEvent(eventId);
      });

      expect(deleted).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle thrown errors', async () => {
      const eventId = 'event-1' as CookingEventId;

      const error = new Error('Permission denied');
      vi.mocked(cookingEventActions.deleteCookingEvent).mockRejectedValue(error);

      const { result } = renderHook(() => useCookingEvents());

      let deleted: boolean | undefined;

      await act(async () => {
        deleted = await result.current.deleteEvent(eventId);
      });

      expect(deleted).toBe(false);
      expect(result.current.error).toBe('Permission denied');
    });
  });

  describe('error state', () => {
    it('should clear error on successful operation after failure', async () => {
      const input: CreateCookingEventInput = {
        recipe_id: 'recipe-1' as RecipeId,
        cooked_at: '2024-01-15T12:00:00Z',
        servings: 4,
      };

      // First call fails
      vi.mocked(cookingEventActions.createCookingEvent).mockResolvedValueOnce({
        success: false,
        error: 'Failed',
      } as any);

      const { result } = renderHook(() => useCookingEvents());

      await act(async () => {
        await result.current.logMeal(input);
      });

      expect(result.current.error).toBe('Failed');

      // Second call succeeds
      vi.mocked(cookingEventActions.createCookingEvent).mockResolvedValueOnce({
        success: true,
        data: mockCookingEvent,
      });

      await act(async () => {
        await result.current.logMeal(input);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
