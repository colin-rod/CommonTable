import type { CalendarEntry, CalendarEntryId } from '@commontable/api-client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createCalendarEntry,
  updateCalendarEntry,
  deleteCalendarEntry,
  markCalendarEntryCompleted,
} from './calendar';

const { mockSupabaseClient, mockCalendarService, calendarServiceClients } = vi.hoisted(() => ({
  mockSupabaseClient: {},
  mockCalendarService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateStatus: vi.fn(),
  },
  calendarServiceClients: [] as unknown[],
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
}));

vi.mock('@commontable/api-client', () => ({
  CalendarService: vi.fn((client: unknown) => {
    calendarServiceClients.push(client);
    return mockCalendarService;
  }),
}));

describe('calendar server actions', () => {
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
    calendarServiceClients.length = 0;
  });

  describe('createCalendarEntry', () => {
    it('should create a calendar entry and return success', async () => {
      mockCalendarService.create.mockResolvedValue(mockEntry);

      const input = {
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'dinner' as const,
        notes: 'Family dinner',
      };

      const result = await createCalendarEntry(input);

      expect(result).toEqual({ success: true, data: mockEntry });
      expect(mockCalendarService.create).toHaveBeenCalledWith(input);
      expect(calendarServiceClients.at(-1)).toBe(mockSupabaseClient);
    });

    it('should return error when creation fails', async () => {
      const error = new Error('Create failed');
      mockCalendarService.create.mockRejectedValue(error);

      const input = {
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'dinner' as const,
        notes: null,
      };

      const result = await createCalendarEntry(input);

      expect(result).toEqual({ success: false, error: 'Create failed' });
    });

    it('should handle unknown errors', async () => {
      mockCalendarService.create.mockRejectedValue('Unknown error');

      const input = {
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'dinner' as const,
        notes: null,
      };

      const result = await createCalendarEntry(input);

      expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
    });
  });

  describe('updateCalendarEntry', () => {
    it('should update a calendar entry and return success', async () => {
      const updatedEntry = { ...mockEntry, notes: 'Updated dinner' };
      mockCalendarService.update.mockResolvedValue(updatedEntry);

      const input = {
        notes: 'Updated dinner',
      };

      const result = await updateCalendarEntry('entry-1' as CalendarEntryId, input);

      expect(result).toEqual({ success: true, data: updatedEntry });
      expect(mockCalendarService.update).toHaveBeenCalledWith('entry-1', input);
      expect(calendarServiceClients.at(-1)).toBe(mockSupabaseClient);
    });

    it('should return error when update fails', async () => {
      const error = new Error('Update failed');
      mockCalendarService.update.mockRejectedValue(error);

      const input = {
        notes: 'Updated dinner',
      };

      const result = await updateCalendarEntry('entry-1' as CalendarEntryId, input);

      expect(result).toEqual({ success: false, error: 'Update failed' });
    });
  });

  describe('deleteCalendarEntry', () => {
    it('should delete a calendar entry and return success', async () => {
      mockCalendarService.delete.mockResolvedValue(undefined);

      const result = await deleteCalendarEntry('entry-1' as CalendarEntryId);

      expect(result).toEqual({ success: true, data: undefined });
      expect(mockCalendarService.delete).toHaveBeenCalledWith('entry-1');
      expect(calendarServiceClients.at(-1)).toBe(mockSupabaseClient);
    });

    it('should return error when deletion fails', async () => {
      const error = new Error('Delete failed');
      mockCalendarService.delete.mockRejectedValue(error);

      const result = await deleteCalendarEntry('entry-1' as CalendarEntryId);

      expect(result).toEqual({ success: false, error: 'Delete failed' });
    });
  });

  describe('markCalendarEntryCompleted', () => {
    it('should mark entry as completed and return success', async () => {
      const completedEntry = { ...mockEntry, status: 'completed' as const };
      mockCalendarService.updateStatus.mockResolvedValue(completedEntry);

      const result = await markCalendarEntryCompleted('entry-1' as CalendarEntryId);

      expect(result).toEqual({ success: true, data: completedEntry });
      expect(mockCalendarService.updateStatus).toHaveBeenCalledWith('entry-1', 'completed');
      expect(calendarServiceClients.at(-1)).toBe(mockSupabaseClient);
    });

    it('should return error when status update fails', async () => {
      const error = new Error('Status update failed');
      mockCalendarService.updateStatus.mockRejectedValue(error);

      const result = await markCalendarEntryCompleted('entry-1' as CalendarEntryId);

      expect(result).toEqual({ success: false, error: 'Status update failed' });
    });
  });
});
