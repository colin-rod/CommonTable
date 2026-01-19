import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

import type { RawRecipeData } from './jsonld.ts';
import { normalizeRecipeData } from './normalizer.ts';

Deno.test('normalizeRecipeData - normalizes complete recipe data', () => {
  const raw: RawRecipeData = {
    title: '  Pasta Carbonara  ',
    description: '  Classic Italian dish  ',
    servings: 4,
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    ingredients: ['2 cups flour', '3 eggs', '1 cup cheese'],
    steps: ['Step 1', 'Step 2', 'Step 3'],
    image_url: 'https://example.com/image.jpg',
    tags: ['italian', 'pasta', 'dinner'],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.title, 'Pasta Carbonara');
  assertEquals(result.preview.description, 'Classic Italian dish');
  assertEquals(result.preview.servings, 4);
  assertEquals(result.preview.prep_time_minutes, 10);
  assertEquals(result.preview.cook_time_minutes, 20);
  assertEquals(result.preview.ingredients.length, 3);
  assertEquals(result.preview.steps.length, 3);
  assertEquals(result.preview.image_url, 'https://example.com/image.jpg');
  assertEquals(result.preview.tags, ['italian', 'pasta', 'dinner']);
  assertEquals(result.validation_errors.length, 0);
});

Deno.test('normalizeRecipeData - parses ingredient strings', () => {
  const raw: RawRecipeData = {
    ingredients: ['2 cups flour', '3 eggs', '1 tsp salt', '400g spaghetti', 'olive oil'],
    steps: ['Mix'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  // "2 cups flour"
  assertEquals(result.preview.ingredients[0].name, 'flour');
  assertEquals(result.preview.ingredients[0].quantity, 2);
  assertEquals(result.preview.ingredients[0].unit, 'cup');

  // "3 eggs" (no unit)
  assertEquals(result.preview.ingredients[1].name, 'eggs');
  assertEquals(result.preview.ingredients[1].quantity, 3);
  assertEquals(result.preview.ingredients[1].unit, undefined);

  // "1 tsp salt"
  assertEquals(result.preview.ingredients[2].name, 'salt');
  assertEquals(result.preview.ingredients[2].quantity, 1);
  assertEquals(result.preview.ingredients[2].unit, 'tsp');

  // "400g spaghetti"
  assertEquals(result.preview.ingredients[3].name, 'spaghetti');
  assertEquals(result.preview.ingredients[3].quantity, 400);
  assertEquals(result.preview.ingredients[3].unit, 'g');

  // "olive oil" (no quantity)
  assertEquals(result.preview.ingredients[4].name, 'olive oil');
  assertEquals(result.preview.ingredients[4].quantity, undefined);
  assertEquals(result.preview.ingredients[4].unit, undefined);
});

Deno.test('normalizeRecipeData - handles fractional quantities', () => {
  const raw: RawRecipeData = {
    ingredients: ['1/2 cup sugar', '1.5 cups milk', '2 1/2 tsp vanilla'],
    steps: ['Mix'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.ingredients[0].quantity, 0.5);
  assertEquals(result.preview.ingredients[1].quantity, 1.5);
  assertEquals(result.preview.ingredients[2].quantity, 2.5);
});

Deno.test('normalizeRecipeData - normalizes units', () => {
  const raw: RawRecipeData = {
    ingredients: ['2 cups flour', '3 tablespoons butter', '1 teaspoon salt'],
    steps: ['Mix'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.ingredients[0].unit, 'cup');
  assertEquals(result.preview.ingredients[1].unit, 'tbsp');
  assertEquals(result.preview.ingredients[2].unit, 'tsp');
});

Deno.test('normalizeRecipeData - adds position to steps', () => {
  const raw: RawRecipeData = {
    ingredients: ['flour'],
    steps: ['First step', 'Second step', 'Third step'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.steps[0].position, 1);
  assertEquals(result.preview.steps[0].text, 'First step');
  assertEquals(result.preview.steps[1].position, 2);
  assertEquals(result.preview.steps[1].text, 'Second step');
  assertEquals(result.preview.steps[2].position, 3);
  assertEquals(result.preview.steps[2].text, 'Third step');
});

Deno.test('normalizeRecipeData - truncates title to 200 chars', () => {
  const raw: RawRecipeData = {
    title: 'A'.repeat(250),
    ingredients: ['flour'],
    steps: ['mix'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.title?.length, 200);
});

Deno.test('normalizeRecipeData - truncates description to 2000 chars', () => {
  const raw: RawRecipeData = {
    description: 'A'.repeat(2500),
    ingredients: ['flour'],
    steps: ['mix'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.description?.length, 2000);
});

Deno.test('normalizeRecipeData - limits tags to 20', () => {
  const raw: RawRecipeData = {
    ingredients: ['flour'],
    steps: ['mix'],
    tags: Array.from({ length: 30 }, (_, i) => `tag${i}`),
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.tags.length, 20);
});

Deno.test('normalizeRecipeData - truncates tag names to 50 chars', () => {
  const raw: RawRecipeData = {
    ingredients: ['flour'],
    steps: ['mix'],
    tags: ['a'.repeat(100)],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.tags[0].length, 50);
});

Deno.test('normalizeRecipeData - filters empty ingredients', () => {
  const raw: RawRecipeData = {
    ingredients: ['flour', '', '  ', 'eggs'],
    steps: ['mix'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.ingredients.length, 2);
  assertEquals(result.preview.ingredients[0].name, 'flour');
  assertEquals(result.preview.ingredients[1].name, 'eggs');
});

Deno.test('normalizeRecipeData - filters empty steps', () => {
  const raw: RawRecipeData = {
    ingredients: ['flour'],
    steps: ['Step 1', '', '  ', 'Step 2'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.steps.length, 2);
  assertEquals(result.preview.steps[0].text, 'Step 1');
  assertEquals(result.preview.steps[1].text, 'Step 2');
});

Deno.test('normalizeRecipeData - adds validation error when title missing', () => {
  const raw: RawRecipeData = {
    ingredients: ['flour'],
    steps: ['mix'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  const titleError = result.validation_errors.find((e) => e.field === 'title');
  assertEquals(titleError?.message, 'Title is required');
});

Deno.test('normalizeRecipeData - adds validation error when no ingredients', () => {
  const raw: RawRecipeData = {
    title: 'Test Recipe',
    ingredients: [],
    steps: ['mix'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  const ingredientsError = result.validation_errors.find((e) => e.field === 'ingredients');
  assertEquals(ingredientsError?.message, 'At least one ingredient is required');
});

Deno.test('normalizeRecipeData - adds validation error when no steps', () => {
  const raw: RawRecipeData = {
    title: 'Test Recipe',
    ingredients: ['flour'],
    steps: [],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  const stepsError = result.validation_errors.find((e) => e.field === 'steps');
  assertEquals(stepsError?.message, 'At least one step is required');
});

Deno.test('normalizeRecipeData - handles partial data gracefully', () => {
  const raw: RawRecipeData = {
    title: 'Minimal Recipe',
    ingredients: [],
    steps: [],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.title, 'Minimal Recipe');
  assertEquals(result.preview.ingredients, []);
  assertEquals(result.preview.steps, []);
  assertEquals(result.validation_errors.length, 2); // Missing ingredients and steps
});

Deno.test('normalizeRecipeData - removes duplicate tags', () => {
  const raw: RawRecipeData = {
    ingredients: ['flour'],
    steps: ['mix'],
    tags: ['italian', 'pasta', 'italian', 'dinner', 'pasta'],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.tags, ['italian', 'pasta', 'dinner']);
});

Deno.test('normalizeRecipeData - trims whitespace from tags', () => {
  const raw: RawRecipeData = {
    ingredients: ['flour'],
    steps: ['mix'],
    tags: ['  italian  ', ' pasta ', 'dinner'],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.tags, ['italian', 'pasta', 'dinner']);
});

Deno.test('normalizeRecipeData - handles ingredient with range quantities', () => {
  const raw: RawRecipeData = {
    ingredients: ['2-3 cups flour', '1/2-1 tsp salt'],
    steps: ['mix'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  // Should use first number in range
  assertEquals(result.preview.ingredients[0].quantity, 2);
  assertEquals(result.preview.ingredients[1].quantity, 0.5);
});

Deno.test('normalizeRecipeData - parses ingredient with parenthetical notes', () => {
  const raw: RawRecipeData = {
    ingredients: ['2 cups flour (all-purpose)', '1 lb chicken (boneless, skinless)'],
    steps: ['cook'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.ingredients[0].name, 'flour');
  assertEquals(result.preview.ingredients[0].notes, 'all-purpose');

  assertEquals(result.preview.ingredients[1].name, 'chicken');
  assertEquals(result.preview.ingredients[1].notes, 'boneless, skinless');
});

Deno.test('normalizeRecipeData - handles ingredients with no quantity but with unit', () => {
  const raw: RawRecipeData = {
    ingredients: ['salt to taste', 'pepper as needed'],
    steps: ['season'],
    tags: [],
  };

  const result = normalizeRecipeData(raw);

  assertEquals(result.preview.ingredients[0].name, 'salt to taste');
  assertEquals(result.preview.ingredients[0].quantity, undefined);
});
