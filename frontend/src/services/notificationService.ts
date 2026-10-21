import { apiRequest } from './apiClient';
import {
  NotificationPreferences,
  AppNotification,
  NotificationPagination,
  NotificationType,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../types/notification';

export interface PreferencesResponse {
  preferences: NotificationPreferences;
}

export interface UpdatePreferencesResponse {
  message: string;
  preferences: NotificationPreferences;
}

export interface NotificationHistoryResponse {
  notifications: AppNotification[];
  pagination: NotificationPagination;
}

export interface CreateNotificationResponse {
  notification: AppNotification | null;
}

export const notificationService = {
  /**
   * Get user notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const data = await apiRequest<PreferencesResponse>('/notifications/preferences');
      return data.preferences;
    } catch {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const data = await apiRequest<UpdatePreferencesResponse>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
    return data.preferences;
  },

  /**
   * Get paginated notification history
   */
  async getHistory(
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: AppNotification[]; pagination: NotificationPagination }> {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(unreadOnly ? { unreadOnly: 'true' } : {}),
    });

    return apiRequest<NotificationHistoryResponse>(`/notifications/history?${query.toString()}`);
  },

  /**
   * Create an in-app notification
   */
  async createNotification(payload: {
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    dedupKey?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AppNotification | null> {
    try {
      const data = await apiRequest<CreateNotificationResponse>('/notifications', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data.notification;
    } catch (err) {
      console.warn('Could not record notification on backend:', err);
      return null;
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      await apiRequest<{ success: boolean }>(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    try {
      const data = await apiRequest<{ success: boolean; updatedCount: number }>(
        '/notifications/read-all',
        {
          method: 'PATCH',
        }
      );
      return data.updatedCount || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      await apiRequest<{ success: boolean }>(`/notifications/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch {
      return false;
    }
  },
};
