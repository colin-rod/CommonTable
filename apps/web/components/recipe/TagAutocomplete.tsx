'use client';

import { Autocomplete, TextField, Chip } from '@mui/material';

export interface TagAutocompleteProps {
  value: string[];
  onChange: (tags: string[]) => void;
  availableTags: string[];
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

/**
 * TagAutocomplete - Material UI Autocomplete for tag selection with inline creation
 *
 * Features:
 * - Autocomplete with freeSolo (allows creating new tags)
 * - Chip display for selected tags
 * - Real-time filtering from household tags
 * - Tag normalization (lowercase, trim)
 * - Duplicate prevention
 * - Material Design 3 compliant
 */
export function TagAutocomplete({
  value,
  onChange,
  availableTags,
  disabled = false,
  error = false,
  helperText = 'Press Enter to add a tag',
}: TagAutocompleteProps) {
  const handleChange = (_event: unknown, newValue: string[]) => {
    // Normalize and deduplicate tags
    const normalized = [
      ...new Set(newValue.map((tag) => tag.toLowerCase().trim()).filter((tag) => tag.length > 0)),
    ];
    onChange(normalized);
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      options={availableTags}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      renderTags={(tags, getTagProps) =>
        tags.map((tag, index) => (
          <Chip label={tag} size="small" {...getTagProps({ index })} key={tag} />
        ))
      }
      renderInput={(params) => (
        <TextField {...params} label="Tags" helperText={helperText} error={error} />
      )}
    />
  );
}
