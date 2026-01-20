'use client';

import type { SortOption } from '@commontable/types';
import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from '@mui/material';

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'last-cooked', label: 'Last cooked' },
  { value: 'recent', label: 'Recently added' },
  { value: 'alphabetical', label: 'A-Z' },
  { value: 'favorites', label: 'Favorites first' },
  { value: 'rating', label: 'Highest rated' },
];

export function SortSelect({ value, onChange }: SortSelectProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value as SortOption);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel id="sort-select-label">Sort</InputLabel>
      <Select
        labelId="sort-select-label"
        id="sort-select"
        value={value}
        label="Sort"
        onChange={handleChange}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
