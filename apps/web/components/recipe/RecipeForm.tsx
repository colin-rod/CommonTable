'use client';

import { IngredientInputSchema, StepInputSchema } from '@commontable/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, Typography, Button, Alert, Divider } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { IngredientEditor } from './IngredientEditor';
import { RecipeMetadataFields, type RecipeFormValues } from './RecipeMetadataFields';
import { StepEditor } from './StepEditor';

/**
 * Form-specific validation schema (without household_id which is added server-side)
 */
const RecipeFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),
  servings: z
    .number()
    .int('Servings must be an integer')
    .positive('Servings must be positive')
    .optional(),
  prep_time_minutes: z
    .number()
    .int('Prep time must be an integer')
    .nonnegative('Prep time cannot be negative')
    .optional(),
  cook_time_minutes: z
    .number()
    .int('Cook time must be an integer')
    .nonnegative('Cook time cannot be negative')
    .optional(),
  notes: z
    .string()
    .max(5000, 'Notes must be 5000 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),
  ingredients: z.array(IngredientInputSchema).default([]),
  steps: z.array(StepInputSchema).default([]),
});

export interface RecipeFormProps {
  mode: 'create' | 'edit';
  initialValues: RecipeFormValues;
  onSubmit: (data: RecipeFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: Error | null;
}

/**
 * Main recipe form component for creating and editing recipes.
 * Integrates metadata fields, ingredient editor, and step editor.
 *
 * Follows Material Design 3 strict compliance:
 * - One primary button per form
 * - Stack spacing={3} for sections
 * - Dividers between sections
 */
export function RecipeForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
}: RecipeFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(RecipeFormSchema),
    defaultValues: initialValues,
  });

  const handleFormSubmit = async (data: RecipeFormValues) => {
    try {
      await onSubmit(data);
    } catch (err) {
      // Error handled by parent component via error prop
      console.error('Form submission error:', err);
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit(handleFormSubmit)} spacing={3}>
      {/* Page Title */}
      <Typography variant="h5">{mode === 'create' ? 'Create Recipe' : 'Edit Recipe'}</Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" variant="outlined">
          {error.message}
        </Alert>
      )}

      {/* Metadata Fields Section */}
      <RecipeMetadataFields control={control} errors={errors} disabled={loading} />

      <Divider />

      {/* Ingredient Editor Section */}
      <IngredientEditor control={control} errors={errors} disabled={loading} />

      <Divider />

      {/* Step Editor Section */}
      <StepEditor control={control} errors={errors} disabled={loading} />

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button variant="outlined" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {mode === 'create' ? 'Create Recipe' : 'Save Changes'}
        </Button>
      </Stack>
    </Stack>
  );
}
