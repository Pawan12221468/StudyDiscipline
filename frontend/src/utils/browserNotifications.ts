import { BrowserPermissionStatus } from '../types/notification';

/**
 * Check if the Notifications API is available in the current browser/environment
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission status
 */
export function getNotificationPermission(): BrowserPermissionStatus {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as BrowserPermissionStatus;
}

/**
 * Request notification permission from the user
 * Must only be called as a direct consequence of a user action (e.g., clicking a button)
 */
export async function requestNotificationPermission(): Promise<BrowserPermissionStatus> {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as BrowserPermissionStatus;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return getNotificationPermission();
  }
}

/**
 * Display a browser notification if permission is granted
 */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions & { onClick?: () => void }
): boolean {
  if (!isBrowserNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    if (options?.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };
    }

    return true;
  } catch (err) {
    console.warn('Error showing browser notification:', err);
    return false;
  }
}
