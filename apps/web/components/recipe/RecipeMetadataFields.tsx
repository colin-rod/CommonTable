'use client';

import type {
  CuisineType,
  MealType,
  RecipeStatus,
  CookingMethod,
  DietaryCategory,
  DishCategory,
} from '@commontable/types';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Stack,
} from '@mui/material';
import { useState, useEffect, useRef, type Ref } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState, useEffect, useRef } from 'react';
import { type Control, Controller, type FieldErrors, useWatch } from 'react-hook-form';

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
  // New metadata fields
  cuisine?: CuisineType | null;
  meal_type?: MealType | null;
  key_ingredients?: string[];
  priority?: number | null;
  status?: RecipeStatus;
  cooking_method?: CookingMethod | null;
  dietary_categories?: DietaryCategory[];
  dish_category?: DishCategory | null;
}

export interface RecipeMetadataFieldsProps {
  control: Control<RecipeFormValues>;
  errors: FieldErrors<RecipeFormValues>;
  disabled?: boolean;
  availableTags: string[];
  titleInputRef?: Ref<HTMLInputElement>;
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

const CUISINE_OPTIONS: CuisineType[] = [
  'african',
  'american',
  'asian',
  'brazilian',
  'breakfast',
  'chinese',
  'dessert',
  'french',
  'german',
  'greek',
  'hungarian',
  'indian',
  'italian',
  'japanese',
  'korean',
  'mediterranean',
  'mexican',
  'middle_eastern',
  'pastry',
  'persian',
  'peruvian',
  'salad',
  'sauce',
  'seafood',
  'spanish',
  'staple',
  'thai',
  'vegetable',
  'vietnamese',
];

const MEAL_TYPE_OPTIONS: MealType[] = [
  'main_dish',
  'side_dish',
  'breakfast',
  'dessert',
  'snack',
  'beverage',
];

const STATUS_OPTIONS: RecipeStatus[] = ['suggested', 'to_buy', 'to_cook', 'cooked'];

const PRIORITY_OPTIONS: number[] = [1, 2, 3, 4, 5];

const COOKING_METHOD_OPTIONS: CookingMethod[] = [
  'quick',
  'slow_cook',
  'instant_pot',
  'bake',
  'grill',
  'stovetop',
  'air_fryer',
  'no_cook',
];

const DIETARY_CATEGORY_OPTIONS: DietaryCategory[] = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'keto',
  'paleo',
  'low_carb',
  'low_fat',
  'high_protein',
  'pescatarian',
];

const DISH_CATEGORY_OPTIONS: DishCategory[] = [
  'main',
  'side',
  'appetizer',
  'soup',
  'salad',
  'bread',
  'condiment',
];

