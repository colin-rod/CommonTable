import type {
  MealRequest,
  MealRequestId,
  MealRequestStatus,
  CalendarEntry,
} from '@commontable/types';
import { NotFoundError, ValidationError, AppError } from '@commontable/types';
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
    requested_meal_slot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
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
    try {
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

      if (error) throw error;

      return (data || []).map((request) => ({
        ...request,
        requested_date: new Date(request.requested_date),
        created_at: new Date(request.created_at),
        updated_at: new Date(request.updated_at),
      })) as MealRequest[];
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('MealRequestService.list failed:', error);
      throw new AppError('Failed to fetch meal requests', 'FETCH_ERROR', 500, {
        filters,
      });
    }
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
    try {
      const { data, error } = await this.supabase
        .from('meal_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('MealRequest', id);

      return {
        ...data,
        requested_date: new Date(data.requested_date),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      } as MealRequest;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('MealRequestService.getById failed:', error);
      throw new AppError('Failed to fetch meal request', 'FETCH_ERROR', 500, { id });
    }
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
    try {
      // Validate input
      const validated = CreateMealRequestSchema.parse(input);

      // Insert request
      const { data, error } = await this.supabase
        .from('meal_requests')
        .insert({
          recipe_id: validated.recipe_id,
          requested_date: validated.requested_date.toISOString().split('T')[0],
          requested_meal_slot: validated.requested_meal_slot,
          notes: validated.notes,
          status: 'open', // Default status
          priority: 0, // Default priority
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        requested_date: new Date(data.requested_date),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      } as MealRequest;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid meal request data', {
          errors: error.errors,
        });
      }
      if (error instanceof AppError) throw error;

      console.error('MealRequestService.create failed:', error);
      throw new AppError('Failed to create meal request', 'CREATE_ERROR', 500);
    }
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
    try {
      // Validate status
      UpdateStatusSchema.parse({ status });

      const { data, error } = await this.supabase
        .from('meal_requests')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('MealRequest', id);

      return {
        ...data,
        requested_date: new Date(data.requested_date),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      } as MealRequest;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid status', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('MealRequestService.updateStatus failed:', error);
      throw new AppError('Failed to update meal request status', 'UPDATE_ERROR', 500, {
        id,
        status,
      });
    }
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
    try {
      // Validate priority
      UpdatePrioritySchema.parse({ priority });

      const { data, error } = await this.supabase
        .from('meal_requests')
        .update({ priority })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('MealRequest', id);

      return {
        ...data,
        requested_date: new Date(data.requested_date),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      } as MealRequest;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid priority', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('MealRequestService.updatePriority failed:', error);
      throw new AppError('Failed to update meal request priority', 'UPDATE_ERROR', 500, {
        id,
        priority,
      });
    }
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
    try {
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
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('MealRequestService.addToCalendar failed:', error);
      throw new AppError('Failed to add meal request to calendar', 'CREATE_ERROR', 500, {
        id,
      });
    }
  }
}
