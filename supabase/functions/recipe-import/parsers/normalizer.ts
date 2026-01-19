import type {
  IngredientPreview,
  RecipeImportResponse,
  StepPreview,
  ValidationError,
} from '../schema.ts';

import type { RawRecipeData } from './jsonld.ts';

/**
 * Unit alias mapping for normalization (subset from unitConversion.ts)
 */
const UNIT_ALIASES: Record<string, string> = {
  cups: 'cup',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  ounce: 'oz',
  ounces: 'oz',
  pound: 'lb',
  pounds: 'lb',
  lbs: 'lb',
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
};

/**
 * Normalize raw parsed recipe data into CommonTable format
 * Applies validation, truncation, unit normalization, etc.
 *
 * @param raw - Raw parsed data from JSON-LD or HTML fallback
 * @returns Normalized recipe preview with validation errors
 */
export function normalizeRecipeData(raw: RawRecipeData): RecipeImportResponse {
  const validation_errors: ValidationError[] = [];

  // Normalize title
  const title = raw.title?.trim().substring(0, 200);
  if (!title) {
    validation_errors.push({ field: 'title', message: 'Title is required' });
  }

  // Normalize description
  const description = raw.description?.trim().substring(0, 2000);

  // Normalize ingredients
  const ingredients = normalizeIngredients(raw.ingredients);
  if (ingredients.length === 0) {
    validation_errors.push({
      field: 'ingredients',
      message: 'At least one ingredient is required',
    });
  }

  // Normalize steps
  const steps = normalizeSteps(raw.steps);
  if (steps.length === 0) {
    validation_errors.push({ field: 'steps', message: 'At least one step is required' });
  }

  // Normalize tags (max 20, max 50 chars each, dedupe)
  const tags = normalizeTags(raw.tags);

  return {
    preview: {
      title,
      description,
      servings: raw.servings,
      prep_time_minutes: raw.prep_time_minutes,
      cook_time_minutes: raw.cook_time_minutes,
      ingredients,
      steps,
      image_url: raw.image_url,
      tags,
    },
    validation_errors,
    source: {
      url: '', // Will be filled by handler
      parsed_via: 'jsonld', // Will be filled by handler
      fetched_at: new Date().toISOString(),
    },
  };
}

/**
 * Normalize ingredients array
 * Parses ingredient strings into {name, quantity, unit, notes}
 */
function normalizeIngredients(ingredients: string[]): IngredientPreview[] {
  return ingredients
    .map((ing) => ing.trim())
    .filter((ing) => ing.length > 0)
    .map(parseIngredientString)
    .filter((ing): ing is IngredientPreview => ing !== null);
}

/**
 * Parse ingredient string into structured format
 * Examples:
 *   "2 cups flour" → {name: 'flour', quantity: 2, unit: 'cup'}
 *   "3 eggs" → {name: 'eggs', quantity: 3}
 *   "salt to taste" → {name: 'salt to taste'}
 *   "1 lb chicken (boneless)" → {name: 'chicken', quantity: 1, unit: 'lb', notes: 'boneless'}
 */
function parseIngredientString(ingredient: string): IngredientPreview | null {
  if (!ingredient.trim()) return null;

  // Extract notes in parentheses
  let notes: string | undefined;
  const notesMatch = ingredient.match(/\(([^)]+)\)/);
  if (notesMatch) {
    notes = notesMatch[1].trim();
    ingredient = ingredient.replace(/\([^)]+\)/g, '').trim();
  }

  // Try to parse quantity and unit
  // Patterns: "2 cups flour", "1/2 cup sugar", "1.5 tsp salt", "2-3 eggs"
  const quantityPattern = /^(\d+(?:[/.]?\d+)?(?:\s*-\s*\d+(?:[/.]?\d+)?)?)\s*([a-zA-Z]+)?\s+(.+)/;
  const match = ingredient.match(quantityPattern);

  if (match) {
    const quantityStr = match[1];
    const unit = match[2];
    const name = match[3];

    const quantity = parseQuantity(quantityStr);

    return {
      name: name.trim(),
      quantity: quantity ?? undefined,
      unit: unit ? normalizeUnit(unit) : undefined,
      notes,
    };
  }

  // Try pattern without unit: "3 eggs"
  const noUnitPattern = /^(\d+(?:[/.]?\d+)?(?:\s*-\s*\d+(?:[/.]?\d+)?)?)\s+(.+)/;
  const noUnitMatch = ingredient.match(noUnitPattern);

  if (noUnitMatch) {
    const quantityStr = noUnitMatch[1];
    const name = noUnitMatch[2];

    const quantity = parseQuantity(quantityStr);

    return {
      name: name.trim(),
      quantity: quantity ?? undefined,
      notes,
    };
  }

  // No quantity or unit found - just name
  return {
    name: ingredient.trim(),
    notes,
  };
}

/**
 * Parse quantity string to number
 * Handles: "2", "1/2", "1.5", "2-3" (range, returns first number), "2 1/2"
 */
function parseQuantity(quantityStr: string): number | null {
  if (!quantityStr) return null;

  // Handle range (e.g., "2-3") - use first number
  if (quantityStr.includes('-')) {
    quantityStr = quantityStr.split('-')[0].trim();
  }

  // Handle mixed number (e.g., "2 1/2")
  const mixedMatch = quantityStr.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const numerator = parseInt(mixedMatch[2], 10);
    const denominator = parseInt(mixedMatch[3], 10);
    return whole + numerator / denominator;
  }

  // Handle fraction (e.g., "1/2")
  if (quantityStr.includes('/')) {
    const [numerator, denominator] = quantityStr.split('/').map((n) => parseInt(n, 10));
    if (denominator && !isNaN(numerator) && !isNaN(denominator)) {
      return numerator / denominator;
    }
  }

  // Handle decimal (e.g., "1.5")
  const num = parseFloat(quantityStr);
  return isNaN(num) ? null : num;
}

/**
 * Normalize unit string (lowercase, apply aliases)
 */
function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();
  return UNIT_ALIASES[lower] || lower;
}

/**
 * Normalize steps array
 * Adds position numbering (1-indexed)
 */
function normalizeSteps(steps: string[]): StepPreview[] {
  return steps
    .map((step) => step.trim())
    .filter((step) => step.length > 0)
    .map((text, index) => ({
      position: index + 1,
      text: text.substring(0, 2000), // Max 2000 chars per step
    }));
}

/**
 * Normalize tags
 * - Trim whitespace
 * - Remove duplicates
 * - Limit to 20 tags
 * - Max 50 chars per tag
 */
function normalizeTags(tags: string[]): string[] {
  const normalized = tags.map((tag) => tag.trim().substring(0, 50)).filter((tag) => tag.length > 0);

  // Remove duplicates (case-insensitive)
  const unique = [...new Set(normalized.map((tag) => tag.toLowerCase()))].map(
    (lower) => normalized.find((tag) => tag.toLowerCase() === lower)!,
  );

  return unique.slice(0, 20);
}
