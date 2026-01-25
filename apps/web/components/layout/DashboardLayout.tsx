'use client';

import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Restaurant as RestaurantIcon,
  CalendarToday as CalendarIcon,
  RequestPage as RequestIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
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
export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
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
    router.push('/settings/profile');
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
                <ListItemText primary={item.label} />
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
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
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
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        {/* Toolbar spacer to prevent content from being hidden under AppBar */}
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
