import type { Database } from '@commontable/types';
import { AppError, NotFoundError, ConflictError, ValidationError } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * Base service class for all data access services
 * Provides common functionality and patterns including:
 * - Centralized Supabase error handling
 * - Input validation with Zod
 * - Date field hydration
 */
export abstract class BaseService {
  constructor(protected supabase: SupabaseClient<Database>) {}

  /**
   * Centralized Supabase error handler
   * Maps Postgres error codes to AppError subclasses
   *
   * @param error - Error from Supabase query
   * @param operation - Operation name for logging (e.g., 'RecipeService.getById')
   * @param metadata - Additional context to include in error
   * @throws {NotFoundError} For PGRST116 (not found) or PGRST204 (empty result)
   * @throws {ConflictError} For PostgreSQL 23505 (duplicate key)
   * @throws {AppError} For all other errors
   */
  protected static handleSupabaseError(
    error: unknown,
    operation: string,
    metadata?: Record<string, unknown>,
  ): never {
    // Preserve existing AppError instances
    if (error instanceof AppError) {
      throw error;
    }

    // Type guard for objects with code property
    const isErrorWithCode = (err: unknown): err is { code: string; message?: string } => {
      return typeof err === 'object' && err !== null && 'code' in err;
    };

    // PGRST116 = Row not found
    // PGRST204 = No rows returned (empty result)
    if (isErrorWithCode(error) && (error.code === 'PGRST116' || error.code === 'PGRST204')) {
      throw new NotFoundError(operation, (metadata?.id as string) || 'unknown');
    }

    // 23505 = Unique constraint violation (duplicate key)
    if (isErrorWithCode(error) && error.code === '23505') {
      throw new ConflictError(`${operation} already exists`, metadata);
    }

    // Generic error with logging
    console.error(`${operation} failed:`, error);

    const errorMessage =
      isErrorWithCode(error) && error.message ? error.message : `${operation} failed`;

    throw new AppError(errorMessage, 'DATABASE_ERROR', 500, metadata);
  }

  /**
   * Validate input with Zod schema, throw consistent ValidationError
   *
   * @param schema - Zod schema to validate against
   * @param input - Input data to validate
   * @param errorMessage - Custom error message (default: 'Validation failed')
   * @returns Validated data
   * @throws {ValidationError} If validation fails
   */
  protected static validateInput<T>(
    schema: z.ZodSchema<T>,
    input: unknown,
    errorMessage: string = 'Validation failed',
  ): T {
    try {
      return schema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(errorMessage, { errors: error.errors });
      }
      throw error;
    }
  }

  /**
   * Hydrate date fields from ISO strings to Date objects
   * Supabase returns dates as ISO strings, this converts them to Date instances
   *
   * @param obj - Object with date fields
   * @param dateFields - Array of field names to convert
   * @returns New object with hydrated dates
   */
  protected static hydrateDates<T extends Record<string, unknown>>(
    obj: T,
    dateFields: Array<keyof T>,
  ): T {
    const result = { ...obj };

    for (const field of dateFields) {
      const value = result[field];
      // Only convert if value exists and is a string
      if (value && typeof value === 'string') {
        result[field] = new Date(value) as T[keyof T];
      }
      // Preserve null, undefined, and existing Date objects
    }

    return result;
  }

  /**
   * Hydrate date fields in array of objects
   *
   * @param arr - Array of objects with date fields
   * @param dateFields - Array of field names to convert
   * @returns New array with hydrated dates
   */
  protected static hydrateDatesArray<T extends Record<string, unknown>>(
    arr: T[],
    dateFields: Array<keyof T>,
  ): T[] {
    return arr.map((obj) => this.hydrateDates(obj, dateFields));
  }

  /**
   * Convert Date to ISO date string (YYYY-MM-DD format)
   * Used when inserting DATE columns (not TIMESTAMP)
   *
   * @param date - Date to convert
   * @returns ISO date string (YYYY-MM-DD)
   */
  protected static toDateString(date: Date): string {
    const isoString = date.toISOString();
    const datePart = isoString.split('T')[0];
    if (!datePart) {
      throw new Error('Failed to extract date part from ISO string');
    }
    return datePart;
  }
}
