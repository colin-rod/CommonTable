import { describe, it, expect } from 'vitest';

import {
  IngredientInputSchema,
  StepInputSchema,
  CreateRecipeInputSchema,
  UpdateRecipeMetadataSchema,
  RecipeFilterSchema,
  RecipeSearchSchema,
  RecipeIdSchema,
  RecipeVersionIdSchema,
  ForkRecipeInputSchema,
} from './recipe';

describe('IngredientInputSchema', () => {
  describe('valid inputs', () => {
    it('should accept ingredient with all fields', () => {
      const input = {
        name: 'Flour',
        quantity: 2,
        unit: 'cups',
        notes: 'All-purpose flour',
      };
      const result = IngredientInputSchema.parse(input);
      expect(result.name).toBe('Flour');
      expect(result.quantity).toBe(2);
      expect(result.unit).toBe('cups');
      expect(result.notes).toBe('All-purpose flour');
    });

    it('should accept ingredient with only name', () => {
      const input = { name: 'Salt' };
      const result = IngredientInputSchema.parse(input);
      expect(result.name).toBe('Salt');
      expect(result.quantity).toBeUndefined();
    });

    it('should trim whitespace from name', () => {
      const input = { name: '  Flour  ' };
      const result = IngredientInputSchema.parse(input);
      expect(result.name).toBe('Flour');
    });
  });

  describe('validation errors', () => {
    it('should reject empty name', () => {
      const input = { name: '' };
      expect(() => IngredientInputSchema.parse(input)).toThrow('Ingredient name is required');
    });

    it('should reject name over 200 characters', () => {
      const input = { name: 'a'.repeat(201) };
      expect(() => IngredientInputSchema.parse(input)).toThrow(
        'Ingredient name must be 200 characters or less',
      );
    });

    it('should reject negative quantity', () => {
      const input = { name: 'Flour', quantity: -1 };
      expect(() => IngredientInputSchema.parse(input)).toThrow('Quantity must be positive');
    });

    it('should reject zero quantity', () => {
      const input = { name: 'Flour', quantity: 0 };
      expect(() => IngredientInputSchema.parse(input)).toThrow('Quantity must be positive');
    });

    it('should reject unit over 50 characters', () => {
      const input = { name: 'Flour', unit: 'a'.repeat(51) };
      expect(() => IngredientInputSchema.parse(input)).toThrow(
        'Unit must be 50 characters or less',
      );
    });

    it('should reject notes over 500 characters', () => {
      const input = { name: 'Flour', notes: 'a'.repeat(501) };
      expect(() => IngredientInputSchema.parse(input)).toThrow(
        'Notes must be 500 characters or less',
      );
    });
  });
});

describe('StepInputSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid step', () => {
      const input = { position: 1, text: 'Mix flour and water' };
      const result = StepInputSchema.parse(input);
      expect(result.position).toBe(1);
      expect(result.text).toBe('Mix flour and water');
    });

    it('should trim whitespace from text', () => {
      const input = { position: 1, text: '  Mix flour and water  ' };
      const result = StepInputSchema.parse(input);
      expect(result.text).toBe('Mix flour and water');
    });

    it('should accept text at maximum length (2000 chars)', () => {
      const input = { position: 1, text: 'a'.repeat(2000) };
      const result = StepInputSchema.parse(input);
      expect(result.text).toBe('a'.repeat(2000));
    });
  });

  describe('validation errors', () => {
    it('should reject non-integer position', () => {
      const input = { position: 1.5, text: 'Mix flour' };
      expect(() => StepInputSchema.parse(input)).toThrow('Position must be an integer');
    });

    it('should reject negative position', () => {
      const input = { position: -1, text: 'Mix flour' };
      expect(() => StepInputSchema.parse(input)).toThrow('Position must be positive');
    });

    it('should reject zero position', () => {
      const input = { position: 0, text: 'Mix flour' };
      expect(() => StepInputSchema.parse(input)).toThrow('Position must be positive');
    });

    it('should reject empty text', () => {
      const input = { position: 1, text: '' };
      expect(() => StepInputSchema.parse(input)).toThrow('Step text is required');
    });

    it('should reject text over 2000 characters', () => {
      const input = { position: 1, text: 'a'.repeat(2001) };
      expect(() => StepInputSchema.parse(input)).toThrow(
        'Step text must be 2000 characters or less',
      );
    });
  });
});

