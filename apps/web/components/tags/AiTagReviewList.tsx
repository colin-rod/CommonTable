'use client';

import type {
  RecipeWithPendingSuggestions,
  AiTagSuggestionId,
  RecipeId,
  RecipeVersionId,
} from '@commontable/types';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { Box, List, ListItem, ListItemButton, ListItemText, Collapse } from '@mui/material';
import { useState } from 'react';

import { AiSuggestedTagsList } from '../recipe/AiSuggestedTagsList';

export interface AiTagReviewListProps {
  /** Recipes with pending suggestions */
  recipes: RecipeWithPendingSuggestions[];
  /** Callback when user accepts a suggestion */
  onAccept: (suggestionId: AiTagSuggestionId) => Promise<void>;
  /** Callback when user rejects a suggestion */
  onReject: (suggestionId: AiTagSuggestionId) => Promise<void>;
  /** Callback when user accepts all suggestions for a recipe */
  onAcceptAll: (recipeVersionId: RecipeVersionId) => Promise<void>;
}

/**
 * Expandable list of recipes with pending AI tag suggestions
 *
 * Each recipe shows:
 * - Recipe title
 * - Count of pending tags
 * - Expand/collapse icon
 *
 * When expanded:
 * - AiSuggestedTagsList component (reused from recipe detail page)
 * - Accept/reject individual tags
 * - "Accept All" button for this recipe
 *
 * Design System Compliance:
 * - Material UI components only (List, ListItem, ListItemButton, ListItemText, Collapse, Box)
 * - Typography variants: primary (body1), secondary (body2)
 * - Spacing: pl/pr/pb: 2 (16px)
 * - Icons: @mui/icons-material (ExpandMore, ExpandLess)
 * - No custom colors (theme palette only)
 * - Calm, neutral tone (no emojis)
 */
export function AiTagReviewList({
  recipes,
  onAccept,
  onReject,
  onAcceptAll,
}: AiTagReviewListProps) {
  const [expandedRecipeId, setExpandedRecipeId] = useState<RecipeId | null>(null);

  const handleToggle = (recipeId: RecipeId) => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  return (
    <List>
      {recipes.map((recipe) => (
        <Box key={recipe.recipe_id}>
          {/* Recipe header - clickable to expand/collapse */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleToggle(recipe.recipe_id)}>
              <ListItemText
                primary={recipe.recipe_title}
                secondary={`${recipe.suggestions.length} pending tag${recipe.suggestions.length === 1 ? '' : 's'}`}
              />
              {expandedRecipeId === recipe.recipe_id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>

          {/* Expanded content: Tag suggestions */}
          <Collapse in={expandedRecipeId === recipe.recipe_id} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 2, pr: 2, pb: 2 }}>
              <AiSuggestedTagsList
                suggestions={recipe.suggestions}
                recipeVersionId={recipe.recipe_version_id}
                onAccept={onAccept}
                onReject={onReject}
                onAcceptAll={() => onAcceptAll(recipe.recipe_version_id)}
              />
            </Box>
          </Collapse>
        </Box>
      ))}
    </List>
  );
}
