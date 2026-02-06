'use client';

import { Container, CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createRecipe } from '@/app/actions/recipe';
import { RecipeForm, type RecipeFormValues } from '@/components/recipe';
import { useAuth } from '@/hooks/useAuth';
import { useTags } from '@/hooks/useTags';

/**
 * Create Recipe Page
 *
 * Allows users to create a new recipe in their household.
 * Uses RecipeForm component with server actions for submission.
 */
export default function CreateRecipePage() {
  const router = useRouter();
  const { household, isAuthenticated, isLoading: authLoading } = useAuth();
  const { tags: availableTags, loading: tagsLoading } = useTags();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Default form values for new recipe
  const initialValues: RecipeFormValues = {
    title: '',
    description: '',
    servings: undefined,
    prep_time_minutes: undefined,
    cook_time_minutes: undefined,
    notes: '',
    tags: [],
    ingredients: [],
    steps: [],
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
        ingredients_json: data.ingredients || [],
        steps_json: data.steps || [],
        servings: data.servings,
        prep_time_minutes: data.prep_time_minutes,
        cook_time_minutes: data.cook_time_minutes,
        notes: data.notes || '',
        tags: data.tags || [],
        // New metadata fields (Phase 3) - defaults for creation
        status: 'suggested' as const,
        key_ingredients: [],
        cuisine: undefined,
        meal_type: undefined,
        priority: undefined,
        cooking_method: undefined,
        dietary_categories: [],
        dish_category: undefined,
      };

      const result = await createRecipe(input);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      // Navigate to the newly created recipe detail page
      if (result.data?.id) {
        router.push(`/recipes/${result.data.id}`);
      }
    } catch (err) {
      console.error('Failed to create recipe:', err);
      setError(err instanceof Error ? err : new Error('Failed to create recipe'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/recipes');
  };

  // Loading state while checking auth or tags
  if (authLoading || tagsLoading) {
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
    router.push('/auth/login');
    return null;
  }

  // No household
  if (!household) {
    return (
      <Container maxWidth="md">
        <Box py={4}>
          <RecipeForm
            mode="create"
            initialValues={initialValues}
            availableTags={availableTags}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={
              error || new Error('No household found. Please join or create a household first.')
            }
            draftStorageKey="recipe:draft:new"
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <RecipeForm
          mode="create"
          initialValues={initialValues}
          availableTags={availableTags}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          error={error}
          draftStorageKey="recipe:draft:new"
        />
      </Box>
    </Container>
  );
}
