'use client';

import type { SortOption } from '@commontable/types';
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

interface RecipeFilterBarProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showFavoritesOnly: boolean;
  onFavoritesToggle: (show: boolean) => void;
  availableTags: string[];
}

export function RecipeFilterBar({
  selectedTags,
  onTagsChange,
  sortBy,
  onSortChange,
  showFavoritesOnly,
  onFavoritesToggle,
  availableTags,
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
    </Stack>
  );
}
