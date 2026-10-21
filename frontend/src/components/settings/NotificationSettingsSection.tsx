import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  Bell,
  Volume2,
  Moon,
  Clock,
  Globe,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Coffee,
  Target,
  ListTodo,
} from 'lucide-react';

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export const NotificationSettingsSection: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    permissionStatus,
    requestBrowserPermission,
    sendTestNotification,
    isQuietHoursActive,
  } = useNotifications();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    await updatePreferences({ [key]: value });
    showToast('Notification preferences updated');
  };

  const handleTimeChange = async (key: 'quietHoursStart' | 'quietHoursEnd' | 'preferredReminderTime', value: string) => {
    await updatePreferences({ [key]: value });
    showToast('Reminder schedule updated');
  };

  const handleTimezoneChange = async (tz: string) => {
    await updatePreferences({ timezone: tz });
    showToast(`Timezone set to ${tz}`);
  };

  const handleEnableBrowserNotifications = async () => {
    setShowExplanationModal(false);
    const result = await requestBrowserPermission();
    if (result === 'granted') {
      showToast('Browser notifications enabled successfully!');
    } else if (result === 'denied') {
      showToast('Permission was denied in browser settings.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold animate-fade-in border border-emerald-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Permission Pre-Explanation Modal */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Enable Study Reminders?</h3>
                <p className="text-xs text-slate-500">Stay on track without constantly watching the clock</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Pomodoro Alerts:</strong> Gentle chime & notification when your study interval or break ends.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Goal & Streak Protection:</strong> Helpful prompt if your daily study goal is incomplete.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Quiet Hours Respected:</strong> All optional alerts are muted during your configured sleep hours.</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowExplanationModal(false)}>
                Not Now
              </Button>
              <Button size="sm" onClick={handleEnableBrowserNotifications}>
                Continue & Allow
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Notification Settings Card */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Bell className="w-5 h-5 text-emerald-600" />
              <span>Smart Notifications & Reminders</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                {preferences.masterEnabled ? 'All Notifications Enabled' : 'Reminders Silenced'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.masterEnabled}
                  onChange={(e) => handleToggle('masterEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        }
        subtitle="Configure study session reminders, break alerts, audio chimes, and quiet hours"
      >
        <div className={`space-y-6 ${!preferences.masterEnabled ? 'opacity-60 pointer-events-none' : ''}`}>
          
          {/* Master status banner if disabled */}
          {!preferences.masterEnabled && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Master toggle is OFF. All optional reminders, break alerts, and sounds are currently silenced.</span>
            </div>
          )}

          {/* Delivery Channels: Browser Notifications & Audio Chimes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Browser Notifications Channel */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Desktop Notifications</h4>
                      <p className="text-[11px] text-slate-500">Native browser popups</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      permissionStatus === 'granted'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : permissionStatus === 'denied'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {permissionStatus === 'granted'
                      ? 'Permitted'
                      : permissionStatus === 'denied'
                      ? 'Blocked'
                      : 'Not Allowed'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  Receive break-end and goal alerts even when this tab is running in the background.
                </p>

                {permissionStatus === 'denied' && (
                  <p className="text-[11px] text-rose-600 mt-2 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    To enable notifications, click the tune/lock icon in your browser URL address bar and change Notifications to <strong>Allow</strong>.
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {permissionStatus !== 'granted' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowExplanationModal(true)}
                    className="w-full text-xs"
                  >
                    Enable Browser Notifications
                  </Button>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-medium text-slate-600">Active</span>
                    <Button size="sm" variant="ghost" onClick={sendTestNotification} className="text-xs">
                      Send Test
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Sound Alerts Channel */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Audio Chimes</h4>
                      <p className="text-[11px] text-slate-500">Synthesized Web Audio</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.soundEnabled}
                      onChange={(e) => handleToggle('soundEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  Gentle, harmonious synthesized audio chimes for interval completions and study reminders. No audio files needed.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Sample audio alert</span>
                <Button size="sm" variant="outline" onClick={sendTestNotification} className="text-xs">
                  Test Sound
                </Button>
              </div>
            </div>
          </div>

          {/* Reminder Categories & Types */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Study Reminders & Event Triggers
            </h4>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
              {/* Pomodoro Breaks */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Pomodoro Break Alerts</h5>
                    <p className="text-[11px] text-slate-500">Notify when focus interval ends so you can take a breather</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.pomodoroBreakReminders}
                  onChange={(e) => handleToggle('pomodoroBreakReminders', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {/* Break-End */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Break-End Alerts</h5>
                    <p className="text-[11px] text-slate-500">Notify when your rest period finishes so you can resume studying</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.breakEndReminders}
                  onChange={(e) => handleToggle('breakEndReminders', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {/* Daily Goal Reminder */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Daily Study Goal Reminder</h5>
                    <p className="text-[11px] text-slate-500">Prompt if you haven't hit your target hours by your reminder time</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.dailyGoalReminders}
                  onChange={(e) => handleToggle('dailyGoalReminders', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {/* Task Deadline Reminders */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Task Deadline Reminders</h5>
                    <p className="text-[11px] text-slate-500">Notify when incomplete academic tasks are due within 24 hours</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.taskDeadlineReminders}
                  onChange={(e) => handleToggle('taskDeadlineReminders', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {/* Daily Study Summary */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Daily Study Summary</h5>
                    <p className="text-[11px] text-slate-500">Evening recap of completed focus minutes, sessions, and tasks</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.dailySummaryReminders}
                  onChange={(e) => handleToggle('dailySummaryReminders', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {/* Study Session Start Reminders */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Session Start Reminders</h5>
                    <p className="text-[11px] text-slate-500">Actionable reminders to start a focused study block</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.studySessionReminders}
                  onChange={(e) => handleToggle('studySessionReminders', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Quiet Hours Configuration */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Quiet Hours</span>
                    {isQuietHoursActive && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                        Currently Active
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500">Silence optional reminders during sleep or rest</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.quietHoursEnabled}
                  onChange={(e) => handleToggle('quietHoursEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {preferences.quietHoursEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Quiet Hours Start
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Quiet Hours End
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2 text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Note: </span>
                  Quiet hours crossing midnight (such as 10:00 PM to 7:00 AM) are supported seamlessly. Reminders will be silenced during this window.
                </div>
              </div>
            )}
          </div>

          {/* Timing & Timezone Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preferred Reminder Time */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800">Preferred Daily Goal Time</h4>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                When you'd like your daily goal reminder to prompt you if target hours are incomplete.
              </p>
              <input
                type="time"
                value={preferences.preferredReminderTime}
                onChange={(e) => handleTimeChange('preferredReminderTime', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Timezone Selector */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800">User Timezone</h4>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Used to accurately calculate quiet hours and reminder schedules.
              </p>
              <select
                value={preferences.timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {!COMMON_TIMEZONES.includes(preferences.timezone) && (
                  <option value={preferences.timezone}>{preferences.timezone} (Detected)</option>
                )}
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </Card>
    </div>
  );
};
