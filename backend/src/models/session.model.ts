import { ObjectId, Collection, Filter } from 'mongodb';
import { dbConnection } from '../config/database';

export type SessionType = 'stopwatch' | 'countdown' | 'pomodoro';
export type SessionStatus = 'running' | 'paused' | 'completed' | 'abandoned';
export type PomodoroPhase = 'work' | 'short_break' | 'long_break';

export interface FocusMonitoringSummary {
  totalMonitoredSeconds: number;
  personPresentPercent: number;
  absenceIncidentCount: number;
  phoneVisibleCount: number;
}

export interface StudySessionDocument {
  _id: ObjectId;
  userId: ObjectId;
  sessionType: SessionType;
  title: string;
  subject: string;
  status: SessionStatus;
  startedAt: Date;
  lastResumedAt: Date | null;
  accumulatedDurationMs: number;
  durationSeconds: number;
  targetDurationSeconds?: number;
  pomodoroPhase?: PomodoroPhase;
  pomodoroCycles?: number;
  completedAt?: Date | null;
  notes?: string;
  taskId?: string;
  monitoringSummary?: FocusMonitoringSummary;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicStudySession {
  id: string;
  userId: string;
  sessionType: SessionType;
  title: string;
  subject: string;
  status: SessionStatus;
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
  monitoringSummary?: FocusMonitoringSummary;
  createdAt: string;
  updatedAt: string;
}


export function toPublicSession(doc: StudySessionDocument): PublicStudySession {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    sessionType: doc.sessionType,
    title: doc.title,
    subject: doc.subject,
    status: doc.status,
    startedAt: doc.startedAt.toISOString(),
    lastResumedAt: doc.lastResumedAt ? doc.lastResumedAt.toISOString() : null,
    accumulatedDurationMs: doc.accumulatedDurationMs,
    durationSeconds: doc.durationSeconds,
    targetDurationSeconds: doc.targetDurationSeconds,
    pomodoroPhase: doc.pomodoroPhase,
    pomodoroCycles: doc.pomodoroCycles,
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    notes: doc.notes,
    taskId: doc.taskId,
    monitoringSummary: doc.monitoringSummary,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}


export function calculateElapsedMs(session: StudySessionDocument, now: Date = new Date()): number {
  if (session.status === 'running' && session.lastResumedAt) {
    const activeSpan = Math.max(0, now.getTime() - session.lastResumedAt.getTime());
    return session.accumulatedDurationMs + activeSpan;
  }
  return session.accumulatedDurationMs;
}

export interface CreateSessionParams {
  userId: ObjectId;
  sessionType: SessionType;
  title?: string;
  subject: string;
  targetDurationSeconds?: number;
  pomodoroPhase?: PomodoroPhase;
  pomodoroCycles?: number;
  taskId?: string;
}

export class SessionRepository {
  private collectionName = 'study_sessions';

  public getCollection(): Collection<StudySessionDocument> {
    const db = dbConnection.getDb();
    return db.collection<StudySessionDocument>(this.collectionName);
  }

  public async ensureIndexes(): Promise<void> {
    try {
      const collection = this.getCollection();
      await collection.createIndex(
        { userId: 1, status: 1 },
        { name: 'idx_user_status' }
      );
      await collection.createIndex(
        { userId: 1, completedAt: -1, createdAt: -1 },
        { name: 'idx_user_sessions_date' }
      );
    } catch (err) {
      console.warn('Notice: Could not ensure session indexes (database may be offline during unit test):', (err as Error).message);
    }
  }

  /**
   * Finds the currently active (running or paused) session for a user.
   */
  public async findActiveByUserId(userId: ObjectId): Promise<StudySessionDocument | null> {
    const collection = this.getCollection();
    return collection.findOne({
      userId,
      status: { $in: ['running', 'paused'] },
    });
  }

  /**
   * Creates a new session. Rejects if an active session already exists for the user.
   */
  public async create(params: CreateSessionParams): Promise<StudySessionDocument> {
    const existingActive = await this.findActiveByUserId(params.userId);
    if (existingActive) {
      throw new Error('An active study session is already in progress. Please pause or finish your current session.');
    }

    const now = new Date();
    const fallbackTitle = params.title?.trim() || `${params.subject} Focus Session`;

    const newDoc: StudySessionDocument = {
      _id: new ObjectId(),
      userId: params.userId,
      sessionType: params.sessionType,
      title: fallbackTitle,
      subject: params.subject.trim() || 'General Study',
      status: 'running',
      startedAt: now,
      lastResumedAt: now,
      accumulatedDurationMs: 0,
      durationSeconds: 0,
      targetDurationSeconds: params.targetDurationSeconds,
      pomodoroPhase: params.pomodoroPhase || (params.sessionType === 'pomodoro' ? 'work' : undefined),
      pomodoroCycles: params.pomodoroCycles || 0,
      taskId: params.taskId,
      createdAt: now,
      updatedAt: now,
    };

    const collection = this.getCollection();
    await collection.insertOne(newDoc);
    return newDoc;
  }

