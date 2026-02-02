'use client';

import { RecipeService } from '@commontable/api-client';
import type { SortOption, CuisineType, MealType, RecipeStatus } from '@commontable/types';
import { Add as AddIcon } from '@mui/icons-material';
import { Stack, Typography, Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';

import { RecipeList } from '@/components/recipe/RecipeList';
import { RecipeSearchBar } from '@/components/recipe/RecipeSearchBar';
import { RecipeFilterBar } from '@/components/recipes/RecipeFilterBar';
import { useAuth } from '@/hooks/useAuth';
import { useRecipeFilters } from '@/hooks/useRecipeFilters';
import { useRecipes } from '@/hooks/useRecipes';
import { useRecipeSearch } from '@/hooks/useRecipeSearch';
import { createClient } from '@/lib/supabase/client';

/**
 * Recipes List Page (Issue 4.3 - UI: Search + Filters)
 *
 * Displays all recipes for the household with:
 * - Full-text search functionality (backend)
 * - Tag filter (multi-select with AND logic)
 * - Sort options (last-cooked, recent, alphabetical, favorites, rating)
 * - Favorites filter toggle
 * - Favorite toggling
 * - Navigation to recipe detail
 *
 * Follows DESIGN_SYSTEM.md:
 * - Container with maxWidth="md"
 * - Stack with spacing={3} for layout
 * - h5 for page title
 * - One primary button ("Add Recipe")
 */
export default function RecipesPage() {
  const router = useRouter();
  const { household } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('last-cooked');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // New metadata filter state
  const [cuisine, setCuisine] = useState<CuisineType | null>(null);
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [status, setStatus] = useState<RecipeStatus | null>(null);
  const [priority, setPriority] = useState<number | null>(null);

  const { recipes, loading: recipesLoading, error, toggleFavorite } = useRecipes();
  const { results: searchResults, loading: searchLoading } = useRecipeSearch(searchQuery);

  const supabase = useMemo(() => createClient(), []);
  const recipeService = useMemo(() => new RecipeService(supabase), [supabase]);

  // Fetch available tags on mount
  useEffect(() => {
    async function loadTags() {
      if (!household?.id) return;

      try {
        const tags = await recipeService.getAllTags(household.id);
        setAvailableTags(tags);
      } catch (err) {
        console.error('Failed to load tags:', err);
      }
    }
    void loadTags();
  }, [household?.id, recipeService]);

  // Show search results when searching, otherwise show all recipes
  const baseRecipes = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    return recipes;
  }, [searchQuery, searchResults, recipes]);

  // Apply client-side filters and sort
  const filteredRecipes = useRecipeFilters(baseRecipes, selectedTags, showFavoritesOnly, sortBy);

  const isLoading = searchQuery.trim() ? searchLoading : recipesLoading;

  const handleAddRecipe = () => {
    router.push('/recipes/new');
  };

  const handleImportRecipe = () => {
    router.push('/recipes/import');
  };

  if (error) {
    return (
      <Typography variant="body1" color="error">
        Failed to load recipes. Please try again.
      </Typography>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5">Recipes</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" color="primary" onClick={handleImportRecipe}>
            Import from URL
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddRecipe}
          >
            Add Recipe
          </Button>
        </Stack>
      </Box>

      {/* Search */}
      <RecipeSearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Filters (Issue 4.3) */}
      <RecipeFilterBar
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showFavoritesOnly={showFavoritesOnly}
        onFavoritesToggle={setShowFavoritesOnly}
        availableTags={availableTags}
        cuisine={cuisine}
        onCuisineChange={setCuisine}
        mealType={mealType}
        onMealTypeChange={setMealType}
        status={status}
        onStatusChange={setStatus}
        priority={priority}
        onPriorityChange={setPriority}
      />

      {/* Recipe List */}
      <RecipeList recipes={filteredRecipes} loading={isLoading} onToggleFavorite={toggleFavorite} />
    </Stack>
  );
}
