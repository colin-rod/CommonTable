import { describe, it, expect } from 'vitest';

import {
  getStartOfWeek,
  getEndOfWeek,
  addWeeks,
  formatWeekRange,
  getDaysInWeek,
  isSameDay,
  formatRelativeDate,
} from './dateUtils';

describe('dateUtils', () => {
  describe('getStartOfWeek', () => {
    it('should return Sunday for a date in the middle of the week', () => {
      // Wednesday, Jan 22, 2026
      const date = new Date('2026-01-22');
      const result = getStartOfWeek(date);

      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(18); // Jan 18, 2026
    });

    it('should return the same date if already Sunday', () => {
      const sunday = new Date('2026-01-18');
      const result = getStartOfWeek(sunday);

      expect(result.getDay()).toBe(0);
      expect(result.getDate()).toBe(18);
    });

    it('should return previous Sunday if Saturday', () => {
      const saturday = new Date('2026-01-24');
      const result = getStartOfWeek(saturday);

      expect(result.getDay()).toBe(0);
      expect(result.getDate()).toBe(18);
    });

    it('should handle month boundaries', () => {
      // Feb 3, 2026 (Tuesday)
      const date = new Date('2026-02-03');
      const result = getStartOfWeek(date);

      expect(result.getDay()).toBe(0);
      expect(result.getDate()).toBe(1); // Feb 1, 2026
      expect(result.getMonth()).toBe(1); // February
    });
  });

  describe('getEndOfWeek', () => {
    it('should return Saturday for a date in the middle of the week', () => {
      const date = new Date('2026-01-22');
      const result = getEndOfWeek(date);

      expect(result.getDay()).toBe(6); // Saturday
      expect(result.getDate()).toBe(24); // Jan 24, 2026
    });

    it('should return the same date if already Saturday', () => {
      const saturday = new Date('2026-01-24');
      const result = getEndOfWeek(saturday);

      expect(result.getDay()).toBe(6);
      expect(result.getDate()).toBe(24);
    });

    it('should return next Saturday if Sunday', () => {
      const sunday = new Date('2026-01-18');
      const result = getEndOfWeek(sunday);

      expect(result.getDay()).toBe(6);
      expect(result.getDate()).toBe(24);
    });
  });

  describe('addWeeks', () => {
    it('should add positive weeks', () => {
      const date = new Date('2026-01-18');
      const result = addWeeks(date, 2);

      expect(result.getDate()).toBe(1); // Feb 1, 2026
      expect(result.getMonth()).toBe(1); // February
    });

    it('should subtract weeks with negative number', () => {
      const date = new Date('2026-01-18');
      const result = addWeeks(date, -1);

      expect(result.getDate()).toBe(11); // Jan 11, 2026
    });

    it('should handle zero weeks', () => {
      const date = new Date('2026-01-18');
      const result = addWeeks(date, 0);

      expect(result.getDate()).toBe(18);
      expect(result.getMonth()).toBe(0);
    });

    it('should handle year boundaries', () => {
      const date = new Date('2025-12-28');
      const result = addWeeks(date, 1);

      expect(result.getDate()).toBe(4); // Jan 4, 2026
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2026);
    });
  });

  describe('formatWeekRange', () => {
    it('should format week range within same month', () => {
      const start = new Date('2026-01-18');
      const end = new Date('2026-01-24');
      const result = formatWeekRange(start, end);

      expect(result).toBe('Jan 18 - 24, 2026');
    });

    it('should format week range across months', () => {
      const start = new Date('2026-01-25');
      const end = new Date('2026-01-31');
      const result = formatWeekRange(start, end);

      expect(result).toBe('Jan 25 - 31, 2026');
    });

    it('should format week range across different months', () => {
      const start = new Date('2026-01-25');
      const end = new Date('2026-02-01');
      const result = formatWeekRange(start, end);

      expect(result).toBe('Jan 25 - Feb 1, 2026');
    });

    it('should format week range across years', () => {
      const start = new Date('2025-12-28');
      const end = new Date('2026-01-03');
      const result = formatWeekRange(start, end);

      expect(result).toBe('Dec 28, 2025 - Jan 3, 2026');
    });
  });

  describe('getDaysInWeek', () => {
    it('should return 7 days starting from given date', () => {
      const startDate = new Date('2026-01-18'); // Sunday
      const result = getDaysInWeek(startDate);

      expect(result).toHaveLength(7);
      expect(result[0]!.getDay()).toBe(0); // Sunday
      expect(result[6]!.getDay()).toBe(6); // Saturday
    });

    it('should return dates in correct order', () => {
      const startDate = new Date('2026-01-18');
      const result = getDaysInWeek(startDate);

      for (let i = 0; i < 7; i++) {
        expect(result[i]!.getDate()).toBe(18 + i);
      }
    });

    it('should handle month boundaries', () => {
      const startDate = new Date('2026-01-25'); // Sunday
      const result = getDaysInWeek(startDate);

      expect(result[0]!.getMonth()).toBe(0); // January
      expect(result[6]!.getMonth()).toBe(0); // January (31 days)
    });
  });

  describe('isSameDay', () => {
    it('should return true for same date', () => {
      const date1 = new Date('2026-01-22T10:00:00');
      const date2 = new Date('2026-01-22T15:30:00');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different dates', () => {
      const date1 = new Date('2026-01-22');
      const date2 = new Date('2026-01-23');

      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return true for exact same date object', () => {
      const date = new Date('2026-01-22');

      expect(isSameDay(date, date)).toBe(true);
    });

    it('should handle different months', () => {
      const date1 = new Date('2026-01-31');
      const date2 = new Date('2026-02-01');

      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should handle different years', () => {
      const date1 = new Date('2025-12-31');
      const date2 = new Date('2026-01-01');

      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('formatRelativeDate', () => {
    it('should return "Just now" for dates within the last minute', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 30 * 1000); // 30 seconds ago

      expect(formatRelativeDate(recent)).toBe('Just now');
    });

    it('should return "X minutes ago" for recent dates', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      expect(formatRelativeDate(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('should return "1 hour ago" for singular hour', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      expect(formatRelativeDate(oneHourAgo)).toBe('1 hour ago');
    });

    it('should return "X hours ago" for plural hours', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      expect(formatRelativeDate(twoHoursAgo)).toBe('2 hours ago');
    });

    it('should return "Yesterday" for yesterday', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(formatRelativeDate(yesterday)).toBe('Yesterday');
    });

    it('should return "X days ago" for recent days', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
    });

    it('should return "Jan 15" for dates within the current year but > 7 days ago', () => {
      const date = new Date('2026-01-15');

      expect(formatRelativeDate(date)).toBe('Jan 15');
    });

    it('should return "Jan 15, 2025" for dates in previous years', () => {
      const date = new Date('2025-01-15');

      expect(formatRelativeDate(date)).toBe('Jan 15, 2025');
    });
  });
});
