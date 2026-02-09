import type { CuisineType, MealType, RecipeStatus } from '@commontable/types';

/**
 * Format cuisine type for display (capitalize, replace underscores)
 */
export function formatCuisine(cuisine: CuisineType): string {
  return cuisine
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format meal type for display (capitalize, replace underscores)
 */
export function formatMealType(mealType: MealType): string {
  return mealType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format status for display (capitalize, replace underscores)
 */
export function formatStatus(status: RecipeStatus): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
