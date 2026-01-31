import type { RecipeStatus } from '@commontable/types';
import {
  LightbulbOutlined as SuggestedIcon,
  ShoppingCartOutlined as ToBuyIcon,
  RestaurantOutlined as ToCookIcon,
  CheckCircleOutline as CookedIcon,
} from '@mui/icons-material';
import { Chip } from '@mui/material';
import type React from 'react';

interface RecipeStatusChipProps {
  status: RecipeStatus;
  size?: 'small' | 'medium';
}

/**
 * RecipeStatusChip Component
 *
 * Displays recipe lifecycle status with color-coded Material UI chips.
 * Status workflow: suggested → to_buy → to_cook → cooked
 *
 * Design System Compliance:
 * - Material UI Chip component (approved)
 * - Material Icons (@mui/icons-material)
 * - Theme color palette only (no custom colors)
 * - Calm, neutral tone (no emojis)
 */
export function RecipeStatusChip({ status, size = 'small' }: RecipeStatusChipProps) {
  const statusConfig = getStatusConfig(status);

  return (
    <Chip
      icon={statusConfig.icon}
      label={statusConfig.label}
      color={statusConfig.color}
      variant="outlined"
      size={size}
    />
  );
}

/**
 * Get status configuration for chip display
 */
function getStatusConfig(status: RecipeStatus): {
  label: string;
  color: 'default' | 'primary' | 'success';
  icon: React.ReactElement;
} {
  switch (status) {
    case 'suggested': {
      return {
        label: 'Suggested',
        color: 'default',
        icon: <SuggestedIcon />,
      };
    }
    case 'to_buy': {
      return {
        label: 'To Buy',
        color: 'primary',
        icon: <ToBuyIcon />,
      };
    }
    case 'to_cook': {
      return {
        label: 'To Cook',
        color: 'primary',
        icon: <ToCookIcon />,
      };
    }
    case 'cooked': {
      return {
        label: 'Cooked',
        color: 'success',
        icon: <CookedIcon />,
      };
    }
    default: {
      const exhaustiveCheck: never = status;
      throw new Error(`Unhandled status: ${exhaustiveCheck}`);
    }
  }
}
