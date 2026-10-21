import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ActiveTimerData, TimerMode, PomodoroPhase, TimerStatus, StudyTask } from '../types';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { soundAlerts } from '../utils/soundAlerts';
import { useSettings } from './SettingsContext';
import { useSessions } from './SessionContext';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { sessionService } from '../services/sessionService';
import confetti from 'canvas-confetti';

interface TimerContextType {
  timer: ActiveTimerData;
  elapsedMs: number;
  remainingMs: number;
  progressPercent: number;
  isRunning: boolean;
  isPaused: boolean;
  isIdle: boolean;
  isCompleted: boolean;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  reset: () => Promise<void>;
  finish: (
    customTitle?: string,
    notes?: string,
    monitoringSummary?: {
      totalMonitoredSeconds: number;
      personPresentPercent: number;
      absenceIncidentCount: number;
      phoneVisibleCount: number;
    }
  ) => Promise<void>;

  skipBreak: () => void;
  setMode: (mode: TimerMode, durationMinutes?: number) => void;
  setCountdownDuration: (minutes: number) => void;
  setSubject: (subject: string) => void;
  linkTask: (task: StudyTask) => void;
  unlinkTask: () => void;
  showFinishModal: boolean;
  setShowFinishModal: (show: boolean) => void;
  isSyncing: boolean;
}

