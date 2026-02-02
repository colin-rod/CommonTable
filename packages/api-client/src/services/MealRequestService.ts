import type {
  MealRequest,
  MealRequestId,
  MealRequestStatus,
  CalendarEntry,
} from '@commontable/types';
import { NotFoundError, MealSlotSchema } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { BaseService } from './BaseService';
import { CalendarService } from './CalendarService';

/**
 * Input schema for creating a meal request
 */
const CreateMealRequestSchema = z
  .object({
    recipe_id: z.string().uuid().nullable(),
    requested_date: z.date(),
    requested_meal_slot: MealSlotSchema,
    notes: z.union([z.string().min(1).max(500), z.null()]),
  })
  .refine((data) => data.recipe_id !== null || data.notes !== null, {
    message: 'Must provide either a recipe or notes',
  });

export type CreateMealRequestInput = z.infer<typeof CreateMealRequestSchema>;

/**
 * Input schema for updating meal request status
 */
const UpdateStatusSchema = z.object({
  status: z.enum(['open', 'planned', 'dismissed']),
});

/**
 * Input schema for updating meal request priority
 */
const UpdatePrioritySchema = z.object({
  priority: z.number().int(),
});

/**
 * Service for managing meal requests
 */
export class MealRequestService extends BaseService {
  private calendarService: CalendarService;

  constructor(supabase: SupabaseClient) {
    super(supabase);
    this.calendarService = new CalendarService(supabase);
  }

  /**
   * Fetch meal requests with optional status filter
   *
   * @param filters - Optional filters (status)
   * @returns Array of meal requests sorted by priority DESC, requested_date ASC, created_at ASC
   * @throws {AppError} If database query fails
   */
  async list(filters?: { status?: MealRequestStatus }): Promise<MealRequest[]> {
    let query = this.supabase.from('meal_requests').select('*');

    // Apply status filter if provided
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    // Sort by priority (desc), requested_date (asc), created_at (asc)
    query = query
      .order('priority', { ascending: false })
      .order('requested_date', { ascending: true })
      .order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      BaseService.handleSupabaseError(error, 'MealRequestService.list', { filters });
    }

    return BaseService.hydrateDatesArray(data || [], [
      'requested_date',
      'created_at',
      'updated_at',
    ]) as MealRequest[];
  }

  /**
   * Get a meal request by ID
   *
   * @param id - Meal request ID
   * @returns Meal request
   * @throws {NotFoundError} If request does not exist
   * @throws {AppError} If database query fails
   */
  async getById(id: MealRequestId): Promise<MealRequest> {
    const { data, error } = await this.supabase
      .from('meal_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'MealRequestService.getById', { id });
    }
    if (!data) throw new NotFoundError('MealRequest', id);

    return BaseService.hydrateDates(data, [
      'requested_date',
      'created_at',
      'updated_at',
    ]) as MealRequest;
  }

  /**
   * Create a new meal request
   *
   * @param input - Meal request data (must have recipe OR notes)
   * @returns Created meal request
   * @throws {ValidationError} If input is invalid
   * @throws {AppError} If database operation fails
   */
  async create(input: CreateMealRequestInput): Promise<MealRequest> {
    const validated = BaseService.validateInput(
      CreateMealRequestSchema,
      input,
      'Invalid meal request data',
    );

    // Insert request
    const { data, error } = await this.supabase
      .from('meal_requests')
      .insert({
        recipe_id: validated.recipe_id ?? null,
        requested_date: BaseService.toDateString(validated.requested_date),
        requested_meal_slot: validated.requested_meal_slot,
        notes: validated.notes ?? null,
        status: 'open', // Default status
        priority: 0, // Default priority
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any) // DB triggers handle household_id, requested_by, created_at, updated_at
      .select()
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'MealRequestService.create');
    }

    return BaseService.hydrateDates(data, [
      'requested_date',
      'created_at',
      'updated_at',
    ]) as MealRequest;
  }

  /**
   * Update meal request status
   *
   * @param id - Meal request ID
   * @param status - New status
   * @returns Updated meal request
   * @throws {ValidationError} If status is invalid
   * @throws {NotFoundError} If request does not exist
   * @throws {AppError} If database operation fails
   */
  async updateStatus(id: MealRequestId, status: MealRequestStatus): Promise<MealRequest> {
    BaseService.validateInput(UpdateStatusSchema, { status }, 'Invalid status');

    const { data, error } = await this.supabase
      .from('meal_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'MealRequestService.updateStatus', { id, status });
    }
    if (!data) throw new NotFoundError('MealRequest', id);

    return BaseService.hydrateDates(data, [
      'requested_date',
      'created_at',
      'updated_at',
    ]) as MealRequest;
  }

  /**
   * Update meal request priority
   *
   * @param id - Meal request ID
   * @param priority - New priority (integer)
   * @returns Updated meal request
   * @throws {ValidationError} If priority is not an integer
   * @throws {NotFoundError} If request does not exist
   * @throws {AppError} If database operation fails
   */
  async updatePriority(id: MealRequestId, priority: number): Promise<MealRequest> {
    BaseService.validateInput(UpdatePrioritySchema, { priority }, 'Invalid priority');

    const { data, error } = await this.supabase
      .from('meal_requests')
      .update({ priority })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      BaseService.handleSupabaseError(error, 'MealRequestService.updatePriority', {
        id,
        priority,
      });
    }
    if (!data) throw new NotFoundError('MealRequest', id);

    return BaseService.hydrateDates(data, [
      'requested_date',
      'created_at',
      'updated_at',
    ]) as MealRequest;
  }

  /**
   * Add meal request to calendar
   * Creates a calendar entry and updates request status to 'planned'
   *
   * @param id - Meal request ID
   * @returns Object containing updated request and created calendar entry
   * @throws {NotFoundError} If request does not exist
   * @throws {AppError} If database operation fails
   */
  async addToCalendar(
    id: MealRequestId,
  ): Promise<{ request: MealRequest; calendarEntry: CalendarEntry }> {
    // Fetch the request
    const request = await this.getById(id);

    // Create calendar entry
    const calendarEntry = await this.calendarService.create({
      recipe_id: request.recipe_id,
      planned_date: request.requested_date,
      meal_slot: request.requested_meal_slot,
      notes: request.notes,
    });

    // Update request status to 'planned'
    const updatedRequest = await this.updateStatus(id, 'planned');

    return {
      request: updatedRequest,
      calendarEntry,
    };
  }
}
