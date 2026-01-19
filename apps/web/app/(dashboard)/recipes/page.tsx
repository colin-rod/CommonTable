'use client';

import { Add as AddIcon } from '@mui/icons-material';
import { Container, Stack, Typography, Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

import { RecipeList } from '@/components/recipe/RecipeList';
import { RecipeSearchBar } from '@/components/recipe/RecipeSearchBar';
import { useRecipes } from '@/hooks/useRecipes';
import { useRecipeSearch } from '@/hooks/useRecipeSearch';

/**
 * Recipes List Page
 *
 * Displays all recipes for the household with:
 * - Search functionality
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
  const [searchQuery, setSearchQuery] = useState('');

  const { recipes, loading: recipesLoading, error, toggleFavorite } = useRecipes();
  const { results: searchResults, loading: searchLoading } = useRecipeSearch(searchQuery);

  // Show search results when searching, otherwise show all recipes
  const displayRecipes = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    return recipes;
  }, [searchQuery, searchResults, recipes]);

  const isLoading = searchQuery.trim() ? searchLoading : recipesLoading;

  const handleAddRecipe = () => {
    router.push('/recipes/new');
  };

  const handleImportRecipe = () => {
    router.push('/recipes/import');
  };

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="body1" color="error">
          Failed to load recipes. Please try again.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
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

        {/* Recipe List */}
        <RecipeList
          recipes={displayRecipes}
          loading={isLoading}
          onToggleFavorite={toggleFavorite}
        />
      </Stack>
    </Container>
  );
}
