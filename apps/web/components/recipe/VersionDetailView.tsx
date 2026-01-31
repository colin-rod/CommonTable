'use client';

import type { RecipeVersion } from '@commontable/types';
import ServingsIcon from '@mui/icons-material/Restaurant';
import TimeIcon from '@mui/icons-material/Schedule';
import { Stack, Typography, Divider, Box } from '@mui/material';

import { IngredientList } from './IngredientList';
import { StepList } from './StepList';

interface VersionDetailViewProps {
  version: RecipeVersion;
  editorName?: string | null;
}

/**
 * Format time display (minutes to hours + minutes)
 */
function formatTime(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format a date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * VersionDetailView Component
 *
 * Displays full content of a specific recipe version:
 * - Version metadata (number, editor, timestamp)
 * - Servings and cooking times
 * - Ingredients list
 * - Steps list
 * - Notes (if any)
 *
 * Does NOT show recipe-level data (tags, last_cooked_at, rolling_score).
 *
 * Follows DESIGN_SYSTEM.md:
 * - Stack with spacing={3}
 * - h6 for section headers
 * - body1/body2 for content
 * - Dividers between sections
 */
export function VersionDetailView({ version, editorName }: VersionDetailViewProps) {
  const prepTime = formatTime(version.prep_time_minutes);
  const cookTime = formatTime(version.cook_time_minutes);
  const totalTime =
    version.prep_time_minutes || version.cook_time_minutes
      ? formatTime((version.prep_time_minutes ?? 0) + (version.cook_time_minutes ?? 0))
      : null;

  return (
    <Stack spacing={3}>
      {/* Version Metadata */}
      <Box>
        <Typography variant="body2" color="text.secondary">
          {editorName ? `Edited by ${editorName}` : 'Unknown editor'} ·{' '}
          {formatDate(version.created_at)}
        </Typography>
      </Box>

      {/* Cooking Info */}
      {(version.servings || prepTime || cookTime) && (
        <>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            {version.servings && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ServingsIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {version.servings} servings
                </Typography>
              </Box>
            )}
            {prepTime && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Prep: {prepTime}
                </Typography>
              </Box>
            )}
            {cookTime && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Cook: {cookTime}
                </Typography>
              </Box>
            )}
            {totalTime && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Total: {totalTime}
                </Typography>
              </Box>
            )}
          </Stack>
          <Divider />
        </>
      )}

      {/* Ingredients Section */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Ingredients
        </Typography>
        <IngredientList ingredients={version.ingredients_json || []} />
      </Box>

      <Divider />

      {/* Steps Section */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Steps
        </Typography>
        <StepList steps={version.steps_json || []} />
      </Box>

      {/* Notes Section */}
      {version.notes && (
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
