import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  NotificationPreferences,
  AppNotification,
  BrowserPermissionStatus,
  NotificationType,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../types/notification';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { soundAlerts } from '../utils/soundAlerts';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
} from '../utils/browserNotifications';
import { isWithinQuietHours, formatTimeInTimezone, formatDateInTimezone } from '../utils/quietHours';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';

export interface DispatchNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  dedupKey?: string;
  metadata?: Record<string, unknown>;
  forceAlert?: boolean; // ignore quiet hours for urgent manual/system actions
}

interface NotificationContextType {
  preferences: NotificationPreferences;
  updatePreferences: (newPrefs: Partial<NotificationPreferences>) => Promise<void>;
  notifications: AppNotification[];
  unreadCount: number;
  permissionStatus: BrowserPermissionStatus;
  requestBrowserPermission: () => Promise<BrowserPermissionStatus>;
  sendTestNotification: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  dispatchNotification: (params: DispatchNotificationParams) => Promise<boolean>;
  refreshHistory: () => Promise<void>;
  isQuietHoursActive: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    return getFromStorage<NotificationPreferences>(
      STORAGE_KEYS.NOTIFICATION_PREFS,
      DEFAULT_NOTIFICATION_PREFERENCES
    );
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return getFromStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  });

  const [permissionStatus, setPermissionStatus] = useState<BrowserPermissionStatus>(() =>
    getNotificationPermission()
  );

  const [isQuietHoursActive, setIsQuietHoursActive] = useState<boolean>(false);

  // In-memory set of recently dispatched dedupKeys to prevent spamming
  const dispatchedKeysRef = useRef<Set<string>>(new Set());

  // 1. Sync local storage when notifications or preferences change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.NOTIFICATION_PREFS, preferences);
  }, [preferences]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  // 2. Fetch authenticated preferences and history from MongoDB backend
  const refreshHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [backendPrefs, historyData] = await Promise.all([
        notificationService.getPreferences(),
        notificationService.getHistory(1, 30),
      ]);
      setPreferences(backendPrefs);
      if (historyData?.notifications) {
        setNotifications(historyData.notifications);
      }
    } catch (err) {
      console.warn('Could not load notifications from backend:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // 3. Monitor quiet hours state periodically
  useEffect(() => {
    const evaluateQuietHours = () => {
      if (!preferences.quietHoursEnabled) {
        setIsQuietHoursActive(false);
        return;
      }
      const nowTime = formatTimeInTimezone(new Date(), preferences.timezone);
      const inQuiet = isWithinQuietHours(
        nowTime,
        preferences.quietHoursStart,
        preferences.quietHoursEnd
      );
      setIsQuietHoursActive(inQuiet);
    };

    evaluateQuietHours();
    const interval = setInterval(evaluateQuietHours, 30000);
    return () => clearInterval(interval);
  }, [preferences.quietHoursEnabled, preferences.quietHoursStart, preferences.quietHoursEnd, preferences.timezone]);

  // 4. Update Preferences
  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    if (isAuthenticated) {
      try {
        const saved = await notificationService.updatePreferences(newPrefs);
        setPreferences(saved);
      } catch (err) {
        console.warn('Could not persist preferences to backend:', err);
      }
    }
  };

  // 5. Request browser permission
  const requestBrowserPermission = async (): Promise<BrowserPermissionStatus> => {
    const result = await requestNotificationPermission();
    setPermissionStatus(result);

    if (result === 'granted') {
      await updatePreferences({ browserNotificationsEnabled: true });
    } else {
      await updatePreferences({ browserNotificationsEnabled: false });
    }

    return result;
  };

  // 6. Core Dispatch Notification Engine
  const dispatchNotification = useCallback(
    async (params: DispatchNotificationParams): Promise<boolean> => {
      // A. Master Switch Check
      if (!preferences.masterEnabled && !params.forceAlert) {
        return false;
      }

      // B. Category Switch Checks
      if (!params.forceAlert) {
        if (params.type === 'goal_reminder' && !preferences.dailyGoalReminders) return false;
        if (params.type === 'task_deadline' && !preferences.taskDeadlineReminders) return false;
        if (params.type === 'session_reminder' && !preferences.studySessionReminders) return false;
        if (params.type === 'pomodoro_break' && !preferences.pomodoroBreakReminders) return false;
        if (params.type === 'break_end' && !preferences.breakEndReminders) return false;
        if (params.type === 'daily_summary' && !preferences.dailySummaryReminders) return false;
      }

      // C. Duplicate Key Check
      if (params.dedupKey) {
        if (dispatchedKeysRef.current.has(params.dedupKey)) {
          return false;
        }
        dispatchedKeysRef.current.add(params.dedupKey);
      }

      // D. Quiet Hours Check
      const nowTime = formatTimeInTimezone(new Date(), preferences.timezone);
      const inQuiet =
        preferences.quietHoursEnabled &&
        isWithinQuietHours(nowTime, preferences.quietHoursStart, preferences.quietHoursEnd);

      if (inQuiet && !params.forceAlert) {
        // Suppressed by quiet hours
        return false;
      }

      // E. Sound Alert
      if (preferences.soundEnabled) {
        if (params.type === 'break_end' || params.type === 'session_reminder') {
          soundAlerts.playAttentionChime();
        } else if (params.type === 'pomodoro_break') {
          soundAlerts.playCompletionChime();
        } else {
          soundAlerts.playGentleNotice();
        }
      }

      // F. Browser Notification
      if (preferences.browserNotificationsEnabled && permissionStatus === 'granted') {
        showBrowserNotification(params.title, {
          body: params.message,
          onClick: () => {
            if (params.actionUrl) {
              window.location.hash = params.actionUrl;
            }
          },
        });
      }

      // G. In-App Notification Recording
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
        isRead: false,
        dedupKey: params.dedupKey,
        metadata: params.metadata,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]); // keep recent 50

      if (isAuthenticated) {
        try {
          const backendDoc = await notificationService.createNotification({
            type: params.type,
            title: params.title,
            message: params.message,
            actionUrl: params.actionUrl,
            dedupKey: params.dedupKey,
            metadata: params.metadata,
          });
          if (backendDoc) {
            setNotifications((prev) =>
              prev.map((item) => (item.id === newNotif.id ? backendDoc : item))
            );
          }
        } catch (err) {
          console.warn('Could not record notification on backend:', err);
        }
      }

      return true;
    },
    [preferences, permissionStatus, isAuthenticated]
  );

  // 7. Test Notification Button Action
  const sendTestNotification = () => {
    dispatchNotification({
      type: 'system',
      title: 'Study Discipline Notifications Active',
      message: 'Sound and notification alerts are configured and operating smoothly!',
      actionUrl: '/settings',
      forceAlert: true,
    });
  };

  // 8. Mark as Read
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );

    if (isAuthenticated) {
      await notificationService.markAsRead(id);
    }
  };

  // 9. Mark All as Read
  const markAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );

    if (isAuthenticated) {
      await notificationService.markAllAsRead();
    }
  };

  // 10. Delete Notification
  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (isAuthenticated) {
      await notificationService.deleteNotification(id);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        preferences,
        updatePreferences,
        notifications,
        unreadCount,
        permissionStatus,
        requestBrowserPermission,
        sendTestNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        dispatchNotification,
        refreshHistory,
        isQuietHoursActive,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
