'use client';

import { Search as SearchIcon } from '@mui/icons-material';
import { TextField, InputAdornment } from '@mui/material';

interface RecipeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * RecipeSearchBar Component
 *
 * Search input for filtering recipes
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses TextField with visible label
 * - Search icon as visual indicator
 * - Full width for mobile-friendly design
 */
export function RecipeSearchBar({
  value,
  onChange,
  placeholder = 'Search recipes...',
}: RecipeSearchBarProps) {
  return (
    <TextField
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
      }}
      size="small"
    />
  );
}
