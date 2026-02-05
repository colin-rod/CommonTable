import { describe, it, expect } from 'vitest';

import {
  CreateCalendarEntryCommentSchema,
  CalendarEntryCommentIdSchema,
  MealSlotSchema,
} from './calendar';

describe('CreateCalendarEntryCommentSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid comment input', () => {
      const input = {
        calendar_entry_id: '550e8400-e29b-41d4-a716-446655440000',
        comment_text: 'This looks delicious!',
      };
      const result = CreateCalendarEntryCommentSchema.parse(input);
      expect(result.calendar_entry_id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.comment_text).toBe('This looks delicious!');
    });

    it('should trim whitespace from comment text', () => {
      const input = {
        calendar_entry_id: '550e8400-e29b-41d4-a716-446655440000',
        comment_text: '  This looks delicious!  ',
      };
      const result = CreateCalendarEntryCommentSchema.parse(input);
      expect(result.comment_text).toBe('This looks delicious!');
    });

    it('should accept multi-line comments', () => {
      const input = {
        calendar_entry_id: '550e8400-e29b-41d4-a716-446655440000',
        comment_text: 'Line 1\nLine 2\nLine 3',
      };
      const result = CreateCalendarEntryCommentSchema.parse(input);
      expect(result.comment_text).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('validation errors', () => {
    it('should reject invalid calendar_entry_id UUID', () => {
      const input = {
        calendar_entry_id: 'not-a-uuid',
        comment_text: 'This looks delicious!',
      };
      expect(() => CreateCalendarEntryCommentSchema.parse(input)).toThrow(
        'Invalid calendar entry ID',
      );
    });

    it('should reject missing calendar_entry_id', () => {
      const input = {
        comment_text: 'This looks delicious!',
      };
      expect(() => CreateCalendarEntryCommentSchema.parse(input)).toThrow();
    });

    it('should reject missing comment_text', () => {
      const input = {
        calendar_entry_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => CreateCalendarEntryCommentSchema.parse(input)).toThrow();
    });

    it('should reject empty comment_text', () => {
      const input = {
        calendar_entry_id: '550e8400-e29b-41d4-a716-446655440000',
        comment_text: '',
      };
      expect(() => CreateCalendarEntryCommentSchema.parse(input)).toThrow(
        'Comment cannot be empty',
      );
    });

    it('should reject whitespace-only comment_text', () => {
      const input = {
        calendar_entry_id: '550e8400-e29b-41d4-a716-446655440000',
        comment_text: '   ',
      };
      // After trim, becomes empty string and fails min(1) validation
      expect(() => CreateCalendarEntryCommentSchema.parse(input)).toThrow(
        'Comment cannot be empty',
      );
    });
  });
});

describe('CalendarEntryCommentIdSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = CalendarEntryCommentIdSchema.parse(uuid);
      expect(result).toBe(uuid);
    });

    it('should accept UUID in different formats', () => {
      // Lowercase
      const lowercaseUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(CalendarEntryCommentIdSchema.parse(lowercaseUuid)).toBe(lowercaseUuid);

      // Uppercase
      const uppercaseUuid = '550E8400-E29B-41D4-A716-446655440000';
      expect(CalendarEntryCommentIdSchema.parse(uppercaseUuid)).toBe(uppercaseUuid);

      // Mixed case
      const mixedUuid = '550e8400-E29B-41d4-a716-446655440000';
      expect(CalendarEntryCommentIdSchema.parse(mixedUuid)).toBe(mixedUuid);
    });
  });

  describe('validation errors', () => {
    it('should reject invalid UUID format', () => {
      expect(() => CalendarEntryCommentIdSchema.parse('not-a-uuid')).toThrow('Invalid comment ID');
    });

    it('should reject UUID without hyphens', () => {
      expect(() => CalendarEntryCommentIdSchema.parse('550e8400e29b41d4a716446655440000')).toThrow(
        'Invalid comment ID',
      );
    });

    it('should reject UUID with wrong number of sections', () => {
      expect(() => CalendarEntryCommentIdSchema.parse('550e8400-e29b-41d4-a716')).toThrow(
        'Invalid comment ID',
      );
    });

    it('should reject empty string', () => {
      expect(() => CalendarEntryCommentIdSchema.parse('')).toThrow('Invalid comment ID');
    });

    it('should reject non-string values', () => {
      expect(() => CalendarEntryCommentIdSchema.parse(123 as any)).toThrow();
    });
  });
});

describe('MealSlotSchema', () => {
  describe('valid inputs', () => {
    it('should accept "breakfast"', () => {
      const result = MealSlotSchema.parse('breakfast');
      expect(result).toBe('breakfast');
    });

    it('should accept "lunch"', () => {
      const result = MealSlotSchema.parse('lunch');
      expect(result).toBe('lunch');
    });

    it('should accept "dinner"', () => {
      const result = MealSlotSchema.parse('dinner');
      expect(result).toBe('dinner');
    });

    it('should accept "snack"', () => {
      const result = MealSlotSchema.parse('snack');
      expect(result).toBe('snack');
    });
  });

  describe('validation errors', () => {
    it('should reject invalid meal slot "brunch"', () => {
      expect(() => MealSlotSchema.parse('brunch')).toThrow();
    });

    it('should reject invalid meal slot "dessert"', () => {
      expect(() => MealSlotSchema.parse('dessert')).toThrow();
    });

    it('should reject empty string', () => {
      expect(() => MealSlotSchema.parse('')).toThrow();
    });

    it('should reject null', () => {
      expect(() => MealSlotSchema.parse(null)).toThrow();
    });

    it('should reject undefined', () => {
      expect(() => MealSlotSchema.parse(undefined)).toThrow();
    });

    it('should reject number', () => {
      expect(() => MealSlotSchema.parse(123 as any)).toThrow();
    });

    it('should reject object', () => {
      expect(() => MealSlotSchema.parse({ meal: 'breakfast' } as any)).toThrow();
    });
  });
});
