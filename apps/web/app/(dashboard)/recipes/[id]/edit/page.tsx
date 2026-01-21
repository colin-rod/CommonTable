'use client';

import type { RecipeId, RecipeWithVersion } from '@commontable/types';
import { Container, CircularProgress, Box, Typography, Divider, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { updateRecipe } from '@/app/actions/recipe';
import { RecipeForm, type RecipeFormValues, ImageManagement } from '@/components/recipe';
import { useAuth } from '@/hooks/useAuth';
import { useRecipe } from '@/hooks/useRecipe';
import { useTags } from '@/hooks/useTags';

/**
 * Edit Recipe Page
 *
 * Allows users to edit an existing recipe in their household.
 * Uses RecipeForm component with server actions for submission.
 *
 * Versioning Logic:
 * - Editing content (ingredients, steps, times, servings, notes) creates a new version
 * - Editing metadata (title, description) does NOT create a new version
 * - This is handled by the updateRecipe server action
 */
export default function EditRecipePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { household, isAuthenticated, isLoading: authLoading } = useAuth();
  const recipeId = params.id as RecipeId;
  const { recipe, loading: recipeLoading, error: recipeError } = useRecipe(recipeId);
  const { tags: availableTags, loading: tagsLoading } = useTags();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Transform RecipeWithVersion to RecipeFormValues
   */
  const transformToFormValues = (recipe: RecipeWithVersion): RecipeFormValues => {
    return {
      title: recipe.title,
      description: recipe.description || '',
      servings: recipe.servings ?? undefined,
      prep_time_minutes: recipe.prep_time_minutes ?? undefined,
      cook_time_minutes: recipe.cook_time_minutes ?? undefined,
      notes: recipe.notes || '',
      tags: recipe.tags || [],
      ingredients: recipe.ingredients_json || [],
      steps: recipe.steps_json || [],
    };
  };

  const handleSubmit = async (data: RecipeFormValues) => {
    if (!household?.id) {
      setError(new Error('No household found. Please join or create a household first.'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Transform form data to API format
      const input = {
        household_id: household.id,
        title: data.title,
        description: data.description || '',
        ingredients_json: data.ingredients,
        steps_json: data.steps,
        servings: data.servings,
        prep_time_minutes: data.prep_time_minutes,
        cook_time_minutes: data.cook_time_minutes,
        notes: data.notes || '',
        tags: data.tags,
      };

      const result = await updateRecipe(recipeId, input);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      // Navigate back to recipe detail page
      router.push(`/recipes/${recipeId}`);
    } catch (err) {
      console.error('Failed to update recipe:', err);
      setError(err instanceof Error ? err : new Error('Failed to update recipe'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/recipes/${recipeId}`);
  };

  // Loading state while checking auth, recipe, or tags
  if (authLoading || recipeLoading || tagsLoading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  // Recipe not found
  if (recipeError || !recipe) {
    return (
      <Container maxWidth="md">
        <Box py={4}>
          <Typography variant="h5">Recipe not found</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            The recipe you're looking for doesn't exist or you don't have permission to edit it.
          </Typography>
        </Box>
      </Container>
    );
  }

  // No household
  if (!household) {
    return (
      <Container maxWidth="md">
        <Box py={4}>
          <RecipeForm
            mode="edit"
            initialValues={transformToFormValues(recipe)}
            availableTags={availableTags}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={
              error || new Error('No household found. Please join or create a household first.')
            }
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Stack spacing={4}>
          <RecipeForm
            mode="edit"
            initialValues={transformToFormValues(recipe)}
            availableTags={availableTags}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />

          <Divider />

          {/* Image Management Section */}
          <ImageManagement recipeId={recipeId} userId={household.id} />
        </Stack>
      </Box>
    </Container>
  );
}
