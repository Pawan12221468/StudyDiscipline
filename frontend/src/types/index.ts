export type TimerMode = 'stopwatch' | 'countdown' | 'pomodoro';

export type PomodoroPhase = 'work' | 'short_break' | 'long_break';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface ActiveTimerData {
  mode: TimerMode;
  status: TimerStatus;
  // Timestamp-based calculation keys
  startTime: number | null; // Timestamp (Date.now()) of current running block
  accumulatedMs: number;    // Accumulated ms before current running block
  targetSeconds: number;    // Target countdown or pomodoro duration in seconds
  pomodoroPhase: PomodoroPhase;
  pomodoroCycles: number;   // Completed work sessions
  subject: string;
  taskId?: string;
  taskTitle?: string;
  sessionNotes?: string;
  backendSessionId?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface StudySession {
  id: string;
  title: string;
  subject: string;
  durationSeconds: number;
  mode: TimerMode;
  completedAt: string; // ISO String
  notes?: string;
  taskId?: string;
  taskTitle?: string;
  isDemo?: boolean;
}

export interface UserSettings {
  dailyTargetHours: number;
  preferredTimerMode: TimerMode;
  pomodoroWorkMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  pomodoroLongBreakInterval: number;
  soundAlerts: boolean;
  autoStartBreaks: boolean;
  autoStartPomodoro: boolean;
  themeAccent: 'emerald' | 'forest' | 'sage' | 'teal';
}

export interface StudySubject {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export interface DailyStudyLog {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  actualHours: number;
  targetHours: number;
  sessionsCount: number;
  isDemo?: boolean;
}
