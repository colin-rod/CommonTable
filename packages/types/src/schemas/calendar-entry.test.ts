import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import {
  CreateCalendarEntrySchema,
  UpdateCalendarEntrySchema,
  type CreateCalendarEntryInput,
  type UpdateCalendarEntryInput,
} from './calendar-entry';

describe('CreateCalendarEntrySchema', () => {
  describe('valid inputs', () => {
    it('should accept valid input with all fields provided', () => {
      const input = {
        recipe_id: 'abc-123',
        planned_date: new Date('2024-03-15'),
        meal_slot: 'dinner' as const,
        notes: 'Try the new pasta recipe',
      };

      const result = CreateCalendarEntrySchema.parse(input);
      expect(result.recipe_id).toBe('abc-123');
      expect(result.planned_date).toEqual(new Date('2024-03-15'));
      expect(result.meal_slot).toBe('dinner');
      expect(result.notes).toBe('Try the new pasta recipe');
    });

    it('should accept valid input with recipe_id = null', () => {
      const input = {
        recipe_id: null,
        planned_date: new Date('2024-03-15'),
        meal_slot: 'lunch' as const,
        notes: 'Planning for later',
      };

      const result = CreateCalendarEntrySchema.parse(input);
      expect(result.recipe_id).toBeNull();
      expect(result.planned_date).toEqual(new Date('2024-03-15'));
      expect(result.meal_slot).toBe('lunch');
    });

    it('should accept valid input without notes (optional field)', () => {
      const input = {
        recipe_id: 'recipe-123',
        planned_date: new Date('2024-03-20'),
        meal_slot: 'breakfast' as const,
      };

      const result = CreateCalendarEntrySchema.parse(input);
      expect(result.recipe_id).toBe('recipe-123');
      expect(result.planned_date).toEqual(new Date('2024-03-20'));
      expect(result.meal_slot).toBe('breakfast');
      expect(result.notes).toBeUndefined();
    });

    it('should accept valid input with notes = null', () => {
      const input = {
        recipe_id: 'recipe-456',
        planned_date: new Date('2024-04-01'),
        meal_slot: 'snack' as const,
        notes: null,
      };

      const result = CreateCalendarEntrySchema.parse(input);
      expect(result.recipe_id).toBe('recipe-456');
      expect(result.notes).toBeNull();
    });

    it('should accept empty string for notes', () => {
      const input = {
        recipe_id: 'recipe-789',
        planned_date: new Date('2024-05-10'),
        meal_slot: 'dinner' as const,
        notes: '',
      };

      const result = CreateCalendarEntrySchema.parse(input);
      expect(result.notes).toBe('');
    });

    it('should accept very long string for notes', () => {
      const longNotes = 'A'.repeat(1000);
      const input = {
        recipe_id: null,
        planned_date: new Date('2024-06-15'),
        meal_slot: 'lunch' as const,
        notes: longNotes,
      };

      const result = CreateCalendarEntrySchema.parse(input);
      expect(result.notes).toBe(longNotes);
    });

    it('should accept all valid meal_slot values', () => {
      const mealSlots = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

      mealSlots.forEach((slot) => {
        const input = {
          recipe_id: 'recipe-123',
          planned_date: new Date('2024-03-15'),
          meal_slot: slot,
        };

        const result = CreateCalendarEntrySchema.parse(input);
        expect(result.meal_slot).toBe(slot);
      });
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing required field planned_date', () => {
      const input = {
        recipe_id: 'abc-123',
        meal_slot: 'dinner',
      };

      expect(() => CreateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject missing required field meal_slot', () => {
      const input = {
        recipe_id: 'abc-123',
        planned_date: new Date('2024-03-15'),
      };

      expect(() => CreateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject missing required field recipe_id', () => {
      const input = {
        planned_date: new Date('2024-03-15'),
        meal_slot: 'dinner',
      };

      expect(() => CreateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for recipe_id (number instead of string)', () => {
      const input = {
        recipe_id: 123 as any,
        planned_date: new Date('2024-03-15'),
        meal_slot: 'dinner',
      };

      expect(() => CreateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for planned_date (string instead of Date)', () => {
      const input = {
        recipe_id: 'abc-123',
        planned_date: '2024-03-15' as any,
        meal_slot: 'dinner',
      };

      expect(() => CreateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for planned_date (number instead of Date)', () => {
      const input = {
        recipe_id: 'abc-123',
        planned_date: 1234567890 as any,
        meal_slot: 'dinner',
      };

      expect(() => CreateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid meal_slot value "brunch"', () => {
      const input = {
        recipe_id: 'abc-123',
        planned_date: new Date('2024-03-15'),
        meal_slot: 'brunch' as any,
      };

      expect(() => CreateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid meal_slot value "invalid"', () => {
      const input = {
        recipe_id: 'abc-123',
        planned_date: new Date('2024-03-15'),
        meal_slot: 'invalid' as any,
      };

      expect(() => CreateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for meal_slot (number instead of string)', () => {
      const input = {
        recipe_id: 'abc-123',
        planned_date: new Date('2024-03-15'),
        meal_slot: 123 as any,
      };

      expect(() => CreateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for notes (number instead of string)', () => {
      const input = {
        recipe_id: 'abc-123',
        planned_date: new Date('2024-03-15'),
        meal_slot: 'dinner',
        notes: 123 as any,
      };

      expect(() => CreateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      type Expected = {
        recipe_id: string | null;
        planned_date: Date;
        meal_slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
        notes?: string | null | undefined;
      };

      type Actual = CreateCalendarEntryInput;

      // Type assertion tests (will fail to compile if types don't match)
      const assertType: Actual = {} as Expected;
      const assertTypeReverse: Expected = {} as Actual;

      expect(assertType).toBeDefined();
      expect(assertTypeReverse).toBeDefined();
    });
  });
});

describe('UpdateCalendarEntrySchema', () => {
  describe('valid inputs', () => {
    it('should accept valid input with all fields', () => {
      const input = {
        recipe_id: 'new-recipe',
        planned_date: new Date('2024-03-20'),
        meal_slot: 'lunch' as const,
        notes: 'Updated notes',
      };

      const result = UpdateCalendarEntrySchema.parse(input);
      expect(result.recipe_id).toBe('new-recipe');
      expect(result.planned_date).toEqual(new Date('2024-03-20'));
      expect(result.meal_slot).toBe('lunch');
      expect(result.notes).toBe('Updated notes');
    });

    it('should accept valid input with only recipe_id', () => {
      const input = {
        recipe_id: 'recipe-xyz',
      };

      const result = UpdateCalendarEntrySchema.parse(input);
      expect(result.recipe_id).toBe('recipe-xyz');
      expect(result.planned_date).toBeUndefined();
      expect(result.meal_slot).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('should accept valid input with only planned_date', () => {
      const input = {
        planned_date: new Date('2024-04-01'),
      };

      const result = UpdateCalendarEntrySchema.parse(input);
      expect(result.planned_date).toEqual(new Date('2024-04-01'));
      expect(result.recipe_id).toBeUndefined();
    });

    it('should accept valid input with only meal_slot', () => {
      const input = {
        meal_slot: 'breakfast' as const,
      };

      const result = UpdateCalendarEntrySchema.parse(input);
      expect(result.meal_slot).toBe('breakfast');
      expect(result.recipe_id).toBeUndefined();
    });

    it('should accept valid input with only notes', () => {
      const input = {
        notes: 'New notes only',
      };

      const result = UpdateCalendarEntrySchema.parse(input);
      expect(result.notes).toBe('New notes only');
      expect(result.recipe_id).toBeUndefined();
    });

    it('should accept valid input with recipe_id = null', () => {
      const input = {
        recipe_id: null,
      };

      const result = UpdateCalendarEntrySchema.parse(input);
      expect(result.recipe_id).toBeNull();
    });

    it('should accept valid input with notes = null', () => {
      const input = {
        notes: null,
      };

      const result = UpdateCalendarEntrySchema.parse(input);
      expect(result.notes).toBeNull();
    });

    it('should accept valid input with empty object (all fields optional)', () => {
      const input = {};

      const result = UpdateCalendarEntrySchema.parse(input);
      expect(result.recipe_id).toBeUndefined();
      expect(result.planned_date).toBeUndefined();
      expect(result.meal_slot).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('should accept all valid meal_slot values', () => {
      const mealSlots = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

      mealSlots.forEach((slot) => {
        const input = {
          meal_slot: slot,
        };

        const result = UpdateCalendarEntrySchema.parse(input);
        expect(result.meal_slot).toBe(slot);
      });
    });

    it('should accept combination of multiple fields', () => {
      const input = {
        recipe_id: 'combo-recipe',
        meal_slot: 'dinner' as const,
      };

      const result = UpdateCalendarEntrySchema.parse(input);
      expect(result.recipe_id).toBe('combo-recipe');
      expect(result.meal_slot).toBe('dinner');
      expect(result.planned_date).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  describe('invalid inputs', () => {
    it('should reject wrong type for recipe_id (number instead of string)', () => {
      const input = {
        recipe_id: 123 as any,
      };

      expect(() => UpdateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for planned_date (string instead of Date)', () => {
      const input = {
        planned_date: '2024-03-15' as any,
      };

      expect(() => UpdateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for planned_date (number instead of Date)', () => {
      const input = {
        planned_date: 1234567890 as any,
      };

      expect(() => UpdateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid meal_slot value', () => {
      const input = {
        meal_slot: 'brunch' as any,
      };

      expect(() => UpdateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for meal_slot (number instead of string)', () => {
      const input = {
        meal_slot: 123 as any,
      };

      expect(() => UpdateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject wrong type for notes (number instead of string)', () => {
      const input = {
        notes: 123 as any,
      };

      expect(() => UpdateCalendarEntrySchema.parse(input)).toThrow(z.ZodError);
    });
  });

  describe('type inference', () => {
    it('should infer correct TypeScript type', () => {
      type Expected = {
        recipe_id?: string | null | undefined;
        planned_date?: Date | undefined;
        meal_slot?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined;
        notes?: string | null | undefined;
      };

      type Actual = UpdateCalendarEntryInput;

      // Type assertion tests (will fail to compile if types don't match)
      const assertType: Actual = {} as Expected;
      const assertTypeReverse: Expected = {} as Actual;

      expect(assertType).toBeDefined();
      expect(assertTypeReverse).toBeDefined();
    });
  });
});
