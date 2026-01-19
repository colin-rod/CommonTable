'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { fetchRecipePreview, type RecipeImportResponse } from '@/app/actions/recipe-import';

/**
 * URL validation schema - requires HTTPS
 */
const UrlInputSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .url('Please enter a valid URL')
    .refine((url) => url.startsWith('https://'), {
      message: 'URL must use HTTPS',
    }),
});

type UrlInputFormValues = z.infer<typeof UrlInputSchema>;

export interface RecipeImportUrlInputProps {
  onSuccess: (preview: RecipeImportResponse) => void;
}

/**
 * URL input component for recipe import flow.
 *
 * Validates URL format (HTTPS required), calls fetchRecipePreview server action,
 * and displays loading/error states.
 *
 * Design System Compliance:
 * - Typography variant="h6" for section header
 * - Single primary button ("Import Recipe")
 * - Stack spacing={3}
 * - Calm, neutral tone
 */
export function RecipeImportUrlInput({ onSuccess }: RecipeImportUrlInputProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UrlInputFormValues>({
    resolver: zodResolver(UrlInputSchema),
  });

  const onSubmit = async (data: UrlInputFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchRecipePreview(data.url);

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      onSuccess(result.data);
    } catch (err) {
      setError('Failed to fetch recipe. Please try again.');
      console.error('Import error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Import Recipe from URL</Typography>

      <Typography variant="body2" color="text.secondary">
        Enter the URL of a recipe from a supported website. We'll extract the recipe details for you
        to review and edit.
      </Typography>

      {error && (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      )}

      <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
        <TextField
          {...register('url')}
          label="Recipe URL"
          placeholder="https://example.com/recipe"
          fullWidth
          error={!!errors.url}
          helperText={errors.url?.message || 'Must be a valid HTTPS URL'}
          disabled={loading}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          fullWidth={false}
          sx={{ alignSelf: 'flex-start' }}
        >
          {loading ? <CircularProgress size={24} /> : 'Import Recipe'}
        </Button>
      </Stack>
    </Stack>
  );
}
