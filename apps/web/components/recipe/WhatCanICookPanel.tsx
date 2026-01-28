'use client';

import type { RecipeId, UserId } from '@commontable/types';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';

import { RecipeGrid } from './RecipeGrid';

import { useRecipeFilters } from '@/hooks/useRecipeFilters';
import { useRecipes } from '@/hooks/useRecipes';
import { useShortlistStore } from '@/stores/useShortlistStore';

export function WhatCanICookPanel() {
  const { recipes, loading, error } = useRecipes();
  const {
    filteredRecipes,
    selectedTags,
    availableTags,
    showFavoritesOnly,
    sortBy,
    toggleTag,
    toggleFavorites,
    setSortBy,
    clearFilters,
  } = useRecipeFilters(recipes);

  const { add: addToShortlist, hasRecipe } = useShortlistStore();

  const handleAddToShortlist = async (recipeId: RecipeId) => {
    // TODO: Get current user ID from auth context
    const userId = 'temp-user-id' as UserId;
    await addToShortlist(recipeId, userId);
  };

  const hasActiveFilters = selectedTags.length > 0 || showFavoritesOnly;

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Loading recipes" />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="body1" color="error">
          Failed to load recipes. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Title */}
      <Typography variant="h5">What Can I Cook?</Typography>

      {/* Filters Bar */}
      <Stack spacing={2}>
        {/* Tag Filters */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Filter by tags:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => toggleTag(tag)}
                color={selectedTags.includes(tag) ? 'primary' : 'default'}
                variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        {/* Favorites and Sort Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Favorites Toggle */}
          <FormControlLabel
            control={<Checkbox checked={showFavoritesOnly} onChange={() => toggleFavorites()} />}
            label="Favorites only"
          />

          {/* Sort Select */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="sort-by-label">Sort by</InputLabel>
            <Select
              labelId="sort-by-label"
              id="sort-by"
              value={sortBy}
              label="Sort by"
              onChange={(e) => setSortBy(e.target.value as 'last_cooked' | 'title' | 'rating')}
            >
              <MenuItem value="last_cooked">Last Cooked</MenuItem>
              <MenuItem value="title">Title (A-Z)</MenuItem>
              <MenuItem value="rating">Rating</MenuItem>
            </Select>
          </FormControl>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button variant="outlined" onClick={clearFilters} size="small">
              Clear Filters
            </Button>
          )}
        </Box>
      </Stack>

      {/* Recipe Grid */}
      <RecipeGrid
        recipes={filteredRecipes}
        onAddToShortlist={handleAddToShortlist}
        shortlistedRecipeIds={recipes.filter((r) => hasRecipe(r.id)).map((r) => r.id)}
      />
    </Stack>
  );
}
