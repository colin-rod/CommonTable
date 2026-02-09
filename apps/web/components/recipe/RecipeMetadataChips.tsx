import type { CuisineType, MealType } from '@commontable/types';
import { Public as CuisineIcon, RestaurantMenu as MealTypeIcon } from '@mui/icons-material';
import { Stack, Chip } from '@mui/material';

import { formatCuisine, formatMealType } from './recipeMetadataFormatters';

interface RecipeMetadataChipsProps {
  cuisine?: CuisineType | null;
  mealType?: MealType | null;
  size?: 'small' | 'medium';
}

/**
 * RecipeMetadataChips Component
 *
 * Displays recipe metadata (cuisine, meal type) as Material UI chips.
 * Shows only provided metadata (no chips for null/undefined values).
 *
 * Design System Compliance:
 * - Material UI Chip component (approved)
 * - Material Icons (@mui/icons-material)
 * - Stack for spacing (8px base grid)
 * - Theme color palette only (no custom colors)
 * - Calm, neutral tone (no emojis)
 */
export function RecipeMetadataChips({
  cuisine,
  mealType,
  size = 'small',
}: RecipeMetadataChipsProps) {
  const hasCuisine = cuisine != null;
  const hasMealType = mealType != null;

  // Don't render if no metadata provided
  if (!hasCuisine && !hasMealType) {
    return null;
  }

  return (
    <Stack direction="row" spacing={1}>
      {hasCuisine && (
        <Chip
          icon={<CuisineIcon />}
          label={formatCuisine(cuisine)}
          variant="outlined"
          size={size}
        />
      )}
      {hasMealType && (
        <Chip
          icon={<MealTypeIcon />}
          label={formatMealType(mealType)}
          variant="outlined"
          size={size}
        />
      )}
    </Stack>
  );
}
