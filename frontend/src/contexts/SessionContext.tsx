import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { StudySession, DailyStudyLog } from '../types';
import { INITIAL_DEMO_SESSIONS, STUDY_SUBJECTS, generateWeeklyStudyLogs } from '../data/initialData';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { sessionService } from '../services/sessionService';

interface SubjectStat {
  name: string;
  seconds: number;
  hours: number;
  percentage: number;
  color: string;
  sessionsCount: number;
}

interface SessionContextType {
  sessions: StudySession[];
  isLoading: boolean;
  error: string | null;
  refreshSessions: () => Promise<void>;
  addSession: (session: Omit<StudySession, 'id' | 'completedAt'>) => StudySession;
  deleteSession: (id: string) => void;
  clearSessions: () => void;
  resetDemoSessions: () => void;
  todayFocusSeconds: number;
  todayTargetSeconds: number;
  todayProgressPercent: number;
  weeklyFocusSeconds: number;
  streakDays: number;
  subjectBreakdown: SubjectStat[];
  recentSessions: StudySession[];
  weeklyLogs: DailyStudyLog[];
  hasRealSessions: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();

  const [sessions, setSessions] = useState<StudySession[]>(() => {
    return getFromStorage<StudySession[]>(STORAGE_KEYS.SESSIONS, INITIAL_DEMO_SESSIONS);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRealSessions, setHasRealSessions] = useState<boolean>(false);

  // Synchronize local fallback cache
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
  }, [sessions]);

  // Fetch real persistent study sessions from backend
  const refreshSessions = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await sessionService.listSessions({ limit: 50, status: 'completed' });
      if (data?.sessions && Array.isArray(data.sessions)) {
        if (data.sessions.length > 0) {
          const mappedSessions: StudySession[] = data.sessions.map((s) => ({
            id: s.id,
            title: s.title,
            subject: s.subject,
            durationSeconds: s.durationSeconds,
            mode: s.sessionType,
            completedAt: s.completedAt || s.createdAt,
            notes: s.notes,
            taskId: s.taskId,
            isDemo: false,
          }));
          setSessions(mappedSessions);
          setHasRealSessions(true);
        } else {
          // No sessions yet in database for this user
          setHasRealSessions(false);
          // Keep empty or leave clean
          setSessions([]);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch backend sessions:', err);
      setError(err.message || 'Unable to load sessions from server.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const addSession = (sessionData: Omit<StudySession, 'id' | 'completedAt'>): StudySession => {
    const newSession: StudySession = {
      ...sessionData,
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      completedAt: new Date().toISOString(),
      isDemo: false,
    };
    setSessions((prev) => [newSession, ...prev]);
    setHasRealSessions(true);
    return newSession;
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const clearSessions = () => {
    setSessions([]);
    setHasRealSessions(false);
  };

  const resetDemoSessions = () => {
    setSessions(INITIAL_DEMO_SESSIONS);
    setHasRealSessions(false);
  };

  // Today's focused seconds
  const todayFocusSeconds = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return sessions
      .filter((s) => {
        try {
          return s.completedAt.split('T')[0] === todayStr;
        } catch {
          return false;
        }
      })
      .reduce((acc, curr) => acc + curr.durationSeconds, 0);
  }, [sessions]);

  const todayTargetSeconds = settings.dailyTargetHours * 3600;
  const todayProgressPercent = Math.min(100, Math.round((todayFocusSeconds / Math.max(1, todayTargetSeconds)) * 100));

  // Weekly focus seconds (last 7 days)
  const weeklyFocusSeconds = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return sessions
      .filter((s) => {
        try {
          return new Date(s.completedAt) >= sevenDaysAgo;
        } catch {
          return false;
        }
      })
      .reduce((acc, curr) => acc + curr.durationSeconds, 0);
  }, [sessions]);

  // Streak Calculation (consecutive days with sessions)
  const streakDays = useMemo(() => {
    if (sessions.length === 0) return 0;

    const uniqueDates = Array.from(
      new Set(
        sessions.map((s) => {
          try {
            return s.completedAt.split('T')[0];
          } catch {
            return '';
          }
        }).filter(Boolean)
      )
    ).sort().reverse();

    if (uniqueDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let currentIndex = 0;
    if (uniqueDates[0] === todayStr) {
      currentIndex = 0;
    } else if (uniqueDates[0] === yesterdayStr) {
      currentIndex = 0;
    } else {
      return 0;
    }

    let streak = 0;
    const checkDate = new Date(uniqueDates[currentIndex]);

    for (let i = currentIndex; i < uniqueDates.length; i++) {
      const expectedDateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates[i] === expectedDateStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [sessions]);

  // Subject breakdown
  const subjectBreakdown = useMemo((): SubjectStat[] => {
    const totalSecs = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    if (totalSecs === 0) return [];

    const map = new Map<string, { seconds: number; count: number }>();
    sessions.forEach((s) => {
      const cur = map.get(s.subject) || { seconds: 0, count: 0 };
      map.set(s.subject, {
        seconds: cur.seconds + s.durationSeconds,
        count: cur.count + 1,
      });
    });

    const stats: SubjectStat[] = [];
    map.forEach((val, subjectName) => {
      const subjectDef = STUDY_SUBJECTS.find((sub) => sub.name === subjectName);
      const hours = Math.round((val.seconds / 3600) * 10) / 10;
      const percentage = Math.round((val.seconds / totalSecs) * 100);
      stats.push({
        name: subjectName,
        seconds: val.seconds,
        hours,
        percentage,
        color: subjectDef?.color || '#16a34a',
        sessionsCount: val.count,
      });
    });

    return stats.sort((a, b) => b.seconds - a.seconds);
  }, [sessions]);

  const recentSessions = useMemo(() => {
    return sessions.slice(0, 6);
  }, [sessions]);

  const weeklyLogs = useMemo(() => {
    return generateWeeklyStudyLogs(sessions, settings.dailyTargetHours);
  }, [sessions, settings.dailyTargetHours]);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        isLoading,
        error,
        refreshSessions,
        addSession,
        deleteSession,
        clearSessions,
        resetDemoSessions,
        todayFocusSeconds,
        todayTargetSeconds,
        todayProgressPercent,
        weeklyFocusSeconds,
        streakDays,
        subjectBreakdown,
        recentSessions,
        weeklyLogs,
        hasRealSessions,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSessions = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessions must be used within a SessionProvider');
  }
  return context;
};
