'use client';

import {
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Stack, Typography, TextField, IconButton, Button, Box } from '@mui/material';
import { type Control, Controller, type FieldErrors, useFieldArray } from 'react-hook-form';

import type { RecipeFormValues } from './RecipeMetadataFields';

export interface StepEditorProps {
  control: Control<RecipeFormValues>;
  errors: FieldErrors<RecipeFormValues>;
  disabled?: boolean;
}

/**
 * Dynamic step list editor with add/remove/reorder functionality.
 *
 * Features:
 * - Add new step rows
 * - Remove step rows
 * - Reorder steps with up/down buttons
 * - Auto-numbered steps (1, 2, 3...)
 * - Fields: position (auto-calculated), text (required, multiline)
 *
 * Material Design 3 compliance:
 * - Stack spacing={2} for rows
 * - IconButton for row actions
 * - Outlined button for add action
 */
export function StepEditor({ control, errors, disabled = false }: StepEditorProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'steps',
  });

  const handleAddStep = () => {
    // Position will be auto-calculated based on array index
    append({ position: fields.length + 1, text: '' });
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
      <Typography variant="h6">Steps</Typography>

      {/* Step Rows */}
      {fields.map((field, index) => (
        <Box key={field.id}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Step Number + Text */}
            <Controller
              name={`steps.${index}.text`}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={`Step ${index + 1}`}
                  required
                  multiline
                  rows={2}
                  fullWidth
                  disabled={disabled}
                  error={!!errors.steps?.[index]?.text}
                  helperText={errors.steps?.[index]?.text?.message}
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
                aria-label="Delete step"
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Stack>

          {/* Hidden position field - auto-updated based on index */}
          <Controller
            name={`steps.${index}.position`}
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="hidden"
                value={index + 1}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
        </Box>
      ))}

      {/* Add Step Button */}
      <Box>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddStep}
          disabled={disabled}
        >
          Add Step
        </Button>
      </Box>
    </Stack>
  );
}