describe('CreateRecipeInputSchema', () => {
  const validInput = {
    household_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Pasta Carbonara',
    user_id: '660e8400-e29b-41d4-a716-446655440001',
  };

  describe('valid inputs', () => {
    it('should accept minimal required fields', () => {
      const result = CreateRecipeInputSchema.parse(validInput);
      expect(result.title).toBe('Pasta Carbonara');
      expect(result.ingredients_json).toEqual([]);
      expect(result.steps_json).toEqual([]);
      expect(result.tags).toEqual([]);
    });

    it('should accept all fields', () => {
      const input = {
        ...validInput,
        description: 'Classic Italian pasta',
        ingredients_json: [{ name: 'Pasta', quantity: 400, unit: 'g' }],
        steps_json: [{ position: 1, text: 'Boil water' }],
        servings: 4,
        prep_time_minutes: 10,
        cook_time_minutes: 20,
        notes: 'Best served immediately',
        tags: ['italian', 'pasta'],
      };
      const result = CreateRecipeInputSchema.parse(input);
      expect(result.servings).toBe(4);
      expect(result.prep_time_minutes).toBe(10);
      expect(result.tags).toEqual(['italian', 'pasta']);
    });

    it('should accept zero for time fields', () => {
      const input = {
        ...validInput,
        prep_time_minutes: 0,
        cook_time_minutes: 0,
      };
      const result = CreateRecipeInputSchema.parse(input);
      expect(result.prep_time_minutes).toBe(0);
      expect(result.cook_time_minutes).toBe(0);
    });

    it('should accept maximum 20 tags', () => {
      const input = {
        ...validInput,
        tags: Array(20).fill('tag'),
      };
      const result = CreateRecipeInputSchema.parse(input);
      expect(result.tags).toHaveLength(20);
    });
  });

  describe('validation errors', () => {
    it('should reject invalid household_id UUID', () => {
      const input = { ...validInput, household_id: 'not-a-uuid' };
      expect(() => CreateRecipeInputSchema.parse(input)).toThrow('Invalid household ID');
    });

    it('should reject empty title', () => {
      const input = { ...validInput, title: '' };
      expect(() => CreateRecipeInputSchema.parse(input)).toThrow('Title is required');
    });

    it('should reject title over 200 characters', () => {
      const input = { ...validInput, title: 'a'.repeat(201) };
      expect(() => CreateRecipeInputSchema.parse(input)).toThrow(
        'Title must be 200 characters or less',
      );
    });

    it('should reject description over 2000 characters', () => {
      const input = { ...validInput, description: 'a'.repeat(2001) };
      expect(() => CreateRecipeInputSchema.parse(input)).toThrow(
        'Description must be 2000 characters or less',
      );
    });

    it('should reject non-integer servings', () => {
      const input = { ...validInput, servings: 4.5 };
      expect(() => CreateRecipeInputSchema.parse(input)).toThrow('Servings must be an integer');
    });

    it('should reject negative servings', () => {
      const input = { ...validInput, servings: -1 };
      expect(() => CreateRecipeInputSchema.parse(input)).toThrow('Servings must be positive');
    });

    it('should reject negative prep_time', () => {
      const input = { ...validInput, prep_time_minutes: -1 };
      expect(() => CreateRecipeInputSchema.parse(input)).toThrow('Prep time cannot be negative');
    });

    it('should reject more than 20 tags', () => {
      const input = { ...validInput, tags: Array(21).fill('tag') };
      expect(() => CreateRecipeInputSchema.parse(input)).toThrow('Maximum 20 tags allowed');
    });

    it('should reject invalid user_id UUID', () => {
      const input = { ...validInput, user_id: 'not-a-uuid' };
      expect(() => CreateRecipeInputSchema.parse(input)).toThrow('Invalid user ID');
    });
  });
});

describe('UpdateRecipeMetadataSchema', () => {
  describe('valid inputs', () => {
    it('should accept partial updates', () => {
      const input = { title: 'New Title' };
      const result = UpdateRecipeMetadataSchema.parse(input);
      expect(result.title).toBe('New Title');
    });

    it('should accept null description', () => {
      const input = { description: null };
      const result = UpdateRecipeMetadataSchema.parse(input);
      expect(result.description).toBeNull();
    });

    it('should accept is_favorite boolean', () => {
      const input = { is_favorite: true };
      const result = UpdateRecipeMetadataSchema.parse(input);
      expect(result.is_favorite).toBe(true);
    });
  });

  describe('validation errors', () => {
    it('should reject empty title', () => {
      const input = { title: '' };
      expect(() => UpdateRecipeMetadataSchema.parse(input)).toThrow('Title is required');
    });

    it('should reject title over 200 characters', () => {
      const input = { title: 'a'.repeat(201) };
      expect(() => UpdateRecipeMetadataSchema.parse(input)).toThrow(
        'Title must be 200 characters or less',
      );
    });

    it('should reject more than 20 tags', () => {
      const input = { tags: Array(21).fill('tag') };
      expect(() => UpdateRecipeMetadataSchema.parse(input)).toThrow('Maximum 20 tags allowed');
    });
  });
});

