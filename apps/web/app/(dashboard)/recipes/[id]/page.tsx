'use client';

import { RecipeImageService } from '@commontable/api-client';
import type {
  RecipeId,
  CookingEvent,
  AiTagSuggestionWithTag,
  AiTagSuggestionId,
} from '@commontable/types';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ForkIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import {
  Stack,
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  IconButton,
} from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { useState, useCallback, useEffect, useMemo } from 'react';

import {
  getPendingAiTagSuggestions,
  acceptAiTagSuggestion,
  rejectAiTagSuggestion,
  acceptAllAiTagSuggestions,
} from '@/app/actions/aiTagSuggestion';
import { getCookingEventsByRecipe } from '@/app/actions/cookingEvent';
import { deleteRecipe, forkRecipe } from '@/app/actions/recipe';
import { CookingHistoryList } from '@/components/cooking/CookingHistoryList';
import { LogMealDialog } from '@/components/cooking/LogMealDialog';
import { AiSuggestedTagsList } from '@/components/recipe/AiSuggestedTagsList';
import { DeleteRecipeDialog } from '@/components/recipe/DeleteRecipeDialog';
import { ForkRecipeDialog } from '@/components/recipe/ForkRecipeDialog';
import { RecipeDetailView } from '@/components/recipe/RecipeDetailView';
import { useMealPlan } from '@/hooks/useMealPlan';
import { useRecipe } from '@/hooks/useRecipe';
import { createClient } from '@/lib/supabase/client';

/**
 * Recipe Detail Page
 *
 * Displays full recipe details with:
 * - Back navigation
 * - Edit button (secondary)
 * - Delete button (destructive)
 * - "I cooked this" button (primary)
 * - Favorite toggle
 *
 * Follows DESIGN_SYSTEM.md:
 * - Container with maxWidth="md"
 * - Stack with spacing={3} for layout
 * - h5 for page title
 * - One primary button ("I cooked this")
 * - Snackbar for feedback
 */
