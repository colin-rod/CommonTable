import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import {
  QueueStatusSchema,
  LaneTypeSchema,
  CreateQueueEntrySchema,
  UpdateQueueEntrySchema,
  UpdateQueuePositionSchema,
  UpdateQueueStatusSchema,
  QueueEntryIdSchema,
  QueueFilterSchema,
  LaneConfigSchema,
  LANE_TYPES,
  MarkAsCookedSchema,
  type QueueStatus,
} from './recipe-queue';

describe('QueueStatusSchema', () => {
  describe('valid values', () => {
    it('should accept "queued"', () => {
      const result = QueueStatusSchema.parse('queued');
      expect(result).toBe('queued');
    });

    it('should accept "cooking"', () => {
      const result = QueueStatusSchema.parse('cooking');
      expect(result).toBe('cooking');
    });

    it('should accept "cooked"', () => {
      const result = QueueStatusSchema.parse('cooked');
      expect(result).toBe('cooked');
    });
  });

  describe('invalid values', () => {
    it('should reject unknown status value', () => {
      expect(() => QueueStatusSchema.parse('unknown')).toThrow(z.ZodError);
    });

    it('should reject null', () => {
      expect(() => QueueStatusSchema.parse(null)).toThrow(z.ZodError);
    });
  });
});

describe('LaneTypeSchema', () => {
  describe('valid values', () => {
    it('should accept "meal_type"', () => {
      const result = LaneTypeSchema.parse('meal_type');
      expect(result).toBe('meal_type');
    });

    it('should accept "cuisine"', () => {
      const result = LaneTypeSchema.parse('cuisine');
      expect(result).toBe('cuisine');
    });

    it('should accept "cooking_method"', () => {
      const result = LaneTypeSchema.parse('cooking_method');
      expect(result).toBe('cooking_method');
    });

    it('should accept "dietary"', () => {
      const result = LaneTypeSchema.parse('dietary');
      expect(result).toBe('dietary');
    });

    it('should accept "dish_category"', () => {
      const result = LaneTypeSchema.parse('dish_category');
      expect(result).toBe('dish_category');
    });
  });

  describe('invalid values', () => {
    it('should reject unknown lane type', () => {
      expect(() => LaneTypeSchema.parse('unknown')).toThrow(z.ZodError);
    });

    it('should reject null', () => {
      expect(() => LaneTypeSchema.parse(null)).toThrow(z.ZodError);
    });
  });
});

describe('CreateQueueEntrySchema', () => {
  describe('valid inputs', () => {
    it('should accept all required fields provided', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        position: 5,
        status: 'queued' as const,
        notes: 'Try this recipe soon',
      };

      const result = CreateQueueEntrySchema.parse(input);
      expect(result.recipe_id).toBe(input.recipe_id);
      expect(result.household_id).toBe(input.household_id);
      expect(result.added_by).toBe(input.added_by);
      expect(result.position).toBe(5);
      expect(result.status).toBe('queued');
      expect(result.notes).toBe('Try this recipe soon');
    });

    it('should accept input with optional notes field', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        notes: 'Optional notes',
      };

      const result = CreateQueueEntrySchema.parse(input);
      expect(result.notes).toBe('Optional notes');
    });

    it('should accept input without optional notes field', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
      };

      const result = CreateQueueEntrySchema.parse(input);
      expect(result.notes).toBeUndefined();
    });

    it('should default status to "queued"', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
      };

      const result = CreateQueueEntrySchema.parse(input);
      expect(result.status).toBe('queued');
    });

    it('should default position to 0', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
      };

      const result = CreateQueueEntrySchema.parse(input);
      expect(result.position).toBe(0);
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing recipe_id', () => {
      const input = {
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
      };

      expect(() => CreateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject missing household_id', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
      };

      expect(() => CreateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject missing added_by', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      expect(() => CreateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid recipe_id (not UUID)', () => {
      const input = {
        recipe_id: 'invalid-uuid',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
      };

      expect(() => CreateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid household_id (not UUID)', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: 'invalid-uuid',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
      };

      expect(() => CreateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid added_by (not UUID)', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: 'invalid-uuid',
      };

      expect(() => CreateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid position (negative)', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        position: -1,
      };

      expect(() => CreateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid position (non-integer)', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        position: 3.5,
      };

      expect(() => CreateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid status (not in enum)', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        status: 'invalid',
      };

      expect(() => CreateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject notes too long (>1000 chars)', () => {
      const input = {
        recipe_id: '123e4567-e89b-12d3-a456-426614174000',
        household_id: '123e4567-e89b-12d3-a456-426614174001',
        added_by: '123e4567-e89b-12d3-a456-426614174002',
        notes: 'a'.repeat(1001),
      };

      expect(() => CreateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });
  });
});

