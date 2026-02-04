'use client';

import type { RecipeId, SortOption } from '@commontable/types';
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
import { useMemo, useState } from 'react';

import { RecipeGrid } from './RecipeGrid';

import { useAuth } from '@/hooks/useAuth';
import { useRecipeFilters } from '@/hooks/useRecipeFilters';
import { useRecipes } from '@/hooks/useRecipes';
import { useShortlistStore } from '@/stores/useShortlistStore';

export function WhatCanICookPanel() {
  const { user } = useAuth();
  const { recipes, loading, error } = useRecipes();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('last-cooked');

  // Get available tags from recipes
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((recipe) => {
      recipe.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [recipes]);

  // Apply filters
  const filteredRecipes = useRecipeFilters(recipes, selectedTags, showFavoritesOnly, sortBy);

  const { add: addToShortlist, hasRecipe } = useShortlistStore();

  const handleAddToShortlist = async (recipeId: RecipeId) => {
    if (!user?.profile) {
      console.error('Cannot add to shortlist: user not authenticated');
      return;
    }

    await addToShortlist(recipeId, user.profile.id);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setShowFavoritesOnly(false);
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
            control={
              <Checkbox
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              />
            }
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
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <MenuItem value="last-cooked">Last Cooked</MenuItem>
              <MenuItem value="alphabetical">Title (A-Z)</MenuItem>
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
