'use client';

import type { MealSlot, Recipe, RecipeId } from '@commontable/types';
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

interface AddCalendarEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    recipe_id: RecipeId | null;
    planned_date: Date;
    meal_slot: MealSlot;
    notes: string | null;
  }) => Promise<void>;
  recipes: Recipe[];
  initialDate?: Date;
  initialMealSlot?: MealSlot;
}

/**
 * Dialog for adding a new calendar entry
 *
 * Design System Compliance:
 * - Dialog component
 * - TextField for date and notes
 * - Autocomplete for recipe selection
 * - Buttons: outlined (Cancel) and contained primary (Add)
 * - Stack for spacing
 */
export function AddCalendarEntryDialog({
  open,
  onClose,
  onSubmit,
  recipes,
  initialDate,
  initialMealSlot,
}: AddCalendarEntryDialogProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [plannedDate, setPlannedDate] = useState<string>(
    initialDate ? initialDate.toISOString().split('T')[0] : '',
  );
  const [mealSlot, setMealSlot] = useState<MealSlot>(initialMealSlot || 'dinner');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!plannedDate) return;

    setSubmitting(true);
    try {
      await onSubmit({
        recipe_id: selectedRecipe?.id || null,
        planned_date: new Date(plannedDate),
        meal_slot: mealSlot,
        notes: notes.trim() || null,
      });

      // Reset form
      setSelectedRecipe(null);
      setPlannedDate(initialDate ? initialDate.toISOString().split('T')[0] : '');
      setMealSlot(initialMealSlot || 'dinner');
      setNotes('');

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;

    // Reset form
    setSelectedRecipe(null);
    setPlannedDate(initialDate ? initialDate.toISOString().split('T')[0] : '');
    setMealSlot(initialMealSlot || 'dinner');
    setNotes('');

    onClose();
  };

  const mealSlots: { value: MealSlot; label: string }[] = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Meal</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Recipe Selection */}
          <Autocomplete
            options={recipes}
            getOptionLabel={(recipe) => recipe.title}
            value={selectedRecipe}
            onChange={(_, newValue) => setSelectedRecipe(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Recipe (optional)"
                helperText="Leave blank for notes-only entry"
              />
            )}
          />

          {/* Date */}
          <TextField
            label="Date"
            type="date"
            value={plannedDate}
            onChange={(e) => setPlannedDate(e.target.value)}
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
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            helperText="Add any notes about this meal"
          />
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
          disabled={!plannedDate || submitting}
        >
          {submitting ? 'Adding...' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
