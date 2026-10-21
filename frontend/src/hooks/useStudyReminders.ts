import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useSessions } from '../contexts/SessionContext';
import { useTasks } from '../contexts/TaskContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatTimeInTimezone, formatDateInTimezone } from '../utils/quietHours';

/**
 * Smart Study Reminders Hook
 * Runs periodically to evaluate daily goal progress, task deadlines, and daily summaries.
 */
export function useStudyReminders() {
  const { preferences, dispatchNotification, isQuietHoursActive } = useNotifications();
  const { sessions } = useSessions();
  const { tasks } = useTasks();
  const { settings } = useSettings();

  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!preferences.masterEnabled || isQuietHoursActive) {
      return;
    }

    const runRemindersCheck = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        const now = new Date();
        const timezone = preferences.timezone || 'UTC';
        const currentTime = formatTimeInTimezone(now, timezone);
        const todayDate = formatDateInTimezone(now, timezone);

        // -------------------------------------------------------------
        // A. Daily Study Goal Reminder
        // -------------------------------------------------------------
        if (preferences.dailyGoalReminders) {
          const targetMinutes = settings.dailyTargetHours * 60;

          // Compute today's focus minutes from recorded sessions
          const todaySessions = sessions.filter((s) => {
            if (!s.completedAt) return false;
            const sessionDate = formatDateInTimezone(new Date(s.completedAt), timezone);
            return sessionDate === todayDate;
          });

          const completedSeconds = todaySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
          const completedMinutes = Math.floor(completedSeconds / 60);

          // Only trigger if goal has NOT been achieved yet and time is past preferred reminder time
          if (completedMinutes < targetMinutes && currentTime >= preferences.preferredReminderTime) {
            const remaining = targetMinutes - completedMinutes;
            await dispatchNotification({
              type: 'goal_reminder',
              title: 'Daily Study Goal Reminder',
              message: `You've logged ${completedMinutes}m of your ${targetMinutes}m target today. Only ${remaining}m remaining to hit your goal!`,
              actionUrl: '/timer',
              dedupKey: `daily_goal_${todayDate}`,
              metadata: { targetMinutes, completedMinutes, remainingMinutes: remaining },
            });
          }
        }

        // -------------------------------------------------------------
        // B. Task Deadline Reminders
        // -------------------------------------------------------------
        if (preferences.taskDeadlineReminders) {
          const incompleteTasks = tasks.filter((t) => !t.completed && t.dueDate);

          for (const task of incompleteTasks) {
            if (!task.dueDate) continue;

            const dueDate = new Date(task.dueDate);
            const diffMs = dueDate.getTime() - now.getTime();
            const hoursRemaining = diffMs / (1000 * 60 * 60);

            // Notify if due within 24 hours and not yet overdue by more than 2 hours
            if (hoursRemaining > 0 && hoursRemaining <= 24) {
              const displayTime =
                hoursRemaining < 1
                  ? `${Math.max(1, Math.round(hoursRemaining * 60))} minutes`
                  : `${Math.round(hoursRemaining)} hours`;

              await dispatchNotification({
                type: 'task_deadline',
                title: 'Task Deadline Approaching',
                message: `Task "${task.title}" is due in approximately ${displayTime}.`,
                actionUrl: '/tasks',
                dedupKey: `task_deadline_${task.id}_${task.dueDate}`,
                metadata: { taskId: task.id, dueDate: task.dueDate },
              });
            }
          }
        }

        // -------------------------------------------------------------
        // C. Daily Study Summary Reminder
        // -------------------------------------------------------------
        if (preferences.dailySummaryReminders) {
          // Trigger after 21:00 (9 PM)
          if (currentTime >= '21:00') {
            const todaySessions = sessions.filter((s) => {
              if (!s.completedAt) return false;
              const sessionDate = formatDateInTimezone(new Date(s.completedAt), timezone);
              return sessionDate === todayDate;
            });

            const completedSeconds = todaySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
            const completedMinutes = Math.floor(completedSeconds / 60);

            const completedTasksToday = tasks.filter((t) => {
              if (!t.completed || !t.completedAt) return false;
              const taskDate = formatDateInTimezone(new Date(t.completedAt), timezone);
              return taskDate === todayDate;
            }).length;

            await dispatchNotification({
              type: 'daily_summary',
              title: 'Daily Study Summary',
              message: `Today's summary: ${completedMinutes}m focus logged across ${todaySessions.length} sessions, with ${completedTasksToday} tasks finished!`,
              actionUrl: '/analytics',
              dedupKey: `daily_summary_${todayDate}`,
              metadata: { completedMinutes, sessionsCount: todaySessions.length, completedTasksCount: completedTasksToday },
            });
          }
        }
      } catch (err) {
        console.warn('Error evaluating study reminders:', err);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Run immediately on mount, then check every 60 seconds
    runRemindersCheck();
    const interval = setInterval(runRemindersCheck, 60000);

    return () => clearInterval(interval);
  }, [
    preferences.masterEnabled,
    preferences.dailyGoalReminders,
    preferences.taskDeadlineReminders,
    preferences.dailySummaryReminders,
    preferences.preferredReminderTime,
    preferences.timezone,
    isQuietHoursActive,
    sessions,
    tasks,
    settings.dailyTargetHours,
    dispatchNotification,
  ]);
}
