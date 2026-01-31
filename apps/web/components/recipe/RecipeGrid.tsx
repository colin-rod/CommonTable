'use client';

import type { Recipe, RecipeId } from '@commontable/types';
import { Box, CircularProgress, Grid2 as Grid, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';

import { RecipeCard } from './RecipeCard';

interface RecipeGridProps {
  recipes: Recipe[];
  onAddToShortlist: (recipeId: RecipeId) => void;
  shortlistedRecipeIds: RecipeId[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function RecipeGrid({
  recipes,
  onAddToShortlist,
  shortlistedRecipeIds,
  loading = false,
  hasMore = false,
  onLoadMore,
}: RecipeGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: observe sentinel element
  useEffect(() => {
    if (!hasMore || !onLoadMore || loading) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, onLoadMore, loading]);

  // Empty state
  if (recipes.length === 0 && !loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="body1" color="text.secondary">
          No recipes found. Try adjusting your filters or add a new recipe.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {recipes.map((recipe) => (
          <Grid key={recipe.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <RecipeCard
              recipe={recipe}
              onAddToShortlist={onAddToShortlist}
              isInShortlist={shortlistedRecipeIds.includes(recipe.id)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <Box ref={sentinelRef} data-testid="scroll-sentinel" sx={{ height: '20px', mt: 4 }} />
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress aria-label="Loading more recipes" />
        </Box>
      )}
    </Box>
  );
}
