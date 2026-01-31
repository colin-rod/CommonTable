'use client';

import type { SortOption, CuisineType, MealType, RecipeStatus } from '@commontable/types';
import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  type SelectChangeEvent,
} from '@mui/material';

import { SortSelect } from './SortSelect';

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

interface RecipeFilterBarProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showFavoritesOnly: boolean;
  onFavoritesToggle: (show: boolean) => void;
  availableTags: string[];
  cuisine?: CuisineType | null;
  onCuisineChange: (cuisine: CuisineType | null) => void;
  mealType?: MealType | null;
  onMealTypeChange: (mealType: MealType | null) => void;
  status?: RecipeStatus | null;
  onStatusChange: (status: RecipeStatus | null) => void;
  priority?: number | null;
  onPriorityChange: (priority: number | null) => void;
}

export function RecipeFilterBar({
  selectedTags,
  onTagsChange,
  sortBy,
  onSortChange,
  showFavoritesOnly,
  onFavoritesToggle,
  availableTags,
  cuisine,
  onCuisineChange,
  mealType,
  onMealTypeChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
}: RecipeFilterBarProps) {
  const handleTagsChange = (event: SelectChangeEvent<typeof selectedTags>) => {
    const {
      target: { value },
    } = event;
    onTagsChange(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems={{ xs: 'stretch', sm: 'center' }}
    >
      {/* Tag Filter */}
      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 240 } }}>
        <InputLabel id="tag-filter-label">Filter by tags</InputLabel>
        <Select
          labelId="tag-filter-label"
          id="tag-filter"
          multiple
          value={selectedTags}
          onChange={handleTagsChange}
          input={<OutlinedInput label="Filter by tags" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Box>
          )}
        >
          {availableTags.length === 0 ? (
            <MenuItem disabled>No tags available</MenuItem>
          ) : (
            availableTags.map((tag) => (
              <MenuItem key={tag} value={tag}>
                <Checkbox checked={selectedTags.includes(tag)} />
                <ListItemText primary={tag} />
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Sort Dropdown */}
      <SortSelect value={sortBy} onChange={onSortChange} />

      {/* Favorites Toggle */}
      <FormControlLabel
        control={
          <Checkbox
            checked={showFavoritesOnly}
            onChange={(e) => onFavoritesToggle(e.target.checked)}
          />
        }
        label="Favorites only"
      />

      {/* Cuisine Filter */}
      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
        <InputLabel id="cuisine-filter-label">Cuisine</InputLabel>
        <Select
          labelId="cuisine-filter-label"
          id="cuisine-filter"
          value={cuisine ?? ''}
          onChange={(e) => onCuisineChange((e.target.value as CuisineType) || null)}
          label="Cuisine"
        >
          <MenuItem value="">
            <em>All cuisines</em>
          </MenuItem>
          {CUISINE_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {formatCuisine(option)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Meal Type Filter */}
      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
        <InputLabel id="meal-type-filter-label">Meal Type</InputLabel>
        <Select
          labelId="meal-type-filter-label"
          id="meal-type-filter"
          value={mealType ?? ''}
          onChange={(e) => onMealTypeChange((e.target.value as MealType) || null)}
          label="Meal Type"
        >
          <MenuItem value="">
            <em>All meal types</em>
          </MenuItem>
          {MEAL_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {formatMealType(option)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Status Filter */}
      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
        <InputLabel id="status-filter-label">Status</InputLabel>
        <Select
          labelId="status-filter-label"
          id="status-filter"
          value={status ?? ''}
          onChange={(e) => onStatusChange((e.target.value as RecipeStatus) || null)}
          label="Status"
        >
          <MenuItem value="">
            <em>All statuses</em>
          </MenuItem>
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {formatStatus(option)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Priority Filter */}
      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
        <InputLabel id="priority-filter-label">Priority</InputLabel>
        <Select
          labelId="priority-filter-label"
          id="priority-filter"
          value={priority ?? ''}
          onChange={(e) => onPriorityChange(e.target.value ? Number(e.target.value) : null)}
          label="Priority"
        >
          <MenuItem value="">
            <em>All priorities</em>
          </MenuItem>
          {PRIORITY_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
