'use client';

import type { Recipe, RecipeId } from '@commontable/types';
import { List, Typography, Box, CircularProgress } from '@mui/material';

import { RecipeListItem } from './RecipeListItem';

interface RecipeListProps {
  recipes: Recipe[];
  loading?: boolean;
  onToggleFavorite: (id: RecipeId) => void;
}

/**
 * RecipeList Component
 *
 * Displays a list of recipes with:
 * - Loading state (CircularProgress)
 * - Empty state message
 * - List of RecipeListItem components
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses List as primary pattern
 * - CircularProgress for loading
 * - Calm, neutral empty state message
 */
export function RecipeList({ recipes, loading = false, onToggleFavorite }: RecipeListProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (recipes.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No recipes yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Add your first recipe to get started
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {recipes.map((recipe) => (
        <RecipeListItem key={recipe.id} recipe={recipe} onToggleFavorite={onToggleFavorite} />
      ))}
    </List>
  );
}
