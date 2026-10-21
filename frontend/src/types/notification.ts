export type NotificationType =
  | 'goal_reminder'
  | 'task_deadline'
  | 'session_reminder'
  | 'pomodoro_break'
  | 'break_end'
  | 'daily_summary'
  | 'system';

export interface NotificationPreferences {
  masterEnabled: boolean;
  studySessionReminders: boolean;
  dailyGoalReminders: boolean;
  taskDeadlineReminders: boolean;
  pomodoroBreakReminders: boolean;
  breakEndReminders: boolean;
  dailySummaryReminders: boolean;
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM (e.g. "22:00")
  quietHoursEnd: string; // HH:MM (e.g. "07:00")
  preferredReminderTime: string; // HH:MM (e.g. "19:00")
  timezone: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  dedupKey?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount: number;
}

export type BrowserPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  masterEnabled: true,
  studySessionReminders: true,
  dailyGoalReminders: true,
  taskDeadlineReminders: true,
  pomodoroBreakReminders: true,
  breakEndReminders: true,
  dailySummaryReminders: true,
  soundEnabled: true,
  browserNotificationsEnabled: false,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  preferredReminderTime: '19:00',
  timezone: typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : 'UTC',
};
