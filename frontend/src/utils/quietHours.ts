/**
 * Pure function to evaluate whether current time (HH:MM 24-hr) falls within quiet hours.
 * Accurately handles windows that cross midnight (e.g., 22:00 to 07:00).
 */
export function isWithinQuietHours(currentTime: string, startTime: string, endTime: string): boolean {
  if (startTime === endTime) return false;
  if (startTime < endTime) {
    // Normal window within single day (e.g. 13:00 to 16:00)
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Window crossing midnight (e.g. 22:00 to 07:00)
    return currentTime >= startTime || currentTime < endTime;
  }
}

/**
 * Format a Date object to "HH:MM" in a specific timezone
 */
export function formatTimeInTimezone(date: Date, timezone: string = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });
    return formatter.format(date);
  } catch {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

/**
 * Format a Date object to "YYYY-MM-DD" in a specific timezone
 */
export function formatDateInTimezone(date: Date, timezone: string = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone,
    });
    return formatter.format(date);
  } catch {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
