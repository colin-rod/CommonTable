import type { CalendarEntry, CalendarEntryId, CalendarEntryStatus } from '@commontable/types';
import { NotFoundError, MealSlotSchema } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { BaseService } from './BaseService';

/**
 * Input schema for creating a calendar entry
 */
const CreateCalendarEntrySchema = z.object({
  recipe_id: z.string().nullable(),
  planned_date: z.date(),
  meal_slot: MealSlotSchema,
  notes: z.string().nullable().optional(),
});

export type CreateCalendarEntryInput = z.infer<typeof CreateCalendarEntrySchema>;

/**
 * Input schema for updating a calendar entry
 */
const UpdateCalendarEntrySchema = z.object({
  recipe_id: z.string().nullable().optional(),
  planned_date: z.date().optional(),
  meal_slot: MealSlotSchema.optional(),
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
    const { data, error } = await this.supabase
      .from('calendar_entries')
      .select('*')
      .gte('planned_date', startDate.toISOString())
      .lte('planned_date', endDate.toISOString())
      .order('planned_date', { ascending: true })
      .order('meal_slot', { ascending: true });

    if (error) {
      BaseService.handleSupabaseError(error, 'CalendarService.getEntriesForWeek', {
        startDate,
        endDate,
      });
    }

    return BaseService.hydrateDatesArray(data || [], [
      'planned_date',
      'created_at',
      'updated_at',
    ]) as CalendarEntry[];
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
    const { data, error } = await this.supabase
      .from('calendar_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'CalendarService.getById', { id });
    }
    if (!data) throw new NotFoundError('CalendarEntry', id);

    return BaseService.hydrateDates(data, [
      'planned_date',
      'created_at',
      'updated_at',
    ]) as CalendarEntry;
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
    const validated = BaseService.validateInput(
      CreateCalendarEntrySchema,
      input,
      'Invalid calendar entry data',
    );

    // Note: household_id and created_by are set by RLS/database triggers
    const { data, error } = await this.supabase
      .from('calendar_entries')
      .insert({
        recipe_id: validated.recipe_id ?? null,
        planned_date: BaseService.toDateString(validated.planned_date),
        meal_slot: validated.meal_slot,
        notes: validated.notes ?? null,
        status: 'planned', // Default status
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any) // Type assertion: DB triggers handle household_id and created_by
      .select()
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'CalendarService.create');
    }

    return BaseService.hydrateDates(data, [
      'planned_date',
      'created_at',
      'updated_at',
    ]) as CalendarEntry;
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
    const validated = BaseService.validateInput(
      UpdateCalendarEntrySchema,
      input,
      'Invalid calendar entry data',
    );

    const updateData: Record<string, string | null> = {};

    if (validated.recipe_id !== undefined) {
      updateData.recipe_id = validated.recipe_id;
    }
    if (validated.planned_date !== undefined) {
      updateData.planned_date = BaseService.toDateString(validated.planned_date);
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

    if (error) {
      BaseService.handleSupabaseError(error, 'CalendarService.update', { id });
    }

    return BaseService.hydrateDates(data, [
      'planned_date',
      'created_at',
      'updated_at',
    ]) as CalendarEntry;
  }

  /**
   * Delete a calendar entry
   *
   * @param id - Calendar entry ID
   * @throws {AppError} If database delete fails
   */
  async delete(id: CalendarEntryId): Promise<void> {
    const { error } = await this.supabase.from('calendar_entries').delete().eq('id', id);

    if (error) {
      BaseService.handleSupabaseError(error, 'CalendarService.delete', { id });
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
    const { data, error } = await this.supabase
      .from('calendar_entries')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'CalendarService.updateStatus', { id, status });
    }

    return BaseService.hydrateDates(data, [
      'planned_date',
      'created_at',
      'updated_at',
    ]) as CalendarEntry;
  }
}
