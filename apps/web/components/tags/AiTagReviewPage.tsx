'use client';

import type {
  RecipeWithPendingSuggestions,
  AiTagSuggestionId,
  RecipeVersionId,
} from '@commontable/types';
import { Container, Stack, Typography, CircularProgress, Box } from '@mui/material';
import { useState, useEffect, useCallback } from 'react';

import { AiTagReviewList } from './AiTagReviewList';

import {
  getPendingTagSuggestionsForReview,
  acceptAiTagSuggestion,
  rejectAiTagSuggestion,
  acceptAllAiTagSuggestionsForRecipe,
} from '@/app/actions/aiTagSuggestion';

/**
 * AI Tag Review Page
 *
 * Displays all recipes with pending AI tag suggestions.
 * Users can expand recipes to review and accept/reject tags.
 *
 * Features:
 * - Expandable list of recipes
 * - Per-recipe tag management
 * - Optimistic UI updates (remove suggestions on accept/reject)
 * - Loading and error states
 *
 * Design System Compliance:
 * - Material UI components only (Container, Stack, Typography, CircularProgress, Box)
 * - Typography variants: h5 (title), body2 (description), body1 (content/error)
 * - Spacing: spacing={3} between sections, py: 4/6 for loading/empty states
 * - Container: maxWidth="md" (standard page width)
 * - Colors: text.secondary, error (theme palette only)
 * - No emojis, no custom styles
 * - Calm, neutral tone
 */
export function AiTagReviewPage() {
  const [recipes, setRecipes] = useState<RecipeWithPendingSuggestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load pending suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);

    const result = await getPendingTagSuggestionsForReview();

    if (result.success) {
      setRecipes(result.data);
    } else {
      setError(result.error.message);
    }

    setLoading(false);
  };

  // Accept individual suggestion
  const handleAccept = useCallback(async (suggestionId: AiTagSuggestionId) => {
    const result = await acceptAiTagSuggestion(suggestionId);

    if (result.success) {
      // Optimistically remove suggestion from list
      setRecipes(
        (prev) =>
          prev
            .map((recipe) => ({
              ...recipe,
              suggestions: recipe.suggestions.filter((s) => s.id !== suggestionId),
            }))
            .filter((recipe) => recipe.suggestions.length > 0), // Remove recipe if no pending suggestions
      );
    } else {
      // Show error (could use toast/snackbar in future)
      console.error('Failed to accept suggestion:', result.error);
    }
  }, []);

  // Reject individual suggestion
  const handleReject = useCallback(async (suggestionId: AiTagSuggestionId) => {
    const result = await rejectAiTagSuggestion(suggestionId);

    if (result.success) {
      // Optimistically remove suggestion from list
      setRecipes((prev) =>
        prev
          .map((recipe) => ({
            ...recipe,
            suggestions: recipe.suggestions.filter((s) => s.id !== suggestionId),
          }))
          .filter((recipe) => recipe.suggestions.length > 0),
      );
    } else {
      console.error('Failed to reject suggestion:', result.error);
    }
  }, []);

  // Accept all suggestions for a recipe
  const handleAcceptAll = useCallback(async (recipeVersionId: RecipeVersionId) => {
    const result = await acceptAllAiTagSuggestionsForRecipe(recipeVersionId);

    if (result.success) {
      // Optimistically remove recipe from list
      setRecipes((prev) => prev.filter((r) => r.recipe_version_id !== recipeVersionId));
    } else {
      console.error('Failed to accept all suggestions:', result.error);
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Typography variant="h5">Review AI Suggestions</Typography>
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        </Stack>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Typography variant="h5">Review AI Suggestions</Typography>
          <Typography variant="body1" color="error" sx={{ textAlign: 'center', py: 4 }}>
            {error}
          </Typography>
        </Stack>
      </Container>
    );
  }

  // Empty state
  if (recipes.length === 0) {
    return (
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Typography variant="h5">Review AI Suggestions</Typography>
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No pending tag suggestions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              AI-suggested tags will appear here for review
            </Typography>
          </Box>
        </Stack>
      </Container>
    );
  }

  // Main content
  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Typography variant="h5">Review AI Suggestions</Typography>
        <Typography variant="body2" color="text.secondary">
          Review and accept or reject AI-suggested tags for your recipes
        </Typography>

        <AiTagReviewList
          recipes={recipes}
          onAccept={handleAccept}
          onReject={handleReject}
          onAcceptAll={handleAcceptAll}
        />
      </Stack>
    </Container>
  );
}