export default function RecipeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as RecipeId;

  const { addToMealPlan, hasRecipe } = useMealPlan();
  const { recipe, primaryImage, loading, error, toggleFavorite, refresh } = useRecipe(recipeId);
  const isInMealPlan = hasRecipe(recipeId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const [forking, setForking] = useState(false);
  const [logMealDialogOpen, setLogMealDialogOpen] = useState(false);
  const [cookingEvents, setCookingEvents] = useState<CookingEvent[]>([]);
  const [cookingEventsLoading, setCookingEventsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: '' });
  const [aiSuggestions, setAiSuggestions] = useState<AiTagSuggestionWithTag[]>([]);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(true);

  // Image service for getting signed URLs
  const supabase = useMemo(() => createClient(), []);
  const recipeImageService = useMemo(() => new RecipeImageService(supabase), [supabase]);

  // Fetch cooking events for this recipe
  useEffect(() => {
    const fetchCookingEvents = async () => {
      try {
        setCookingEventsLoading(true);
        const result = await getCookingEventsByRecipe(recipeId);
        if (result.success) {
          setCookingEvents(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch cooking events:', error);
      } finally {
        setCookingEventsLoading(false);
      }
    };

    fetchCookingEvents();
  }, [recipeId]);

  // Fetch AI tag suggestions
  useEffect(() => {
    const fetchAiSuggestions = async () => {
      if (!recipe?.current_version_id) return;

      try {
        setAiSuggestionsLoading(true);
        const result = await getPendingAiTagSuggestions(recipe.current_version_id);
        if (result.success) {
          setAiSuggestions(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch AI suggestions:', error);
      } finally {
        setAiSuggestionsLoading(false);
      }
    };

    fetchAiSuggestions();
  }, [recipe?.current_version_id]);

  const handleBack = () => {
    router.push('/recipes');
  };

  const handleEdit = () => {
    router.push(`/recipes/${recipeId}/edit`);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      const result = await deleteRecipe(recipeId);

      if (result.success) {
        router.push('/recipes');
      } else {
        setSnackbar({ open: true, message: result.error.message });
        setDeleteDialogOpen(false);
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete recipe' });
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleForkClick = () => {
    setForkDialogOpen(true);
  };

  const handleForkConfirm = async (newTitle: string) => {
    try {
      setForking(true);
      const result = await forkRecipe({
        parentRecipeId: recipeId,
        newTitle,
      });

      if (result.success) {
        // Navigate to the forked recipe
        router.push(`/recipes/${result.data.id}`);
      } else {
        setSnackbar({ open: true, message: result.error.message });
        setForkDialogOpen(false);
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to fork recipe' });
      setForkDialogOpen(false);
    } finally {
      setForking(false);
    }
  };

  const handleForkCancel = () => {
    setForkDialogOpen(false);
  };

  const handleLogMeal = () => {
    setLogMealDialogOpen(true);
  };

  const handleAddToMealPlan = useCallback(async () => {
    try {
      await addToMealPlan(recipeId);
    } catch {
      setSnackbar({ open: true, message: 'Failed to add to meal plan' });
    }
  }, [addToMealPlan, recipeId]);

  const handleLogMealClose = async () => {
    setLogMealDialogOpen(false);
    // Refresh cooking events after logging
    try {
      const result = await getCookingEventsByRecipe(recipeId);
      if (result.success) {
        setCookingEvents(result.data);
      }
    } catch (error) {
      console.error('Failed to refresh cooking events:', error);
    }
    // Refresh recipe to update last_cooked_at and rolling_score
    refresh();
  };

  const handleFavoriteClick = useCallback(async () => {
    try {
      await toggleFavorite();
    } catch {
      setSnackbar({ open: true, message: 'Failed to update favorite' });
    }
  }, [toggleFavorite]);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAcceptSuggestion = useCallback(
    async (suggestionId: AiTagSuggestionId) => {
      try {
        const result = await acceptAiTagSuggestion(suggestionId);
        if (result.success) {
          // Remove from local state
          setAiSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
          refresh(); // Refresh recipe to show updated tags
        } else {
          setSnackbar({ open: true, message: result.error.message });
        }
      } catch {
        setSnackbar({ open: true, message: 'Failed to accept suggestion' });
      }
    },
    [refresh],
  );

  const handleRejectSuggestion = useCallback(
    async (suggestionId: AiTagSuggestionId) => {
      try {
        const result = await rejectAiTagSuggestion(suggestionId);
        if (result.success) {
          // Remove from local state
          setAiSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
          refresh(); // Refresh recipe to show removed tags
        } else {
          setSnackbar({ open: true, message: result.error.message });
        }
      } catch {
        setSnackbar({ open: true, message: 'Failed to reject suggestion' });
      }
    },
    [refresh],
  );

  const handleAcceptAllSuggestions = useCallback(async () => {
    if (!recipe?.current_version_id) return;

    try {
      const result = await acceptAllAiTagSuggestions(recipe.current_version_id);
      if (result.success) {
        // Clear all suggestions from local state
        setAiSuggestions([]);
        refresh(); // Refresh recipe to show updated tags
      } else {
        setSnackbar({ open: true, message: result.error.message });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to accept all suggestions' });
    }
  }, [recipe?.current_version_id, refresh]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !recipe) {
    return (
      <Stack spacing={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ alignSelf: 'flex-start' }}>
          Back to recipes
        </Button>
        <Typography variant="body1" color="error">
          {error?.message || 'Recipe not found'}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Back navigation */}
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ alignSelf: 'flex-start' }}>
        Back to recipes
      </Button>

      {/* Header with title and actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5">{recipe.title}</Typography>
          <IconButton
            onClick={handleFavoriteClick}
            aria-label={recipe.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {recipe.is_favorite ? <StarIcon color="primary" /> : <StarBorderIcon />}
          </IconButton>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant={isInMealPlan ? 'outlined' : 'contained'}
            color="primary"
            onClick={handleAddToMealPlan}
            disabled={isInMealPlan}
            aria-label={isInMealPlan ? 'Added to meal plan' : 'Add to meal plan'}
          >
            {isInMealPlan ? 'Added' : 'Add to Meal Plan'}
          </Button>
          <Button variant="outlined" color="primary" startIcon={<EditIcon />} onClick={handleEdit}>
            Edit
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ForkIcon />}
            onClick={handleForkClick}
          >
            Fork
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => router.push(`/recipes/${recipeId}/versions`)}
          >
            View version history
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      {/* Recipe content */}
      <RecipeDetailView
        recipe={recipe}
        primaryImage={primaryImage}
        getImageUrl={(image) => recipeImageService.getSignedUrl(image.storage_path)}
      />

      {/* AI Suggested Tags */}
      {!aiSuggestionsLoading && aiSuggestions.length > 0 && recipe.current_version_id && (
        <AiSuggestedTagsList
          suggestions={aiSuggestions}
          recipeVersionId={recipe.current_version_id}
          onAccept={handleAcceptSuggestion}
          onReject={handleRejectSuggestion}
          onAcceptAll={handleAcceptAllSuggestions}
        />
      )}

      {/* Cooking History */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Cooking History
        </Typography>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Button variant="contained" color="primary" onClick={handleLogMeal} fullWidth>
            Log Meal
          </Button>
        </Stack>
        {cookingEventsLoading ? (
          <CircularProgress size={24} />
        ) : (
          <CookingHistoryList events={cookingEvents} />
        )}
      </Box>

      {/* Version history link */}
      <Box>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => router.push(`/recipes/${recipeId}/versions`)}
        >
          View version history
        </Button>
      </Box>

      {/* Delete confirmation dialog */}
      <DeleteRecipeDialog
        open={deleteDialogOpen}
        recipeName={recipe.title}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Fork recipe dialog */}
      <ForkRecipeDialog
        open={forkDialogOpen}
        recipeName={recipe.title}
        loading={forking}
        onConfirm={handleForkConfirm}
        onCancel={handleForkCancel}
      />

      {/* Log Meal Dialog */}
      {recipe.current_version_id && (
        <LogMealDialog
          open={logMealDialogOpen}
          onClose={handleLogMealClose}
          recipeId={recipe.id}
          recipeVersionId={recipe.current_version_id}
          recipeTitle={recipe.title}
        />
      )}

      {/* Feedback snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
      />
    </Stack>
  );
}