  /**
   * Finds a session by ID strictly scoped to user ID.
   */
  public async findByIdAndUserId(sessionId: ObjectId, userId: ObjectId): Promise<StudySessionDocument | null> {
    const collection = this.getCollection();
    return collection.findOne({ _id: sessionId, userId });
  }

  /**
   * Pauses an active running session.
   */
  public async pause(sessionId: ObjectId, userId: ObjectId): Promise<StudySessionDocument> {
    const session = await this.findByIdAndUserId(sessionId, userId);
    if (!session) {
      throw new Error('Session not found.');
    }

    if (session.status !== 'running') {
      throw new Error(`Cannot pause a session with status "${session.status}".`);
    }

    const now = new Date();
    const addedMs = session.lastResumedAt ? Math.max(0, now.getTime() - session.lastResumedAt.getTime()) : 0;
    const newAccumulated = session.accumulatedDurationMs + addedMs;

    const collection = this.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: sessionId, userId },
      {
        $set: {
          status: 'paused',
          accumulatedDurationMs: newAccumulated,
          lastResumedAt: null,
          durationSeconds: Math.floor(newAccumulated / 1000),
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) throw new Error('Failed to update session.');
    return result;
  }

  /**
   * Resumes a paused session.
   */
  public async resume(sessionId: ObjectId, userId: ObjectId): Promise<StudySessionDocument> {
    const session = await this.findByIdAndUserId(sessionId, userId);
    if (!session) {
      throw new Error('Session not found.');
    }

    if (session.status !== 'paused') {
      throw new Error(`Cannot resume a session with status "${session.status}".`);
    }

    const now = new Date();
    const collection = this.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: sessionId, userId },
      {
        $set: {
          status: 'running',
          lastResumedAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) throw new Error('Failed to update session.');
    return result;
  }

  /**
   * Completes a session and records final verified duration.
   */
  public async finish(
    sessionId: ObjectId,
    userId: ObjectId,
    options?: { title?: string; notes?: string; monitoringSummary?: FocusMonitoringSummary }
  ): Promise<StudySessionDocument> {
    const session = await this.findByIdAndUserId(sessionId, userId);
    if (!session) {
      throw new Error('Session not found.');
    }

    if (session.status === 'completed' || session.status === 'abandoned') {
      throw new Error(`Session is already ${session.status}.`);
    }

    const now = new Date();
    const totalElapsedMs = calculateElapsedMs(session, now);
    const finalDurationSeconds = Math.max(1, Math.round(totalElapsedMs / 1000));

    const setFields: Record<string, any> = {
      status: 'completed',
      accumulatedDurationMs: totalElapsedMs,
      lastResumedAt: null,
      durationSeconds: finalDurationSeconds,
      completedAt: now,
      title: options?.title?.trim() || session.title,
      notes: options?.notes?.trim() || session.notes,
      updatedAt: now,
    };

    if (options?.monitoringSummary) {
      setFields.monitoringSummary = options.monitoringSummary;
    }

    const collection = this.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: sessionId, userId },
      { $set: setFields },
      { returnDocument: 'after' }
    );


    if (!result) throw new Error('Failed to finish session.');
    return result;
  }

  /**
   * Abandons an active or paused session.
   */
  public async abandon(sessionId: ObjectId, userId: ObjectId): Promise<StudySessionDocument> {
    const session = await this.findByIdAndUserId(sessionId, userId);
    if (!session) {
      throw new Error('Session not found.');
    }

    const now = new Date();
    const collection = this.getCollection();
    const result = await collection.findOneAndUpdate(
      { _id: sessionId, userId },
      {
        $set: {
          status: 'abandoned',
          lastResumedAt: null,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) throw new Error('Failed to abandon session.');
    return result;
  }

  /**
   * Lists completed or historical sessions for a user with pagination.
   */
  public async listByUserId(
    userId: ObjectId,
    options: { page?: number; limit?: number; status?: SessionStatus } = {}
  ): Promise<{ sessions: StudySessionDocument[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 15));
    const skip = (page - 1) * limit;

    const filter: Filter<StudySessionDocument> = { userId };
    if (options.status) {
      filter.status = options.status;
    } else {
      // Default to completed sessions for history
      filter.status = 'completed';
    }

    const collection = this.getCollection();
    const [sessions, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ completedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return { sessions, total, page, limit };
  }
}

export const sessionRepository = new SessionRepository();
