'use client';

import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Stack, Typography, TextField, IconButton, Button, Box } from '@mui/material';
import React, { useEffect, useRef, type Ref } from 'react';
import { type Control, Controller, type FieldErrors, useFieldArray } from 'react-hook-form';

import type { RecipeFormValues } from './RecipeMetadataFields';

export interface StepEditorProps {
  control: Control<RecipeFormValues>;
  errors: FieldErrors<RecipeFormValues>;
  disabled?: boolean;
  addButtonRef?: Ref<HTMLButtonElement>;
  showHeader?: boolean;
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
export function StepEditor({
  control,
  errors,
  disabled = false,
  addButtonRef,
  showHeader = true,
}: StepEditorProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'steps',
  });
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Auto-focus when new step added
  useEffect(() => {
    const lastIndex = fields.length - 1;
    if (lastIndex >= 0 && textareaRefs.current[lastIndex]) {
      textareaRefs.current[lastIndex]?.focus();
    }
  }, [fields.length]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ignore if disabled
    if (disabled) return;

    // Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      e.stopPropagation(); // Prevent bubbling to form

      // Add new step
      append({ position: fields.length + 1, text: '' });

      // Auto-focus is handled by useEffect watching fields.length
    }
  };

  return (
    <Stack spacing={2}>
      {/* Section Header */}
      {showHeader && (
        <Typography component="h3" variant="h6">
          Steps
        </Typography>
      )}

      {/* Step Rows */}
      {fields.map((field, index) => (
        <Box key={field.id}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* Step Number Badge */}
            <Typography variant="h6" color="text.secondary" sx={{ minWidth: '2rem', pt: 2 }}>
              {index + 1}
            </Typography>

            {/* Step Text */}
            <Controller
              name={`steps.${index}.text`}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  placeholder="Describe this step..."
                  required
                  multiline
                  minRows={2}
                  fullWidth
                  disabled={disabled}
                  error={!!errors.steps?.[index]?.text}
                  helperText={errors.steps?.[index]?.text?.message || 'Required'}
                  inputProps={{
                    'aria-label': `Step ${index + 1}`,
                  }}
                  inputRef={(el: HTMLTextAreaElement | null) => {
                    textareaRefs.current[index] = el;
                  }}
                  onKeyDown={handleKeyDown}
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
          ref={addButtonRef}
        >
          Add Step
        </Button>
      </Box>
    </Stack>
  );
}
