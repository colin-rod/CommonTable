'use client';

import CalendarIcon from '@mui/icons-material/CalendarToday';
import ExploreIcon from '@mui/icons-material/Explore';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import RequestIcon from '@mui/icons-material/RequestPage';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  AppBar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactElement, ReactNode, MouseEvent } from 'react';
import { useState } from 'react';

import { WelcomeDialog } from '@/components/onboarding/WelcomeDialog';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';

/**
 * Navigation item interface
 */
interface NavItem {
  label: string;
  href: Route;
  icon: ReactElement;
}

/**
 * Navigation items configuration
 */
const navItems: NavItem[] = [
  {
    label: 'Discovery',
    href: '/discovery',
    icon: <ExploreIcon />,
  },
  {
    label: 'Recipes',
    href: '/recipes',
    icon: <RestaurantIcon />,
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: <CalendarIcon />,
  },
  {
    label: 'Tags',
    href: '/tags/review',
    icon: <LocalOfferIcon />,
  },
  {
    label: 'Requests',
    href: '/requests',
    icon: <RequestIcon />,
  },
  {
    label: 'Settings',
    href: '/settings/household',
    icon: <SettingsIcon />,
  },
];

/**
 * Drawer width constant
 */
const DRAWER_WIDTH = 240;

/**
 * DashboardLayout Component
 * Provides persistent navigation with AppBar and responsive Drawer
 *
 * Desktop: Permanent sidebar navigation
 * Mobile: Temporary drawer with hamburger menu
 *
 * Design System Compliance:
 * - Typography: h6 for app title, body1 for nav links
 * - Spacing: 2 (16px) between nav items
 * - Icons: Material Icons only
 * - Buttons: IconButton for secondary actions
 * - Colors: Theme palette only
 */
export function DashboardLayout({
  children,
  pendingTagsCount = 0,
  pendingRequestsCount = 0,
}: {
  children: ReactNode;
  pendingTagsCount?: number;
  pendingRequestsCount?: number;
}) {
  const { user, household, householdRole, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Onboarding state
  const { showWelcome, completeOnboarding, skipOnboarding } = useOnboarding();

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // User menu state
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  /**
   * Toggle mobile drawer
   */
  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  /**
   * Close mobile drawer (called when navigation link clicked)
   */
  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  /**
   * Open user menu
   */
  const handleUserMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  /**
   * Close user menu
   */
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    handleUserMenuClose();
    await signOut();
    router.push('/auth/login');
  };

  /**
   * Handle profile navigation
   */
  const handleProfile = () => {
    handleUserMenuClose();
    router.push('/settings/profile' as Route);
  };

  /**
   * Handle welcome dialog completion (navigate to add recipe)
   */
  const handleWelcomeComplete = () => {
    completeOnboarding();
    router.push('/recipes/new');
  };

  /**
   * Handle welcome dialog close (skip)
   */
  const handleWelcomeClose = () => {
    skipOnboarding();
  };

  /**
   * Drawer content (shared between mobile and desktop)
   */
  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          CommonTable
        </Typography>
      </Toolbar>
      <List>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          // Determine badge count for this item
          const badgeCount =
            item.label === 'Tags'
              ? pendingTagsCount
              : item.label === 'Requests'
                ? pendingRequestsCount
                : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              passHref
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <ListItemButton
                onClick={handleDrawerClose}
                selected={isActive}
                aria-current={isActive ? 'page' : undefined}
              >
                <Box sx={{ mr: 2, display: 'flex', color: 'inherit' }}>{item.icon}</Box>
                <Badge badgeContent={badgeCount} color="error">
                  <ListItemText primary={item.label} />
                </Badge>
              </ListItemButton>
            </Link>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Welcome Dialog (Onboarding) */}
      <WelcomeDialog
        open={showWelcome}
        onClose={handleWelcomeClose}
        onComplete={handleWelcomeComplete}
      />

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {/* Hamburger menu (mobile only) */}
          <IconButton
            color="inherit"
            aria-label="Open navigation menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* User menu */}
          {user && (
            <>
              <IconButton color="inherit" aria-label="User menu" onClick={handleUserMenuOpen}>
                <PersonIcon />
              </IconButton>
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
              >
                {/* User info section */}
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="body1">{user.profile.display_name || user.email}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>

                <Divider />

                {/* Household info section */}
                {household && (
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Household
                    </Typography>
                    <Typography variant="body1">{household.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Role: {householdRole || 'No role'}
                    </Typography>
                  </Box>
                )}

                {household && <Divider />}

                {/* Actions */}
                <MenuItem onClick={handleProfile}>Profile</MenuItem>
                <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer - Mobile (temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawer}
      </Drawer>

      {/* Drawer - Desktop (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            position: 'static',
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          overflow: 'auto',
          minWidth: 0,
        }}
      >
        {/* Toolbar spacer to prevent content from being hidden under AppBar */}
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
