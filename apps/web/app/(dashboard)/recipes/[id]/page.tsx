'use client';

import { RecipeImageService } from '@commontable/api-client';
import type { RecipeId } from '@commontable/types';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ForkIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import {
  Container,
  Stack,
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  IconButton,
} from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { useState, useCallback } from 'react';

import { deleteRecipe, logCookingEvent, forkRecipe } from '@/app/actions/recipe';
import { DeleteRecipeDialog } from '@/components/recipe/DeleteRecipeDialog';
import { ForkRecipeDialog } from '@/components/recipe/ForkRecipeDialog';
import { RecipeDetailView } from '@/components/recipe/RecipeDetailView';
import { useRecipe } from '@/hooks/useRecipe';

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

  const { recipe, primaryImage, loading, error, toggleFavorite, refresh } = useRecipe(recipeId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const [forking, setForking] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: '' });

  // Image service for getting signed URLs
  const recipeImageService = new RecipeImageService();

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

  const handleCookThis = async () => {
    try {
      const result = await logCookingEvent(recipeId);

      if (result.success) {
        setSnackbar({ open: true, message: 'Cooking logged successfully' });
        refresh(); // Refresh to update last_cooked_at
      } else {
        setSnackbar({ open: true, message: result.error.message });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to log cooking event' });
    }
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !recipe) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ alignSelf: 'flex-start' }}
          >
            Back to recipes
          </Button>
          <Typography variant="body1" color="error">
            {error?.message || 'Recipe not found'}
          </Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
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
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
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

        {/* Primary action */}
        <Box sx={{ pt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleCookThis} fullWidth>
            I cooked this
          </Button>
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
      </Stack>

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

      {/* Feedback snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
      />
    </Container>
  );
}