describe('UpdateQueueEntrySchema', () => {
  describe('valid inputs', () => {
    it('should accept update position only', () => {
      const input = { position: 5 };
      const result = UpdateQueueEntrySchema.parse(input);
      expect(result.position).toBe(5);
    });

    it('should accept update status only', () => {
      const input = { status: 'cooking' as const };
      const result = UpdateQueueEntrySchema.parse(input);
      expect(result.status).toBe('cooking');
    });

    it('should accept update notes only (with value)', () => {
      const input = { notes: 'Updated notes' };
      const result = UpdateQueueEntrySchema.parse(input);
      expect(result.notes).toBe('Updated notes');
    });

    it('should accept update notes to null (clear notes)', () => {
      const input = { notes: null };
      const result = UpdateQueueEntrySchema.parse(input);
      expect(result.notes).toBeNull();
    });

    it('should accept update all fields together', () => {
      const input = {
        position: 3,
        status: 'cooked' as const,
        notes: 'All fields updated',
      };

      const result = UpdateQueueEntrySchema.parse(input);
      expect(result.position).toBe(3);
      expect(result.status).toBe('cooked');
      expect(result.notes).toBe('All fields updated');
    });

    it('should accept empty object (all fields optional)', () => {
      const input = {};
      const result = UpdateQueueEntrySchema.parse(input);
      expect(result).toEqual({});
    });
  });

  describe('invalid inputs', () => {
    it('should reject invalid position (negative)', () => {
      const input = { position: -1 };
      expect(() => UpdateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid position (non-integer)', () => {
      const input = { position: 2.5 };
      expect(() => UpdateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid status (not in enum)', () => {
      const input = { status: 'invalid' };
      expect(() => UpdateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject notes too long (>1000 chars)', () => {
      const input = { notes: 'a'.repeat(1001) };
      expect(() => UpdateQueueEntrySchema.parse(input)).toThrow(z.ZodError);
    });
  });
});

describe('UpdateQueuePositionSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid position (0)', () => {
      const input = { position: 0 };
      const result = UpdateQueuePositionSchema.parse(input);
      expect(result.position).toBe(0);
    });

    it('should accept valid position (positive integer)', () => {
      const input = { position: 10 };
      const result = UpdateQueuePositionSchema.parse(input);
      expect(result.position).toBe(10);
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing position', () => {
      const input = {};
      expect(() => UpdateQueuePositionSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject negative position', () => {
      const input = { position: -1 };
      expect(() => UpdateQueuePositionSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject non-integer position', () => {
      const input = { position: 3.14 };
      expect(() => UpdateQueuePositionSchema.parse(input)).toThrow(z.ZodError);
    });
  });
});

describe('UpdateQueueStatusSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid status: "queued"', () => {
      const input = { status: 'queued' as const };
      const result = UpdateQueueStatusSchema.parse(input);
      expect(result.status).toBe('queued');
    });

    it('should accept valid status: "cooking"', () => {
      const input = { status: 'cooking' as const };
      const result = UpdateQueueStatusSchema.parse(input);
      expect(result.status).toBe('cooking');
    });

    it('should accept valid status: "cooked"', () => {
      const input = { status: 'cooked' as const };
      const result = UpdateQueueStatusSchema.parse(input);
      expect(result.status).toBe('cooked');
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing status', () => {
      const input = {};
      expect(() => UpdateQueueStatusSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid status (not in enum)', () => {
      const input = { status: 'invalid' };
      expect(() => UpdateQueueStatusSchema.parse(input)).toThrow(z.ZodError);
    });
  });
});

describe('QueueEntryIdSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid UUID string', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = QueueEntryIdSchema.parse(uuid);
      expect(result).toBe(uuid);
    });
  });

  describe('invalid inputs', () => {
    it('should reject invalid UUID format', () => {
      expect(() => QueueEntryIdSchema.parse('invalid-uuid')).toThrow(z.ZodError);
    });

    it('should reject empty string', () => {
      expect(() => QueueEntryIdSchema.parse('')).toThrow(z.ZodError);
    });

    it('should reject non-string value', () => {
      expect(() => QueueEntryIdSchema.parse(123)).toThrow(z.ZodError);
    });
  });
});

