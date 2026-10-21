import { StudySubject, StudyTask, StudySession, UserSettings, DailyStudyLog } from '../types';

export const STUDY_SUBJECTS: StudySubject[] = [
  { id: 'math', name: 'Mathematics', color: '#16a34a', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' , badgeText: 'text-emerald-700' },
  { id: 'cs', name: 'Computer Science', color: '#2563eb', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200', badgeText: 'text-blue-700' },
  { id: 'physics', name: 'Physics', color: '#7c3aed', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200', badgeText: 'text-purple-700' },
  { id: 'biology', name: 'Biology', color: '#0d9488', badgeBg: 'bg-teal-50 text-teal-700 border-teal-200', badgeText: 'text-teal-700' },
  { id: 'history', name: 'History', color: '#d97706', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200', badgeText: 'text-amber-700' },
  { id: 'literature', name: 'Literature', color: '#e11d48', badgeBg: 'bg-rose-50 text-rose-700 border-rose-200', badgeText: 'text-rose-700' },
  { id: 'general', name: 'General Study', color: '#475569', badgeBg: 'bg-slate-100 text-slate-700 border-slate-200', badgeText: 'text-slate-700' },
];

export const DEFAULT_SETTINGS: UserSettings = {
  dailyTargetHours: 4,
  preferredTimerMode: 'pomodoro',
  pomodoroWorkMinutes: 25,
  pomodoroShortBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  pomodoroLongBreakInterval: 4,
  soundAlerts: true,
  autoStartBreaks: false,
  autoStartPomodoro: false,
  themeAccent: 'emerald',
};

// Generate realistic dates for demo items (relative to current date)
const now = new Date();
const getIsoDateDaysAgo = (daysAgo: number, hoursOffset: number = 0): string => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursOffset);
  return d.toISOString();
};

export const INITIAL_DEMO_TASKS: StudyTask[] = [
  {
    id: 'demo-task-1',
    title: 'Linear Algebra: Eigenvalues & Vector Spaces',
    subject: 'Mathematics',
    priority: 'high',
    estimatedMinutes: 50,
    completed: false,
    dueDate: 'Today',
    notes: 'Cover Gilbert Strang lecture 21 exercises',
    createdAt: getIsoDateDaysAgo(1, 2),
    isDemo: true,
  },
  {
    id: 'demo-task-2',
    title: 'Operating Systems: Concurrency & Semaphores',
    subject: 'Computer Science',
    priority: 'urgent',
    estimatedMinutes: 60,
    completed: false,
    dueDate: 'Tomorrow',
    notes: 'Solve producer-consumer deadlock questions',
    createdAt: getIsoDateDaysAgo(1, 4),
    isDemo: true,
  },
  {
    id: 'demo-task-3',
    title: 'Classical Mechanics: Lagrangian Formulation',
    subject: 'Physics',
    priority: 'medium',
    estimatedMinutes: 45,
    completed: false,
    dueDate: 'In 2 days',
    notes: 'Derive equations of motion for double pendulum',
    createdAt: getIsoDateDaysAgo(2),
    isDemo: true,
  },
  {
    id: 'demo-task-4',
    title: 'Molecular Biology: DNA Polymerase & Replication',
    subject: 'Biology',
    priority: 'low',
    estimatedMinutes: 30,
    completed: true,
    completedAt: getIsoDateDaysAgo(0, 3),
    dueDate: 'Yesterday',
    notes: 'Completed practice flashcards with 95% recall',
    createdAt: getIsoDateDaysAgo(3),
    isDemo: true,
  },
  {
    id: 'demo-task-5',
    title: 'Modern European History: Post-War Reconstruction',
    subject: 'History',
    priority: 'medium',
    estimatedMinutes: 40,
    completed: true,
    completedAt: getIsoDateDaysAgo(0, 1),
    dueDate: 'Today',
    notes: 'Summarized Marshall Plan impacts and Cold War treaties',
    createdAt: getIsoDateDaysAgo(2, 5),
    isDemo: true,
  },
  {
    id: 'demo-task-6',
    title: 'Data Structures: Red-Black Tree Balancing Cases',
    subject: 'Computer Science',
    priority: 'high',
    estimatedMinutes: 50,
    completed: false,
    dueDate: 'Friday',
    notes: 'Implement left/right rotations and test balance invariants',
    createdAt: getIsoDateDaysAgo(0, 5),
    isDemo: true,
  },
];

export const INITIAL_DEMO_SESSIONS: StudySession[] = [
  {
    id: 'demo-sess-1',
    title: 'Morning Focus: Concurrency in Go',
    subject: 'Computer Science',
    durationSeconds: 3000, // 50 mins
    mode: 'countdown',
    completedAt: getIsoDateDaysAgo(0, 2),
    notes: 'High concentration. No distractions.',
    taskId: 'demo-task-2',
    taskTitle: 'Operating Systems: Concurrency & Semaphores',
    isDemo: true,
  },
  {
    id: 'demo-sess-2',
    title: 'Pomodoro Focus: Matrix Decomposition',
    subject: 'Mathematics',
    durationSeconds: 1500, // 25 mins
    mode: 'pomodoro',
    completedAt: getIsoDateDaysAgo(0, 4),
    notes: 'Solved 4 textbook problems.',
    taskId: 'demo-task-1',
    taskTitle: 'Linear Algebra: Eigenvalues & Vector Spaces',
    isDemo: true,
  },
  {
    id: 'demo-sess-3',
    title: 'Deep Work: Quantum Potential Wells',
    subject: 'Physics',
    durationSeconds: 3600, // 60 mins
    mode: 'countdown',
    completedAt: getIsoDateDaysAgo(1, 3),
    notes: 'Finished chapter 5 calculations.',
    isDemo: true,
  },
  {
    id: 'demo-sess-4',
    title: 'Pomodoro Session: Cold War Timeline',
    subject: 'History',
    durationSeconds: 1500,
    mode: 'pomodoro',
    completedAt: getIsoDateDaysAgo(1, 6),
    notes: 'Reviewed flashcards.',
    taskId: 'demo-task-5',
    taskTitle: 'Modern European History: Post-War Reconstruction',
    isDemo: true,
  },
  {
    id: 'demo-sess-5',
    title: 'Evening Stopwatch: Algorithm Profiling',
    subject: 'Computer Science',
    durationSeconds: 2700, // 45 mins
    mode: 'stopwatch',
    completedAt: getIsoDateDaysAgo(2, 4),
    notes: 'Benchmarked quicksort vs mergesort.',
    isDemo: true,
  },
  {
    id: 'demo-sess-6',
    title: 'Focus Sprint: Cell Division Phases',
    subject: 'Biology',
    durationSeconds: 1800, // 30 mins
    mode: 'countdown',
    completedAt: getIsoDateDaysAgo(3, 5),
    notes: 'Mitosis vs meiosis comparison diagrams.',
    taskId: 'demo-task-4',
    isDemo: true,
  },
  {
    id: 'demo-sess-7',
    title: 'Sunday Deep Session: Calculus Integrals',
    subject: 'Mathematics',
    durationSeconds: 4500, // 75 mins
    mode: 'stopwatch',
    completedAt: getIsoDateDaysAgo(4, 2),
    notes: 'Reviewed trigonometric substitutions.',
    isDemo: true,
  },
  {
    id: 'demo-sess-8',
    title: 'Pomodoro Cycle: Shakespeare Prose Analysis',
    subject: 'Literature',
    durationSeconds: 1500,
    mode: 'pomodoro',
    completedAt: getIsoDateDaysAgo(5, 3),
    notes: 'Close reading of Hamlet Act 3.',
    isDemo: true,
  },
  {
    id: 'demo-sess-9',
    title: 'Thermodynamics Problem Solving',
    subject: 'Physics',
    durationSeconds: 3600,
    mode: 'countdown',
    completedAt: getIsoDateDaysAgo(6, 4),
    notes: 'Entropy and heat engines review.',
    isDemo: true,
  },
];

// Helper to calculate weekly logs for Recharts
export function generateWeeklyStudyLogs(sessions: StudySession[], targetHours: number): DailyStudyLog[] {
  const days: DailyStudyLog[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = dayNames[d.getDay()];

    // Find sessions on this date
    const daySessions = sessions.filter((s) => {
      try {
        return s.completedAt.split('T')[0] === dateStr;
      } catch {
        return false;
      }
    });

    const totalSeconds = daySessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const actualHours = Math.round((totalSeconds / 3600) * 10) / 10;

    days.push({
      date: dateStr,
      dayLabel,
      actualHours,
      targetHours,
      sessionsCount: daySessions.length,
      isDemo: daySessions.every((s) => s.isDemo),
    });
  }

  return days;
}