const DEFAULT_TIMER_STATE: ActiveTimerData = {
  mode: 'pomodoro',
  status: 'idle',
  startTime: null,
  accumulatedMs: 0,
  targetSeconds: 25 * 60,
  pomodoroPhase: 'work',
  pomodoroCycles: 0,
  subject: 'Mathematics',
  taskId: undefined,
  taskTitle: undefined,
  sessionNotes: '',
  backendSessionId: undefined,
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const { addSession, refreshSessions } = useSessions();
  const { isAuthenticated } = useAuth();
  const { dispatchNotification } = useNotifications();

  const [timer, setTimer] = useState<ActiveTimerData>(() => {
    const saved = getFromStorage<ActiveTimerData>(STORAGE_KEYS.ACTIVE_TIMER, DEFAULT_TIMER_STATE);
    return saved || DEFAULT_TIMER_STATE;
  });

  const [now, setNow] = useState<number>(Date.now());
  const [showFinishModal, setShowFinishModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const intervalRef = useRef<number | null>(null);
  const isActionLockedRef = useRef<boolean>(false);

  // Synchronize timer state with LocalStorage for offline fallback
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TIMER, timer);
  }, [timer]);

  // Recover active session from MongoDB backend on initial load / login
  useEffect(() => {
    let isCancelled = false;

    async function recoverBackendSession() {
      if (!isAuthenticated) return;
      setIsSyncing(true);

      try {
        const { session, elapsedMs } = await sessionService.getActiveSession();
        if (isCancelled) return;

        if (session) {
          const isRunning = session.status === 'running';
          const startTime = isRunning && session.lastResumedAt ? new Date(session.lastResumedAt).getTime() : null;

          setTimer((prev) => ({
            ...prev,
            backendSessionId: session.id,
            mode: session.sessionType,
            status: session.status as TimerStatus,
            subject: session.subject,
            targetSeconds: session.targetDurationSeconds || prev.targetSeconds,
            pomodoroPhase: session.pomodoroPhase || 'work',
            pomodoroCycles: session.pomodoroCycles || 0,
            accumulatedMs: session.accumulatedDurationMs,
            startTime,
            taskId: session.taskId || prev.taskId,
          }));
        }
      } catch (err) {
        console.warn('Could not recover backend session:', err);
      } finally {
        if (!isCancelled) setIsSyncing(false);
      }
    }

    recoverBackendSession();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  // Timestamp-based calculation functions
  const calculateElapsedMs = useCallback((t: ActiveTimerData, currentTime: number): number => {
    if (t.status === 'running' && t.startTime !== null) {
      return t.accumulatedMs + Math.max(0, currentTime - t.startTime);
    }
    return t.accumulatedMs;
  }, []);

  const calculateRemainingMs = useCallback((t: ActiveTimerData, currentTime: number): number => {
    if (t.mode === 'stopwatch') return 0;
    const targetMs = t.targetSeconds * 1000;
    const elapsed = calculateElapsedMs(t, currentTime);
    return Math.max(0, targetMs - elapsed);
  }, [calculateElapsedMs]);

  // Derived states
  const elapsedMs = calculateElapsedMs(timer, now);
  const remainingMs = calculateRemainingMs(timer, now);

  const progressPercent = Math.min(
    100,
    timer.mode === 'stopwatch'
      ? (elapsedMs / (3600 * 1000)) * 100
      : timer.targetSeconds > 0
      ? (elapsedMs / (timer.targetSeconds * 1000)) * 100
      : 0
  );

  const isRunning = timer.status === 'running';
  const isPaused = timer.status === 'paused';
  const isIdle = timer.status === 'idle';
  const isCompleted = timer.status === 'completed';

  // Handle timer completion for Pomodoro or Countdown
  const handleTimerComplete = useCallback(async (finishedTimer: ActiveTimerData) => {
    if (settings.soundAlerts) {
      soundAlerts.playCompletionChime();
    }
    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#16a34a', '#22c55e', '#4ade80', '#10b981'],
      });
    } catch {
      // Confetti fallback
    }

    if (finishedTimer.mode === 'pomodoro') {
      if (finishedTimer.pomodoroPhase === 'work') {
        // Complete current work session on backend
        if (finishedTimer.backendSessionId && isAuthenticated) {
          try {
            await sessionService.finishSession(finishedTimer.backendSessionId, {
              title: finishedTimer.taskTitle ? `Pomodoro: ${finishedTimer.taskTitle}` : `Pomodoro Focus (${finishedTimer.subject})`,
              notes: finishedTimer.sessionNotes || 'Completed 25m Pomodoro focus session.',
            });
            await refreshSessions();
          } catch (err) {
            console.error('Error completing pomodoro session on backend:', err);
          }
        }

        // Add to local state
        addSession({
          title: finishedTimer.taskTitle ? `Pomodoro: ${finishedTimer.taskTitle}` : `Pomodoro Focus (${finishedTimer.subject})`,
          subject: finishedTimer.subject,
          durationSeconds: finishedTimer.targetSeconds,
          mode: 'pomodoro',
          taskId: finishedTimer.taskId,
          taskTitle: finishedTimer.taskTitle,
          notes: finishedTimer.sessionNotes || 'Completed 25m Pomodoro focus session.',
        });

        const newCycles = finishedTimer.pomodoroCycles + 1;
        const isLongBreak = newCycles % settings.pomodoroLongBreakInterval === 0;
        const nextPhase: PomodoroPhase = isLongBreak ? 'long_break' : 'short_break';
        const nextTargetSeconds = (isLongBreak ? settings.pomodoroLongBreakMinutes : settings.pomodoroShortBreakMinutes) * 60;

        // Dispatch Pomodoro break alert
        dispatchNotification({
          type: 'pomodoro_break',
          title: 'Focus Interval Complete!',
          message: isLongBreak
            ? `Cycle ${newCycles} finished! Time for a well-deserved ${settings.pomodoroLongBreakMinutes}m long break.`
            : `Focus session complete! Take a ${settings.pomodoroShortBreakMinutes}m short break to rest your eyes.`,
          actionUrl: '/timer',
          dedupKey: `pomodoro_break_${Date.now()}`,
          metadata: { cycles: newCycles, phase: nextPhase },
        });

        setTimer((prev) => ({
          ...prev,
          backendSessionId: undefined,
          pomodoroPhase: nextPhase,
          pomodoroCycles: newCycles,
          targetSeconds: nextTargetSeconds,
          accumulatedMs: 0,
          startTime: settings.autoStartBreaks ? Date.now() : null,
          status: settings.autoStartBreaks ? 'running' : 'idle',
        }));
      } else {
        // Break finished -> switch to work
        dispatchNotification({
          type: 'break_end',
          title: 'Break Ended!',
          message: 'Break period finished! Ready to resume your focused study session?',
          actionUrl: '/timer',
          dedupKey: `break_end_${Date.now()}`,
        });

        setTimer((prev) => ({
          ...prev,
          backendSessionId: undefined,
          pomodoroPhase: 'work',
          targetSeconds: settings.pomodoroWorkMinutes * 60,
          accumulatedMs: 0,
          startTime: settings.autoStartPomodoro ? Date.now() : null,
          status: settings.autoStartPomodoro ? 'running' : 'idle',
        }));
      }
    } else if (finishedTimer.mode === 'countdown') {
      // Countdown completed
      dispatchNotification({
        type: 'session_reminder',
        title: 'Target Time Achieved!',
        message: `Your countdown session for ${finishedTimer.subject} is finished! Review and save your session.`,
        actionUrl: '/timer',
        dedupKey: `countdown_finish_${Date.now()}`,
      });

      setTimer((prev) => ({
        ...prev,
        status: 'completed',
        startTime: null,
        accumulatedMs: prev.targetSeconds * 1000,
      }));
      setShowFinishModal(true);
    }
  }, [settings, addSession, refreshSessions, isAuthenticated, dispatchNotification]);

  // Main UI update interval (100ms for smooth display)
  useEffect(() => {
    if (timer.status === 'running') {
      intervalRef.current = window.setInterval(() => {
        const currentNow = Date.now();
        setNow(currentNow);

        if (timer.mode !== 'stopwatch') {
          const remaining = calculateRemainingMs(timer, currentNow);
          if (remaining <= 0) {
            handleTimerComplete(timer);
          }
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setNow(Date.now());
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer, calculateRemainingMs, handleTimerComplete]);

  // Timer Actions with Backend Synchronization & Duplicate Guards
  const start = async () => {
    if (isActionLockedRef.current) return;
    isActionLockedRef.current = true;
    soundAlerts.playSoftTick();

    const startTime = Date.now();

    // Optimistic local update
    setTimer((prev) => ({
      ...prev,
      status: 'running',
      startTime,
    }));

    if (isAuthenticated) {
      try {
        const res = await sessionService.createSession({
          sessionType: timer.mode,
          subject: timer.subject,
          title: timer.taskTitle ? `Focus: ${timer.taskTitle}` : undefined,
          targetDurationSeconds: timer.mode !== 'stopwatch' ? timer.targetSeconds : undefined,
          pomodoroPhase: timer.mode === 'pomodoro' ? timer.pomodoroPhase : undefined,
          pomodoroCycles: timer.pomodoroCycles,
          taskId: timer.taskId,
        });

        if (res?.session?.id) {
          setTimer((prev) => ({
            ...prev,
            backendSessionId: res.session.id,
          }));
        }
      } catch (err: any) {
        if (err.data?.activeSession?.id) {
          // If already active on backend, link session ID safely
          setTimer((prev) => ({
            ...prev,
            backendSessionId: err.data.activeSession.id,
          }));
        }
      }
    }

    isActionLockedRef.current = false;
  };

  const pause = async () => {
    if (isActionLockedRef.current) return;
    isActionLockedRef.current = true;
    soundAlerts.playSoftTick();

    const currentStartTime = timer.startTime;
    const added = currentStartTime ? Date.now() - currentStartTime : 0;
    const newAccumulated = timer.accumulatedMs + added;

    setTimer((prev) => ({
      ...prev,
      status: 'paused',
      startTime: null,
      accumulatedMs: newAccumulated,
    }));

    if (isAuthenticated && timer.backendSessionId) {
      try {
        await sessionService.pauseSession(timer.backendSessionId);
      } catch (err) {
        console.warn('Backend pause failed:', err);
      }
    }

    isActionLockedRef.current = false;
  };

  const resume = async () => {
    if (isActionLockedRef.current) return;
    isActionLockedRef.current = true;
    soundAlerts.playSoftTick();

    const startTime = Date.now();

    setTimer((prev) => ({
      ...prev,
      status: 'running',
      startTime,
    }));

    if (isAuthenticated && timer.backendSessionId) {
      try {
        await sessionService.resumeSession(timer.backendSessionId);
      } catch (err) {
        console.warn('Backend resume failed:', err);
      }
    }

    isActionLockedRef.current = false;
  };

  const reset = async () => {
    soundAlerts.playSoftTick();

    const activeBackendId = timer.backendSessionId;

    setTimer((prev) => ({
      ...prev,
      status: 'idle',
      startTime: null,
      accumulatedMs: 0,
      backendSessionId: undefined,
    }));

    if (isAuthenticated && activeBackendId) {
      try {
        await sessionService.abandonSession(activeBackendId);
      } catch (err) {
        console.warn('Backend abandon failed:', err);
      }
    }
  };

  const finish = async (
    customTitle?: string,
    notes?: string,
    monitoringSummary?: {
      totalMonitoredSeconds: number;
      personPresentPercent: number;
      absenceIncidentCount: number;
      phoneVisibleCount: number;
    }
  ) => {
    const totalSecs = Math.max(1, Math.floor(elapsedMs / 1000));
    const title = customTitle || (timer.taskTitle ? `Focus: ${timer.taskTitle}` : `${timer.subject} Study Session`);
    const activeBackendId = timer.backendSessionId;

    // 1. Sync finish to backend if authenticated
    if (isAuthenticated && activeBackendId) {
      try {
        await sessionService.finishSession(activeBackendId, {
          title,
          notes: notes || timer.sessionNotes || '',
          monitoringSummary,
        });
        await refreshSessions();
      } catch (err) {
        console.warn('Backend finish sync error:', err);
      }
    }


    // 2. Add to local session state
    addSession({
      title,
      subject: timer.subject,
      durationSeconds: totalSecs,
      mode: timer.mode,
      taskId: timer.taskId,
      taskTitle: timer.taskTitle,
      notes: notes || timer.sessionNotes || '',
    });

    if (settings.soundAlerts) {
      soundAlerts.playCompletionChime();
    }

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#16a34a', '#22c55e', '#3b82f6'],
      });
    } catch {
      // Confetti fallback
    }

    setShowFinishModal(false);
    reset();
  };

  const skipBreak = () => {
    if (timer.mode === 'pomodoro' && (timer.pomodoroPhase === 'short_break' || timer.pomodoroPhase === 'long_break')) {
      setTimer((prev) => ({
        ...prev,
        pomodoroPhase: 'work',
        targetSeconds: settings.pomodoroWorkMinutes * 60,
        accumulatedMs: 0,
        startTime: null,
        status: 'idle',
        backendSessionId: undefined,
      }));
    }
  };

  const setMode = (mode: TimerMode, durationMinutes?: number) => {
    let target = 25 * 60;
    if (mode === 'pomodoro') {
      target = settings.pomodoroWorkMinutes * 60;
    } else if (mode === 'countdown') {
      target = (durationMinutes || 25) * 60;
    } else {
      target = 0;
    }

    setTimer((prev) => ({
      ...prev,
      mode,
      targetSeconds: target,
      status: 'idle',
      startTime: null,
      accumulatedMs: 0,
      pomodoroPhase: 'work',
      backendSessionId: undefined,
    }));
  };

  const setCountdownDuration = (minutes: number) => {
    const validMinutes = Math.max(1, Math.min(360, minutes));
    setTimer((prev) => ({
      ...prev,
      mode: 'countdown',
      targetSeconds: validMinutes * 60,
      status: 'idle',
      startTime: null,
      accumulatedMs: 0,
      backendSessionId: undefined,
    }));
  };

  const setSubject = (subject: string) => {
    setTimer((prev) => ({ ...prev, subject }));
  };

  const linkTask = (task: StudyTask) => {
    const targetSeconds = (task.estimatedMinutes || 25) * 60;
    setTimer((prev) => ({
      ...prev,
      subject: task.subject,
      taskId: task.id,
      taskTitle: task.title,
      targetSeconds: prev.mode === 'countdown' ? targetSeconds : prev.targetSeconds,
    }));
  };

  const unlinkTask = () => {
    setTimer((prev) => ({
      ...prev,
      taskId: undefined,
      taskTitle: undefined,
    }));
  };

  return (
    <TimerContext.Provider
      value={{
        timer,
        elapsedMs,
        remainingMs,
        progressPercent,
        isRunning,
        isPaused,
        isIdle,
        isCompleted,
        start,
        pause,
        resume,
        reset,
        finish,
        skipBreak,
        setMode,
        setCountdownDuration,
        setSubject,
        linkTask,
        unlinkTask,
        showFinishModal,
        setShowFinishModal,
        isSyncing,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
