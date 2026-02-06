'use client';

/* eslint-disable no-undef */
import {
  IngredientInputSchema,
  StepInputSchema,
  CuisineTypeSchema,
  MealTypeSchema,
  RecipeStatusSchema,
} from '@commontable/types';
import { zodResolver } from '@hookform/resolvers/zod';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {
  Stack,
  Typography,
  Button,
  Alert,
  Divider,
  Box,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState, type RefObject, type SyntheticEvent } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
});

export interface RecipeFormProps {
  mode: 'create' | 'edit';
  initialValues: RecipeFormValues;
  availableTags: string[];
  onSubmit: (data: RecipeFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: Error | null;
  draftStorageKey?: string;
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
  draftStorageKey,
}: RecipeFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(RecipeFormSchema),
    defaultValues: initialValues,
  });
  const watchedValues = useWatch({ control, defaultValue: initialValues });
  const currentValues = watchedValues ?? initialValues;
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [expandedSection, setExpandedSection] = useState<
    'details' | 'ingredients' | 'steps' | null
  >('details');
  const detailsSummaryRef = useRef<HTMLDivElement>(null);
  const ingredientsSummaryRef = useRef<HTMLDivElement>(null);
  const stepsSummaryRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const ingredientAddButtonRef = useRef<HTMLButtonElement>(null);
  const stepAddButtonRef = useRef<HTMLButtonElement>(null);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRestoredDraftRef = useRef(false);

  const ingredientFields = currentValues.ingredients ?? [];
  const stepFields = currentValues.steps ?? [];
  const completedIngredients = ingredientFields.filter((item) => item.name?.trim()).length;
  const completedSteps = stepFields.filter((item) => item.text?.trim()).length;
  const detailsComplete = Boolean(currentValues.title?.trim());

  const ingredientStatusLabel =
    ingredientFields.length === 0
      ? '0 items'
      : `${completedIngredients}/${ingredientFields.length} items`;
  const stepStatusLabel =
    stepFields.length === 0 ? '0 items' : `${completedSteps}/${stepFields.length} items`;

  const draftStatusLabel = useMemo(() => {
    if (!draftStorageKey) {
      return null;
    }
    if (draftStatus === 'saving') {
      return 'Saving draft…';
    }
    if (draftStatus === 'saved' && lastSavedAt) {
      return `Draft saved at ${lastSavedAt.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    }
    if (draftStatus === 'error') {
      return 'Draft failed to save';
    }
    return 'Draft not saved yet';
  }, [draftStatus, lastSavedAt, draftStorageKey]);

  useEffect(() => {
    if (!draftStorageKey || hasRestoredDraftRef.current) {
      return;
    }
    try {
      const rawDraft = localStorage.getItem(draftStorageKey);
      if (rawDraft) {
        const parsedDraft = JSON.parse(rawDraft) as RecipeFormValues;
        reset(parsedDraft);
        setDraftStatus('saved');
      }
      hasRestoredDraftRef.current = true;
    } catch (draftError) {
      console.error('Failed to restore recipe draft:', draftError);
      setDraftStatus('error');
      hasRestoredDraftRef.current = true;
    }
  }, [draftStorageKey, reset]);

  useEffect(() => {
    if (!draftStorageKey) {
      return;
    }
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = setTimeout(() => {
      try {
        setDraftStatus('saving');
        localStorage.setItem(draftStorageKey, JSON.stringify(currentValues));
        setLastSavedAt(new Date());
        setDraftStatus('saved');
      } catch (draftError) {
        console.error('Failed to save recipe draft:', draftError);
        setDraftStatus('error');
      }
    }, 1200);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [draftStorageKey, currentValues]);

  useEffect(() => {
    if (expandedSection === 'details') {
      titleInputRef.current?.focus();
    }
    if (expandedSection === 'ingredients') {
      ingredientAddButtonRef.current?.focus();
    }
    if (expandedSection === 'steps') {
      stepAddButtonRef.current?.focus();
    }
  }, [expandedSection]);

  const handleSectionChange =
    (section: 'details' | 'ingredients' | 'steps', summaryRef: RefObject<HTMLDivElement | null>) =>
    (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpandedSection(isExpanded ? section : null);
      if (!isExpanded) {
        requestAnimationFrame(() => {
          summaryRef.current?.focus();
        });
      }
    };

  const handleSaveDraft = () => {
    if (!draftStorageKey) {
      return;
    }
    try {
      setDraftStatus('saving');
      localStorage.setItem(draftStorageKey, JSON.stringify(currentValues));
      setLastSavedAt(new Date());
      setDraftStatus('saved');
    } catch (draftError) {
      console.error('Failed to save recipe draft:', draftError);
      setDraftStatus('error');
    }
  };

  const handleFormSubmit = async (data: RecipeFormValues) => {
    try {
      await onSubmit(data);
      if (draftStorageKey) {
        localStorage.removeItem(draftStorageKey);
      }
    } catch (err) {
      // Error handled by parent component via error prop
      console.error('Form submission error:', err);
    }
  };

  const handleNavigateToSection = (sectionId: string) => {
    if (sectionId === 'recipe-details-section') {
      setExpandedSection('details');
    }
    if (sectionId === 'recipe-ingredients-section') {
      setExpandedSection('ingredients');
    }
    if (sectionId === 'recipe-steps-section') {
      setExpandedSection('steps');
    }
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit(handleFormSubmit)} spacing={3}>
      {/* Page Title */}
      <Typography variant="h5">{mode === 'create' ? 'Create Recipe' : 'Edit Recipe'}</Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Jump to section
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="text"
              size="small"
              onClick={() => handleNavigateToSection('recipe-details-section')}
            >
              Details
            </Button>
            <Chip
              size="small"
              icon={detailsComplete ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
              label={detailsComplete ? 'Complete' : 'Required'}
              color={detailsComplete ? 'success' : 'default'}
              variant="outlined"
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="text"
              size="small"
              onClick={() => handleNavigateToSection('recipe-ingredients-section')}
            >
              Ingredients
            </Button>
            <Chip
              size="small"
              icon={completedIngredients > 0 ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
              label={ingredientStatusLabel}
              color={completedIngredients > 0 ? 'success' : 'default'}
              variant="outlined"
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="text"
              size="small"
              onClick={() => handleNavigateToSection('recipe-steps-section')}
            >
              Steps
            </Button>
            <Chip
              size="small"
              icon={completedSteps > 0 ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
              label={stepStatusLabel}
              color={completedSteps > 0 ? 'success' : 'default'}
              variant="outlined"
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" variant="outlined">
          {error.message}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              inputRef={titleInputRef}
              label="Recipe Title"
              required
              fullWidth
              disabled={loading}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          )}
        />
      </Box>

      <Accordion
        id="recipe-details-section"
        expanded={expandedSection === 'details'}
        onChange={handleSectionChange('details', detailsSummaryRef)}
        elevation={1}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="recipe-details-content"
          id="recipe-details-header"
          ref={detailsSummaryRef}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6">Details</Typography>
            <Chip
              size="small"
              icon={detailsComplete ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
              label={detailsComplete ? 'Complete' : 'Required'}
              color={detailsComplete ? 'success' : 'default'}
              variant="outlined"
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <RecipeMetadataFields
            control={control}
            errors={errors}
            disabled={loading}
            availableTags={availableTags}
            titleInputRef={titleInputRef}
            showTitle={false}
          />
        </AccordionDetails>
      </Accordion>

      <Divider />

      {/* Two-Column Content Section: Ingredients & Steps */}
      <Stack spacing={3}>
        <Accordion
          id="recipe-ingredients-section"
          expanded={expandedSection === 'ingredients'}
          onChange={handleSectionChange('ingredients', ingredientsSummaryRef)}
          elevation={1}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="recipe-ingredients-content"
            id="recipe-ingredients-header"
            ref={ingredientsSummaryRef}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h6">Ingredients</Typography>
              <Chip
                size="small"
                icon={completedIngredients > 0 ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                label={ingredientStatusLabel}
                color={completedIngredients > 0 ? 'success' : 'default'}
                variant="outlined"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <IngredientEditor
              control={control}
              errors={errors}
              disabled={loading}
              addButtonRef={ingredientAddButtonRef}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion
          id="recipe-steps-section"
          expanded={expandedSection === 'steps'}
          onChange={handleSectionChange('steps', stepsSummaryRef)}
          elevation={1}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="recipe-steps-content"
            id="recipe-steps-header"
            ref={stepsSummaryRef}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h6">Steps</Typography>
              <Chip
                size="small"
                icon={completedSteps > 0 ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                label={stepStatusLabel}
                color={completedSteps > 0 ? 'success' : 'default'}
                variant="outlined"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <StepEditor
              control={control}
              errors={errors}
              disabled={loading}
              addButtonRef={stepAddButtonRef}
            />
          </AccordionDetails>
        </Accordion>
      </Stack>

      {/* Action Buttons */}
      <Box
        display="flex"
        flexWrap="wrap"
        alignItems="center"
        gap={2}
        justifyContent="space-between"
      >
        {draftStorageKey && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button variant="outlined" onClick={handleSaveDraft} disabled={loading}>
              Save Draft
            </Button>
            {draftStatusLabel && (
              <Typography variant="body2" color="text.secondary">
                {draftStatusLabel}
              </Typography>
            )}
          </Stack>
        )}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {mode === 'create' ? 'Create Recipe' : 'Save Changes'}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
