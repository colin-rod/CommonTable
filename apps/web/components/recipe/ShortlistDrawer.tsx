'use client';

import { Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';

import { useShortlistStore } from '@/stores/useShortlistStore';

interface ShortlistDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ShortlistDrawer({ open, onClose }: ShortlistDrawerProps) {
  const router = useRouter();
  const { items, loading, error, remove } = useShortlistStore();

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipes/${recipeId}`);
    onClose(); // Close drawer after navigation
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Shortlist {items.length > 0 && `(${items.length})`}</Typography>
          <IconButton onClick={onClose} aria-label="Close shortlist">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          </Box>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No recipes in shortlist
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add recipes from the discovery panel to plan your meals
            </Typography>
          </Box>
        )}

        {/* Recipe List */}
        {!loading && !error && items.length > 0 && (
          <List>
            {items.map((item) => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label={`Remove ${item.recipe.title} from shortlist`}
                    onClick={() => remove(item.recipe.id)}
                  >
                    <CloseIcon />
                  </IconButton>
                }
              >
                <ListItemButton onClick={() => handleRecipeClick(item.recipe.id)}>
                  <ListItemText
                    primary={item.recipe.title}
                    secondary={`Added by ${item.addedBy.name}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
}
