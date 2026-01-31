import type { RecipeSuggestion, RecipeId } from '@commontable/types';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Typography,
  Box,
  Stack,
} from '@mui/material';

/**
 * Props for SuggestedRecipesList component
 */
export interface SuggestedRecipesListProps {
  suggestions: RecipeSuggestion[];
  onSelectRecipe: (recipeId: RecipeId) => void;
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * SuggestedRecipesList Component
 *
 * Displays a list of suggested recipes with badges and matching tags
 *
 * Design System Compliance:
 * - Uses List, ListItem, ListItemButton, ListItemText (Material UI)
 * - Chip for badges (size="small")
 * - CircularProgress for loading state
 * - Typography for empty state
 */
export function SuggestedRecipesList({
  suggestions,
  onSelectRecipe,
  loading = false,
  emptyMessage = 'No suggestions available',
}: SuggestedRecipesListProps) {
  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Empty state
  if (suggestions.length === 0) {
    return (
      <Box sx={{ padding: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  // List of suggestions
  return (
    <List>
      {suggestions.map((suggestion) => (
        <ListItem key={suggestion.recipe.id} disablePadding>
          <ListItemButton onClick={() => onSelectRecipe(suggestion.recipe.id)}>
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body1">{suggestion.recipe.title}</Typography>
                  <Chip
                    label={suggestion.badge}
                    size="small"
                    color={getBadgeColor(suggestion.badge)}
                    aria-label={`${suggestion.badge} recipe`}
                  />
                </Stack>
              }
              secondary={
                suggestion.matchingTags.length > 0
                  ? `Matches: ${suggestion.matchingTags.join(', ')}`
                  : 'No matches'
              }
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

/**
 * Get MUI color for badge based on badge type
 */
function getBadgeColor(
  badge: string,
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (badge) {
    case 'Favorite':
      return 'primary';
    case 'Top Rated':
      return 'primary';
    case 'New Recipe':
      return 'default';
    case 'Try Again':
      return 'secondary';
    case 'Classic':
      return 'default';
    default:
      return 'default';
  }
}
