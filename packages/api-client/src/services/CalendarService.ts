import type { CalendarEntry, CalendarEntryId, CalendarEntryStatus } from '@commontable/types';
import { NotFoundError, ValidationError, AppError } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { BaseService } from './BaseService';

/**
 * Input schema for creating a calendar entry
 */
const CreateCalendarEntrySchema = z.object({
  recipe_id: z.string().nullable(),
  planned_date: z.date(),
  meal_slot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  notes: z.string().nullable().optional(),
});

export type CreateCalendarEntryInput = z.infer<typeof CreateCalendarEntrySchema>;

/**
 * Input schema for updating a calendar entry
 */
const UpdateCalendarEntrySchema = z.object({
  recipe_id: z.string().nullable().optional(),
  planned_date: z.date().optional(),
  meal_slot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateCalendarEntryInput = z.infer<typeof UpdateCalendarEntrySchema>;

/**
 * Service for managing calendar entries
 */
export class CalendarService extends BaseService {
  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Fetch calendar entries for a specific week
   *
   * @param startDate - Start of the week (Sunday)
   * @param endDate - End of the week (Saturday)
   * @returns Array of calendar entries for the week
   * @throws {AppError} If database query fails
   */
  async getEntriesForWeek(startDate: Date, endDate: Date): Promise<CalendarEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('calendar_entries')
        .select('*')
        .gte('planned_date', startDate.toISOString())
        .lte('planned_date', endDate.toISOString())
        .order('planned_date', { ascending: true })
        .order('meal_slot', { ascending: true });

      if (error) throw error;

      return (data || []).map((entry) => ({
        ...entry,
        planned_date: new Date(entry.planned_date),
        created_at: new Date(entry.created_at),
        updated_at: new Date(entry.updated_at),
      })) as CalendarEntry[];
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('CalendarService.getEntriesForWeek failed:', error);
      throw new AppError('Failed to fetch calendar entries', 'FETCH_ERROR', 500, {
        startDate,
        endDate,
      });
    }
  }

  /**
   * Get a calendar entry by ID
   *
   * @param id - Calendar entry ID
   * @returns Calendar entry
   * @throws {NotFoundError} If entry does not exist
   * @throws {AppError} If database query fails
   */
  async getById(id: CalendarEntryId): Promise<CalendarEntry> {
    try {
      const { data, error } = await this.supabase
        .from('calendar_entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('CalendarEntry', id);

      return {
        ...data,
        planned_date: new Date(data.planned_date),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      } as CalendarEntry;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('CalendarService.getById failed:', error);
      throw new AppError('Failed to fetch calendar entry', 'FETCH_ERROR', 500, { id });
    }
  }

  /**
   * Create a new calendar entry
   *
   * @param input - Calendar entry data
   * @returns Created calendar entry
   * @throws {ValidationError} If input is invalid
   * @throws {AppError} If database insert fails
   */
  async create(input: CreateCalendarEntryInput): Promise<CalendarEntry> {
    try {
      const validated = CreateCalendarEntrySchema.parse(input);

      // Note: household_id and created_by are set by RLS/database triggers
      const { data, error } = await this.supabase
        .from('calendar_entries')
        .insert({
          recipe_id: validated.recipe_id ?? null,
          planned_date: validated.planned_date.toISOString().split('T')[0], // DATE format
          meal_slot: validated.meal_slot,
          notes: validated.notes ?? null,
          status: 'planned', // Default status
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any) // Type assertion: DB triggers handle household_id and created_by
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        planned_date: new Date(data.planned_date),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      } as CalendarEntry;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid calendar entry data', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('CalendarService.create failed:', error);
      throw new AppError('Failed to create calendar entry', 'CREATE_ERROR', 500);
    }
  }

  /**
   * Update an existing calendar entry
   *
   * @param id - Calendar entry ID
   * @param input - Updated calendar entry data
   * @returns Updated calendar entry
   * @throws {ValidationError} If input is invalid
   * @throws {AppError} If database update fails
   */
  async update(id: CalendarEntryId, input: UpdateCalendarEntryInput): Promise<CalendarEntry> {
    try {
      const validated = UpdateCalendarEntrySchema.parse(input);

      const updateData: Record<string, string | null> = {};

      if (validated.recipe_id !== undefined) {
        updateData.recipe_id = validated.recipe_id;
      }
      if (validated.planned_date !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        updateData.planned_date = validated.planned_date.toISOString().split('T')[0]!;
      }
      if (validated.meal_slot !== undefined) {
        updateData.meal_slot = validated.meal_slot;
      }
      if (validated.notes !== undefined) {
        updateData.notes = validated.notes ?? null;
      }

      const { data, error } = await this.supabase
        .from('calendar_entries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        planned_date: new Date(data.planned_date),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      } as CalendarEntry;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid calendar entry data', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('CalendarService.update failed:', error);
      throw new AppError('Failed to update calendar entry', 'UPDATE_ERROR', 500, { id });
    }
  }

  /**
   * Delete a calendar entry
   *
   * @param id - Calendar entry ID
   * @throws {AppError} If database delete fails
   */
  async delete(id: CalendarEntryId): Promise<void> {
    try {
      const { error } = await this.supabase.from('calendar_entries').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('CalendarService.delete failed:', error);
      throw new AppError('Failed to delete calendar entry', 'DELETE_ERROR', 500, { id });
    }
  }

  /**
   * Update the status of a calendar entry
   *
   * @param id - Calendar entry ID
   * @param status - New status
   * @returns Updated calendar entry
   * @throws {AppError} If database update fails
   */
  async updateStatus(id: CalendarEntryId, status: CalendarEntryStatus): Promise<CalendarEntry> {
    try {
      const { data, error } = await this.supabase
        .from('calendar_entries')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        planned_date: new Date(data.planned_date),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      } as CalendarEntry;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('CalendarService.updateStatus failed:', error);
      throw new AppError('Failed to update calendar entry status', 'UPDATE_ERROR', 500, {
        id,
        status,
      });
    }
  }
}
