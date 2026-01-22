'use client';

import { Stack, TextField } from '@mui/material';
import { type Control, Controller, type FieldErrors } from 'react-hook-form';

import { TagAutocomplete } from './TagAutocomplete';

/**
 * Recipe form values structure matching CreateRecipeInput schema
 */
export interface RecipeFormValues {
  title: string;
  description?: string;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  notes?: string;
  tags?: string[];
  ingredients?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }>;
  steps?: Array<{
    position: number;
    text: string;
  }>;
}

export interface RecipeMetadataFieldsProps {
  control: Control<RecipeFormValues>;
  errors: FieldErrors<RecipeFormValues>;
  disabled?: boolean;
  availableTags: string[];
}

/**
 * Field configuration for consistent field styling
 */
const FIELD_CONFIG = {
  description: {
    rows: 3,
  },
  notes: {
    rows: 4,
  },
} as const;

export function RecipeMetadataFields({
  control,
  errors,
  disabled = false,
  availableTags,
}: RecipeMetadataFieldsProps) {
  return (
    <Stack spacing={3}>
      <Controller
        name="title"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Recipe Title"
            required
            fullWidth
            disabled={disabled}
            error={!!errors.title}
            helperText={errors.title?.message}
          />
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Description"
            multiline
            rows={FIELD_CONFIG.description.rows}
            fullWidth
            disabled={disabled}
            error={!!errors.description}
            helperText={errors.description?.message}
          />
        )}
      />

      <Controller
        name="servings"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Servings"
            type="number"
            fullWidth
            disabled={disabled}
            error={!!errors.servings}
            helperText={errors.servings?.message}
            value={field.value ?? ''}
            onChange={(e) =>
              field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
        )}
      />

      <Controller
        name="prep_time_minutes"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Prep Time"
            type="number"
            fullWidth
            disabled={disabled}
            error={!!errors.prep_time_minutes}
            helperText={errors.prep_time_minutes?.message || 'minutes'}
            value={field.value ?? ''}
            onChange={(e) =>
              field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
        )}
      />

      <Controller
        name="cook_time_minutes"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Cook Time"
            type="number"
            fullWidth
            disabled={disabled}
            error={!!errors.cook_time_minutes}
            helperText={errors.cook_time_minutes?.message || 'minutes'}
            value={field.value ?? ''}
            onChange={(e) =>
              field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
        )}
      />

      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Notes"
            multiline
            rows={FIELD_CONFIG.notes.rows}
            fullWidth
            disabled={disabled}
            error={!!errors.notes}
            helperText={errors.notes?.message}
          />
        )}
      />

      <Controller
        name="tags"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <TagAutocomplete
            value={field.value || []}
            onChange={field.onChange}
            availableTags={availableTags}
            disabled={disabled}
            error={!!errors.tags}
            helperText={errors.tags?.message}
          />
        )}
      />
    </Stack>
  );
}
