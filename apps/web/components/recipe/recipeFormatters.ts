import type { CuisineType, MealType, RecipeStatus } from '@commontable/types';

function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatCuisine(cuisine: CuisineType): string {
  return formatEnumLabel(cuisine);
}

export function formatMealType(mealType: MealType): string {
  return formatEnumLabel(mealType);
}

export function formatStatus(status: RecipeStatus): string {
  return formatEnumLabel(status);
}

export function formatStatusLabel(status: RecipeStatus): string {
  return `Status: ${formatStatus(status)}`;
}

export function formatPriorityLabel(priority: number): string {
  return `Priority: ${priority}`;
}
