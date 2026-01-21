import type { CalendarEntry, CalendarEntryId, CalendarEntryStatus } from '@commontable/types';
import { NotFoundError, ValidationError, AppError } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CalendarService } from './CalendarService';

/**
 * Mock query builder interface
 */
interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
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
    eq: vi.fn().mockResolvedValue(defaultValue), // For delete().eq() chain
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(), // Return this for chaining to eq()
    order: vi.fn().mockReturnThis(), // Return this for chaining
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(defaultValue),
  };

  // Mock order to return the result on the second call
  (builder.order as any).mockImplementationOnce(() => builder);
  (builder.order as any).mockImplementationOnce(() => Promise.resolve(defaultValue));

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

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(() => {
    service = new CalendarService(mockSupabase);
    vi.clearAllMocks();
  });

  describe('getEntriesForWeek', () => {
    it('should fetch entries for a specific week', async () => {
      const startDate = new Date('2026-01-18');
      const endDate = new Date('2026-01-24');
      const mockEntries: CalendarEntry[] = [
        {
          id: 'entry-1' as CalendarEntryId,
          household_id: 'household-1' as any,
          recipe_id: 'recipe-1' as any,
          planned_date: new Date('2026-01-20'),
          meal_slot: 'dinner',
          status: 'planned',
          notes: null,
          created_by: 'user-1' as any,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockBuilder = createMockQueryBuilder({ data: mockEntries, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.getEntriesForWeek(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('entry-1');
      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_entries');
    });

    it('should throw AppError when database query fails', async () => {
      const startDate = new Date('2026-01-18');
      const endDate = new Date('2026-01-24');
      const dbError = new Error('Database error');

      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.getEntriesForWeek(startDate, endDate)).rejects.toThrow(AppError);
    });
  });

  describe('getById', () => {
    it('should return calendar entry when found', async () => {
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

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEntry, error: null }),
      };
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.getById('entry-1' as CalendarEntryId);

      expect(result.id).toBe('entry-1');
      expect(result.notes).toBe('Family dinner');
    });

    it('should throw NotFoundError when entry does not exist', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.getById('nonexistent' as CalendarEntryId)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw AppError when database query fails', async () => {
      const dbError = new Error('Database error');

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
      };
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.getById('entry-1' as CalendarEntryId)).rejects.toThrow(AppError);
    });
  });

  describe('create', () => {
    it('should create a new calendar entry with valid input', async () => {
      const input = {
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'dinner' as const,
        notes: 'Family dinner',
      };

      const mockEntry: CalendarEntry = {
        id: 'entry-1' as CalendarEntryId,
        household_id: 'household-1' as any,
        recipe_id: input.recipe_id,
        planned_date: input.planned_date,
        meal_slot: input.meal_slot,
        status: 'planned',
        notes: input.notes,
        created_by: 'user-1' as any,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockBuilder = createMockQueryBuilder({ data: mockEntry, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.create(input);

      expect(result.id).toBe('entry-1');
      expect(result.meal_slot).toBe('dinner');
    });

    it('should create entry without recipe_id (notes only)', async () => {
      const input = {
        recipe_id: null,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'lunch' as const,
        notes: 'Lunch meeting',
      };

      const mockEntry: CalendarEntry = {
        id: 'entry-2' as CalendarEntryId,
        household_id: 'household-1' as any,
        recipe_id: null,
        planned_date: input.planned_date,
        meal_slot: input.meal_slot,
        status: 'planned',
        notes: input.notes,
        created_by: 'user-1' as any,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockBuilder = createMockQueryBuilder({ data: mockEntry, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.create(input);

      expect(result.recipe_id).toBeNull();
      expect(result.notes).toBe('Lunch meeting');
    });

    it('should throw ValidationError with invalid meal_slot', async () => {
      const input = {
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'invalid' as any,
        notes: null,
      };

      await expect(service.create(input)).rejects.toThrow(ValidationError);
    });

    it('should throw AppError when insert fails', async () => {
      const input = {
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'dinner' as const,
        notes: null,
      };

      const dbError = new Error('Insert failed');

      const mockBuilder = createMockQueryBuilder({ data: null, error: dbError });
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.create(input)).rejects.toThrow(AppError);
    });
  });

  describe('update', () => {
    it('should update an existing calendar entry', async () => {
      const id = 'entry-1' as CalendarEntryId;
      const input = {
        recipe_id: 'recipe-2' as any,
        planned_date: new Date('2026-01-21'),
        meal_slot: 'lunch' as const,
        notes: 'Updated notes',
      };

      const mockEntry: CalendarEntry = {
        id,
        household_id: 'household-1' as any,
        recipe_id: input.recipe_id,
        planned_date: input.planned_date,
        meal_slot: input.meal_slot,
        status: 'planned',
        notes: input.notes,
        created_by: 'user-1' as any,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEntry, error: null }),
      };
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.update(id, input);

      expect(result.notes).toBe('Updated notes');
      expect(result.meal_slot).toBe('lunch');
    });

    it('should throw ValidationError with invalid input', async () => {
      const id = 'entry-1' as CalendarEntryId;
      const input = {
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'invalid-slot' as any,
        notes: null,
      };

      await expect(service.update(id, input)).rejects.toThrow(ValidationError);
    });

    it('should throw AppError when update fails', async () => {
      const id = 'entry-1' as CalendarEntryId;
      const input = {
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'dinner' as const,
        notes: null,
      };

      const dbError = new Error('Update failed');

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
      };
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.update(id, input)).rejects.toThrow(AppError);
    });
  });

  describe('delete', () => {
    it('should delete a calendar entry', async () => {
      const id = 'entry-1' as CalendarEntryId;

      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      await service.delete(id);

      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_entries');
    });

    it('should throw AppError when delete fails', async () => {
      const id = 'entry-1' as CalendarEntryId;
      const dbError = new Error('Delete failed');

      const mockBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: dbError }),
      };
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.delete(id)).rejects.toThrow(AppError);
    });
  });

  describe('updateStatus', () => {
    it('should update status to completed', async () => {
      const id = 'entry-1' as CalendarEntryId;
      const status: CalendarEntryStatus = 'completed';

      const mockEntry: CalendarEntry = {
        id,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'dinner',
        status,
        notes: null,
        created_by: 'user-1' as any,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEntry, error: null }),
      };
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.updateStatus(id, status);

      expect(result.status).toBe('completed');
    });

    it('should update status to cancelled', async () => {
      const id = 'entry-1' as CalendarEntryId;
      const status: CalendarEntryStatus = 'cancelled';

      const mockEntry: CalendarEntry = {
        id,
        household_id: 'household-1' as any,
        recipe_id: 'recipe-1' as any,
        planned_date: new Date('2026-01-20'),
        meal_slot: 'lunch',
        status,
        notes: null,
        created_by: 'user-1' as any,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockEntry, error: null }),
      };
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      const result = await service.updateStatus(id, status);

      expect(result.status).toBe('cancelled');
    });

    it('should throw AppError when status update fails', async () => {
      const id = 'entry-1' as CalendarEntryId;
      const status: CalendarEntryStatus = 'completed';
      const dbError = new Error('Update failed');

      const mockBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
      };
      vi.mocked(mockSupabase.from).mockReturnValue(mockBuilder as any);

      await expect(service.updateStatus(id, status)).rejects.toThrow(AppError);
    });
  });
});
