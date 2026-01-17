'use client';

import type { RecipeWithVersion, RecipeImage, UnitSystem } from '@commontable/types';
import { scaleIngredients } from '@commontable/types';
import { Stack, Typography, Divider, Box } from '@mui/material';
import { useState, useMemo, useCallback } from 'react';

import { IngredientList } from './IngredientList';
import { RecipeMetadata } from './RecipeMetadata';
import { ServingsScaler } from './ServingsScaler';
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
  const originalServings = version?.servings ?? null;

  // Scaling state
  const [targetServings, setTargetServings] = useState<number>(originalServings ?? 4);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');

  // Calculate scaled ingredients
  const scaledIngredients = useMemo(() => {
    const ingredients = version?.ingredients_json ?? [];
    if (originalServings === null || originalServings === targetServings) {
      return ingredients;
    }
    return scaleIngredients(ingredients, originalServings, targetServings);
  }, [version?.ingredients_json, originalServings, targetServings]);

  const handleServingsChange = useCallback((servings: number) => {
    setTargetServings(servings);
  }, []);

  const handleUnitSystemChange = useCallback((system: UnitSystem) => {
    setUnitSystem(system);
  }, []);

  const canScale = originalServings !== null;

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

      {/* Scaling controls */}
      {canScale && (
        <ServingsScaler
          originalServings={originalServings}
          targetServings={targetServings}
          onServingsChange={handleServingsChange}
          unitSystem={unitSystem}
          onUnitSystemChange={handleUnitSystemChange}
        />
      )}

      {!canScale && (
        <Typography variant="body2" color="text.secondary">
          Servings not set for this recipe
        </Typography>
      )}

      <Divider />

      {/* Ingredients */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Ingredients
        </Typography>
        <IngredientList ingredients={scaledIngredients} unitSystem={unitSystem} />
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
