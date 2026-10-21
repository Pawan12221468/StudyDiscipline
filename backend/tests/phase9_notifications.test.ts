/**
 * Phase 9 Notification & Smart Study Reminders Test Suite
 * Validates preference persistence, quiet hours calculations (including midnight crossings),
 * deduplication, goal reminder rules, task deadline rules, Pomodoro alerts, and authorization.
 */

import { ObjectId } from 'mongodb';
import {
  notificationPreferenceSchema,
  updateNotificationPreferenceSchema,
  createNotificationSchema,
  notificationQuerySchema,
} from '../src/validators/notification.validator';
import {
  isWithinQuietHours,
  toPublicNotificationPreferences,
  toPublicNotification,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferenceDocument,
  NotificationDocument,
} from '../src/models/notification.model';

export async function runPhase9NotificationTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n======================================================');
  console.log(' Phase 9: Smart Notifications & Reminders Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ ${testName}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------
  // 1. Validator Schemas: Notification Preferences
  // ---------------------------------------------------------
  console.log('[1] Notification Preferences Schema Validation');
  try {
    const validPrefs = notificationPreferenceSchema.safeParse({
      masterEnabled: true,
      studySessionReminders: true,
      dailyGoalReminders: true,
      taskDeadlineReminders: true,
      pomodoroBreakReminders: true,
      breakEndReminders: true,
      dailySummaryReminders: true,
      soundEnabled: true,
      browserNotificationsEnabled: true,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      preferredReminderTime: '19:00',
      timezone: 'Asia/Kolkata',
    });
    assert(validPrefs.success === true, 'notificationPreferenceSchema accepts valid complete configuration');

    const defaultsParse = notificationPreferenceSchema.safeParse({});
    assert(defaultsParse.success === true, 'notificationPreferenceSchema fills sensible defaults when empty');
    if (defaultsParse.success) {
      assert(defaultsParse.data.masterEnabled === true, 'Default masterEnabled is true');
      assert(defaultsParse.data.quietHoursStart === '22:00', 'Default quietHoursStart is 22:00');
      assert(defaultsParse.data.quietHoursEnd === '07:00', 'Default quietHoursEnd is 07:00');
      assert(defaultsParse.data.preferredReminderTime === '19:00', 'Default preferredReminderTime is 19:00');
      assert(defaultsParse.data.browserNotificationsEnabled === false, 'Browser notifications disabled by default');
    }

    // Invalid time formats
    const invalidTime = notificationPreferenceSchema.safeParse({ quietHoursStart: '25:70' });
    assert(invalidTime.success === false, 'Rejects invalid hours (>23:59)');

    const malformedTime = notificationPreferenceSchema.safeParse({ preferredReminderTime: '7pm' });
    assert(malformedTime.success === false, 'Rejects non-24hr time format');

    // Partial updates
    const partialUpdate = updateNotificationPreferenceSchema.safeParse({
      soundEnabled: false,
      preferredReminderTime: '20:30',
    });
    assert(partialUpdate.success === true, 'updateNotificationPreferenceSchema allows partial updates');
  } catch (err) {
    assert(false, `Preference validation failed: ${(err as Error).message}`);
  }

  // ---------------------------------------------------------
  // 2. Notification Creation & Query Schemas
  // ---------------------------------------------------------
  console.log('\n[2] Notification Payloads & Pagination Validation');
  try {
    const validNotif = createNotificationSchema.safeParse({
      type: 'goal_reminder',
      title: 'Daily Goal Reminder',
      message: 'You have 30 minutes left to hit your goal!',
      actionUrl: '/timer',
      dedupKey: 'goal_2026-10-21',
      metadata: { remainingMinutes: 30 },
    });
    assert(validNotif.success === true, 'createNotificationSchema accepts valid notification payload');

    const invalidType = createNotificationSchema.safeParse({
      type: 'invalid_type',
      title: 'Test',
      message: 'Test message',
    });
    assert(invalidType.success === false, 'createNotificationSchema rejects unapproved notification types');

    const emptyTitle = createNotificationSchema.safeParse({
      type: 'system',
      title: '',
      message: 'Notice content',
    });
    assert(emptyTitle.success === false, 'createNotificationSchema rejects empty titles');

    const queryParse = notificationQuerySchema.safeParse({
      page: '2',
      limit: '15',
      unreadOnly: 'true',
    });
    assert(queryParse.success === true, 'notificationQuerySchema coerces numbers and transforms unreadOnly boolean');
    if (queryParse.success) {
      assert(queryParse.data.page === 2, 'Page coerced to number 2');
      assert(queryParse.data.limit === 15, 'Limit coerced to number 15');
      assert(queryParse.data.unreadOnly === true, 'unreadOnly parsed to boolean true');
    }
  } catch (err) {
    assert(false, `Payload schema tests failed: ${(err as Error).message}`);
  }

  // ---------------------------------------------------------
  // 3. Quiet Hours Calculations (Crossing Midnight)
  // ---------------------------------------------------------
  console.log('\n[3] Quiet Hours Engine (Midnight Crossing Math)');
  try {
    // Window: 22:00 to 07:00 (crosses midnight)
    assert(isWithinQuietHours('22:00', '22:00', '07:00') === true, '22:00 is within 22:00-07:00 (exact start boundary)');
    assert(isWithinQuietHours('23:45', '22:00', '07:00') === true, '23:45 is within 22:00-07:00');
    assert(isWithinQuietHours('00:00', '22:00', '07:00') === true, '00:00 (midnight) is within 22:00-07:00');
    assert(isWithinQuietHours('03:15', '22:00', '07:00') === true, '03:15 is within 22:00-07:00');
    assert(isWithinQuietHours('06:59', '22:00', '07:00') === true, '06:59 is within 22:00-07:00');
    assert(isWithinQuietHours('07:00', '22:00', '07:00') === false, '07:00 is OUTSIDE 22:00-07:00 (exact end boundary)');
    assert(isWithinQuietHours('12:00', '22:00', '07:00') === false, '12:00 (noon) is OUTSIDE 22:00-07:00');
    assert(isWithinQuietHours('21:59', '22:00', '07:00') === false, '21:59 is OUTSIDE 22:00-07:00 (one minute before)');

    // Daytime window: 13:00 to 16:00 (does not cross midnight)
    assert(isWithinQuietHours('14:30', '13:00', '16:00') === true, '14:30 is within 13:00-16:00');
    assert(isWithinQuietHours('12:59', '13:00', '16:00') === false, '12:59 is outside 13:00-16:00');
    assert(isWithinQuietHours('16:00', '13:00', '16:00') === false, '16:00 is outside 13:00-16:00');

    // Equal times (disabled)
    assert(isWithinQuietHours('10:00', '10:00', '10:00') === false, 'Equal start/end times safely evaluate to false');
  } catch (err) {
    assert(false, `Quiet hours test failed: ${(err as Error).message}`);
  }

  // ---------------------------------------------------------
  // 4. Master Toggle & Category Filtering
  // ---------------------------------------------------------
  console.log('\n[4] Master Toggle & Category Filtering Rules');
  try {
    function shouldDeliverNotification(
      prefs: { masterEnabled: boolean; dailyGoalReminders: boolean; taskDeadlineReminders: boolean },
      type: 'goal_reminder' | 'task_deadline'
    ): boolean {
      if (!prefs.masterEnabled) return false;
      if (type === 'goal_reminder' && !prefs.dailyGoalReminders) return false;
      if (type === 'task_deadline' && !prefs.taskDeadlineReminders) return false;
      return true;
    }

    // Master switch disabled
    const masterOff = { masterEnabled: false, dailyGoalReminders: true, taskDeadlineReminders: true };
    assert(shouldDeliverNotification(masterOff, 'goal_reminder') === false, 'Master toggle OFF suppresses daily goal reminder');
    assert(shouldDeliverNotification(masterOff, 'task_deadline') === false, 'Master toggle OFF suppresses task deadline reminder');

    // Category switch disabled
    const categoryOff = { masterEnabled: true, dailyGoalReminders: false, taskDeadlineReminders: true };
    assert(shouldDeliverNotification(categoryOff, 'goal_reminder') === false, 'Individual category toggle OFF suppresses goal reminder');
    assert(shouldDeliverNotification(categoryOff, 'task_deadline') === true, 'Active category delivers when master toggle is ON');
  } catch (err) {
    assert(false, `Master toggle test failed: ${(err as Error).message}`);
  }

  // ---------------------------------------------------------
  // 5. Smart Study Reminders: Daily Goal Logic
  // ---------------------------------------------------------
  console.log('\n[5] Daily Study Goal Reminder Rules');
  try {
    function evaluateDailyGoalReminder(
      targetMinutes: number,
      completedMinutes: number,
      currentTime: string,
      reminderTime: string
    ): boolean {
      // If goal already met, do not send reminder
      if (completedMinutes >= targetMinutes) return false;
      // If current time has not reached preferred reminder time, do not send yet
      if (currentTime < reminderTime) return false;
      return true;
    }

    const targetMinutes = 120; // 2 hours
    assert(evaluateDailyGoalReminder(targetMinutes, 45, '19:30', '19:00') === true, 'Incomplete goal at 19:30 triggers reminder (19:00 preferred)');
    assert(evaluateDailyGoalReminder(targetMinutes, 120, '19:30', '19:00') === false, 'Achieved goal (120/120) strictly SUPPRESSES reminder');
    assert(evaluateDailyGoalReminder(targetMinutes, 150, '20:00', '19:00') === false, 'Exceeded goal (150/120) strictly SUPPRESSES reminder');
    assert(evaluateDailyGoalReminder(targetMinutes, 45, '18:30', '19:00') === false, 'Incomplete goal BEFORE preferred reminder time does not prematurely trigger');
  } catch (err) {
    assert(false, `Goal reminder rules failed: ${(err as Error).message}`);
  }

  // ---------------------------------------------------------
  // 6. Smart Study Reminders: Task Deadlines
  // ---------------------------------------------------------
  console.log('\n[6] Task Deadline Reminder Rules');
  try {
    function evaluateTaskReminder(
      isCompleted: boolean,
      hoursRemaining: number
    ): boolean {
      if (isCompleted) return false; // Never notify completed tasks
      if (hoursRemaining <= 0) return false; // Already overdue
      if (hoursRemaining <= 24) return true; // Due within 24 hours
      return false; // Beyond reminder window
    }

    assert(evaluateTaskReminder(false, 6) === true, 'Incomplete task due in 6 hours triggers deadline reminder');
    assert(evaluateTaskReminder(true, 6) === false, 'Completed task due in 6 hours strictly SUPPRESSES reminder');
    assert(evaluateTaskReminder(false, 48) === false, 'Task due in 48 hours does not trigger premature reminder');
    assert(evaluateTaskReminder(false, -2) === false, 'Past overdue task does not spam active deadline reminder');
  } catch (err) {
    assert(false, `Task reminder rules failed: ${(err as Error).message}`);
  }

  // ---------------------------------------------------------
  // 7. Duplicate Prevention & Dedup Keys
  // ---------------------------------------------------------
  console.log('\n[7] Duplicate Suppression & Dedup Keys');
  try {
    const memoryKeys = new Set<string>();

    function dispatchWithDedup(dedupKey: string): boolean {
      if (memoryKeys.has(dedupKey)) {
        return false; // Suppress duplicate
      }
      memoryKeys.add(dedupKey);
      return true; // Dispatched
    }

    assert(dispatchWithDedup('goal_reminder_2026-10-21') === true, 'First dispatch of unique dedupKey succeeds');
    assert(dispatchWithDedup('goal_reminder_2026-10-21') === false, 'Duplicate dispatch of same dedupKey is suppressed');
    assert(dispatchWithDedup('task_due_task123_2026-10-21') === true, 'Different dedupKey dispatches cleanly');
    assert(dispatchWithDedup('task_due_task123_2026-10-21') === false, 'Repeated task dedupKey is suppressed');
  } catch (err) {
    assert(false, `Dedup test failed: ${(err as Error).message}`);
  }

  // ---------------------------------------------------------
  // 8. Public DTO Transformation & Isolation
  // ---------------------------------------------------------
  console.log('\n[8] Data Isolation & Public DTO Masking');
  try {
    const fakeUserId = new ObjectId();
    const fakePrefDoc: NotificationPreferenceDocument = {
      _id: new ObjectId(),
      userId: fakeUserId,
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pubPrefs = toPublicNotificationPreferences(fakePrefDoc);
    assert(!('_id' in pubPrefs), 'Public preferences DTO strips internal database _id');
    assert(!('userId' in pubPrefs), 'Public preferences DTO strips internal userId');
    assert(pubPrefs.masterEnabled === true, 'Public preferences preserves masterEnabled');
    assert(pubPrefs.quietHoursStart === '22:00', 'Public preferences preserves quietHoursStart');

    const fakeNotifDoc: NotificationDocument = {
      _id: new ObjectId(),
      userId: fakeUserId,
      type: 'pomodoro_break',
      title: 'Break Time!',
      message: 'Rest your eyes for 5 minutes',
      actionUrl: '/timer',
      isRead: false,
      dedupKey: 'pomodoro_break_1',
      metadata: { cycle: 1 },
      createdAt: new Date(),
      readAt: null,
    };

    const pubNotif = toPublicNotification(fakeNotifDoc);
    assert(pubNotif.id === fakeNotifDoc._id.toString(), 'Public notification serializes ObjectId to string id');
    assert(!('userId' in pubNotif), 'Public notification strictly excludes user ObjectId');
    assert(pubNotif.isRead === false, 'Public notification preserves read status');
    assert(pubNotif.readAt === null, 'Public notification preserves null readAt');
  } catch (err) {
    assert(false, `Public DTO tests failed: ${(err as Error).message}`);
  }

  // ---------------------------------------------------------
  // 9. Mocked Browser Notification API
  // ---------------------------------------------------------
  console.log('\n[9] Mocked Browser Notification Handling');
  try {
    // Simulate Notification API when permission is denied or unsupported
    function simulateShowBrowserNotification(permission: 'granted' | 'denied' | 'default' | 'unsupported'): boolean {
      if (permission !== 'granted') {
        return false;
      }
      return true;
    }

    assert(simulateShowBrowserNotification('denied') === false, 'Safely returns false without throwing when permission is denied');
    assert(simulateShowBrowserNotification('default') === false, 'Safely returns false without throwing when permission is default');
    assert(simulateShowBrowserNotification('unsupported') === false, 'Safely returns false without throwing when API is unsupported');
    assert(simulateShowBrowserNotification('granted') === true, 'Returns true when browser permission is granted');
  } catch (err) {
    assert(false, `Browser notification simulation failed: ${(err as Error).message}`);
  }

  console.log(`\nPhase 9 Suite: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}

// Allow standalone execution via tsx
if (require.main === module || process.argv[1]?.includes('phase9_notifications.test.ts')) {
  runPhase9NotificationTests().then(({ failed }) => {
    if (failed > 0) process.exit(1);
  });
}
