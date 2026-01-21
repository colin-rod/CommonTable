import { useState, useCallback, useMemo } from 'react';

import { getStartOfWeek, getEndOfWeek, addWeeks, isSameDay } from '@/lib/dateUtils';

/**
 * Hook for managing week navigation state
 *
 * @param initialDate - Optional initial date (defaults to current date)
 * @returns Week navigation state and actions
 */
export function useWeekNavigation(initialDate?: Date) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    getStartOfWeek(initialDate || new Date()),
  );

  /**
   * Calculate the end of the current week (Saturday)
   */
  const currentWeekEnd = useMemo(() => getEndOfWeek(currentWeekStart), [currentWeekStart]);

  /**
   * Check if the current week is the actual current week
   */
  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    const todayWeekStart = getStartOfWeek(today);
    return isSameDay(currentWeekStart, todayWeekStart);
  }, [currentWeekStart]);

  /**
   * Navigate to the previous week
   */
  const goToPreviousWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addWeeks(prev, -1));
  }, []);

  /**
   * Navigate to the next week
   */
  const goToNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  /**
   * Navigate to a specific week containing the given date
   * @param date - Any date within the target week
   */
  const goToWeek = useCallback((date: Date) => {
    setCurrentWeekStart(getStartOfWeek(date));
  }, []);

  return {
    currentWeekStart,
    currentWeekEnd,
    isCurrentWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToWeek,
  };
}
