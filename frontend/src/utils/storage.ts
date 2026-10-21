/**
 * Safe LocalStorage wrapper with JSON parsing and fallback error handling
 */

export const STORAGE_KEYS = {
  ACTIVE_TIMER: 'study_discipline_active_timer_v1',
  SESSIONS: 'study_discipline_sessions_v1',
  TASKS: 'study_discipline_tasks_v1',
  SETTINGS: 'study_discipline_settings_v1',
  NOTIFICATIONS: 'study_discipline_notifications_v1',
  NOTIFICATION_PREFS: 'study_discipline_notification_prefs_v1',
} as const;

export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading key "${key}" from localStorage:`, error);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key "${key}" to localStorage:`, error);
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing key "${key}" from localStorage:`, error);
  }
}
