import { describe, it, expect } from 'vitest';

import {
  CreateCookingEventSchema,
  UpdateCookingEventSchema,
  CookingEventIdSchema,
} from './cooking-event';

describe('CreateCookingEventSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid cooking event input with all fields', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        cooked_at: new Date('2024-01-15T18:30:00Z'),
        servings_made: 4,
        rating: 5,
        notes: 'Delicious! Made a few tweaks.',
        calendar_entry_id: '770e8400-e29b-41d4-a716-446655440002',
      };
      const result = CreateCookingEventSchema.parse(input);
      expect(result.recipe_id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.recipe_version_id).toBe('660e8400-e29b-41d4-a716-446655440001');
      expect(result.cooked_at).toEqual(new Date('2024-01-15T18:30:00Z'));
      expect(result.servings_made).toBe(4);
      expect(result.rating).toBe(5);
      expect(result.notes).toBe('Delicious! Made a few tweaks.');
      expect(result.calendar_entry_id).toBe('770e8400-e29b-41d4-a716-446655440002');
    });

    it('should accept minimal required fields', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
      };
      const result = CreateCookingEventSchema.parse(input);
      expect(result.recipe_id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.recipe_version_id).toBe('660e8400-e29b-41d4-a716-446655440001');
      expect(result.cooked_at).toBeUndefined();
      expect(result.servings_made).toBeUndefined();
      expect(result.rating).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });

    it('should accept null optional fields', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        servings_made: null,
        rating: null,
        notes: null,
      };
      const result = CreateCookingEventSchema.parse(input);
      expect(result.servings_made).toBeNull();
      expect(result.rating).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should trim whitespace from notes', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        notes: '  Great recipe!  ',
      };
      const result = CreateCookingEventSchema.parse(input);
      expect(result.notes).toBe('Great recipe!');
    });

    it('should accept rating of 1', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        rating: 1,
      };
      const result = CreateCookingEventSchema.parse(input);
      expect(result.rating).toBe(1);
    });

    it('should accept rating of 5', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        rating: 5,
      };
      const result = CreateCookingEventSchema.parse(input);
      expect(result.rating).toBe(5);
    });

    it('should accept notes at maximum length (500 chars)', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        notes: 'a'.repeat(500),
      };
      const result = CreateCookingEventSchema.parse(input);
      expect(result.notes).toBe('a'.repeat(500));
    });
  });

  describe('validation errors', () => {
    it('should reject invalid recipe_id UUID', () => {
      const input = {
        recipe_id: 'not-a-uuid',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow('Invalid recipe ID');
    });

    it('should reject invalid recipe_version_id UUID', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: 'not-a-uuid',
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow('Invalid recipe version ID');
    });

    it('should reject missing recipe_id', () => {
      const input = {
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject missing recipe_version_id', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject non-integer servings_made', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        servings_made: 4.5,
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject negative servings_made', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        servings_made: -1,
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject zero servings_made', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        servings_made: 0,
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject non-integer rating', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        rating: 4.5,
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject rating below 1', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        rating: 0,
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject rating above 5', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        rating: 6,
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject notes over 500 characters', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        notes: 'a'.repeat(501),
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject invalid calendar_entry_id UUID', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        calendar_entry_id: 'not-a-uuid',
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject non-Date cooked_at', () => {
      const input = {
        recipe_id: '550e8400-e29b-41d4-a716-446655440000',
        recipe_version_id: '660e8400-e29b-41d4-a716-446655440001',
        cooked_at: '2024-01-15T18:30:00Z', // String instead of Date
      };
      expect(() => CreateCookingEventSchema.parse(input)).toThrow();
    });
  });
});

describe('UpdateCookingEventSchema', () => {
  describe('valid inputs', () => {
    it('should accept all fields', () => {
      const input = {
        rating: 4,
        notes: 'Updated notes',
        servings_made: 6,
      };
      const result = UpdateCookingEventSchema.parse(input);
      expect(result.rating).toBe(4);
      expect(result.notes).toBe('Updated notes');
      expect(result.servings_made).toBe(6);
    });

    it('should accept partial fields', () => {
      const input = {
        rating: 3,
      };
      const result = UpdateCookingEventSchema.parse(input);
      expect(result.rating).toBe(3);
      expect(result.notes).toBeUndefined();
      expect(result.servings_made).toBeUndefined();
    });

    it('should accept null fields', () => {
      const input = {
        rating: null,
        notes: null,
        servings_made: null,
      };
      const result = UpdateCookingEventSchema.parse(input);
      expect(result.rating).toBeNull();
      expect(result.notes).toBeNull();
      expect(result.servings_made).toBeNull();
    });

    it('should accept empty object', () => {
      const input = {};
      const result = UpdateCookingEventSchema.parse(input);
      expect(result).toEqual({});
    });

    it('should trim whitespace from notes', () => {
      const input = {
        notes: '  Updated notes  ',
      };
      const result = UpdateCookingEventSchema.parse(input);
      expect(result.notes).toBe('Updated notes');
    });

    it('should accept notes at maximum length (500 chars)', () => {
      const input = {
        notes: 'a'.repeat(500),
      };
      const result = UpdateCookingEventSchema.parse(input);
      expect(result.notes).toBe('a'.repeat(500));
    });
  });

  describe('validation errors', () => {
    it('should reject non-integer rating', () => {
      const input = {
        rating: 4.5,
      };
      expect(() => UpdateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject rating below 1', () => {
      const input = {
        rating: 0,
      };
      expect(() => UpdateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject rating above 5', () => {
      const input = {
        rating: 6,
      };
      expect(() => UpdateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject notes over 500 characters', () => {
      const input = {
        notes: 'a'.repeat(501),
      };
      expect(() => UpdateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject non-integer servings_made', () => {
      const input = {
        servings_made: 4.5,
      };
      expect(() => UpdateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject negative servings_made', () => {
      const input = {
        servings_made: -1,
      };
      expect(() => UpdateCookingEventSchema.parse(input)).toThrow();
    });

    it('should reject zero servings_made', () => {
      const input = {
        servings_made: 0,
      };
      expect(() => UpdateCookingEventSchema.parse(input)).toThrow();
    });
  });
});

describe('CookingEventIdSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = CookingEventIdSchema.parse(uuid);
      expect(result).toBe(uuid);
    });

    it('should accept UUID in different formats', () => {
      // Lowercase
      const lowercaseUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(CookingEventIdSchema.parse(lowercaseUuid)).toBe(lowercaseUuid);

      // Uppercase
      const uppercaseUuid = '550E8400-E29B-41D4-A716-446655440000';
      expect(CookingEventIdSchema.parse(uppercaseUuid)).toBe(uppercaseUuid);
    });
  });

  describe('validation errors', () => {
    it('should reject invalid UUID format', () => {
      expect(() => CookingEventIdSchema.parse('not-a-uuid')).toThrow('Invalid cooking event ID');
    });

    it('should reject UUID without hyphens', () => {
      expect(() => CookingEventIdSchema.parse('550e8400e29b41d4a716446655440000')).toThrow(
        'Invalid cooking event ID',
      );
    });

    it('should reject empty string', () => {
      expect(() => CookingEventIdSchema.parse('')).toThrow('Invalid cooking event ID');
    });

    it('should reject non-string values', () => {
      expect(() => CookingEventIdSchema.parse(123 as any)).toThrow();
    });
  });
});
