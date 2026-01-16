'use client';

import type { IngredientInput } from '@commontable/types';
import { List, ListItem, ListItemText, Typography, Box } from '@mui/material';

interface IngredientListProps {
  ingredients: IngredientInput[];
}

/**
 * IngredientList Component
 *
 * Displays recipe ingredients with:
 * - Quantity and unit (if provided)
 * - Ingredient name
 * - Notes (if provided)
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses List as primary pattern
 * - body1 for ingredient text
 * - body2 for notes
 */
export function IngredientList({ ingredients }: IngredientListProps) {
  if (ingredients.length === 0) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No ingredients listed
        </Typography>
      </Box>
    );
  }

  /**
   * Format ingredient display text
   */
  const formatIngredient = (ingredient: IngredientInput): string => {
    const parts: string[] = [];

    if (ingredient.quantity !== undefined) {
      // Format quantity (remove trailing zeros)
      const qty = Number.isInteger(ingredient.quantity)
        ? ingredient.quantity.toString()
        : ingredient.quantity.toFixed(2).replace(/\.?0+$/, '');
      parts.push(qty);
    }

    if (ingredient.unit) {
      parts.push(ingredient.unit);
    }

    parts.push(ingredient.name);

    return parts.join(' ');
  };

  return (
    <List disablePadding>
      {ingredients.map((ingredient, index) => (
        <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
          <ListItemText
            primary={formatIngredient(ingredient)}
            secondary={ingredient.notes || undefined}
            primaryTypographyProps={{ variant: 'body1' }}
            secondaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
      ))}
    </List>
  );
}
