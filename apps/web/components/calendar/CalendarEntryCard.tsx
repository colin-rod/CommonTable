'use client';

import { RecipeService } from '@commontable/api-client';
import type { CalendarEntry } from '@commontable/types';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { Box, Typography, IconButton, Chip, Button, Stack, CircularProgress } from '@mui/material';
import { useState } from 'react';

import { createCookingEvent } from '@/app/actions/cookingEvent';
import { createClient } from '@/lib/supabase/client';

interface CalendarEntryCardProps {
  entry: CalendarEntry;
  onEdit: () => void;
  onDelete: () => void;
  onViewRecipe?: () => void;
  onMarkComplete: () => void;
}

/**
 * Get status badge color
 */
function getStatusColor(
  status: CalendarEntry['status'],
): 'default' | 'primary' | 'success' | 'error' {
  switch (status) {
    case 'planned':
      return 'default';
    case 'confirmed':
      return 'primary';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: CalendarEntry['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Calendar entry card with recipe info and action buttons
 *
 * Design System Compliance:
 * - Typography: body1 for title, body2 for notes and rating prompt
 * - Button variants: outlined (primary) for "Mark as cooked", contained (primary) for Submit
 * - Material Icons only (Star, StarBorder)
 * - Chip for status badge
 * - Spacing: 8px base grid (1, 2, 3 units)
 */
export function CalendarEntryCard({
  entry,
  onEdit,
  onDelete,
  onViewRecipe,
  onMarkComplete,
}: CalendarEntryCardProps) {
  const [showRatingInput, setShowRatingInput] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showMarkAsCookedButton = entry.status === 'planned' || entry.status === 'confirmed';

  const handleMarkAsCookedClick = () => {
    setShowRatingInput(true);
  };

  const handleCancelRating = () => {
    setShowRatingInput(false);
    setSelectedRating(null);
  };

  const handleSubmitRating = async () => {
    if (!selectedRating || !entry.recipe_id) return;

    setIsSubmitting(true);
    try {
      // Get recipe with version data to capture current version ID and servings
      const supabase = createClient();
      const recipeService = new RecipeService(supabase);
      const recipe = await recipeService.getWithVersion(entry.recipe_id);

      if (!recipe.current_version_id || !recipe.current_version) {
        throw new Error('Recipe has no current version');
      }

      // Create cooking event with rating
      const result = await createCookingEvent({
        recipe_id: entry.recipe_id,
        recipe_version_id: recipe.current_version_id,
        rating: selectedRating,
        servings_made: recipe.current_version.servings,
        calendar_entry_id: entry.id,
      });

      if (result.success) {
        // Close rating UI
        setShowRatingInput(false);
        setSelectedRating(null);

        // Notify parent component of success
        onMarkComplete?.();
      }
    } catch (error) {
      console.error('Failed to mark as cooked:', error);
      // Keep rating UI visible for user to retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipRating = async () => {
    if (!entry.recipe_id) return;

    setIsSubmitting(true);
    try {
      // Get recipe with version data to capture current version ID and servings
      const supabase = createClient();
      const recipeService = new RecipeService(supabase);
      const recipe = await recipeService.getWithVersion(entry.recipe_id);

      if (!recipe.current_version_id || !recipe.current_version) {
        throw new Error('Recipe has no current version');
      }

      // Create cooking event without rating (rating = null)
      const result = await createCookingEvent({
        recipe_id: entry.recipe_id,
        recipe_version_id: recipe.current_version_id,
        rating: null,
        servings_made: recipe.current_version.servings,
        calendar_entry_id: entry.id,
      });

      if (result.success) {
        // Close rating UI
        setShowRatingInput(false);
        setSelectedRating(null);

        // Notify parent component of success
        onMarkComplete?.();
      }
    } catch (error) {
      console.error('Failed to mark as cooked:', error);
      // Keep rating UI visible for user to retry
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Recipe title or notes-only indicator */}
      <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
        {entry.recipe_id ? 'Recipe assigned' : 'Notes only'}
      </Typography>

      {/* Notes */}
      {entry.notes && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {entry.notes}
        </Typography>
      )}

      {/* Status badge */}
      <Box sx={{ mb: 1 }}>
        <Chip
          label={getStatusLabel(entry.status)}
          color={getStatusColor(entry.status)}
          size="small"
        />
      </Box>

      {/* Inline Rating UI */}
      {showRatingInput && (
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body2">Rate this meal (optional):</Typography>

          {/* Star rating buttons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <IconButton
                key={rating}
                size="small"
                onClick={() => setSelectedRating(rating)}
                aria-label={`Rate ${rating} ${rating === 1 ? 'star' : 'stars'}`}
                disabled={isSubmitting}
              >
                {selectedRating && rating <= selectedRating ? (
                  <StarIcon fontSize="small" data-testid="star-filled" />
                ) : (
                  <StarBorderIcon fontSize="small" data-testid="star-border" />
                )}
              </IconButton>
            ))}
          </Box>

          {/* Submit, Skip rating, and Cancel buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleSubmitRating}
              disabled={!selectedRating || isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={16} /> : 'Submit'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handleSkipRating}
              disabled={isSubmitting}
            >
              Skip rating
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handleCancelRating}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </Box>
        </Stack>
      )}

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton size="small" onClick={onEdit} aria-label="Edit calendar entry" title="Edit">
          <EditIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          onClick={onDelete}
          aria-label="Delete calendar entry"
          title="Delete"
          color="error"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>

        {onViewRecipe && (
          <IconButton
            size="small"
            onClick={onViewRecipe}
            aria-label="View recipe"
            title="View recipe"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        )}

        {showMarkAsCookedButton && !showRatingInput && (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={handleMarkAsCookedClick}
            startIcon={<StarIcon fontSize="small" />}
          >
            Mark as cooked
          </Button>
        )}
      </Box>
    </Box>
  );
}
