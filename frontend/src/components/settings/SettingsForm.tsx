import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useSettings } from '../../contexts/SettingsContext';
import { useSessions } from '../../contexts/SessionContext';
import { useTasks } from '../../contexts/TaskContext';
import { soundAlerts } from '../../utils/soundAlerts';
import { TimerMode, UserSettings } from '../../types';
import {
  Target,
  Sliders,
  Volume2,
  Palette,
  Database,
  CheckCircle2,
  Download,
  RotateCcw,
  Trash2,
  Zap,
  Hourglass,
  Clock,
} from 'lucide-react';
import { NotificationSettingsSection } from './NotificationSettingsSection';

export const SettingsForm: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { sessions, resetDemoSessions, clearSessions } = useSessions();
  const { tasks, resetDemoTasks } = useTasks();
  const [saveToast, setSaveToast] = useState(false);

  const handleTargetChange = (hours: number) => {
    updateSettings({ dailyTargetHours: hours });
    triggerSaveToast();
  };

  const handleModeChange = (mode: TimerMode) => {
    updateSettings({ preferredTimerMode: mode });
    triggerSaveToast();
  };

  const triggerSaveToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleTestSound = () => {
    soundAlerts.playCompletionChime();
  };

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      settings,
      sessions,
      tasks,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `study_discipline_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset study tasks and session history back to default demo data?')) {
      resetDemoSessions();
      resetDemoTasks();
      alert('Demo data restored successfully.');
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete all recorded sessions and reset data? This cannot be undone.')) {
      clearSessions();
      alert('Local session history cleared.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved to local storage</span>
        </div>
      )}

      {/* Daily Study Goal */}
      <Card
        title={
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Target className="w-5 h-5 text-emerald-600" />
            <span>Daily Study Goal</span>
          </div>
        }
        subtitle="Set your target daily focused hours to build continuous study discipline"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Daily Target:</span>
            <span className="text-xl font-extrabold text-emerald-600">
              {settings.dailyTargetHours} Hours / day
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={12}
            step={0.5}
            value={settings.dailyTargetHours}
            onChange={(e) => handleTargetChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />

          <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
            <span>1 Hour</span>
            <span>4 Hours (Recommended)</span>
            <span>8 Hours</span>
            <span>12 Hours</span>
          </div>
        </div>
      </Card>

      {/* Timer Preferences & Intervals */}
      <Card
        title={
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <span>Timer & Pomodoro Defaults</span>
          </div>
        }
        subtitle="Customize duration presets for focus intervals and rest periods"
      >
        <div className="space-y-6">
          {/* Default Mode Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Default Timer Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { mode: 'pomodoro' as TimerMode, label: 'Pomodoro (25/5)', desc: '25m focus + 5m break', icon: Zap },
                { mode: 'countdown' as TimerMode, label: 'Countdown Timer', desc: 'Customizable target duration', icon: Hourglass },
                { mode: 'stopwatch' as TimerMode, label: 'Stopwatch', desc: 'Continuous open-ended count-up', icon: Clock },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = settings.preferredTimerMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => handleModeChange(item.mode)}
                    className={`p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'clay-btn-white !text-emerald-950 border-2 border-emerald-500 shadow-md scale-[1.02] ring-2 ring-emerald-500/20'
                        : 'clay-btn-white text-slate-700 border-2 border-white/90 hover:scale-[1.01] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4 fill-current" />
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          isSelected
                            ? 'bg-emerald-500 shadow-xs ring-2 ring-emerald-200'
                            : 'border-2 border-slate-300'
                        }`}
                      />
                    </div>

                    <div>
                      <p className={`text-xs font-black tracking-tight ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pomodoro Duration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Focus Duration
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={settings.pomodoroWorkMinutes}
                  onChange={(e) => {
                    updateSettings({ pomodoroWorkMinutes: parseInt(e.target.value) || 25 });
                    triggerSaveToast();
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">min</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Short Break
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.pomodoroShortBreakMinutes}
                  onChange={(e) => {
                    updateSettings({ pomodoroShortBreakMinutes: parseInt(e.target.value) || 5 });
                    triggerSaveToast();
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">min</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Long Break
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={settings.pomodoroLongBreakMinutes}
                  onChange={(e) => {
                    updateSettings({ pomodoroLongBreakMinutes: parseInt(e.target.value) || 15 });
                    triggerSaveToast();
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">min</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Audio & Alert Settings */}
      <Card
        title={
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Volume2 className="w-5 h-5 text-emerald-600" />
            <span>Audio & Automation</span>
          </div>
        }
        subtitle="Manage auditory completion alerts and automated transitions"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Sound Alerts</h4>
              <p className="text-xs text-slate-500">Play gentle synthesized audio chime when a focus session or break ends</p>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" onClick={handleTestSound}>
                Test Chime
              </Button>
              <input
                type="checkbox"
                checked={settings.soundAlerts}
                onChange={(e) => {
                  updateSettings({ soundAlerts: e.target.checked });
                  triggerSaveToast();
                }}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Auto-Start Breaks</h4>
              <p className="text-xs text-slate-500">Automatically start countdown for short or long rest breaks after focus work</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoStartBreaks}
              onChange={(e) => {
                updateSettings({ autoStartBreaks: e.target.checked });
                triggerSaveToast();
              }}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Auto-Start Focus After Break</h4>
              <p className="text-xs text-slate-500">Automatically begin next focus block when break countdown finishes</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoStartPomodoro}
              onChange={(e) => {
                updateSettings({ autoStartPomodoro: e.target.checked });
                triggerSaveToast();
              }}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* Phase 9 Smart Notifications & Reminders */}
      <NotificationSettingsSection />

      {/* Theme Accent Settings */}
      <Card
        title={
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Palette className="w-5 h-5 text-emerald-600" />
            <span>Theme Accent Palette</span>
          </div>
        }
        subtitle="Subtle green and herbal accent highlights"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'emerald', label: 'Subtle Emerald', color: '#16a34a', bg: 'bg-emerald-600' },
            { id: 'forest', label: 'Deep Forest', color: '#15803d', bg: 'bg-emerald-800' },
            { id: 'sage', label: 'Sage Herbal', color: '#5e8965', bg: 'bg-green-700' },
            { id: 'teal', label: 'Clean Teal', color: '#0d9488', bg: 'bg-teal-600' },
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                updateSettings({ themeAccent: theme.id as UserSettings['themeAccent'] });
                triggerSaveToast();
              }}
              className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                settings.themeAccent === theme.id
                  ? 'border-emerald-500 bg-emerald-50/70 font-semibold'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className={`w-4 h-4 rounded-full ${theme.bg} shrink-0 shadow-xs`} />
              <span className="text-xs text-slate-800 font-medium">{theme.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Local Storage & Data Management */}
      <Card
        title={
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>Data Management & Backup</span>
          </div>
        }
        subtitle="All Study Discipline data is stored securely in your browser's LocalStorage"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            icon={<Download className="w-4 h-4" />}
          >
            Export Backup (JSON)
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetDemoData}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Reset Demo Data
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleClearAllData}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Clear All History
          </Button>
        </div>
      </Card>
    </div>
  );
};
