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
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
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

      {/* Cuisine Select */}
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

      {/* Meal Type Select */}
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

      {/* Status Select */}
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

      {/* Priority Select */}
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

      {/* Cooking Method Select */}
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

      {/* Dietary Categories Select (Multiple) */}
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

      {/* Dish Category Select */}
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
    </Stack>
  );
}
