import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import {
  notificationRepository,
  toPublicNotificationPreferences,
  toPublicNotification,
} from '../models/notification.model';
import {
  updateNotificationPreferenceSchema,
  createNotificationSchema,
  notificationQuerySchema,
} from '../validators/notification.validator';

/**
 * Retrieve notification preferences for the authenticated user
 * GET /api/notifications/preferences
 */
export async function getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const prefsDoc = await notificationRepository.getPreferences(userId);

    res.status(200).json({
      preferences: toPublicNotificationPreferences(prefsDoc),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update notification preferences for the authenticated user
 * PUT /api/notifications/preferences
 */
export async function updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = updateNotificationPreferenceSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid notification preference input',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const userId = req.user!._id;
    const updated = await notificationRepository.updatePreferences(userId, parseResult.data);

    res.status(200).json({
      message: 'Notification preferences updated successfully',
      preferences: toPublicNotificationPreferences(updated),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve paginated notification history for the authenticated user
 * GET /api/notifications/history
 */
export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const queryResult = notificationQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: queryResult.error.issues[0]?.message || 'Invalid query parameters',
        issues: queryResult.error.issues,
        status: 400,
      });
      return;
    }

    const { page, limit, unreadOnly } = queryResult.data;
    const userId = req.user!._id;

    const { notifications, total, unreadCount } = await notificationRepository.getHistory(
      userId,
      page,
      limit,
      unreadOnly
    );

    res.status(200).json({
      notifications: notifications.map(toPublicNotification),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        unreadCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new notification (e.g. from client reminder scheduler)
 * POST /api/notifications
 */
export async function createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = createNotificationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: parseResult.error.issues[0]?.message || 'Invalid notification payload',
        issues: parseResult.error.issues,
        status: 400,
      });
      return;
    }

    const userId = req.user!._id;
    const doc = await notificationRepository.createNotification({
      userId,
      ...parseResult.data,
    });

    res.status(201).json({
      notification: doc ? toPublicNotification(doc) : null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        error: 'InvalidId',
        message: 'Invalid notification identifier',
        status: 400,
      });
      return;
    }

    const userId = req.user!._id;
    const success = await notificationRepository.markAsRead(userId, new ObjectId(id));

    if (!success) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Notification not found or already marked as read',
        status: 404,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark all notifications as read for the authenticated user
 * PATCH /api/notifications/read-all
 */
export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const updatedCount = await notificationRepository.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `Marked ${updatedCount} notifications as read`,
      updatedCount,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a single notification
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        error: 'InvalidId',
        message: 'Invalid notification identifier',
        status: 400,
      });
      return;
    }

    const userId = req.user!._id;
    const success = await notificationRepository.deleteNotification(userId, new ObjectId(id));

    if (!success) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Notification not found',
        status: 404,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