describe('QueueFilterSchema', () => {
  describe('valid inputs', () => {
    it('should accept household_id only (no status filter)', () => {
      const input = {
        household_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = QueueFilterSchema.parse(input);
      expect(result.household_id).toBe(input.household_id);
      expect(result.status).toBeUndefined();
    });

    it('should accept household_id and status filter', () => {
      const input = {
        household_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'queued' as const,
      };

      const result = QueueFilterSchema.parse(input);
      expect(result.household_id).toBe(input.household_id);
      expect(result.status).toBe('queued');
    });

    it('should accept all valid status values', () => {
      const statuses: QueueStatus[] = ['queued', 'cooking', 'cooked'];

      statuses.forEach((status) => {
        const input = {
          household_id: '123e4567-e89b-12d3-a456-426614174000',
          status,
        };

        const result = QueueFilterSchema.parse(input);
        expect(result.status).toBe(status);
      });
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing household_id', () => {
      const input = { status: 'queued' as const };
      expect(() => QueueFilterSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid household_id (not UUID)', () => {
      const input = {
        household_id: 'invalid-uuid',
        status: 'queued' as const,
      };

      expect(() => QueueFilterSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid status (not in enum)', () => {
      const input = {
        household_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'invalid',
      };

      expect(() => QueueFilterSchema.parse(input)).toThrow(z.ZodError);
    });
  });
});

describe('LaneConfigSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid config with all fields', () => {
      const input = {
        type: 'meal_type' as const,
        label: 'Meal Type',
        description: 'Group by meal type',
      };

      const result = LaneConfigSchema.parse(input);
      expect(result.type).toBe('meal_type');
      expect(result.label).toBe('Meal Type');
      expect(result.description).toBe('Group by meal type');
    });
  });

  describe('invalid inputs', () => {
    it('should reject missing type', () => {
      const input = {
        label: 'Meal Type',
        description: 'Group by meal type',
      };

      expect(() => LaneConfigSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject missing label', () => {
      const input = {
        type: 'meal_type' as const,
        description: 'Group by meal type',
      };

      expect(() => LaneConfigSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject missing description', () => {
      const input = {
        type: 'meal_type' as const,
        label: 'Meal Type',
      };

      expect(() => LaneConfigSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject empty label', () => {
      const input = {
        type: 'meal_type' as const,
        label: '',
        description: 'Group by meal type',
      };

      expect(() => LaneConfigSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject empty description', () => {
      const input = {
        type: 'meal_type' as const,
        label: 'Meal Type',
        description: '',
      };

      expect(() => LaneConfigSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject invalid type (not in enum)', () => {
      const input = {
        type: 'invalid',
        label: 'Meal Type',
        description: 'Group by meal type',
      };

      expect(() => LaneConfigSchema.parse(input)).toThrow(z.ZodError);
    });
  });
});

describe('LANE_TYPES', () => {
  it('should define all 5 lane types', () => {
    const laneTypes = Object.keys(LANE_TYPES);
    expect(laneTypes).toHaveLength(5);
    expect(laneTypes).toContain('meal_type');
    expect(laneTypes).toContain('cuisine');
    expect(laneTypes).toContain('cooking_method');
    expect(laneTypes).toContain('dietary');
    expect(laneTypes).toContain('dish_category');
  });

  it('should have meal_type config', () => {
    const config = LANE_TYPES.meal_type;
    expect(config.type).toBe('meal_type');
    expect(config.label).toBe('Meal Type');
    expect(config.description).toBe('Group by breakfast, main dish, side dish, etc.');
  });

  it('should have cuisine config', () => {
    const config = LANE_TYPES.cuisine;
    expect(config.type).toBe('cuisine');
    expect(config.label).toBe('Cuisine');
    expect(config.description).toBe('Group by Italian, Mexican, Asian, etc.');
  });
});

describe('MarkAsCookedSchema', () => {
  describe('valid inputs', () => {
    it('should accept all fields optional', () => {
      const input = {};
      const result = MarkAsCookedSchema.parse(input);
      expect(result).toEqual({});
    });

    it('should accept with rating (1-5)', () => {
      const ratings = [1, 2, 3, 4, 5];
      ratings.forEach((rating) => {
        const input = { rating };
        const result = MarkAsCookedSchema.parse(input);
        expect(result.rating).toBe(rating);
      });
    });

    it('should accept with servings_made', () => {
      const input = { servings_made: 4 };
      const result = MarkAsCookedSchema.parse(input);
      expect(result.servings_made).toBe(4);
    });

    it('should accept with notes', () => {
      const input = { notes: 'Tasted great!' };
      const result = MarkAsCookedSchema.parse(input);
      expect(result.notes).toBe('Tasted great!');
    });
  });

  describe('invalid inputs', () => {
    it('should reject rating < 1', () => {
      const input = { rating: 0 };
      expect(() => MarkAsCookedSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject rating > 5', () => {
      const input = { rating: 6 };
      expect(() => MarkAsCookedSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject rating non-integer', () => {
      const input = { rating: 3.5 };
      expect(() => MarkAsCookedSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject servings_made = 0', () => {
      const input = { servings_made: 0 };
      expect(() => MarkAsCookedSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject servings_made negative', () => {
      const input = { servings_made: -1 };
      expect(() => MarkAsCookedSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject servings_made non-integer', () => {
      const input = { servings_made: 2.5 };
      expect(() => MarkAsCookedSchema.parse(input)).toThrow(z.ZodError);
    });

    it('should reject notes too long (>5000 chars)', () => {
      const input = { notes: 'a'.repeat(5001) };
      expect(() => MarkAsCookedSchema.parse(input)).toThrow(z.ZodError);
    });
  });
});
