'use client';

import type { RecipeWithVersion, RecipeImage, UnitSystem } from '@commontable/types';
import { scaleIngredients } from '@commontable/types';
import { Stack, Typography, Divider, Box, Skeleton, Paper, Link, Chip } from '@mui/material';
import { useState, useMemo, useCallback, useEffect } from 'react';

import { IngredientList } from './IngredientList';
import { RecipeMetadata } from './RecipeMetadata';
import { ServingsScaler } from './ServingsScaler';
import { StepList } from './StepList';

// Helper functions for formatting metadata labels
function formatCuisineLabel(cuisine: string): string {
  return cuisine
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatMealTypeLabel(mealType: string): string {
  return mealType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface RecipeDetailViewProps {
  recipe: RecipeWithVersion;
  primaryImage?: RecipeImage | null;
  /** Function to get signed URL for private image */
  getImageUrl?: (image: RecipeImage) => Promise<string>;
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
export function RecipeDetailView({ recipe, primaryImage, getImageUrl }: RecipeDetailViewProps) {
  const version = recipe.current_version;
  const originalServings = version?.servings ?? null;

  // Scaling state
  const [targetServings, setTargetServings] = useState<number>(originalServings ?? 4);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');

  // Image URL state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Load image URL when primary image changes
  useEffect(() => {
    if (primaryImage && getImageUrl) {
      setImageLoading(true);
      getImageUrl(primaryImage)
        .then(setImageUrl)
        .catch(() => setImageUrl(null))
        .finally(() => setImageLoading(false));
    } else {
      setImageUrl(null);
    }
  }, [primaryImage, getImageUrl]);

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
      {/* Primary Image */}
      {(primaryImage || imageLoading) && (
        <Box
          sx={{
            width: '100%',
            maxHeight: 400,
            borderRadius: 1,
            overflow: 'hidden',
            bgcolor: 'background.default',
          }}
        >
          {imageLoading ? (
            <Skeleton variant="rectangular" width="100%" height={300} />
          ) : imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt={primaryImage?.alt_text || recipe.title}
              sx={{
                width: '100%',
                maxHeight: 400,
                objectFit: 'cover',
              }}
            />
          ) : null}
        </Box>
      )}

      {/* Description */}
      {recipe.description && (
        <Typography variant="body1" color="text.secondary">
          {recipe.description}
        </Typography>
      )}

      {/* Source URL - for imported recipes */}
      {recipe.source_url && (
        <Typography variant="body2" color="text.secondary">
          Imported from{' '}
          <Link
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            {(() => {
              try {
                return new URL(recipe.source_url).hostname;
              } catch {
                return recipe.source_url;
              }
            })()}
          </Link>
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
        cuisine={recipe.cuisine}
        mealType={recipe.meal_type}
        status={recipe.status}
        priority={recipe.priority}
      />

      {/* Additional Metadata - cuisine, meal_type, key_ingredients, priority */}
      {(recipe.cuisine ||
        recipe.meal_type ||
        recipe.key_ingredients.length > 0 ||
        recipe.priority) && (
        <>
          <Divider />
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Details
            </Typography>
            <Stack spacing={1}>
              {recipe.cuisine && (
                <Typography variant="body2" color="text.secondary">
                  Cuisine: {formatCuisineLabel(recipe.cuisine)}
                </Typography>
              )}
              {recipe.meal_type && (
                <Typography variant="body2" color="text.secondary">
                  Type: {formatMealTypeLabel(recipe.meal_type)}
                </Typography>
              )}
              {recipe.key_ingredients.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Key Ingredients:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {recipe.key_ingredients.map((ingredient, idx) => (
                      <Chip key={idx} label={ingredient} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}
              {recipe.priority && (
                <Typography variant="body2" color="text.secondary">
                  Priority: {recipe.priority}/5
                </Typography>
              )}
            </Stack>
          </Box>
        </>
      )}

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

      {/* Two-Column Content Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
        }}
      >
        {/* Ingredients Panel */}
        <Paper
          elevation={1}
          sx={{ flex: { xs: '1 1 auto', md: 1 }, p: 2 }}
          data-testid="ingredients-panel"
        >
          <Typography variant="h6" gutterBottom>
            Ingredients
          </Typography>
          <IngredientList ingredients={scaledIngredients} unitSystem={unitSystem} />
        </Paper>

        {/* Steps Panel */}
        <Paper
          elevation={1}
          sx={{ flex: { xs: '1 1 auto', md: 2 }, p: 2 }}
          data-testid="steps-panel"
        >
          <Typography variant="h6" gutterBottom>
            Steps
          </Typography>
          <StepList steps={version?.steps_json || []} />
        </Paper>
      </Box>

      {/* Notes - after panels */}
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