describe('RecipeFilterSchema', () => {
  describe('valid inputs', () => {
    it('should accept minimal required fields with defaults', () => {
      const input = { household_id: '550e8400-e29b-41d4-a716-446655440000' };
      const result = RecipeFilterSchema.parse(input);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('should accept all filter fields', () => {
      const input = {
        household_id: '550e8400-e29b-41d4-a716-446655440000',
        tags: ['italian', 'pasta'],
        search_query: 'carbonara',
        last_cooked_after: new Date('2024-01-01'),
        last_cooked_before: new Date('2024-12-31'),
        min_rating: 4,
        is_favorite: true,
        limit: 25,
        offset: 10,
      };
      const result = RecipeFilterSchema.parse(input);
      expect(result.limit).toBe(25);
      expect(result.offset).toBe(10);
      expect(result.min_rating).toBe(4);
    });
  });

  describe('validation errors', () => {
    it('should reject limit over 100', () => {
      const input = {
        household_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 101,
      };
      expect(() => RecipeFilterSchema.parse(input)).toThrow();
    });

    it('should reject negative offset', () => {
      const input = {
        household_id: '550e8400-e29b-41d4-a716-446655440000',
        offset: -1,
      };
      expect(() => RecipeFilterSchema.parse(input)).toThrow();
    });

    it('should reject min_rating above 5', () => {
      const input = {
        household_id: '550e8400-e29b-41d4-a716-446655440000',
        min_rating: 6,
      };
      expect(() => RecipeFilterSchema.parse(input)).toThrow();
    });
  });
});

describe('RecipeSearchSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid search input', () => {
      const input = {
        query: 'pasta',
        household_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = RecipeSearchSchema.parse(input);
      expect(result.query).toBe('pasta');
      expect(result.limit).toBe(20);
    });

    it('should accept custom limit', () => {
      const input = {
        query: 'pasta',
        household_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 10,
      };
      const result = RecipeSearchSchema.parse(input);
      expect(result.limit).toBe(10);
    });
  });

  describe('validation errors', () => {
    it('should reject empty query', () => {
      const input = {
        query: '',
        household_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => RecipeSearchSchema.parse(input)).toThrow('Search query is required');
    });

    it('should reject query over 200 characters', () => {
      const input = {
        query: 'a'.repeat(201),
        household_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => RecipeSearchSchema.parse(input)).toThrow(
        'Search query must be 200 characters or less',
      );
    });

    it('should reject limit over 50', () => {
      const input = {
        query: 'pasta',
        household_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 51,
      };
      expect(() => RecipeSearchSchema.parse(input)).toThrow();
    });
  });
});

describe('RecipeIdSchema', () => {
  it('should accept valid UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = RecipeIdSchema.parse(uuid);
    expect(result).toBe(uuid);
  });

  it('should reject invalid UUID', () => {
    expect(() => RecipeIdSchema.parse('not-a-uuid')).toThrow('Invalid recipe ID');
  });
});

describe('RecipeVersionIdSchema', () => {
  it('should accept valid UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = RecipeVersionIdSchema.parse(uuid);
    expect(result).toBe(uuid);
  });

  it('should reject invalid UUID', () => {
    expect(() => RecipeVersionIdSchema.parse('not-a-uuid')).toThrow('Invalid recipe version ID');
  });
});

describe('ForkRecipeInputSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid fork input', () => {
      const input = {
        parentRecipeId: '550e8400-e29b-41d4-a716-446655440000',
        newTitle: 'My Version of Pasta Carbonara',
      };
      const result = ForkRecipeInputSchema.parse(input);
      expect(result.parentRecipeId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.newTitle).toBe('My Version of Pasta Carbonara');
    });

    it('should trim whitespace from newTitle', () => {
      const input = {
        parentRecipeId: '550e8400-e29b-41d4-a716-446655440000',
        newTitle: '  My Version  ',
      };
      const result = ForkRecipeInputSchema.parse(input);
      expect(result.newTitle).toBe('My Version');
    });
  });

  describe('validation errors', () => {
    it('should reject invalid parentRecipeId UUID', () => {
      const input = {
        parentRecipeId: 'not-a-uuid',
        newTitle: 'My Version',
      };
      expect(() => ForkRecipeInputSchema.parse(input)).toThrow('Invalid parent recipe ID');
    });

    it('should reject empty newTitle', () => {
      const input = {
        parentRecipeId: '550e8400-e29b-41d4-a716-446655440000',
        newTitle: '',
      };
      expect(() => ForkRecipeInputSchema.parse(input)).toThrow('Title is required');
    });

    it('should reject newTitle over 200 characters', () => {
      const input = {
        parentRecipeId: '550e8400-e29b-41d4-a716-446655440000',
        newTitle: 'a'.repeat(201),
      };
      expect(() => ForkRecipeInputSchema.parse(input)).toThrow(
        'Title must be 200 characters or less',
      );
    });
  });
});
