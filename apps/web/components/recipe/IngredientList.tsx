'use client';

import type { IngredientInput, UnitSystem } from '@commontable/types';
import { convertToSystem, roundQuantity } from '@commontable/types';
import { List, ListItem, ListItemText, Typography, Box } from '@mui/material';

interface IngredientListProps {
  ingredients: IngredientInput[];
  /** Optional unit system for display conversion (metric or imperial) */
  unitSystem?: UnitSystem;
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
export function IngredientList({ ingredients, unitSystem }: IngredientListProps) {
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
   * Format quantity for display (remove trailing zeros)
   */
  const formatQuantity = (qty: number): string => {
    if (Number.isInteger(qty)) {
      return qty.toString();
    }
    return qty.toFixed(2).replace(/\.?0+$/, '');
  };

  /**
   * Format ingredient display text with optional unit conversion
   */
  const formatIngredient = (ingredient: IngredientInput): string => {
    const parts: string[] = [];

    let displayQuantity = ingredient.quantity;
    let displayUnit = ingredient.unit;

    // Apply unit system conversion if specified
    if (unitSystem && ingredient.quantity !== undefined && ingredient.unit) {
      const converted = convertToSystem(ingredient.quantity, ingredient.unit, unitSystem);
      if (converted) {
        displayQuantity = roundQuantity(converted.value);
        displayUnit = converted.unit;
      }
    }

    if (displayQuantity !== undefined) {
      parts.push(formatQuantity(displayQuantity));
    }

    if (displayUnit) {
      parts.push(displayUnit);
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
