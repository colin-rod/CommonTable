import { AppError, NotFoundError, ConflictError, ValidationError } from '@commontable/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

import { BaseService } from './BaseService';

// Create a concrete implementation for testing
class TestService extends BaseService {
  // Expose protected static methods for testing
  static testHandleSupabaseError(
    error: unknown,
    operation: string,
    metadata?: Record<string, unknown>,
  ): never {
    return BaseService.handleSupabaseError(error, operation, metadata);
  }

  static testValidateInput<T>(schema: z.ZodSchema<T>, input: unknown, errorMessage?: string): T {
    return BaseService.validateInput(schema, input, errorMessage);
  }

  static testHydrateDates<T extends Record<string, unknown>>(
    obj: T,
    dateFields: Array<keyof T>,
  ): T {
    return BaseService.hydrateDates(obj, dateFields);
  }

  static testHydrateDatesArray<T extends Record<string, unknown>>(
    arr: T[],
    dateFields: Array<keyof T>,
  ): T[] {
    return BaseService.hydrateDatesArray(arr, dateFields);
  }

  static testToDateString(date: Date): string {
    return BaseService.toDateString(date);
  }
}

describe('BaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('handleSupabaseError', () => {
    it('should throw NotFoundError for PGRST116 code', () => {
      const error = { code: 'PGRST116', message: 'Not found' };

      expect(() =>
        TestService.testHandleSupabaseError(error, 'TestOperation', { id: '123' }),
      ).toThrow(NotFoundError);

      try {
        TestService.testHandleSupabaseError(error, 'TestOperation', { id: '123' });
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundError);
        if (e instanceof NotFoundError) {
          expect(e.message).toContain('TestOperation');
        }
      }
    });

    it('should throw NotFoundError for PGRST204 code', () => {
      const error = { code: 'PGRST204', message: 'No rows returned' };

      expect(() =>
        TestService.testHandleSupabaseError(error, 'TestOperation', { id: '123' }),
      ).toThrow(NotFoundError);
    });

    it('should throw ConflictError for PostgreSQL 23505 (duplicate key)', () => {
      const error = { code: '23505', message: 'Duplicate key violation' };

      expect(() => TestService.testHandleSupabaseError(error, 'TestOperation')).toThrow(
        ConflictError,
      );

      try {
        TestService.testHandleSupabaseError(error, 'TestOperation');
      } catch (e) {
        expect(e).toBeInstanceOf(ConflictError);
        if (e instanceof ConflictError) {
          expect(e.message).toContain('already exists');
        }
      }
    });

    it('should throw AppError with logging for unknown error codes', () => {
      const error = { code: 'UNKNOWN', message: 'Something broke' };

      expect(() =>
        TestService.testHandleSupabaseError(error, 'TestOperation', { foo: 'bar' }),
      ).toThrow(AppError);

      expect(console.error).toHaveBeenCalledWith('TestOperation failed:', error);
    });

    it('should preserve existing AppError instances', () => {
      const existingError = new AppError('Custom error', 'CUSTOM_CODE', 500);

      expect(() => TestService.testHandleSupabaseError(existingError, 'TestOperation')).toThrow(
        existingError,
      );

      // Should not log existing AppErrors
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle errors without code property', () => {
      const error = { message: 'Generic error' };

      expect(() => TestService.testHandleSupabaseError(error, 'TestOperation')).toThrow(AppError);
    });

    it('should include metadata in thrown AppError', () => {
      const error = { message: 'Test error' };
      const metadata = { userId: 'user123', action: 'create' };

      try {
        TestService.testHandleSupabaseError(error, 'TestOperation', metadata);
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        if (e instanceof AppError) {
          expect(e.metadata).toMatchObject(metadata);
        }
      }
    });
  });

  describe('validateInput', () => {
    const TestSchema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
      email: z.string().email(),
    });

    it('should return validated data on success', () => {
      const input = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = TestService.testValidateInput(TestSchema, input);

      expect(result).toEqual(input);
    });

    it('should throw ValidationError for invalid input', () => {
      const input = {
        name: '',
        age: -5,
        email: 'not-an-email',
      };

      expect(() => TestService.testValidateInput(TestSchema, input)).toThrow(ValidationError);
    });

    it('should include Zod error details in ValidationError metadata', () => {
      const input = {
        name: '',
        age: 'not-a-number',
        email: 'invalid',
      };

      try {
        TestService.testValidateInput(TestSchema, input);
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        if (e instanceof ValidationError) {
          expect(e.metadata).toHaveProperty('errors');
          expect(Array.isArray(e.metadata?.errors)).toBe(true);
        }
      }
    });

    it('should use custom error message if provided', () => {
      const input = { name: '', age: -1, email: 'bad' };
      const customMessage = 'Custom validation failed';

      try {
        TestService.testValidateInput(TestSchema, input, customMessage);
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        if (e instanceof ValidationError) {
          expect(e.message).toBe(customMessage);
        }
      }
    });

    it('should use default error message if not provided', () => {
      const input = { name: '', age: -1, email: 'bad' };

      try {
        TestService.testValidateInput(TestSchema, input);
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        if (e instanceof ValidationError) {
          expect(e.message).toBe('Validation failed');
        }
      }
    });
  });

  describe('hydrateDates', () => {
    it('should convert string dates to Date objects', () => {
      const obj = {
        id: '123',
        name: 'Test',
        created_at: '2026-01-30T10:00:00Z',
        updated_at: '2026-01-30T12:00:00Z',
      };

      const result = TestService.testHydrateDates(obj, ['created_at', 'updated_at']);

      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect((result.created_at as unknown as Date).toISOString()).toBe('2026-01-30T10:00:00.000Z');
      expect((result.updated_at as unknown as Date).toISOString()).toBe('2026-01-30T12:00:00.000Z');
    });

    it('should preserve null dates as null', () => {
      const obj = {
        id: '123',
        created_at: '2026-01-30T10:00:00Z',
        completed_at: null,
      };

      const result = TestService.testHydrateDates(obj, ['created_at', 'completed_at']);

      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.completed_at).toBeNull();
    });

    it('should preserve undefined dates as undefined', () => {
      const obj = {
        id: '123',
        created_at: '2026-01-30T10:00:00Z',
        completed_at: undefined,
      };

      const result = TestService.testHydrateDates(obj, ['created_at', 'completed_at']);

      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.completed_at).toBeUndefined();
    });

    it('should skip non-date fields', () => {
      const obj = {
        id: '123',
        name: 'Test',
        created_at: '2026-01-30T10:00:00Z',
      };

      const result = TestService.testHydrateDates(obj, ['created_at']);

      expect(result.id).toBe('123');
      expect(result.name).toBe('Test');
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should not mutate original object', () => {
      const obj = {
        id: '123',
        created_at: '2026-01-30T10:00:00Z',
      };

      const originalCreatedAt = obj.created_at;

      TestService.testHydrateDates(obj, ['created_at']);

      // Original object should still have string
      expect(obj.created_at).toBe(originalCreatedAt);
      expect(typeof obj.created_at).toBe('string');
    });

    it('should handle objects with no date fields', () => {
      const obj = { id: '123', name: 'Test' };

      const result = TestService.testHydrateDates(obj, []);

      expect(result).toEqual(obj);
    });

    it('should handle Date objects that are already Date instances', () => {
      const now = new Date();
      const obj = {
        id: '123',
        created_at: now,
      };

      const result = TestService.testHydrateDates(obj, ['created_at']);

      // Should preserve existing Date object
      expect(result.created_at).toBeInstanceOf(Date);
    });
  });

  describe('hydrateDatesArray', () => {
    it('should hydrate dates in all array items', () => {
      const arr = [
        { id: '1', created_at: '2026-01-30T10:00:00Z' },
        { id: '2', created_at: '2026-01-30T11:00:00Z' },
        { id: '3', created_at: '2026-01-30T12:00:00Z' },
      ];

      const result = TestService.testHydrateDatesArray(arr, ['created_at']);

      expect(result).toHaveLength(3);
      result.forEach((item) => {
        expect(item.created_at).toBeInstanceOf(Date);
      });
    });

    it('should handle empty arrays', () => {
      const arr: Array<{ id: string; created_at: string }> = [];

      const result = TestService.testHydrateDatesArray(arr, ['created_at']);

      expect(result).toEqual([]);
    });

    it('should not mutate original array', () => {
      const arr = [
        { id: '1', created_at: '2026-01-30T10:00:00Z' },
        { id: '2', created_at: '2026-01-30T11:00:00Z' },
      ];

      const originalFirstCreatedAt = arr[0]!.created_at;

      TestService.testHydrateDatesArray(arr, ['created_at']);

      // Original array should still have string dates
      expect(arr[0]!.created_at).toBe(originalFirstCreatedAt);
      expect(typeof arr[0]!.created_at).toBe('string');
    });

    it('should handle multiple date fields per object', () => {
      const arr = [
        {
          id: '1',
          created_at: '2026-01-30T10:00:00Z',
          updated_at: '2026-01-30T11:00:00Z',
        },
        {
          id: '2',
          created_at: '2026-01-30T12:00:00Z',
          updated_at: '2026-01-30T13:00:00Z',
        },
      ];

      const result = TestService.testHydrateDatesArray(arr, ['created_at', 'updated_at']);

      result.forEach((item) => {
        expect(item.created_at).toBeInstanceOf(Date);
        expect(item.updated_at).toBeInstanceOf(Date);
      });
    });
  });

  describe('toDateString', () => {
    it('should convert Date to YYYY-MM-DD format', () => {
      const date = new Date('2026-01-30T10:00:00Z');

      const result = TestService.testToDateString(date);

      expect(result).toBe('2026-01-30');
    });

    it('should handle UTC dates correctly', () => {
      const date = new Date('2026-12-25T23:59:59Z');

      const result = TestService.testToDateString(date);

      expect(result).toBe('2026-12-25');
    });

    it('should handle dates at start of day', () => {
      const date = new Date('2026-06-15T00:00:00Z');

      const result = TestService.testToDateString(date);

      expect(result).toBe('2026-06-15');
    });

    it('should pad single-digit months and days', () => {
      const date = new Date('2026-03-05T12:00:00Z');

      const result = TestService.testToDateString(date);

      expect(result).toBe('2026-03-05');
    });
  });
});
