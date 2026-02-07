'use client';

import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LinkIcon from '@mui/icons-material/Link';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

/**
 * QuickActionsDropdown component
 * Dropdown menu with 3 core actions: Add Recipe, Plan Meals, and Browse Recipes
 *
 * Used in the navbar AppBar as a dropdown menu
 */
interface QuickActionsDropdownProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export function QuickActionsDropdown({ anchorEl, open, onClose }: QuickActionsDropdownProps) {
  const router = useRouter();

  const handleNavigate = (path: Route) => {
    onClose();
    router.push(path);
  };

  return (
    <Menu
      id="quick-actions-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <MenuItem onClick={() => handleNavigate('/recipes/new' as Route)}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>
        <ListItemText>Add Recipe</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleNavigate('/recipes/import' as Route)}>
        <ListItemIcon>
          <LinkIcon />
        </ListItemIcon>
        <ListItemText>Import from URL</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleNavigate('/meal-plan' as Route)}>
        <ListItemIcon>
          <CalendarTodayIcon />
        </ListItemIcon>
        <ListItemText>Open Meal Plan</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleNavigate('/recipes' as Route)}>
        <ListItemIcon>
          <RestaurantIcon />
        </ListItemIcon>
        <ListItemText>Browse All Recipes</ListItemText>
      </MenuItem>
    </Menu>
  );
}
