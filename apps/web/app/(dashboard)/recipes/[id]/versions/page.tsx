'use client';

import type { RecipeId } from '@commontable/types';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Container, Stack, Typography, Button, Box, CircularProgress } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';

import { VersionHistoryList } from '@/components/recipe/VersionHistoryList';
import { useRecipe } from '@/hooks/useRecipe';
import { useVersionHistory } from '@/hooks/useVersionHistory';

/**
 * Version History Page
 *
 * Displays the version history for a recipe:
 * - Back navigation to recipe detail
 * - Recipe name as context
 * - List of all versions (newest first)
 *
 * Follows DESIGN_SYSTEM.md:
 * - Container with maxWidth="md"
 * - Stack with spacing={3} for layout
 * - h5 for page title
 * - body2 for secondary text
 * - Outlined button for back navigation
 */
export default function VersionHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as RecipeId;

  const { recipe, loading: recipeLoading, error: recipeError } = useRecipe(recipeId);
  const { versions, loading: versionsLoading, error: versionsError } = useVersionHistory(recipeId);

  const handleBack = () => {
    router.push(`/recipes/${recipeId}`);
  };

  const handleVersionClick = (versionNumber: number) => {
    router.push(`/recipes/${recipeId}/versions/${versionNumber}`);
  };

  const loading = recipeLoading || versionsLoading;
  const error = recipeError || versionsError;

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
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ alignSelf: 'flex-start' }}
          >
            Back to recipe
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
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to recipe
        </Button>

        {/* Page header */}
        <Box>
          <Typography variant="h5">Version History</Typography>
          <Typography variant="body2" color="text.secondary">
            {recipe.title}
          </Typography>
        </Box>

        {/* Version list */}
        <VersionHistoryList versions={versions} onVersionClick={handleVersionClick} />
      </Stack>
    </Container>
  );
}
