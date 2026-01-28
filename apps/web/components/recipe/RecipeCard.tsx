'use client';

import type { Recipe, RecipeId } from '@commontable/types';
import { Star as StarIcon, Check as CheckIcon } from '@mui/icons-material';
import { Card, CardMedia, CardContent, CardActions, Button, Typography, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

interface RecipeCardProps {
  recipe: Recipe;
  imageUrl?: string;
  onAddToShortlist: (recipeId: RecipeId) => void;
  isInShortlist: boolean;
}

export function RecipeCard({ recipe, imageUrl, onAddToShortlist, isInShortlist }: RecipeCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/recipes/${recipe.id}`);
  };

  const handleAddToShortlist = (e: MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation
    if (!isInShortlist) {
      onAddToShortlist(recipe.id);
    }
  };

  const formatLastCooked = (date: Date | null): string => {
    if (!date) return 'Never cooked';

    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const displayTags = recipe.tags.slice(0, 3).join(', ');
  const displayImage = imageUrl || '/images/recipe-placeholder.png';

  return (
    <Card
      role="article"
      onClick={handleCardClick}
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={displayImage}
        alt={recipe.title}
        sx={{ objectFit: 'cover' }}
      />

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body1" component="h2" gutterBottom>
          {recipe.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {recipe.rolling_score !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon fontSize="small" color="primary" />
              <Typography variant="body2" color="text.secondary">
                {recipe.rolling_score.toFixed(1)}
              </Typography>
            </Box>
          )}
          {displayTags && (
            <Typography variant="body2" color="text.secondary">
              {recipe.rolling_score !== null && '| '}
              {displayTags}
            </Typography>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary">
          Last cooked: {formatLastCooked(recipe.last_cooked_at)}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <Button
          variant={isInShortlist ? 'contained' : 'outlined'}
          color="primary"
          size="small"
          onClick={handleAddToShortlist}
          startIcon={isInShortlist ? <CheckIcon /> : undefined}
          disabled={isInShortlist}
          aria-label={isInShortlist ? 'Added to shortlist' : 'Add to shortlist'}
        >
          {isInShortlist ? 'Added' : 'Add to Shortlist'}
        </Button>
      </CardActions>
    </Card>
  );
}
