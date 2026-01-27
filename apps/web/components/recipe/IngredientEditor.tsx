'use client';

import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Stack, Typography, TextField, IconButton, Button, Box } from '@mui/material';
import { type Control, Controller, type FieldErrors, useFieldArray } from 'react-hook-form';

import type { RecipeFormValues } from './RecipeMetadataFields';

export interface IngredientEditorProps {
  control: Control<RecipeFormValues>;
  errors: FieldErrors<RecipeFormValues>;
  disabled?: boolean;
}

/**
 * Dynamic ingredient list editor with add/remove/reorder functionality.
 *
 * Features:
 * - Add new ingredient rows
 * - Remove ingredient rows
 * - Reorder ingredients with up/down buttons
 * - Fields: name (required), quantity, unit, notes
 *
 * Material Design 3 compliance:
 * - Stack spacing={2} for rows
 * - IconButton for row actions
 * - Outlined button for add action
 */
export function IngredientEditor({ control, errors, disabled = false }: IngredientEditorProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const handleAddIngredient = () => {
    append({ name: '', quantity: undefined, unit: '', notes: '' });
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  return (
    <Stack spacing={2}>
      {/* Section Header */}
      <Typography variant="h6">Ingredients</Typography>

      {/* Ingredient Rows */}
      {fields.map((field, index) => (
        <Box key={field.id}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Ingredient Name */}
            <Controller
              name={`ingredients.${index}.name`}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Ingredient Name"
                  required
                  fullWidth
                  disabled={disabled}
                  error={!!errors.ingredients?.[index]?.name}
                  helperText={errors.ingredients?.[index]?.name?.message}
                  sx={{ flex: 2 }}
                />
              )}
            />

            {/* Quantity */}
            <Controller
              name={`ingredients.${index}.quantity`}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Quantity"
                  type="number"
                  disabled={disabled}
                  error={!!errors.ingredients?.[index]?.quantity}
                  helperText={errors.ingredients?.[index]?.quantity?.message}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                  }
                  sx={{ width: 100 }}
                />
              )}
            />

            {/* Unit */}
            <Controller
              name={`ingredients.${index}.unit`}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Unit"
                  disabled={disabled}
                  error={!!errors.ingredients?.[index]?.unit}
                  helperText={errors.ingredients?.[index]?.unit?.message}
                  sx={{ width: 100 }}
                />
              )}
            />

            {/* Notes */}
            <Controller
              name={`ingredients.${index}.notes`}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  disabled={disabled}
                  error={!!errors.ingredients?.[index]?.notes}
                  helperText={errors.ingredients?.[index]?.notes?.message}
                  sx={{ flex: 1 }}
                />
              )}
            />

            {/* Action Buttons */}
            <Stack direction="row" spacing={0.5}>
              {/* Move Up */}
              <IconButton
                onClick={() => handleMoveUp(index)}
                disabled={disabled || index === 0}
                size="small"
                aria-label="Move up"
              >
                <ArrowUpwardIcon />
              </IconButton>

              {/* Move Down */}
              <IconButton
                onClick={() => handleMoveDown(index)}
                disabled={disabled || index === fields.length - 1}
                size="small"
                aria-label="Move down"
              >
                <ArrowDownwardIcon />
              </IconButton>

              {/* Delete */}
              <IconButton
                onClick={() => remove(index)}
                disabled={disabled}
                size="small"
                aria-label="Delete ingredient"
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      ))}

      {/* Add Ingredient Button */}
      <Box>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddIngredient}
          disabled={disabled}
        >
          Add Ingredient
        </Button>
      </Box>
    </Stack>
  );
}
