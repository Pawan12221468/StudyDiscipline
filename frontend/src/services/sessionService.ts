import { apiRequest } from './apiClient';
import { TimerMode, PomodoroPhase } from '../types';

export interface BackendStudySession {
  id: string;
  userId: string;
  sessionType: TimerMode;
  title: string;
  subject: string;
  status: 'running' | 'paused' | 'completed' | 'abandoned';
  startedAt: string;
  lastResumedAt: string | null;
  accumulatedDurationMs: number;
  durationSeconds: number;
  targetDurationSeconds?: number;
  pomodoroPhase?: PomodoroPhase;
  pomodoroCycles?: number;
  completedAt?: string | null;
  notes?: string;
  taskId?: string;
  monitoringSummary?: {
    totalMonitoredSeconds: number;
    personPresentPercent: number;
    absenceIncidentCount: number;
    phoneVisibleCount: number;
  };
  createdAt: string;
  updatedAt: string;
}


export interface ActiveSessionResponse {
  session: BackendStudySession | null;
  elapsedMs: number;
}

export interface ListSessionsResponse {
  sessions: BackendStudySession[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const sessionService = {
  /**
   * Start a new persistent study session in MongoDB
   */
  async createSession(params: {
    sessionType: TimerMode;
    subject: string;
    title?: string;
    targetDurationSeconds?: number;
    pomodoroPhase?: PomodoroPhase;
    pomodoroCycles?: number;
    taskId?: string;
  }): Promise<{ message: string; session: BackendStudySession; elapsedMs: number }> {
    return apiRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Recover the user's active (running or paused) session from MongoDB
   */
  async getActiveSession(): Promise<ActiveSessionResponse> {
    return apiRequest<ActiveSessionResponse>('/sessions/active', {
      method: 'GET',
    });
  },

  /**
   * Pause a running study session
   */
  async pauseSession(sessionId: string): Promise<{ message: string; session: BackendStudySession; elapsedMs: number }> {
    return apiRequest(`/sessions/${sessionId}/pause`, {
      method: 'PATCH',
    });
  },

  /**
   * Resume a paused study session
   */
  async resumeSession(sessionId: string): Promise<{ message: string; session: BackendStudySession; elapsedMs: number }> {
    return apiRequest(`/sessions/${sessionId}/resume`, {
      method: 'PATCH',
    });
  },

  /**
   * Finish and complete a study session
   */
  async finishSession(
    sessionId: string,
    options?: {
      title?: string;
      notes?: string;
      monitoringSummary?: {
        totalMonitoredSeconds: number;
        personPresentPercent: number;
        absenceIncidentCount: number;
        phoneVisibleCount: number;
      };
    }
  ): Promise<{ message: string; session: BackendStudySession; durationSeconds: number }> {
    return apiRequest(`/sessions/${sessionId}/finish`, {
      method: 'PATCH',
      body: JSON.stringify(options || {}),
    });
  },


  /**
   * Abandon an active or paused session
   */
  async abandonSession(sessionId: string): Promise<{ message: string; session: BackendStudySession }> {
    return apiRequest(`/sessions/${sessionId}/abandon`, {
      method: 'PATCH',
    });
  },

  /**
   * Fetch historical completed sessions with pagination
   */
  async listSessions(options: { page?: number; limit?: number; status?: string } = {}): Promise<ListSessionsResponse> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status) params.append('status', options.status);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<ListSessionsResponse>(`/sessions${queryString}`, {
      method: 'GET',
    });
  },
};
