import { List, ListItem, Box, Skeleton, Stack } from '@mui/material';

/**
 * RecipeListSkeleton Props
 */
export interface RecipeListSkeletonProps {
  /**
   * Number of skeleton items to render
   * @default 5
   */
  count?: number;
}

/**
 * RecipeListSkeleton Component
 * Loading skeleton that mimics RecipeListItem structure
 *
 * Features:
 * - Circular skeleton for avatar (left)
 * - Two text skeletons for title and subtitle
 * - Rectangular skeleton for icon area (right)
 * - Configurable number of items
 *
 * Design System Compliance:
 * - List component
 * - Skeleton variants: circular, text, rectangular
 * - Spacing matches RecipeListItem
 */
export function RecipeListSkeleton({ count = 5 }: RecipeListSkeletonProps) {
  return (
    <List aria-label="Loading recipes">
      {Array.from({ length: count }).map((_, index) => (
        <ListItem key={index} sx={{ gap: 2 }}>
          {/* Avatar skeleton (left) */}
          <Skeleton variant="circular" width={40} height={40} />

          {/* Text content skeleton (middle) */}
          <Box sx={{ flex: 1 }}>
            <Stack spacing={0.5}>
              {/* Title skeleton */}
              <Skeleton variant="text" width="60%" height={24} />
              {/* Subtitle skeleton */}
              <Skeleton variant="text" width="40%" height={20} />
            </Stack>
          </Box>

          {/* Icon skeleton (right) */}
          <Skeleton variant="rectangular" width={24} height={24} />
        </ListItem>
      ))}
    </List>
  );
}
