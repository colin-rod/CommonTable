import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import {
  CreateMealRequestSchema,
  UpdateStatusSchema,
  UpdatePrioritySchema,
  type CreateMealRequestInput,
  type UpdateMealRequestStatusInput,
  type UpdateMealRequestPriorityInput,
} from './meal-request';

describe('CreateMealRequestSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid input with recipe_id and notes provided', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'dinner' as const,
        notes: 'Would love to have this again!',
      };

      const result = CreateMealRequestSchema.parse(input);
      expect(result.recipe_id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.requested_date).toEqual(new Date('2024-03-20'));
      expect(result.requested_meal_slot).toBe('dinner');
      expect(result.notes).toBe('Would love to have this again!');
    });

    it('should accept valid input with recipe_id provided and notes = null', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'lunch' as const,
        notes: null,
      };

      const result = CreateMealRequestSchema.parse(input);
      expect(result.recipe_id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.notes).toBeNull();
    });

    it('should accept valid input with recipe_id = null and notes provided', () => {
      const input = {
        recipe_id: null,
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'lunch' as const,
        notes: 'Something light and healthy',
      };

      const result = CreateMealRequestSchema.parse(input);
      expect(result.recipe_id).toBeNull();
      expect(result.notes).toBe('Something light and healthy');
    });

    it('should accept valid UUID for recipe_id', () => {
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '00000000-0000-0000-0000-000000000000',
      ];

      validUuids.forEach((uuid) => {
        const input = {
          recipe_id: uuid,
          requested_date: new Date('2024-03-20'),
          requested_meal_slot: 'dinner' as const,
          notes: null,
        };

        const result = CreateMealRequestSchema.parse(input);
        expect(result.recipe_id).toBe(uuid);
      });
    });

    it('should accept notes with exactly 500 characters', () => {
      const notes = 'A'.repeat(500);
      const input = {
        recipe_id: null,
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'snack' as const,
        notes,
      };

      const result = CreateMealRequestSchema.parse(input);
      expect(result.notes).toBe(notes);
      expect(result.notes?.length).toBe(500);
    });

    it('should accept notes with exactly 1 character', () => {
      const input = {
        recipe_id: null,
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'breakfast' as const,
        notes: 'A',
      };

      const result = CreateMealRequestSchema.parse(input);
      expect(result.notes).toBe('A');
      expect(result.notes?.length).toBe(1);
    });

    it('should accept all valid meal_slot values', () => {
      const mealSlots = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

      mealSlots.forEach((slot) => {
        const input = {
          recipe_id: '550e8400-e29b-41d4-a716-446655440000',
          requested_date: new Date('2024-03-20'),
          requested_meal_slot: slot,
          notes: null,
        };

        const result = CreateMealRequestSchema.parse(input);
        expect(result.requested_meal_slot).toBe(slot);
      });
    });
  });

  describe('invalid inputs', () => {
    it('should reject recipe_id that is not a UUID', () => {
      const input = {
        recipe_id: 'not-a-uuid',
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'dinner' as const,
        notes: null,
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject recipe_id = null AND notes = null (violates refine constraint)', () => {
      const input = {
        recipe_id: null,
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'dinner' as const,
        notes: null,
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(
        'Must provide either a recipe or notes',
      );
    });

    it('should reject missing required field requested_date', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        requested_meal_slot: 'dinner',
        notes: null,
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject missing required field requested_meal_slot', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        requested_date: new Date('2024-03-20'),
        notes: null,
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for requested_date (string instead of Date)', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        requested_date: '2024-03-20' as any,
        requested_meal_slot: 'dinner' as const,
        notes: null,
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for requested_date (number instead of Date)', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        requested_date: 1234567890 as any,
        requested_meal_slot: 'dinner' as const,
        notes: null,
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid meal_slot value', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'brunch' as any,
        notes: null,
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject notes that is an empty string (fails min(1) validation)', () => {
      const input = {
        recipe_id: null,
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'lunch' as const,
        notes: '',
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject notes that exceeds 500 characters (fails max(500) validation)', () => {
      const notes = 'A'.repeat(501);
      const input = {
        recipe_id: null,
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'lunch' as const,
        notes,
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for notes (number instead of string)', () => {
      const input = {
        recipe_id: null,
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'lunch' as const,
        notes: 123 as any,
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject missing required field recipe_id', () => {
      const input = {
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'dinner' as const,
        notes: 'Missing recipe_id',
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for recipe_id (number instead of string)', () => {
      const input = {
        recipe_id: 123 as any,
        requested_date: new Date('2024-03-20'),
        requested_meal_slot: 'dinner' as const,
        notes: null,
      };

      expect(() => CreateMealRequestSchema.parse(input)).toThrow(z.ZodError);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      type Expected = {
        recipe_id: string | null;
        requested_date: Date;
        requested_meal_slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
        notes: string | null;
      };

      type Actual = CreateMealRequestInput;

      // Type assertion tests (will fail to compile if types don't match)
      const assertType: Actual = {} as Expected;
      const assertTypeReverse: Expected = {} as Actual;

      expect(assertType).toBeDefined();
      expect(assertTypeReverse).toBeDefined();
    });
  });
});

describe('UpdateStatusSchema', () => {
  describe('valid inputs', () => {
    it('should accept status = "open"', () => {
      const input = {
        status: 'open' as const,
      };

      const result = UpdateStatusSchema.parse(input);
      expect(result.status).toBe('open');
    });

    it('should accept status = "planned"', () => {
      const input = {
        status: 'planned' as const,
      };

      const result = UpdateStatusSchema.parse(input);
      expect(result.status).toBe('planned');
    });

    it('should accept status = "dismissed"', () => {
      const input = {
        status: 'dismissed' as const,
      };

      const result = UpdateStatusSchema.parse(input);
      expect(result.status).toBe('dismissed');
    });
  });

  describe('invalid inputs', () => {
    it('should reject invalid status value', () => {
      const input = {
        status: 'invalid' as any,
      };

      expect(() => UpdateStatusSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject missing required field status', () => {
      const input = {};

      expect(() => UpdateStatusSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for status (number instead of string)', () => {
      const input = {
        status: 123 as any,
      };

      expect(() => UpdateStatusSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject null for status', () => {
      const input = {
        status: null as any,
      };

      expect(() => UpdateStatusSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject undefined for status', () => {
      const input = {
        status: undefined as any,
      };

      expect(() => UpdateStatusSchema.parse(input)).toThrow(z.ZodError);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      type Expected = {
        status: 'open' | 'planned' | 'dismissed';
      };

      type Actual = UpdateMealRequestStatusInput;

      // Type assertion tests (will fail to compile if types don't match)
      const assertType: Actual = {} as Expected;
      const assertTypeReverse: Expected = {} as Actual;

      expect(assertType).toBeDefined();
      expect(assertTypeReverse).toBeDefined();
    });
  });
});

describe('UpdatePrioritySchema', () => {
  describe('valid inputs', () => {
    it('should accept positive integer priority', () => {
      const input = {
        priority: 10,
      };

      const result = UpdatePrioritySchema.parse(input);
      expect(result.priority).toBe(10);
    });

    it('should accept negative integer priority', () => {
      const input = {
        priority: -5,
      };

      const result = UpdatePrioritySchema.parse(input);
      expect(result.priority).toBe(-5);
    });

    it('should accept zero for priority', () => {
      const input = {
        priority: 0,
      };

      const result = UpdatePrioritySchema.parse(input);
      expect(result.priority).toBe(0);
    });

    it('should accept large positive integer', () => {
      const input = {
        priority: 999999,
      };

      const result = UpdatePrioritySchema.parse(input);
      expect(result.priority).toBe(999999);
    });

    it('should accept large negative integer', () => {
      const input = {
        priority: -999999,
      };

      const result = UpdatePrioritySchema.parse(input);
      expect(result.priority).toBe(-999999);
    });
  });

  describe('invalid inputs', () => {
    it('should reject float number (fails int() validation)', () => {
      const input = {
        priority: 10.5,
      };

      expect(() => UpdatePrioritySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject missing required field priority', () => {
      const input = {};

      expect(() => UpdatePrioritySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for priority (string instead of number)', () => {
      const input = {
        priority: '10' as any,
      };

      expect(() => UpdatePrioritySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject null for priority', () => {
      const input = {
        priority: null as any,
      };

      expect(() => UpdatePrioritySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject undefined for priority', () => {
      const input = {
        priority: undefined as any,
      };

      expect(() => UpdatePrioritySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject boolean for priority', () => {
      const input = {
        priority: true as any,
      };

      expect(() => UpdatePrioritySchema.parse(input)).toThrow(z.ZodError);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      type Expected = {
        priority: number;
      };

      type Actual = UpdateMealRequestPriorityInput;

      // Type assertion tests (will fail to compile if types don't match)
      const assertType: Actual = {} as Expected;
      const assertTypeReverse: Expected = {} as Actual;

      expect(assertType).toBeDefined();
      expect(assertTypeReverse).toBeDefined();
    });
  });
});
