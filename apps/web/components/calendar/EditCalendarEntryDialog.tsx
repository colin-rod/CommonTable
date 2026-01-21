'use client';

import type { MealSlot, Recipe, RecipeId, CalendarEntry } from '@commontable/types';
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
import { useState, useEffect } from 'react';

interface EditCalendarEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    recipe_id: RecipeId | null;
    planned_date: Date;
    meal_slot: MealSlot;
    notes: string | null;
  }) => Promise<void>;
  recipes: Recipe[];
  entry: CalendarEntry | null;
}

/**
 * Dialog for editing an existing calendar entry
 *
 * Design System Compliance:
 * - Dialog component
 * - TextField for date and notes
 * - Autocomplete for recipe selection
 * - Buttons: outlined (Cancel) and contained primary (Save)
 * - Stack for spacing
 */
export function EditCalendarEntryDialog({
  open,
  onClose,
  onSubmit,
  recipes,
  entry,
}: EditCalendarEntryDialogProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [plannedDate, setPlannedDate] = useState<string>('');
  const [mealSlot, setMealSlot] = useState<MealSlot>('dinner');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when entry changes
  useEffect(() => {
    if (entry) {
      const recipe = recipes.find((r) => r.id === entry.recipe_id) || null;
      setSelectedRecipe(recipe);
      setPlannedDate(new Date(entry.planned_date).toISOString().split('T')[0]);
      setMealSlot(entry.meal_slot);
      setNotes(entry.notes || '');
    }
  }, [entry, recipes]);

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

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const mealSlots: { value: MealSlot; label: string }[] = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
  ];

  if (!entry) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Meal</DialogTitle>

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
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
