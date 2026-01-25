'use client';

/* global localStorage */

import { useState, useEffect } from 'react';

/**
 * Local storage key for onboarding completion status
 */
const ONBOARDING_STORAGE_KEY = 'onboarding_completed';

/**
 * useOnboarding Hook
 * Manages onboarding state for first-time users
 *
 * Features:
 * - Tracks whether user has completed onboarding
 * - Shows welcome dialog to new users
 * - Persists onboarding state in localStorage
 * - Provides methods to complete, skip, or reset onboarding
 *
 * @returns Onboarding state and methods
 */
export function useOnboarding() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);

  /**
   * Load onboarding state from localStorage on mount
   */
  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    const completed = stored === 'true';
    setIsOnboardingComplete(completed);
    setShowWelcome(!completed);
  }, []);

  /**
   * Mark onboarding as completed
   * Called when user completes the onboarding flow (clicks "Add First Recipe")
   */
  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsOnboardingComplete(true);
    setShowWelcome(false);
  };

  /**
   * Skip onboarding (same as completing)
   * Called when user clicks "Skip" button
   */
  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsOnboardingComplete(true);
    setShowWelcome(false);
  };

  /**
   * Reset onboarding state (for testing or re-onboarding)
   * Removes onboarding completion from localStorage
   */
  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setIsOnboardingComplete(false);
    setShowWelcome(true);
  };

  return {
    /**
     * Whether to show the welcome dialog
     */
    showWelcome,
    /**
     * Whether the user has completed onboarding
     */
    isOnboardingComplete,
    /**
     * Mark onboarding as completed
     */
    completeOnboarding,
    /**
     * Skip onboarding (same as completing)
     */
    skipOnboarding,
    /**
     * Reset onboarding state (for testing)
     */
    resetOnboarding,
  };
}
