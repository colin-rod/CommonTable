import type { CalendarEntry, CalendarEntryId } from '@commontable/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useCalendar } from './useCalendar';

// Mock CalendarService
const mockCalendarService = {
  getEntriesForWeek: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  updateStatus: vi.fn(),
};

vi.mock('@commontable/api-client', () => ({
  CalendarService: vi.fn(() => mockCalendarService),
  createClient: vi.fn(() => ({})),
}));

describe('useCalendar', () => {
  const mockWeekStart = new Date('2026-01-18'); // Sunday
  const mockWeekEnd = new Date('2026-01-24'); // Saturday

  const mockEntry: CalendarEntry = {
    id: 'entry-1' as CalendarEntryId,
    household_id: 'household-1' as any,
    recipe_id: 'recipe-1' as any,
    planned_date: new Date('2026-01-20'),
    meal_slot: 'dinner',
    status: 'planned',
    notes: 'Family dinner',
    created_by: 'user-1' as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization and data fetching', () => {
    it('should start with loading state', () => {
      mockCalendarService.getEntriesForWeek.mockResolvedValue([]);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      expect(result.current.loading).toBe(true);
      expect(result.current.entries).toEqual([]);
    });

    it('should fetch entries for the week on mount', async () => {
      mockCalendarService.getEntriesForWeek.mockResolvedValue([mockEntry]);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCalendarService.getEntriesForWeek).toHaveBeenCalledWith(
        mockWeekStart,
        mockWeekEnd,
      );
      expect(result.current.entries).toEqual([mockEntry]);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch');
      mockCalendarService.getEntriesForWeek.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.entries).toEqual([]);
    });

    it('should refetch when week dates change', async () => {
      mockCalendarService.getEntriesForWeek.mockResolvedValue([mockEntry]);

      const { result, rerender } = renderHook(
        ({ weekStart, weekEnd }) => useCalendar(weekStart, weekEnd),
        {
          initialProps: {
            weekStart: mockWeekStart,
            weekEnd: mockWeekEnd,
          },
        },
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCalendarService.getEntriesForWeek).toHaveBeenCalledTimes(1);

      // Change to next week
      const nextWeekStart = new Date('2026-01-25');
      const nextWeekEnd = new Date('2026-01-31');

      rerender({ weekStart: nextWeekStart, weekEnd: nextWeekEnd });

      await waitFor(() => {
        expect(mockCalendarService.getEntriesForWeek).toHaveBeenCalledTimes(2);
      });

      expect(mockCalendarService.getEntriesForWeek).toHaveBeenLastCalledWith(
        nextWeekStart,
        nextWeekEnd,
      );
    });
  });

  describe('createEntry', () => {
    it('should create a new entry and update state', async () => {
      const newEntry = { ...mockEntry, id: 'entry-2' as CalendarEntryId };
      mockCalendarService.getEntriesForWeek.mockResolvedValue([mockEntry]);
      mockCalendarService.create.mockResolvedValue(newEntry);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const input = {
        recipe_id: 'recipe-2' as any,
        planned_date: new Date('2026-01-21'),
        meal_slot: 'lunch' as const,
        notes: 'Quick lunch',
      };

      await result.current.createEntry(input);

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(2);
      });

      expect(mockCalendarService.create).toHaveBeenCalledWith(input);
      expect(result.current.entries).toContainEqual(newEntry);
    });

    it('should handle create errors', async () => {
      const error = new Error('Create failed');
      mockCalendarService.getEntriesForWeek.mockResolvedValue([]);
      mockCalendarService.create.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const input = {
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'dinner' as const,
        notes: null,
      };

      await expect(result.current.createEntry(input)).rejects.toThrow('Create failed');
    });
  });

  describe('updateEntry', () => {
    it('should update an existing entry', async () => {
      const updatedEntry = { ...mockEntry, notes: 'Updated dinner' };
      mockCalendarService.getEntriesForWeek.mockResolvedValue([mockEntry]);
      mockCalendarService.update.mockResolvedValue(updatedEntry);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const input = {
        notes: 'Updated dinner',
      };

      await result.current.updateEntry('entry-1' as CalendarEntryId, input);

      await waitFor(() => {
        expect(result.current.entries[0].notes).toBe('Updated dinner');
      });

      expect(mockCalendarService.update).toHaveBeenCalledWith('entry-1', input);
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockCalendarService.getEntriesForWeek.mockResolvedValue([mockEntry]);
      mockCalendarService.update.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.updateEntry('entry-1' as CalendarEntryId, {})).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('deleteEntry', () => {
    it('should delete an entry and update state', async () => {
      mockCalendarService.getEntriesForWeek.mockResolvedValue([mockEntry]);
      mockCalendarService.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(1);

      await result.current.deleteEntry('entry-1' as CalendarEntryId);

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(0);
      });

      expect(mockCalendarService.delete).toHaveBeenCalledWith('entry-1');
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      mockCalendarService.getEntriesForWeek.mockResolvedValue([mockEntry]);
      mockCalendarService.delete.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.deleteEntry('entry-1' as CalendarEntryId)).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  describe('markCompleted', () => {
    it('should update entry status to completed', async () => {
      const completedEntry = { ...mockEntry, status: 'completed' as const };
      mockCalendarService.getEntriesForWeek.mockResolvedValue([mockEntry]);
      mockCalendarService.updateStatus.mockResolvedValue(completedEntry);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.markCompleted('entry-1' as CalendarEntryId);

      await waitFor(() => {
        expect(result.current.entries[0].status).toBe('completed');
      });

      expect(mockCalendarService.updateStatus).toHaveBeenCalledWith('entry-1', 'completed');
    });

    it('should handle status update errors', async () => {
      const error = new Error('Status update failed');
      mockCalendarService.getEntriesForWeek.mockResolvedValue([mockEntry]);
      mockCalendarService.updateStatus.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.markCompleted('entry-1' as CalendarEntryId)).rejects.toThrow(
        'Status update failed',
      );
    });
  });

  describe('refresh', () => {
    it('should refetch entries', async () => {
      mockCalendarService.getEntriesForWeek.mockResolvedValue([mockEntry]);

      const { result } = renderHook(() => useCalendar(mockWeekStart, mockWeekEnd));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCalendarService.getEntriesForWeek).toHaveBeenCalledTimes(1);

      await result.current.refresh();

      expect(mockCalendarService.getEntriesForWeek).toHaveBeenCalledTimes(2);
    });
  });
});
