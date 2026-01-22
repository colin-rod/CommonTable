/**
 * Date utility functions for calendar operations
 */

/**
 * Get the start of the week (Sunday) for a given date
 * @param date - The date to get the start of week for
 * @returns Date object representing the Sunday of that week
 */
export function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day; // Days since Sunday (0 = Sunday, 1 = Monday, etc.)
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the week (Saturday) for a given date
 * @param date - The date to get the end of week for
 * @returns Date object representing the Saturday of that week
 */
export function getEndOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = 6 - day; // Days until Saturday
  result.setDate(result.getDate() + diff);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Add or subtract weeks from a date
 * @param date - The starting date
 * @param weeks - Number of weeks to add (negative to subtract)
 * @returns New date with weeks added
 */
export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

/**
 * Format a week range as a string (e.g., "Jan 18 - 24, 2026")
 * @param startDate - Start of week (Sunday)
 * @param endDate - End of week (Saturday)
 * @returns Formatted string representing the week range
 */
export function formatWeekRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  // Same month and year: "Jan 18 - 24, 2026"
  if (startMonth === endMonth && startYear === endYear) {
    return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
  }

  // Different months, same year: "Jan 25 - Feb 1, 2026"
  if (startYear === endYear) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
  }

  // Different years: "Dec 28, 2025 - Jan 3, 2026"
  return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
}

/**
 * Get an array of all 7 days in a week starting from the given date
 * @param startDate - The start of the week (Sunday)
 * @returns Array of 7 Date objects (Sunday through Saturday)
 */
export function getDaysInWeek(startDate: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push(day);
  }
  return days;
}

/**
 * Check if two dates represent the same calendar day (ignoring time)
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if both dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "Yesterday", "Jan 15")
 * @param date - The date to format
 * @returns Formatted relative time string
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // Less than 1 minute: "Just now"
  if (diffInMinutes < 1) {
    return 'Just now';
  }

  // Less than 1 hour: "X minutes ago"
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  // Less than 24 hours: "X hours ago"
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  // Exactly 1 day: "Yesterday"
  if (diffInDays === 1) {
    return 'Yesterday';
  }

  // Less than 7 days: "X days ago"
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  // Same year: "Jan 15"
  if (date.getFullYear() === now.getFullYear()) {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  }

  // Different year: "Jan 15, 2025"
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}
