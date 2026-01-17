'use client';

import type { RecipeId } from '@commontable/types';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  Container,
  Stack,
  Typography,
  Button,
  Box,
  CircularProgress,
  Chip,
  Snackbar,
} from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';

import { restoreRecipeVersion } from '@/app/actions/recipe';
import { RestoreVersionDialog } from '@/components/recipe/RestoreVersionDialog';
import { VersionDetailView } from '@/components/recipe/VersionDetailView';
import { useRecipe } from '@/hooks/useRecipe';
import { useVersion } from '@/hooks/useVersion';
import { useVersionHistory } from '@/hooks/useVersionHistory';

/**
 * Version Detail Page
 *
 * Displays the content of a specific recipe version:
 * - Back navigation to version history
 * - Version number with "(Current)" badge if applicable
 * - Full version content (ingredients, steps, notes)
 * - "Restore this version" button (for non-current versions)
 *
 * Follows DESIGN_SYSTEM.md:
 * - Container with maxWidth="md"
 * - Stack with spacing={3} for layout
 * - h5 for page title
 * - Outlined buttons
 */
export default function VersionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as RecipeId;
  const versionNumber = parseInt(params.versionNumber as string, 10);

  const { recipe, loading: recipeLoading, error: recipeError } = useRecipe(recipeId);
  const {
    version,
    loading: versionLoading,
    error: versionError,
  } = useVersion(recipeId, versionNumber);
  const { versions, loading: historyLoading } = useVersionHistory(recipeId);

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Find the current version entry to check if this version is current
  const currentVersionEntry = versions.find((v) => v.is_current);
  const isCurrentVersion = currentVersionEntry?.version_number === versionNumber;

  // Find the editor name for this version
  const versionEntry = versions.find((v) => v.version_number === versionNumber);
  const editorName = versionEntry?.created_by_name;

  const handleBack = () => {
    router.push(`/recipes/${recipeId}/versions`);
  };

  const handleRestoreClick = () => {
    setRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = async () => {
    try {
      setRestoring(true);
      const result = await restoreRecipeVersion(recipeId, versionNumber);

      if (result.success) {
        setSnackbar({ open: true, message: 'Version restored successfully' });
        setRestoreDialogOpen(false);
        // Navigate to the new current version (which will be a new version number)
        router.push(`/recipes/${recipeId}/versions`);
      } else {
        setSnackbar({ open: true, message: result.error.message });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to restore version' });
    } finally {
      setRestoring(false);
    }
  };

  const handleRestoreCancel = () => {
    setRestoreDialogOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const loading = recipeLoading || versionLoading || historyLoading;
  const error = recipeError || versionError;

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !recipe || !version) {
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
            Back to version history
          </Button>
          <Typography variant="body1" color="error">
            {error?.message || 'Version not found'}
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
          Back to version history
        </Button>

        {/* Page header */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h5">Version {versionNumber}</Typography>
            {isCurrentVersion && (
              <Chip label="Current" size="small" color="primary" variant="outlined" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {recipe.title}
          </Typography>
        </Box>

        {/* Version content */}
        <VersionDetailView version={version} editorName={editorName} />

        {/* Restore button (only for non-current versions) */}
        {!isCurrentVersion && (
          <Box sx={{ pt: 2 }}>
            <Button variant="outlined" color="primary" onClick={handleRestoreClick}>
              Restore this version
            </Button>
          </Box>
        )}
      </Stack>

      {/* Restore confirmation dialog */}
      <RestoreVersionDialog
        open={restoreDialogOpen}
        recipeName={recipe.title}
        versionNumber={versionNumber}
        loading={restoring}
        onConfirm={handleRestoreConfirm}
        onCancel={handleRestoreCancel}
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