// Helper functions for formatting display labels
function formatCuisine(cuisine: CuisineType): string {
  return cuisine
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatMealType(mealType: MealType): string {
  return mealType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatStatus(status: RecipeStatus): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatCookingMethod(method: CookingMethod): string {
  return method
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDietaryCategory(category: DietaryCategory): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDishCategory(category: DishCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function RecipeMetadataFields({
  control,
  errors,
  disabled = false,
  availableTags,
  titleInputRef,
}: RecipeMetadataFieldsProps) {
  // Watch the description and notes values to determine initial visibility
  const descriptionValue = useWatch({ control, name: 'description' });
  const notesValue = useWatch({ control, name: 'notes' });

  // State for expandable fields
  const [showDescription, setShowDescription] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Refs for autofocus
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Initialize visibility based on initial values
  useEffect(() => {
    if (descriptionValue && descriptionValue.trim() !== '') {
      setShowDescription(true);
    }
  }, [descriptionValue]);

  useEffect(() => {
    if (notesValue && notesValue.trim() !== '') {
      setShowNotes(true);
    }
  }, [notesValue]);

  // Autofocus when fields are revealed
  useEffect(() => {
    if (showDescription && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [showDescription]);

  useEffect(() => {
    if (showNotes && notesRef.current) {
      notesRef.current.focus();
    }
  }, [showNotes]);

  const shouldExpandOptionalSection = Boolean(
    (descriptionValue && descriptionValue.trim() !== '') || (notesValue && notesValue.trim() !== ''),
  );

  return (
    <Grid container spacing={2}>
      {/* Row 1: Title (full width) */}
      <Grid item xs={12}>
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
              disabled={disabled}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          )}
        />
      </Grid>

      {/* Row 2: Description (conditional) */}
      <Grid item xs={12}>
        {showDescription ? (
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                inputRef={descriptionRef}
                label="Description"
                multiline
                rows={FIELD_CONFIG.description.rows}
                fullWidth
                disabled={disabled}
                error={!!errors.description}
                helperText={errors.description?.message}
    <Stack spacing={2}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography component="h3" variant="h6">
              Basics
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Required
            </Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Row 1: Title (full width) */}
            <Grid item xs={12}>
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
                    helperText={errors.title?.message || 'Required'}
                  />
                )}
              />
            </Grid>

            {/* Row 2: Quick stats - 3 columns */}
            <Grid item xs={12} sm={4}>
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
            </Grid>
            <Grid item xs={12} sm={4}>
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
            </Grid>
            <Grid item xs={12} sm={4}>
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
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography component="h3" variant="h6">
            Meta
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Row 4: Classification - 4 columns on desktop, 2x2 on tablet */}
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="cuisine"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={disabled} error={!!errors.cuisine}>
                    <InputLabel id="cuisine-label">Cuisine</InputLabel>
                    <Select
                      {...field}
                      labelId="cuisine-label"
                      label="Cuisine"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {CUISINE_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {formatCuisine(option)}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.cuisine && <FormHelperText>{errors.cuisine.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="meal_type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={disabled} error={!!errors.meal_type}>
                    <InputLabel id="meal-type-label">Meal Type</InputLabel>
                    <Select
                      {...field}
                      labelId="meal-type-label"
                      label="Meal Type"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {MEAL_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {formatMealType(option)}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.meal_type && <FormHelperText>{errors.meal_type.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="dietary_categories"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <FormControl fullWidth disabled={disabled} error={!!errors.dietary_categories}>
                    <InputLabel id="dietary-categories-label">Dietary Categories</InputLabel>
                    <Select
                      {...field}
                      labelId="dietary-categories-label"
                      label="Dietary Categories"
                      multiple
                      value={field.value || []}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      {DIETARY_CATEGORY_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {formatDietaryCategory(option)}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.dietary_categories && (
                      <FormHelperText>{errors.dietary_categories.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="dish_category"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={disabled} error={!!errors.dish_category}>
                    <InputLabel id="dish-category-label">Dish Category</InputLabel>
                    <Select
                      {...field}
                      labelId="dish-category-label"
                      label="Dish Category"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {DISH_CATEGORY_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {formatDishCategory(option)}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.dish_category && (
                      <FormHelperText>{errors.dish_category.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Row 5: Workflow - 3 columns */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={disabled} error={!!errors.status}>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      {...field}
                      labelId="status-label"
                      label="Status"
                      value={field.value ?? 'suggested'}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {formatStatus(option)}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={disabled} error={!!errors.priority}>
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Select
                      {...field}
                      labelId="priority-label"
                      label="Priority"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {PRIORITY_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.priority && <FormHelperText>{errors.priority.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="cooking_method"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={disabled} error={!!errors.cooking_method}>
                    <InputLabel id="cooking-method-label">Cooking Method</InputLabel>
                    <Select
                      {...field}
                      labelId="cooking-method-label"
                      label="Cooking Method"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {COOKING_METHOD_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {formatCookingMethod(option)}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.cooking_method && (
                      <FormHelperText>{errors.cooking_method.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Row 6: Tags (full width) */}
            <Grid item xs={12}>
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
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded={shouldExpandOptionalSection}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography component="h3" variant="h6">
            Optional
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Row 2: Description (conditional) */}
            <Grid item xs={12}>
              {showDescription ? (
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      inputRef={descriptionRef}
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
              ) : (
                <Typography
                  color="primary"
                  sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => setShowDescription(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setShowDescription(true);
                    }
                  }}
                >
                  Add description
                </Typography>
              )}
            </Grid>

            {/* Row 7: Notes (conditional) */}
            <Grid item xs={12}>
              {showNotes ? (
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      inputRef={notesRef}
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
              ) : (
                <Typography
                  color="primary"
                  sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => setShowNotes(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setShowNotes(true);
                    }
                  }}
                >
                  Add notes
                </Typography>
              )}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}
