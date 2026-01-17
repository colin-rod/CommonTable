/**
 * Scaling Utility
 *
 * Provides functions for scaling recipe ingredient quantities
 * based on serving count adjustments.
 */

import type { IngredientInput } from '../models';

/**
 * Extended ingredient with scaling information
 */
export interface ScaledIngredient extends IngredientInput {
  /** The original quantity before scaling */
  originalQuantity?: number;
  /** The scale factor applied (targetServings / originalServings) */
  scaleFactor: number;
}

/**
 * Rounds a quantity to a reasonable precision for cooking
 *
 * Rounding rules:
 * - Values >= 10: round to whole numbers
 * - Values >= 1: round to 1 decimal place
 * - Values < 1: round to 2 decimal places
 *
 * @param value - The quantity to round
 * @returns The rounded quantity
 */
export function roundQuantity(value: number): number {
  if (value === 0) return 0;

  // Very large values - round to whole numbers
  if (value >= 10) {
    return Math.round(value);
  }

  // Medium values - round to 1 decimal place
  if (value >= 1) {
    return Math.round(value * 10) / 10;
  }

  // Small values - round to 2 decimal places
  return Math.round(value * 100) / 100;
}

/**
 * Scales a single quantity by a factor
 *
 * @param quantity - The original quantity (undefined if ingredient has no quantity)
 * @param scaleFactor - The factor to multiply by
 * @returns The scaled quantity (rounded) or undefined if input was undefined
 */
export function scaleQuantity(
  quantity: number | undefined,
  scaleFactor: number,
): number | undefined {
  if (quantity === undefined) {
    return undefined;
  }

  const scaled = quantity * scaleFactor;
  return roundQuantity(scaled);
}

/**
 * Scales an array of ingredients based on serving count change
 *
 * @param ingredients - The original ingredients array
 * @param originalServings - The original number of servings
 * @param targetServings - The desired number of servings
 * @returns Array of scaled ingredients with original values preserved
 */
export function scaleIngredients(
  ingredients: readonly IngredientInput[],
  originalServings: number,
  targetServings: number,
): ScaledIngredient[] {
  const scaleFactor = targetServings / originalServings;

  return ingredients.map((ingredient) => ({
    ...ingredient,
    originalQuantity: ingredient.quantity,
    quantity: scaleQuantity(ingredient.quantity, scaleFactor),
    scaleFactor,
  }));
}
