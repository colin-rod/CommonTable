'use client';

import {
  IngredientInputSchema,
  StepInputSchema,
  CuisineTypeSchema,
  MealTypeSchema,
  RecipeStatusSchema,
  CookingMethodSchema,
  DietaryCategorySchema,
  DishCategorySchema,
} from '@commontable/types';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Stack,
  Typography,
  Button,
  Alert,
  Divider,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  tags: z.array(z.string().min(1).max(50)).max(20, 'Maximum 20 tags allowed').default([]),
  ingredients: z.array(IngredientInputSchema).default([]),
  steps: z.array(StepInputSchema).default([]),
  // New metadata fields
  cuisine: CuisineTypeSchema.nullable().optional(),
  meal_type: MealTypeSchema.nullable().optional(),
  key_ingredients: z
    .array(z.string().min(1).max(50).trim())
    .max(50, 'Maximum 50 key ingredients allowed')
    .default([]),
  priority: z.number().int().min(1).max(5).nullable().optional(),
  status: RecipeStatusSchema.default('suggested'),
  cooking_method: CookingMethodSchema.nullable().optional(),
  dietary_categories: z.array(DietaryCategorySchema).default([]),
  dish_category: DishCategorySchema.nullable().optional(),
});

export interface RecipeFormProps {
  mode: 'create' | 'edit';
  initialValues: RecipeFormValues;
  availableTags: string[];
  onSubmit: (data: RecipeFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: Error | null;
}

/**
 * Main recipe form component for creating and editing recipes.
 * Integrates metadata fields, ingredient editor, and step editor.
 *
 * Layout:
 * - Top section: Compact metadata grid
 * - Bottom section: Two-column layout for ingredients (left) and steps (right)
 *
 * Follows Material Design 3 strict compliance:
 * - One primary button per form
 * - Paper containers with elevation={1} for content sections
 * - Responsive: columns stack on mobile
 */
export function RecipeForm({
  mode,
  initialValues,
  availableTags,
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

      {/* Metadata Fields Section (Grid Layout) */}
      <RecipeMetadataFields
        control={control}
        errors={errors}
        disabled={loading}
        availableTags={availableTags}
      />

      <Divider />

      {/* Two-Column Content Section: Ingredients & Steps */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
        }}
      >
        {/* Ingredients Column */}
        <Accordion defaultExpanded sx={{ flex: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="h3" variant="h6">
              Ingredients
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <IngredientEditor
              control={control}
              errors={errors}
              disabled={loading}
              showHeader={false}
            />
          </AccordionDetails>
        </Accordion>

        {/* Steps Column */}
        <Accordion defaultExpanded sx={{ flex: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="h3" variant="h6">
              Steps
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <StepEditor control={control} errors={errors} disabled={loading} showHeader={false} />
          </AccordionDetails>
        </Accordion>
      </Box>

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
