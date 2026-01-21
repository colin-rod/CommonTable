import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useWeekNavigation } from './useWeekNavigation';

describe('useWeekNavigation', () => {
  describe('initialization', () => {
    it('should initialize with current week start date by default', () => {
      const { result } = renderHook(() => useWeekNavigation());

      expect(result.current.currentWeekStart).toBeInstanceOf(Date);
      expect(result.current.currentWeekStart.getDay()).toBe(0); // Sunday
    });

    it('should initialize with provided date', () => {
      const initialDate = new Date('2026-01-22'); // Wednesday
      const { result } = renderHook(() => useWeekNavigation(initialDate));

      expect(result.current.currentWeekStart.getDay()).toBe(0); // Sunday
      expect(result.current.currentWeekStart.getDate()).toBe(18); // Jan 18, 2026
    });
  });

  describe('goToPreviousWeek', () => {
    it('should navigate to previous week', () => {
      const initialDate = new Date('2026-01-18'); // Sunday
      const { result } = renderHook(() => useWeekNavigation(initialDate));

      act(() => {
        result.current.goToPreviousWeek();
      });

      expect(result.current.currentWeekStart.getDate()).toBe(11); // Jan 11, 2026
      expect(result.current.currentWeekStart.getDay()).toBe(0); // Sunday
    });

    it('should handle month boundaries', () => {
      const initialDate = new Date('2026-02-01'); // Sunday, Feb 1
      const { result } = renderHook(() => useWeekNavigation(initialDate));

      act(() => {
        result.current.goToPreviousWeek();
      });

      expect(result.current.currentWeekStart.getMonth()).toBe(0); // January
      expect(result.current.currentWeekStart.getDate()).toBe(25); // Jan 25, 2026
    });

    it('should handle year boundaries', () => {
      const initialDate = new Date('2026-01-04'); // Sunday
      const { result } = renderHook(() => useWeekNavigation(initialDate));

      act(() => {
        result.current.goToPreviousWeek();
      });

      expect(result.current.currentWeekStart.getFullYear()).toBe(2025);
      expect(result.current.currentWeekStart.getMonth()).toBe(11); // December
      expect(result.current.currentWeekStart.getDate()).toBe(28); // Dec 28, 2025
    });
  });

  describe('goToNextWeek', () => {
    it('should navigate to next week', () => {
      const initialDate = new Date('2026-01-18'); // Sunday
      const { result } = renderHook(() => useWeekNavigation(initialDate));

      act(() => {
        result.current.goToNextWeek();
      });

      expect(result.current.currentWeekStart.getDate()).toBe(25); // Jan 25, 2026
      expect(result.current.currentWeekStart.getDay()).toBe(0); // Sunday
    });

    it('should handle month boundaries', () => {
      const initialDate = new Date('2026-01-25'); // Sunday
      const { result } = renderHook(() => useWeekNavigation(initialDate));

      act(() => {
        result.current.goToNextWeek();
      });

      expect(result.current.currentWeekStart.getMonth()).toBe(1); // February
      expect(result.current.currentWeekStart.getDate()).toBe(1); // Feb 1, 2026
    });

    it('should handle year boundaries', () => {
      const initialDate = new Date('2025-12-28'); // Sunday
      const { result } = renderHook(() => useWeekNavigation(initialDate));

      act(() => {
        result.current.goToNextWeek();
      });

      expect(result.current.currentWeekStart.getFullYear()).toBe(2026);
      expect(result.current.currentWeekStart.getMonth()).toBe(0); // January
      expect(result.current.currentWeekStart.getDate()).toBe(4); // Jan 4, 2026
    });
  });

  describe('goToWeek', () => {
    it('should navigate to specific week', () => {
      const initialDate = new Date('2026-01-18');
      const { result } = renderHook(() => useWeekNavigation(initialDate));

      act(() => {
        result.current.goToWeek(new Date('2026-02-15')); // Mid-February
      });

      expect(result.current.currentWeekStart.getMonth()).toBe(1); // February
      expect(result.current.currentWeekStart.getDate()).toBe(15); // Feb 15, 2026 (Sunday)
      expect(result.current.currentWeekStart.getDay()).toBe(0); // Sunday
    });

    it('should calculate week start from any day of the week', () => {
      const initialDate = new Date('2026-01-18');
      const { result } = renderHook(() => useWeekNavigation(initialDate));

      // Navigate to Wednesday, Feb 18
      act(() => {
        result.current.goToWeek(new Date('2026-02-18'));
      });

      // Should set to Sunday, Feb 15
      expect(result.current.currentWeekStart.getDate()).toBe(15);
      expect(result.current.currentWeekStart.getDay()).toBe(0); // Sunday
    });
  });

  describe('currentWeekEnd', () => {
    it('should provide end of current week', () => {
      const initialDate = new Date('2026-01-18'); // Sunday
      const { result } = renderHook(() => useWeekNavigation(initialDate));

      expect(result.current.currentWeekEnd.getDay()).toBe(6); // Saturday
      expect(result.current.currentWeekEnd.getDate()).toBe(24); // Jan 24, 2026
    });

    it('should update when week changes', () => {
      const initialDate = new Date('2026-01-18');
      const { result } = renderHook(() => useWeekNavigation(initialDate));

      act(() => {
        result.current.goToNextWeek();
      });

      expect(result.current.currentWeekEnd.getDate()).toBe(31); // Jan 31, 2026
    });
  });

  describe('isCurrentWeek', () => {
    it('should return true for current week', () => {
      const { result } = renderHook(() => useWeekNavigation());

      expect(result.current.isCurrentWeek).toBe(true);
    });

    it('should return false for past week', () => {
      const { result } = renderHook(() => useWeekNavigation());

      act(() => {
        result.current.goToPreviousWeek();
      });

      expect(result.current.isCurrentWeek).toBe(false);
    });

    it('should return false for future week', () => {
      const { result } = renderHook(() => useWeekNavigation());

      act(() => {
        result.current.goToNextWeek();
      });

      expect(result.current.isCurrentWeek).toBe(false);
    });

    it('should return true when navigating back to current week', () => {
      const { result } = renderHook(() => useWeekNavigation());
      const originalWeekStart = result.current.currentWeekStart;

      act(() => {
        result.current.goToNextWeek();
      });

      expect(result.current.isCurrentWeek).toBe(false);

      act(() => {
        result.current.goToWeek(originalWeekStart);
      });

      expect(result.current.isCurrentWeek).toBe(true);
    });
  });
});
