'use client';

/* global navigator, window */

import { Alert, Box } from '@mui/material';
import { useState, useEffect } from 'react';

/**
 * OfflineIndicator Component
 * Displays a banner when the user is offline
 *
 * Features:
 * - Listens to online/offline events
 * - Shows alert banner when offline
 * - Dismissible (close button)
 * - Auto-hides when back online
 *
 * Design System Compliance:
 * - Alert component with warning severity
 * - Positioned at top of screen
 * - Dismissible with close button
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);

    // Listen to online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false); // Reset dismissal when back online
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsDismissed(false); // Show alert when going offline
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClose = () => {
    setIsDismissed(true);
  };

  // Don't render if online or dismissed
  if (!isOffline || isDismissed) {
    return null;
  }

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
      <Alert severity="warning" onClose={handleClose}>
        You're offline. Changes will sync when reconnected.
      </Alert>
    </Box>
  );
}
