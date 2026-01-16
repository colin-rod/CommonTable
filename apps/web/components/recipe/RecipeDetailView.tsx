'use client';

import type { RecipeWithVersion, RecipeImage } from '@commontable/types';
import { Stack, Typography, Divider, Box } from '@mui/material';

import { IngredientList } from './IngredientList';
import { RecipeMetadata } from './RecipeMetadata';
import { StepList } from './StepList';

interface RecipeDetailViewProps {
  recipe: RecipeWithVersion;
  primaryImage?: RecipeImage | null;
}

/**
 * RecipeDetailView Component
 *
 * Displays full recipe details:
 * - Title and description
 * - Metadata (servings, time, tags)
 * - Ingredients
 * - Steps
 * - Notes
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses Stack for layout
 * - h5 for title (handled in page)
 * - h6 for section headers
 * - body1 for content
 * - Divider between sections
 */
export function RecipeDetailView({ recipe, primaryImage: _primaryImage }: RecipeDetailViewProps) {
  const version = recipe.current_version;

  return (
    <Stack spacing={3}>
      {/* Description */}
      {recipe.description && (
        <Typography variant="body1" color="text.secondary">
          {recipe.description}
        </Typography>
      )}

      {/* Metadata */}
      <RecipeMetadata
        servings={version?.servings}
        prepTimeMinutes={version?.prep_time_minutes}
        cookTimeMinutes={version?.cook_time_minutes}
        tags={recipe.tags}
        lastCookedAt={recipe.last_cooked_at}
        rollingScore={recipe.rolling_score}
      />

      <Divider />

      {/* Ingredients */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Ingredients
        </Typography>
        <IngredientList ingredients={version?.ingredients_json || []} />
      </Box>

      <Divider />

      {/* Steps */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Steps
        </Typography>
        <StepList steps={version?.steps_json || []} />
      </Box>

      {/* Notes */}
      {version?.notes && (
        <>
          <Divider />
          <Box>
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {version.notes}
            </Typography>
          </Box>
        </>
      )}
    </Stack>
  );
}
