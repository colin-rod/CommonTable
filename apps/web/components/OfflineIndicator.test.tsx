/* global navigator, window */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { OfflineIndicator } from './OfflineIndicator';

describe('OfflineIndicator', () => {
  // Store original navigator.onLine
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
    // Mock navigator.onLine as true (online) by default
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    // Restore original value
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine,
    });
  });

  describe('Online State', () => {
    it('should not render when online', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      render(<OfflineIndicator />);

      expect(screen.queryByText(/you're offline/i)).not.toBeInTheDocument();
    });
  });

  describe('Offline State', () => {
    it('should render when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      render(<OfflineIndicator />);

      // Trigger offline event
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
      });
    });

    it('should show sync message', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      render(<OfflineIndicator />);

      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText(/changes will sync when reconnected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Online/Offline Events', () => {
    it('should show indicator when going offline', async () => {
      render(<OfflineIndicator />);

      // Initially online, should not be visible
      expect(screen.queryByText(/you're offline/i)).not.toBeInTheDocument();

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
      });
    });

    it('should hide indicator when going online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      render(<OfflineIndicator />);

      // Trigger offline
      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
      });

      // Simulate going back online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(screen.queryByText(/you're offline/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Dismissible', () => {
    it('should show close button', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      render(<OfflineIndicator />);

      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('should dismiss when close button clicked', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      render(<OfflineIndicator />);

      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/you're offline/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Design System Compliance', () => {
    it('should use Alert component with warning severity', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      render(<OfflineIndicator />);

      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveClass('MuiAlert-standardWarning');
      });
    });

    it('should have dismissible close button', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      render(<OfflineIndicator />);

      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have alert role', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      render(<OfflineIndicator />);

      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should have accessible close button', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      render(<OfflineIndicator />);

      window.dispatchEvent(new Event('offline'));

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        expect(closeButton).toHaveAccessibleName();
      });
    });
  });
});
