'use client';

import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { Stack, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

/**
 * RecipeEmptyState Component
 * Displays a friendly message when there are no recipes
 *
 * Features:
 * - Restaurant icon
 * - Friendly message
 * - CTA button to add first recipe
 *
 * Design System Compliance:
 * - Typography: h6 for title, body2 for description
 * - Button: contained primary
 * - Stack spacing 2 (16px)
 * - Material Icon (RestaurantMenu)
 */
export function RecipeEmptyState() {
  const router = useRouter();

  const handleAddRecipe = () => {
    router.push('/recipes/new');
  };

  return (
    <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
      <RestaurantMenuIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
      <Typography variant="h6">No recipes yet</Typography>
      <Typography variant="body2" color="text.secondary">
        Add your first recipe to get started
      </Typography>
      <Button variant="contained" color="primary" onClick={handleAddRecipe}>
        Add Recipe
      </Button>
    </Stack>
  );
}
