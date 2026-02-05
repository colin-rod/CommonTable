'use client';

import type { CreateMealRequestInput, MealSlot, Recipe } from '@commontable/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Autocomplete,
} from '@mui/material';
import { useState } from 'react';

interface AddMealRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMealRequestInput) => Promise<void>;
  recipes: Recipe[];
}

/**
 * Dialog for adding a new meal request
 *
 * Design System Compliance:
 * - Dialog component
 * - TextField for date and notes
 * - Autocomplete for recipe selection
 * - Buttons: outlined (Cancel) and contained primary (Add Request)
 * - Stack for spacing (3 = 24px)
 * - Validation: Must have recipe OR notes (enforced in service layer)
 */
export function AddMealRequestDialog({
  open,
  onClose,
  onSubmit,
  recipes,
}: AddMealRequestDialogProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [requestedDate, setRequestedDate] = useState<string>('');
  const [mealSlot, setMealSlot] = useState<MealSlot>('dinner');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!requestedDate) return;

    // Validate that at least recipe or notes is provided
    const trimmedNotes = notes.trim();
    if (!selectedRecipe && !trimmedNotes) {
      setError('Please select a recipe or add notes');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        recipe_id: selectedRecipe?.id || null,
        requested_date: new Date(requestedDate),
        requested_meal_slot: mealSlot,
        notes: trimmedNotes || null,
      });

      // Reset form
      setSelectedRecipe(null);
      setRequestedDate('');
      setMealSlot('dinner');
      setNotes('');
      setError(null);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;

    // Reset form
    setSelectedRecipe(null);
    setRequestedDate('');
    setMealSlot('dinner');
    setNotes('');
    setError(null);

    onClose();
  };

  const mealSlots: { value: MealSlot; label: string }[] = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
  ];

  const isValid = requestedDate && (selectedRecipe || notes.trim());

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Meal Request</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Recipe Selection */}
          <Autocomplete
            options={recipes}
            getOptionLabel={(recipe) => recipe.title}
            value={selectedRecipe}
            onChange={(_, newValue) => {
              setSelectedRecipe(newValue);
              if (newValue && error) setError(null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Recipe (optional)"
                helperText="Select a recipe or add notes below"
              />
            )}
          />

          {/* Date */}
          <TextField
            label="Requested Date"
            type="date"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* Meal Slot */}
          <TextField
            label="Meal Slot"
            select
            value={mealSlot}
            onChange={(e) => setMealSlot(e.target.value as MealSlot)}
            required
            fullWidth
            SelectProps={{ native: true }}
          >
            {mealSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </TextField>

          {/* Notes */}
          <TextField
            label="Notes (optional)"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (e.target.value.trim() && error) setError(null);
            }}
            fullWidth
            helperText="Describe what you want to eat (required if no recipe selected)"
            error={!!error}
          />

          {/* Error message */}
          {error && (
            <TextField
              value={error}
              error
              fullWidth
              InputProps={{ readOnly: true }}
              sx={{ mt: 0 }}
            />
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined" color="primary" disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!isValid || submitting}
        >
          {submitting ? 'Adding...' : 'Add Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
