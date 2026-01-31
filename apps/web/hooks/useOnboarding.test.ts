/* global localStorage */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useOnboarding } from './useOnboarding';

describe('useOnboarding', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should return showWelcome true when onboarding not completed', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.showWelcome).toBe(true);
      expect(result.current.isOnboardingComplete).toBe(false);
    });

    it('should return showWelcome false when onboarding completed', () => {
      localStorage.setItem('onboarding_completed', 'true');

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.showWelcome).toBe(false);
      expect(result.current.isOnboardingComplete).toBe(true);
    });

    it('should handle invalid localStorage value', () => {
      localStorage.setItem('onboarding_completed', 'invalid');

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.showWelcome).toBe(true);
      expect(result.current.isOnboardingComplete).toBe(false);
    });
  });

  describe('completeOnboarding', () => {
    it('should set onboarding as completed in localStorage', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.showWelcome).toBe(true);

      act(() => {
        result.current.completeOnboarding();
      });

      expect(result.current.showWelcome).toBe(false);
      expect(result.current.isOnboardingComplete).toBe(true);
      expect(localStorage.getItem('onboarding_completed')).toBe('true');
    });

    it('should persist across hook rerenders', () => {
      const { result, rerender } = renderHook(() => useOnboarding());

      act(() => {
        result.current.completeOnboarding();
      });

      rerender();

      expect(result.current.showWelcome).toBe(false);
      expect(result.current.isOnboardingComplete).toBe(true);
    });
  });

  describe('skipOnboarding', () => {
    it('should mark onboarding as completed and hide welcome', () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.showWelcome).toBe(true);

      act(() => {
        result.current.skipOnboarding();
      });

      expect(result.current.showWelcome).toBe(false);
      expect(result.current.isOnboardingComplete).toBe(true);
      expect(localStorage.getItem('onboarding_completed')).toBe('true');
    });
  });

  describe('resetOnboarding', () => {
    it('should clear onboarding state from localStorage', () => {
      localStorage.setItem('onboarding_completed', 'true');

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.showWelcome).toBe(false);

      act(() => {
        result.current.resetOnboarding();
      });

      expect(result.current.showWelcome).toBe(true);
      expect(result.current.isOnboardingComplete).toBe(false);
      expect(localStorage.getItem('onboarding_completed')).toBeNull();
    });
  });

  describe('localStorage Integration', () => {
    it('should read from localStorage on mount', () => {
      localStorage.setItem('onboarding_completed', 'true');

      const { result } = renderHook(() => useOnboarding());

      expect(result.current.showWelcome).toBe(false);
      expect(result.current.isOnboardingComplete).toBe(true);
    });

    it('should write to localStorage when completing onboarding', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.completeOnboarding();
      });

      const stored = localStorage.getItem('onboarding_completed');
      expect(stored).toBe('true');
    });

    it('should remove from localStorage when resetting', () => {
      localStorage.setItem('onboarding_completed', 'true');

      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.resetOnboarding();
      });

      const stored = localStorage.getItem('onboarding_completed');
      expect(stored).toBeNull();
    });
  });

  describe('TypeScript Types', () => {
    it('should have correct TypeScript types for all return values', () => {
      const { result } = renderHook(() => useOnboarding());

      // Type assertions to verify correct types
      const showWelcome: boolean = result.current.showWelcome;
      const isOnboardingComplete: boolean = result.current.isOnboardingComplete;
      const completeOnboarding: () => void = result.current.completeOnboarding;
      const skipOnboarding: () => void = result.current.skipOnboarding;
      const resetOnboarding: () => void = result.current.resetOnboarding;

      expect(typeof showWelcome).toBe('boolean');
      expect(typeof isOnboardingComplete).toBe('boolean');
      expect(typeof completeOnboarding).toBe('function');
      expect(typeof skipOnboarding).toBe('function');
      expect(typeof resetOnboarding).toBe('function');
    });
  });
});
