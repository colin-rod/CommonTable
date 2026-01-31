'use client';

import type { RecipeSuggestion } from '@commontable/types';
import {
  Container,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getRecipeSuggestions } from '@/app/actions/recipeSuggestion';

const BADGE_LABELS: Record<string, string> = {
  Favorite: 'Favorite',
  'Top Rated': 'Top Rated',
  Classic: 'Classic',
  'Try Again': 'Try Again',
  'New Recipe': 'New Recipe',
};

/**
 * RecipeSuggestionsPage component
 * Displays personalized recipe recommendations for the household
 */
export function RecipeSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Get general suggestions (no meal slot context)
        const result = await getRecipeSuggestions({}, undefined, 20);

        if (result.success) {
          setSuggestions(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (err) {
        console.error('Failed to load suggestions:', err);
        setError('Failed to load suggestions');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipes/${recipeId}`);
  };

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Typography variant="h5">Recipe Suggestions</Typography>
        <Typography variant="body2" color="text.secondary">
          Personalized recipe recommendations based on your household's preferences
        </Typography>

        {loading && (
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography variant="body2">Loading suggestions...</Typography>
          </Stack>
        )}

        {error && (
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        )}

        {!loading && !error && suggestions.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No suggestions found
          </Typography>
        )}

        {!loading && !error && suggestions.length > 0 && (
          <List>
            {suggestions.map((suggestion) => (
              <ListItem key={suggestion.recipe.id} disablePadding>
                <ListItemButton onClick={() => handleRecipeClick(suggestion.recipe.id)}>
                  <ListItemText primary={suggestion.recipe.title} />
                  {suggestion.badge && (
                    <Chip
                      label={BADGE_LABELS[suggestion.badge] || suggestion.badge}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Stack>
    </Container>
  );
}
