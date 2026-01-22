'use client';

import type { RecipeId, RecipeVersionId, CalendarEntryId } from '@commontable/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Rating,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { useCookingEvents } from '@/hooks/useCookingEvents';

interface LogMealDialogProps {
  open: boolean;
  onClose: () => void;
  recipeId: RecipeId;
  recipeVersionId: RecipeVersionId;
  recipeTitle: string;
  calendarEntryId?: CalendarEntryId; // Optional: if logging from calendar
}

/**
 * LogMealDialog - Modal for logging a meal (creating a cooking event)
 *
 * Allows users to:
 * - Rate the recipe (1-5 stars)
 * - Add notes about the cooking experience
 * - Record servings made
 *
 * If opened from a calendar entry, it will mark the entry as "completed"
 * when the meal is logged.
 */
export function LogMealDialog({
  open,
  onClose,
  recipeId,
  recipeVersionId,
  recipeTitle,
  calendarEntryId,
}: LogMealDialogProps) {
  const { logMeal, loading, error } = useCookingEvents();

  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [servingsMade, setServingsMade] = useState<number | null>(null);

  const handleSubmit = async () => {
    const result = await logMeal({
      recipe_id: recipeId as string,
      recipe_version_id: recipeVersionId as string,
      rating,
      notes: notes.trim() || null,
      servings_made: servingsMade,
      calendar_entry_id: calendarEntryId as string | undefined,
    });

    if (result) {
      onClose();
      // Reset form
      setRating(null);
      setNotes('');
      setServingsMade(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Log Meal: {recipeTitle}</DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Rating */}
          <Stack spacing={1}>
            <Typography variant="body2">How was it?</Typography>
            <Rating value={rating} onChange={(_, newValue) => setRating(newValue)} size="large" />
          </Stack>

          {/* Servings Made */}
          <TextField
            label="Servings Made"
            type="number"
            value={servingsMade ?? ''}
            onChange={(e) => setServingsMade(e.target.value ? Number(e.target.value) : null)}
            fullWidth
            helperText="Optional: How many servings did you make?"
          />

          {/* Notes */}
          <TextField
            label="Notes"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            helperText="Optional: How did it turn out? Any changes you made?"
          />

          {/* Error Message */}
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Logging...' : 'Log Meal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
