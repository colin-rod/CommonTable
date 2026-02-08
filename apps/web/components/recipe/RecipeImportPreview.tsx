'use client';

import type { CreateRecipeInput } from '@commontable/api-client';
import type { CuisineType, MealType } from '@commontable/types';
import { IngredientInputSchema, StepInputSchema } from '@commontable/types';
import { zodResolver } from '@hookform/resolvers/zod';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Stack,
  Typography,
  Button,
  Alert,
  Divider,
  Paper,
  Box,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { IngredientEditor } from './IngredientEditor';
import { RecipeMetadataFields, type RecipeFormValues } from './RecipeMetadataFields';
import { StepEditor } from './StepEditor';

import {
  createImportedRecipe,
  completeRecipePreview,
  type RecipeImportResponse,
} from '@/app/actions/recipe-import';

/**
 * Form validation schema (same as RecipeForm)
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

export interface RecipeImportPreviewProps {
  preview: RecipeImportResponse;
  householdId: string;
  onSuccess: (recipeId: string) => void;
  onGoBack: () => void;
}

/**
 * Recipe import preview component with editable fields.
 *
 * Displays parsed recipe data with validation warnings (non-blocking),
 * source metadata (read-only), and all editable recipe fields.
 *
 * Design System Compliance:
 * - Typography: h5 for page title, h6 for sections, body1/body2 for content
 * - One primary button ("Create Recipe"), one secondary button ("Go Back")
 * - Stack spacing={3} for sections
 * - Paper elevation={1} for metadata
 */
export function RecipeImportPreview({
  preview,
  householdId,
  onSuccess,
  onGoBack,
}: RecipeImportPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  // Pre-fill form with preview data
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(RecipeFormSchema),
    defaultValues: {
      title: preview.preview.title || '',
      description: preview.preview.description || '',
      servings: preview.preview.servings,
      prep_time_minutes: preview.preview.prep_time_minutes,
      cook_time_minutes: preview.preview.cook_time_minutes,
      notes: '',
      ingredients: preview.preview.ingredients,
      steps: preview.preview.steps,
    },
  });

  const handleCompleteWithAI = async () => {
    setCompleting(true);
    setCompletionError(null);

    try {
      const result = await completeRecipePreview(preview.source.url, householdId);

      if (!result.success) {
        setCompletionError(result.error.message);
        return;
      }

      // Overwrite ALL form fields with AI-completed data
      reset({
        title: result.data.title,
        description: result.data.description || '',
        servings: result.data.servings,
        prep_time_minutes: result.data.prep_time_minutes,
        cook_time_minutes: result.data.cook_time_minutes,
        notes: getValues('notes'), // Preserve user's notes
        ingredients: result.data.ingredients,
        steps: result.data.steps,
        tags: result.data.tags,
        cuisine: (result.data.cuisine as CuisineType | null) || undefined,
        meal_type: (result.data.meal_type as MealType | null) || undefined,
        key_ingredients: result.data.key_ingredients,
      });
    } catch (err) {
      setCompletionError('Failed to complete recipe. Please try again.');
      console.error('Recipe completion error:', err);
    } finally {
      setCompleting(false);
    }
  };

  const onSubmit = async (data: RecipeFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const input: Omit<CreateRecipeInput, 'user_id'> = {
        household_id: householdId,
        title: data.title,
        description: data.description || '',
        servings: data.servings,
        prep_time_minutes: data.prep_time_minutes,
        cook_time_minutes: data.cook_time_minutes,
        notes: data.notes || '',
        ingredients_json: data.ingredients || [],
        steps_json: data.steps || [],
        tags: data.tags || [],
        // New metadata fields (Phase 3)
        key_ingredients: data.key_ingredients || [],
        cuisine: data.cuisine || undefined,
        meal_type: data.meal_type || undefined,
        status: 'suggested' as const,
      };

      const result = await createImportedRecipe(input, preview.preview.image_url);

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      onSuccess(result.data.id);
    } catch (err) {
      setError('Failed to create recipe. Please try again.');
      console.error('Recipe creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Preview Recipe</Typography>

      {/* Source Metadata (Read-Only) */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h6">Source</Typography>
          <Typography variant="body2" color="text.secondary">
            URL: {preview.source.url}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Parsed via:{' '}
            {preview.source.parsed_via === 'jsonld' ? 'Structured data (JSON-LD)' : 'HTML patterns'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fetched: {new Date(preview.source.fetched_at).toLocaleString()}
          </Typography>
        </Stack>
      </Paper>

      {/* Validation Warnings (Non-Blocking) */}
      {preview.validation_errors.length > 0 && (
        <Alert severity="warning" variant="outlined">
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            The following fields had parsing issues:
          </Typography>
          <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
            {preview.validation_errors.map((err, index) => (
              <Typography key={index} component="li" variant="body2">
                {err.field}: {err.message}
              </Typography>
            ))}
          </Stack>
          <Typography variant="body2" sx={{ mt: 1 }}>
            You can edit these fields below before creating the recipe.
          </Typography>
        </Alert>
      )}

      {/* AI Completion Section */}
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            onClick={handleCompleteWithAI}
            disabled={completing || loading}
          >
            {completing ? <CircularProgress size={24} /> : 'Complete Recipe with AI'}
          </Button>
          <Typography variant="body2" color="text.secondary">
            Uses AI to clean and enrich recipe data
          </Typography>
        </Stack>

        {/* Completion Error Alert */}
        {completionError && (
          <Alert severity="error" variant="outlined" onClose={() => setCompletionError(null)}>
            {completionError}
          </Alert>
        )}
      </Stack>

      <Divider />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      )}

      {/* Image Preview */}
      {preview.preview.image_url && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Recipe Image
          </Typography>
          <Box
            component="img"
            src={preview.preview.image_url}
            alt="Recipe preview"
            sx={{
              maxWidth: '100%',
              height: 'auto',
              maxHeight: 400,
              borderRadius: 1,
              objectFit: 'contain',
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This image will be uploaded when you create the recipe.
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Editable Recipe Fields */}
      <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
        <Typography variant="h6">Recipe Details</Typography>

        {/* Metadata Fields Section */}
        <RecipeMetadataFields
          control={control}
          errors={errors}
          disabled={loading || completing}
          availableTags={[]}
          showWorkflowFields={false}
        />

        <Divider />

        {/* Ingredient Editor Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="h3" variant="h6">
              Ingredients
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <IngredientEditor
              control={control}
              errors={errors}
              disabled={loading || completing}
              showHeader={false}
            />
          </AccordionDetails>
        </Accordion>

        {/* Step Editor Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="h3" variant="h6">
              Steps
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <StepEditor
              control={control}
              errors={errors}
              disabled={loading || completing}
              showHeader={false}
            />
          </AccordionDetails>
        </Accordion>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onGoBack} disabled={loading || completing}>
            Go Back
          </Button>
          <Button type="submit" variant="contained" disabled={loading || completing}>
            {loading ? <CircularProgress size={24} /> : 'Create Recipe'}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
