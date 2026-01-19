'use client';

import { Container, Stack, Typography, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { RecipeImportResponse } from '@/app/actions/recipe-import';
import { RecipeImportPreview } from '@/components/recipe/RecipeImportPreview';
import { RecipeImportUrlInput } from '@/components/recipe/RecipeImportUrlInput';
import { useAuth } from '@/hooks/useAuth';

type ImportState = 'input' | 'preview' | 'creating';

/**
 * Recipe Import Page
 *
 * Two-screen flow for importing recipes from URLs:
 * 1. URL input screen - user enters recipe URL
 * 2. Preview screen - display parsed data with editable fields
 *
 * After successful creation, navigates to recipe detail page.
 *
 * Follows DESIGN_SYSTEM.md:
 * - Container maxWidth="md"
 * - Stack spacing={3}
 * - h5 for page title
 * - Auth-protected (redirects to login if not authenticated)
 */
export default function RecipeImportPage() {
  const router = useRouter();
  const { household, isAuthenticated, isLoading: authLoading } = useAuth();

  const [state, setState] = useState<ImportState>('input');
  const [previewData, setPreviewData] = useState<RecipeImportResponse | null>(null);

  // Wait for auth to initialize
  if (authLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  // Check household exists
  if (!household) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="body1" color="error">
          No household found. Please create or join a household first.
        </Typography>
      </Container>
    );
  }

  const handlePreviewSuccess = (preview: RecipeImportResponse) => {
    setPreviewData(preview);
    setState('preview');
  };

  const handleGoBack = () => {
    setPreviewData(null);
    setState('input');
  };

  const handleCreateSuccess = (recipeId: string) => {
    setState('creating');
    router.push(`/recipes/${recipeId}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h5">Import Recipe from URL</Typography>

        {state === 'input' && <RecipeImportUrlInput onSuccess={handlePreviewSuccess} />}

        {state === 'preview' && previewData && (
          <RecipeImportPreview
            preview={previewData}
            householdId={household.id}
            onSuccess={handleCreateSuccess}
            onGoBack={handleGoBack}
          />
        )}

        {state === 'creating' && (
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography variant="body2">Redirecting to recipe...</Typography>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
