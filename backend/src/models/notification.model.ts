import { ObjectId, Collection } from 'mongodb';
import { dbConnection } from '../config/database';

export interface NotificationPreferenceDocument {
  _id: ObjectId;
  userId: ObjectId;
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
  quietHoursStart: string; // HH:MM 24-hr format (e.g. "22:00")
  quietHoursEnd: string; // HH:MM 24-hr format (e.g. "07:00")
  preferredReminderTime: string; // HH:MM 24-hr format (e.g. "19:00")
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicNotificationPreferences {
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
  quietHoursStart: string;
  quietHoursEnd: string;
  preferredReminderTime: string;
  timezone: string;
  updatedAt: string;
}

export type NotificationType =
  | 'goal_reminder'
  | 'task_deadline'
  | 'session_reminder'
  | 'pomodoro_break'
  | 'break_end'
  | 'daily_summary'
  | 'system';

export interface NotificationDocument {
  _id: ObjectId;
  userId: ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  dedupKey?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  readAt?: Date | null;
}

export interface PublicNotification {
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

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferenceDocument, '_id' | 'userId' | 'createdAt' | 'updatedAt'> = {
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
  timezone: 'UTC',
};

/**
 * Pure function to evaluate whether current time (HH:MM) falls within quiet hours.
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

export function toPublicNotificationPreferences(doc: NotificationPreferenceDocument): PublicNotificationPreferences {
  return {
    masterEnabled: doc.masterEnabled,
    studySessionReminders: doc.studySessionReminders,
    dailyGoalReminders: doc.dailyGoalReminders,
    taskDeadlineReminders: doc.taskDeadlineReminders,
    pomodoroBreakReminders: doc.pomodoroBreakReminders,
    breakEndReminders: doc.breakEndReminders,
    dailySummaryReminders: doc.dailySummaryReminders,
    soundEnabled: doc.soundEnabled,
    browserNotificationsEnabled: doc.browserNotificationsEnabled,
    quietHoursEnabled: doc.quietHoursEnabled,
    quietHoursStart: doc.quietHoursStart,
    quietHoursEnd: doc.quietHoursEnd,
    preferredReminderTime: doc.preferredReminderTime,
    timezone: doc.timezone || 'UTC',
    updatedAt: (doc.updatedAt || doc.createdAt || new Date()).toISOString(),
  };
}

export function toPublicNotification(doc: NotificationDocument): PublicNotification {
  return {
    id: doc._id.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    actionUrl: doc.actionUrl,
    isRead: doc.isRead,
    dedupKey: doc.dedupKey,
    metadata: doc.metadata,
    createdAt: doc.createdAt.toISOString(),
    readAt: doc.readAt ? doc.readAt.toISOString() : null,
  };
}

export class NotificationRepository {
  private prefsCollectionName = 'notification_preferences';
  private notifsCollectionName = 'notifications';

  public getPrefsCollection(): Collection<NotificationPreferenceDocument> {
    const db = dbConnection.getDb();
    return db.collection<NotificationPreferenceDocument>(this.prefsCollectionName);
  }

  public getNotifsCollection(): Collection<NotificationDocument> {
    const db = dbConnection.getDb();
    return db.collection<NotificationDocument>(this.notifsCollectionName);
  }

  public async ensureIndexes(): Promise<void> {
    try {
      const prefsCollection = this.getPrefsCollection();
      await prefsCollection.createIndex({ userId: 1 }, { unique: true, name: 'uniq_user_notification_prefs' });

      const notifsCollection = this.getNotifsCollection();
      await notifsCollection.createIndex({ userId: 1, createdAt: -1 }, { name: 'idx_user_notifications_time' });
      await notifsCollection.createIndex({ userId: 1, isRead: 1 }, { name: 'idx_user_notifications_unread' });
      await notifsCollection.createIndex(
        { userId: 1, dedupKey: 1 },
        { name: 'idx_user_dedup_key', sparse: true }
      );
    } catch (err) {
      console.warn('Notice: Could not ensure notification indexes:', (err as Error).message);
    }
  }

  public async getPreferences(userId: ObjectId): Promise<NotificationPreferenceDocument> {
    const collection = this.getPrefsCollection();
    const existing = await collection.findOne({ userId });

    if (existing) {
      return existing;
    }

    const now = new Date();
    const newPrefs: NotificationPreferenceDocument = {
      _id: new ObjectId(),
      userId,
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await collection.insertOne(newPrefs);
      return newPrefs;
    } catch {
      // If concurrent insert occurred, fetch existing
      const fallback = await collection.findOne({ userId });
      return fallback || newPrefs;
    }
  }

  public async updatePreferences(
    userId: ObjectId,
    update: Partial<Omit<NotificationPreferenceDocument, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<NotificationPreferenceDocument> {
    const collection = this.getPrefsCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...update,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    if (result) {
      return result;
    }

    return this.getPreferences(userId);
  }

  public async createNotification(params: {
    userId: ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    dedupKey?: string;
    metadata?: Record<string, unknown>;
  }): Promise<NotificationDocument | null> {
    const collection = this.getNotifsCollection();
    const now = new Date();

    // Check duplicate suppression if dedupKey provided
    if (params.dedupKey) {
      const existing = await collection.findOne({
        userId: params.userId,
        dedupKey: params.dedupKey,
      });

      if (existing) {
        // Already recorded; suppress duplicate
        return existing;
      }
    }

    const doc: NotificationDocument = {
      _id: new ObjectId(),
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
      isRead: false,
      dedupKey: params.dedupKey,
      metadata: params.metadata,
      createdAt: now,
      readAt: null,
    };

    await collection.insertOne(doc);
    return doc;
  }

  public async getHistory(
    userId: ObjectId,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: NotificationDocument[]; total: number; unreadCount: number }> {
    const collection = this.getNotifsCollection();
    const query: Record<string, unknown> = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
      collection.countDocuments({ userId, isRead: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  public async markAsRead(userId: ObjectId, notificationId: ObjectId): Promise<boolean> {
    const collection = this.getNotifsCollection();
    const result = await collection.updateOne(
      { _id: notificationId, userId },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  public async markAllAsRead(userId: ObjectId): Promise<number> {
    const collection = this.getNotifsCollection();
    const result = await collection.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return result.modifiedCount;
  }

  public async deleteNotification(userId: ObjectId, notificationId: ObjectId): Promise<boolean> {
    const collection = this.getNotifsCollection();
    const result = await collection.deleteOne({ _id: notificationId, userId });
    return result.deletedCount > 0;
  }
}

export const notificationRepository = new NotificationRepository();
