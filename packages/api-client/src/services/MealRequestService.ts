import type {
  MealRequest,
  MealRequestId,
  MealRequestStatus,
  CalendarEntry,
  CreateMealRequestInput,
} from '@commontable/types';
import {
  NotFoundError,
  ValidationError,
  CreateMealRequestSchema,
  UpdateStatusSchema,
  UpdatePrioritySchema,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { BaseService } from './BaseService';
import { CalendarService } from './CalendarService';

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
    ]) as unknown as MealRequest[];
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
    ]) as unknown as MealRequest;
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
    ]) as unknown as MealRequest;
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
    ]) as unknown as MealRequest;
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
    ]) as unknown as MealRequest;
  }

  /**
   * Add meal request to meal plan
   * Creates a queue entry and updates request status to 'planned'
   *
   * @param id - Meal request ID
   * @returns Object containing updated request and created queue entry
   * @throws {NotFoundError} If request does not exist
   * @throws {ValidationError} If request has no recipe_id
   * @throws {AppError} If database operation fails
   */
  async addToMealPlan(id: MealRequestId): Promise<{
    mealRequest: MealRequest;
    queueEntry: {
      id: string;
      household_id: string;
      recipe_id: string;
      meal_request_id: string;
      added_by: string;
      notes: string | null;
      created_at: Date;
    };
  }> {
    // Fetch the request
    const request = await this.getById(id);

    // Validate that request has a recipe_id
    if (!request.recipe_id) {
      throw new ValidationError('Cannot add meal request to meal plan without a recipe_id', { id });
    }

    // Get next position for queue entry
    const { count, error: countError } = await this.supabase
      .from('recipe_queue')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      BaseService.handleSupabaseError(countError, 'MealRequestService.addToMealPlan:count', { id });
    }

    const nextPosition = count || 0;

    // Create queue entry
    const { data: queueEntry, error: insertError } = await this.supabase
      .from('recipe_queue')
      .insert({
        recipe_id: request.recipe_id,
        household_id: request.household_id,
        added_by: request.requested_by,
        position: nextPosition,
        status: 'queued',
        notes: request.notes,
      })
      .select()
      .single();

    if (insertError) {
      BaseService.handleSupabaseError(insertError, 'MealRequestService.addToMealPlan', { id });
    }

    // Update request status to 'planned'
    const updatedRequest = await this.updateStatus(id, 'planned');

    // Transform queue entry to match expected shape
    return {
      mealRequest: updatedRequest,
      queueEntry: {
        id: queueEntry.id,
        household_id: queueEntry.household_id,
        recipe_id: queueEntry.recipe_id,
        meal_request_id: id,
        added_by: queueEntry.added_by,
        notes: queueEntry.notes,
        created_at: new Date(queueEntry.created_at),
      },
    };
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
