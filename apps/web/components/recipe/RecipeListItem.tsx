'use client';

import type { Recipe, RecipeId } from '@commontable/types';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { ListItem, ListItemButton, ListItemText, IconButton, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

interface RecipeListItemProps {
  recipe: Recipe;
  onToggleFavorite: (id: RecipeId) => void;
}

/**
 * RecipeListItem Component
 *
 * Displays a single recipe in a list with:
 * - Title (primary text)
 * - Last cooked date (secondary text)
 * - Favorite toggle button
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses ListItemButton for full-row clickability
 * - Icon-only button for secondary action (favorite)
 * - No emojis, calm neutral tone
 */
export function RecipeListItem({ recipe, onToggleFavorite }: RecipeListItemProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/recipes/${recipe.id}`);
  };

  const handleFavoriteClick = (e: MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking favorite
    onToggleFavorite(recipe.id);
  };

  // Format last cooked date
  const formatLastCooked = (date: Date | null): string => {
    if (!date) return 'Never cooked';

    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Cooked today';
    if (diffDays === 1) return 'Cooked yesterday';
    if (diffDays < 7) return `Cooked ${diffDays} days ago`;
    if (diffDays < 30) return `Cooked ${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `Cooked ${Math.floor(diffDays / 30)} months ago`;
    return `Cooked ${Math.floor(diffDays / 365)} years ago`;
  };

  // Build secondary text
  const secondaryParts: string[] = [formatLastCooked(recipe.last_cooked_at)];
  if (recipe.tags.length > 0) {
    secondaryParts.push(recipe.tags.slice(0, 3).join(', '));
  }

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <IconButton
          edge="end"
          onClick={handleFavoriteClick}
          aria-label={recipe.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {recipe.is_favorite ? <StarIcon color="primary" /> : <StarBorderIcon />}
        </IconButton>
      }
    >
      <ListItemButton onClick={handleClick}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <ListItemText
            primary={recipe.title}
            secondary={secondaryParts.join(' · ')}
            sx={{ mr: 6 }} // Space for the favorite button
          />
        </Box>
      </ListItemButton>
    </ListItem>
  );
}
