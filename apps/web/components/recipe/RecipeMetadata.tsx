'use client';

import type { CuisineType, MealType, RecipeStatus } from '@commontable/types';
import TimeIcon from '@mui/icons-material/AccessTime';
import ServingsIcon from '@mui/icons-material/Restaurant';
import StarIcon from '@mui/icons-material/Star';
import { Stack, Typography, Chip, Box } from '@mui/material';

import { RecipeMetadataChips } from './RecipeMetadataChips';
import { formatPriorityLabel, formatStatusLabel } from './recipeFormatters';

interface RecipeMetadataProps {
  servings?: number | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  tags: string[];
  lastCookedAt?: Date | null;
  rollingScore?: number | null;
  cuisine?: CuisineType | null;
  mealType?: MealType | null;
  status?: RecipeStatus | null;
  priority?: number | null;
}

/**
 * RecipeMetadata Component
 *
 * Displays recipe metadata:
 * - Servings
 * - Prep time
 * - Cook time
 * - Tags
 * - Last cooked
 * - Rating
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses Stack for layout
 * - body2 for metadata text
 * - Chip for tags (approved component)
 */
export function RecipeMetadata({
  servings,
  prepTimeMinutes,
  cookTimeMinutes,
  tags,
  lastCookedAt,
  rollingScore,
  cuisine,
  mealType,
  status,
  priority,
}: RecipeMetadataProps) {
  /**
   * Format time display
   */
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} hr`;
    }
    return `${hours} hr ${mins} min`;
  };

  /**
   * Format last cooked date
   */
  const formatLastCooked = (date: Date | null): string => {
    if (!date) return 'Never cooked';

    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const hasTimeInfo = prepTimeMinutes || cookTimeMinutes;
  const totalTime = (prepTimeMinutes || 0) + (cookTimeMinutes || 0);
  const hasCuisine = cuisine != null;
  const hasMealType = mealType != null;
  const hasStatus = status != null;
  const hasPriority = priority != null;
  const hasWorkflowMetadata = hasCuisine || hasMealType || hasStatus || hasPriority;

  return (
    <Stack spacing={2}>
      {/* Time and Servings */}
      <Stack direction="row" spacing={3} flexWrap="wrap">
        {servings && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ServingsIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {servings} servings
            </Typography>
          </Box>
        )}

        {hasTimeInfo && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {prepTimeMinutes ? `${formatTime(prepTimeMinutes)} prep` : ''}
              {prepTimeMinutes && cookTimeMinutes ? ' + ' : ''}
              {cookTimeMinutes ? `${formatTime(cookTimeMinutes)} cook` : ''}
              {totalTime > 0 ? ` (${formatTime(totalTime)} total)` : ''}
            </Typography>
          </Box>
        )}

        {rollingScore !== null && rollingScore !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <StarIcon fontSize="small" color="primary" />
            <Typography variant="body2" color="text.secondary">
              {rollingScore.toFixed(1)} rating
            </Typography>
          </Box>
        )}
      </Stack>

      {/* Cuisine, Meal Type, Status, Priority */}
      {hasWorkflowMetadata && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          <RecipeMetadataChips cuisine={cuisine} mealType={mealType} size="small" />
          {hasStatus && (
            <Chip
              label={formatStatusLabel(status)}
              size="small"
              variant="outlined"
            />
          )}
          {hasPriority && (
            <Chip label={formatPriorityLabel(priority)} size="small" variant="outlined" />
          )}
        </Stack>
      )}

      {/* Last Cooked */}
      <Typography variant="body2" color="text.secondary">
        Last cooked: {formatLastCooked(lastCookedAt ?? null)}
      </Typography>

      {/* Tags */}
      {tags.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
