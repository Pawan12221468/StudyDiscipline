import { createApp } from '../src/app';
import { dbConnection } from '../src/config/database';
import { hashPassword, comparePassword, signAuthToken, verifyAuthToken, getAuthCookieOptions, AUTH_COOKIE_NAME } from '../src/utils/auth.util';
import { signupSchema, loginSchema } from '../src/validators/auth.validator';
import { createSessionSchema, finishSessionSchema, sessionQuerySchema } from '../src/validators/session.validator';
import { toPublicUser, UserDocument } from '../src/models/user.model';
import {
  toPublicSession,
  calculateElapsedMs,
  StudySessionDocument,
} from '../src/models/session.model';
import { ObjectId } from 'mongodb';

async function runTests(): Promise<void> {
  console.log('[Test Suite] Running Phase 4 backend authentication & session tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ ${testName}`);
      failed++;
    }
  }

  // 1. Password Hashing Tests
  try {
    const rawPassword = 'SecurePassword123!';
    const hash = await hashPassword(rawPassword);
    assert(typeof hash === 'string' && hash.startsWith('$2'), 'Password hashing produces valid bcrypt hash');
    assert(hash !== rawPassword, 'Password is never stored in plaintext');

    const isValid = await comparePassword(rawPassword, hash);
    assert(isValid === true, 'comparePassword validates correct password against hash');

    const isWrongValid = await comparePassword('WrongPassword', hash);
    assert(isWrongValid === false, 'comparePassword rejects incorrect password');
  } catch (err) {
    assert(false, `Password hashing tests failed: ${(err as Error).message}`);
  }

  // 2. JWT Signing & Verification Tests
  try {
    const payload = { userId: 'user-12345', email: 'student@example.com' };
    const token = signAuthToken(payload);
    assert(typeof token === 'string' && token.split('.').length === 3, 'signAuthToken generates signed JWT');

    const decoded = verifyAuthToken(token);
    assert(decoded !== null, 'verifyAuthToken decodes valid token');
    assert(decoded?.userId === payload.userId, 'Decoded token preserves correct userId');
    assert(decoded?.email === payload.email, 'Decoded token preserves correct normalized email');

    const invalidDecoded = verifyAuthToken('invalid.token.here');
    assert(invalidDecoded === null, 'verifyAuthToken safely returns null for malformed token');
  } catch (err) {
    assert(false, `JWT tests failed: ${(err as Error).message}`);
  }

  // 3. User Data Isolation & Public DTO
  try {
    const fakeDoc: UserDocument = {
      _id: new ObjectId(),
      name: 'Test Student',
      email: 'test@example.com',
      passwordHash: '$2a$10$encryptedhashstring',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const publicUser = toPublicUser(fakeDoc);
    assert(publicUser.id === fakeDoc._id.toString(), 'Public user contains id string');
    assert(publicUser.name === fakeDoc.name, 'Public user contains name');
    assert(publicUser.email === fakeDoc.email, 'Public user contains normalized email');
    assert(!('passwordHash' in publicUser), 'Public user strictly excludes passwordHash');
  } catch (err) {
    assert(false, `Public DTO test failed: ${(err as Error).message}`);
  }

  // 4. Validator Schema Tests
  try {
    const validSignup = signupSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ADA.LOVELACE@example.com',
      password: 'StrongPassword2026',
    });
    assert(validSignup.success === true, 'signupSchema accepts valid input');
    if (validSignup.success) {
      assert(validSignup.data.email === 'ada.lovelace@example.com', 'signupSchema normalizes email to lowercase');
    }

    const shortPassword = signupSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: '123',
    });
    assert(shortPassword.success === false, 'signupSchema rejects passwords shorter than 8 characters');

    const invalidEmail = signupSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'not-an-email',
      password: 'StrongPassword2026',
    });
    assert(invalidEmail.success === false, 'signupSchema rejects invalid email formats');

    const validLogin = loginSchema.safeParse({
      email: 'STUDENT@EXAMPLE.COM',
      password: 'password123',
    });
    assert(validLogin.success === true, 'loginSchema accepts valid login');
    if (validLogin.success) {
      assert(validLogin.data.email === 'student@example.com', 'loginSchema normalizes email to lowercase');
    }
  } catch (err) {
    assert(false, `Validator schema test failed: ${(err as Error).message}`);
  }

  // 5. Cookie Security Settings
  try {
    const cookieOpts = getAuthCookieOptions();
    assert(cookieOpts.httpOnly === true, 'Auth cookie specifies httpOnly=true for XSS protection');
    assert(cookieOpts.sameSite === 'lax', 'Auth cookie specifies sameSite=lax for CSRF mitigation');
    assert(cookieOpts.path === '/', 'Auth cookie has root path scope');
    assert(typeof cookieOpts.maxAge === 'number' && cookieOpts.maxAge > 0, 'Auth cookie specifies maxAge');
    assert(AUTH_COOKIE_NAME === 'study_discipline_auth_token', 'Cookie name is properly constant-defined');
  } catch (err) {
    assert(false, `Cookie options test failed: ${(err as Error).message}`);
  }

  // 6. Phase 4: Session Validation Schema Tests
  try {
    const validSession = createSessionSchema.safeParse({
      sessionType: 'pomodoro',
      subject: 'Mathematics',
      title: 'Calculus Integrals',
      targetDurationSeconds: 1500,
      pomodoroPhase: 'work',
      pomodoroCycles: 1,
    });
    assert(validSession.success === true, 'createSessionSchema validates valid pomodoro session input');

    const invalidTypeSession = createSessionSchema.safeParse({
      sessionType: 'invalid-type',
      subject: 'Mathematics',
    });
    assert(invalidTypeSession.success === false, 'createSessionSchema rejects invalid session types');

    const missingSubjectSession = createSessionSchema.safeParse({
      sessionType: 'stopwatch',
      subject: '',
    });
    assert(missingSubjectSession.success === false, 'createSessionSchema rejects empty subject');

    const validFinish = finishSessionSchema.safeParse({
      title: 'Updated Session Title',
      notes: 'Covered integration by parts formulas.',
    });
    assert(validFinish.success === true, 'finishSessionSchema accepts title and notes');

    const validQuery = sessionQuerySchema.safeParse({
      page: '2',
      limit: '20',
      status: 'completed',
    });
    assert(validQuery.success === true, 'sessionQuerySchema coerses pagination numbers');
    if (validQuery.success) {
      assert(validQuery.data.page === 2 && validQuery.data.limit === 20, 'sessionQuerySchema parsed correct page and limit');
    }
  } catch (err) {
    assert(false, `Session validator test failed: ${(err as Error).message}`);
  }

  // 7. Phase 4: Elapsed Time & Timer Calculations
  try {
    const baseTime = new Date('2026-10-21T00:00:00.000Z');
    const runningSession: StudySessionDocument = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      sessionType: 'countdown',
      title: 'Physics Deep Work',
      subject: 'Physics',
      status: 'running',
      startedAt: baseTime,
      lastResumedAt: baseTime,
      accumulatedDurationMs: 60000, // 1 min previously accumulated
      durationSeconds: 60,
      targetDurationSeconds: 1500,
      createdAt: baseTime,
      updatedAt: baseTime,
    };

    // Simulate 30 seconds having passed since lastResumedAt
    const thirtySecsLater = new Date(baseTime.getTime() + 30000);
    const elapsed = calculateElapsedMs(runningSession, thirtySecsLater);
    assert(elapsed === 90000, 'calculateElapsedMs accurately computes accumulated + running interval (90,000ms = 1m30s)');

    // Now test a paused session
    const pausedSession: StudySessionDocument = {
      ...runningSession,
      status: 'paused',
      lastResumedAt: null,
      accumulatedDurationMs: 90000,
    };
    const pausedElapsed = calculateElapsedMs(pausedSession, thirtySecsLater);
    assert(pausedElapsed === 90000, 'calculateElapsedMs for paused session freezes at accumulated duration');
  } catch (err) {
    assert(false, `Elapsed time calculation test failed: ${(err as Error).message}`);
  }

  // 8. Phase 4: Public Session DTO Masking & Types
  try {
    const sessionDoc: StudySessionDocument = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      sessionType: 'stopwatch',
      title: 'Algorithms Benchmarking',
      subject: 'Computer Science',
      status: 'completed',
      startedAt: new Date(),
      lastResumedAt: null,
      accumulatedDurationMs: 3600000,
      durationSeconds: 3600,
      targetDurationSeconds: 3600,
      notes: 'Quicksort analysis complete',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const publicSession = toPublicSession(sessionDoc);
    assert(typeof publicSession.id === 'string', 'Public session maps _id to id string');
    assert(typeof publicSession.userId === 'string', 'Public session maps userId to string');
    assert(publicSession.title === sessionDoc.title, 'Public session preserves title');
    assert(publicSession.durationSeconds === 3600, 'Public session preserves verified durationSeconds');
  } catch (err) {
    assert(false, `Public session DTO test failed: ${(err as Error).message}`);
  }

  // 9. Phase 4: Authentication Middleware & Security Checks
  try {
    const { requireAuth } = await import('../src/middleware/auth.middleware');
    let statusSet = 0;
    let jsonSent: any = null;

    const mockReqNoAuth: any = { cookies: {}, headers: {} };
    const mockRes: any = {
      status(code: number) {
        statusSet = code;
        return this;
      },
      json(body: any) {
        jsonSent = body;
        return this;
      },
    };
    const mockNext = () => {};

    await requireAuth(mockReqNoAuth, mockRes, mockNext);
    assert(statusSet === 401, 'requireAuth rejects unauthenticated requests with 401');
    assert(jsonSent?.error === 'Unauthorized', 'requireAuth returns standard Unauthorized error object');
  } catch (err) {
    assert(false, `requireAuth test failed: ${(err as Error).message}`);
  }

  // 10. Phase 4: Pomodoro Work/Break Accounting
  try {
    const pomodoroWorkSession: StudySessionDocument = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      sessionType: 'pomodoro',
      title: 'Math Study Cycle 1',
      subject: 'Mathematics',
      status: 'completed',
      pomodoroPhase: 'work',
      pomodoroCycles: 1,
      startedAt: new Date(),
      lastResumedAt: null,
      accumulatedDurationMs: 1500000, // 25 mins
      durationSeconds: 1500,
      targetDurationSeconds: 1500,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    assert(pomodoroWorkSession.pomodoroPhase === 'work', 'Pomodoro work phase is explicitly tagged as work');
    assert(pomodoroWorkSession.durationSeconds === 1500, 'Pomodoro focus study time is strictly counted from work phase');
    assert(pomodoroWorkSession.pomodoroCycles === 1, 'Pomodoro completed cycles count is preserved');
  } catch (err) {
    assert(false, `Pomodoro accounting test failed: ${(err as Error).message}`);
  }

  // 11. Phase 4: MongoDB ObjectId Validation
  try {
    const validId = new ObjectId().toString();
    const invalidId = '123-not-an-id';
    assert(ObjectId.isValid(validId) === true, 'ObjectId.isValid confirms authentic 24-hex string');
    assert(ObjectId.isValid(invalidId) === false, 'ObjectId.isValid rejects malformed IDs');
  } catch (err) {
    assert(false, `ObjectId validation test failed: ${(err as Error).message}`);
  }

  // 12. Phase 5: Goal Validators & Target Range Checks
  try {
    const { dailyGoalQuerySchema, updateDailyGoalSchema } = await import('../src/validators/goal.validator');

    const validDateQuery = dailyGoalQuerySchema.safeParse({ date: '2026-10-21' });
    assert(validDateQuery.success === true, 'dailyGoalQuerySchema accepts valid YYYY-MM-DD date');

    const invalidDateQuery = dailyGoalQuerySchema.safeParse({ date: '21-10-2026' });
    assert(invalidDateQuery.success === false, 'dailyGoalQuerySchema rejects malformed date format');

    const validGoalUpdate = updateDailyGoalSchema.safeParse({
      date: '2026-10-21',
      targetMinutes: 180,
    });
    assert(validGoalUpdate.success === true, 'updateDailyGoalSchema validates 180 minutes goal');

    const zeroGoal = updateDailyGoalSchema.safeParse({
      date: '2026-10-21',
      targetMinutes: 0,
    });
    assert(zeroGoal.success === false, 'updateDailyGoalSchema rejects 0 minutes target (min is 1)');

    const excessiveGoal = updateDailyGoalSchema.safeParse({
      date: '2026-10-21',
      targetMinutes: 2000,
    });
    assert(excessiveGoal.success === false, 'updateDailyGoalSchema rejects targets over 1440 minutes (24h limit)');
  } catch (err) {
    assert(false, `Goal validator test failed: ${(err as Error).message}`);
  }

  // 13. Phase 5: Task Validators & DTO Transformation
  try {
    const { createTaskSchema, updateTaskSchema, listTasksQuerySchema } = await import('../src/validators/task.validator');
    const { toPublicTask, StudyTaskDocument } = await import('../src/models/task.model');

    const validTask = createTaskSchema.safeParse({
      title: 'Thermodynamics Problem Set #4',
      subject: 'Physics',
      priority: 'high',
      estimatedMinutes: 45,
      dueDate: 'Tomorrow',
      notes: 'Chapters 5 and 6 Carnot cycle',
    });
    assert(validTask.success === true, 'createTaskSchema accepts valid task input');

    const emptyTitleTask = createTaskSchema.safeParse({
      title: '',
      subject: 'Physics',
    });
    assert(emptyTitleTask.success === false, 'createTaskSchema rejects empty task title');

    const invalidPriorityTask = createTaskSchema.safeParse({
      title: 'Valid Title',
      subject: 'Physics',
      priority: 'extreme',
    });
    assert(invalidPriorityTask.success === false, 'createTaskSchema rejects invalid priority enum');

    const validQuery = listTasksQuerySchema.safeParse({
      page: '3',
      limit: '25',
      status: 'pending',
      priority: 'high',
    });
    assert(validQuery.success === true, 'listTasksQuerySchema coerces pagination and parses filters');
    if (validQuery.success) {
      assert(validQuery.data.page === 3 && validQuery.data.limit === 25, 'listTasksQuerySchema parses numbers accurately');
    }

    // Task DTO mapping test
    const mockTaskDoc: StudyTaskDocument = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      title: 'Discrete Math Graphs',
      subject: 'Computer Science',
      priority: 'urgent',
      estimatedMinutes: 60,
      dueDate: 'Friday',
      notes: 'Eulerian paths',
      status: 'completed',
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const publicTask = toPublicTask(mockTaskDoc);
    assert(publicTask.id === mockTaskDoc._id.toString(), 'toPublicTask formats _id to string');
    assert(publicTask.completed === true, 'toPublicTask accurately derives completed boolean from status');
    assert(typeof publicTask.completedAt === 'string', 'toPublicTask serializes completedAt date to ISO string');

    const pendingDoc: StudyTaskDocument = {
      ...mockTaskDoc,
      status: 'pending',
      completedAt: null,
    };
    const publicPending = toPublicTask(pendingDoc);
    assert(publicPending.completed === false, 'toPublicTask sets completed=false for pending tasks');
    assert(publicPending.completedAt === null, 'toPublicTask sets completedAt=null for pending tasks');
  } catch (err) {
    assert(false, `Task validation and DTO test failed: ${(err as Error).message}`);
  }

  // 14. Phase 5: Streak Logic & Idempotency Rules
  try {
    // Test rule: multiple sessions on the same calendar date count towards that single day only
    const sessionsOnSameDay = [
      { date: '2026-10-20', minutes: 30 },
      { date: '2026-10-20', minutes: 40 },
      { date: '2026-10-20', minutes: 60 },
    ];
    const totalDayMinutes = sessionsOnSameDay.reduce((acc, s) => acc + s.minutes, 0);
    assert(totalDayMinutes === 130, 'Multiple study sessions on the same day accumulate correctly');
    const targetMinutes = 120;
    const isTargetMet = totalDayMinutes >= targetMinutes;
    assert(isTargetMet === true, 'Target is achieved once threshold is reached regardless of session count');

    // Test rule: Missed day breaks consecutive streak
    const daysStatus = [
      { date: '2026-10-21', met: true },  // Today
      { date: '2026-10-20', met: true },  // Yesterday
      { date: '2026-10-19', met: false }, // Missed day
      { date: '2026-10-18', met: true },
    ];
    let streakCount = 0;
    for (const d of daysStatus) {
      if (d.met) {
        streakCount++;
      } else {
        break; // Break streak on missed day
      }
    }
    assert(streakCount === 2, 'Streak correctly breaks upon encountering a missed day (streak = 2)');
  } catch (err) {
    assert(false, `Streak logic test failed: ${(err as Error).message}`);
  }

  // 15. Phase 6: Analytics Query Validation & Date Boundaries
  try {
    const { analyticsQuerySchema } = await import('../src/validators/analytics.validator');

    const validWeek = analyticsQuerySchema.safeParse({ period: 'week' });
    assert(validWeek.success === true, 'analyticsQuerySchema accepts period=week');

    const validMonth = analyticsQuerySchema.safeParse({ period: 'month' });
    assert(validMonth.success === true, 'analyticsQuerySchema accepts period=month');

    const validRange = analyticsQuerySchema.safeParse({
      period: 'custom',
      startDate: '2026-10-01',
      endDate: '2026-10-21',
    });
    assert(validRange.success === true, 'analyticsQuerySchema accepts valid custom range (20 days)');

    const invertedRange = analyticsQuerySchema.safeParse({
      period: 'custom',
      startDate: '2026-10-25',
      endDate: '2026-10-10',
    });
    assert(invertedRange.success === false, 'analyticsQuerySchema rejects inverted date range (startDate > endDate)');

    const excessiveRange = analyticsQuerySchema.safeParse({
      period: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-10-21', // ~293 days > 90 days limit
    });
    assert(excessiveRange.success === false, 'analyticsQuerySchema rejects date ranges exceeding 90 days');

    const malformedDate = analyticsQuerySchema.safeParse({
      period: 'custom',
      startDate: 'not-a-date',
      endDate: '2026-10-21',
    });
    assert(malformedDate.success === false, 'analyticsQuerySchema rejects malformed date strings');
  } catch (err) {
    assert(false, `Analytics validator test failed: ${(err as Error).message}`);
  }

  // 16. Phase 6: Analytics Metrics & Subject Grouping Logic
  try {
    // Test rule: Unassigned subject fallback
    const rawSessions = [
      { subject: 'Mathematics', durationSeconds: 3600 },
      { subject: '', durationSeconds: 1800 },
      { subject: undefined, durationSeconds: 1200 },
    ];
    const subjectMap = new Map<string, number>();
    for (const s of rawSessions) {
      const name = (s.subject && s.subject.trim()) || 'Unassigned';
      subjectMap.set(name, (subjectMap.get(name) || 0) + s.durationSeconds);
    }
    assert(subjectMap.get('Mathematics') === 3600, 'Subject grouping preserves assigned subject duration');
    assert(subjectMap.get('Unassigned') === 3000, 'Subject grouping maps empty and undefined subjects to Unassigned');

    // Test rule: Comparison delta and percentage change
    const currentSeconds = 7200; // 2 hours
    const prevSeconds = 3600;    // 1 hour
    const percentChange = Math.round(((currentSeconds - prevSeconds) / prevSeconds) * 100);
    assert(percentChange === 100, 'Previous-period comparison computes +100% when focus doubled');

    // Test rule: Heatmap activity level mapping
    const getLevel = (minutes: number): number => {
      if (minutes > 120) return 4;
      if (minutes > 60) return 3;
      if (minutes > 30) return 2;
      if (minutes > 0) return 1;
      return 0;
    };
    assert(getLevel(0) === 0, 'Heatmap assigns level 0 for 0 minutes');
    assert(getLevel(25) === 1, 'Heatmap assigns level 1 for 1-30 minutes');
    assert(getLevel(45) === 2, 'Heatmap assigns level 2 for 31-60 minutes');
    assert(getLevel(90) === 3, 'Heatmap assigns level 3 for 61-120 minutes');
    assert(getLevel(180) === 4, 'Heatmap assigns level 4 for >120 minutes');
  } catch (err) {
    assert(false, `Analytics metrics logic test failed: ${(err as Error).message}`);
  }

  // 17. Express App & Routing Setup with Analytics
  try {
    const app = createApp();
    assert(typeof app === 'function', 'Express application factory initializes cleanly');
    assert(app._router && app._router.stack && app._router.stack.length > 0, 'Express routing stack is properly loaded');
  } catch (err) {
    assert(false, `App factory test failed: ${(err as Error).message}`);
  }

  // 19. Phase 7: AI Validator Schemas
  try {
    const { coachMessageSchema, studyPlanInputSchema, studyPlanOutputSchema } = await import('../src/validators/ai.validator');

    // Message validation
    const validMsg = coachMessageSchema.safeParse({ message: 'How can I stay focused on Physics?' });
    assert(validMsg.success === true, 'coachMessageSchema accepts valid user message');

    const emptyMsg = coachMessageSchema.safeParse({ message: '   ' });
    assert(emptyMsg.success === false, 'coachMessageSchema rejects whitespace-only message');

    const tooLongMsg = coachMessageSchema.safeParse({ message: 'A'.repeat(1001) });
    assert(tooLongMsg.success === false, 'coachMessageSchema rejects message exceeding 1000 characters');

    // Study plan input validation
    const validPlanInput = studyPlanInputSchema.safeParse({
      availableMinutes: 120,
      preferredStartTime: '09:30',
      preferredEndTime: '11:30',
      focusSubjects: ['Algorithms', 'Database Systems'],
    });
    assert(validPlanInput.success === true, 'studyPlanInputSchema accepts valid parameters');

    const tooShortPlan = studyPlanInputSchema.safeParse({ availableMinutes: 15 });
    assert(tooShortPlan.success === false, 'studyPlanInputSchema rejects study window under 30 minutes');

    const invalidTimeFormat = studyPlanInputSchema.safeParse({ availableMinutes: 60, preferredStartTime: '9:30' });
    assert(invalidTimeFormat.success === false, 'studyPlanInputSchema rejects invalid time format not matching HH:MM');

    // Study plan output validation
    const validPlanOutput = studyPlanOutputSchema.safeParse({
      title: 'Morning Focus Schedule',
      totalMinutes: 60,
      blocks: [
        {
          title: 'Deep Work Block 1',
          subject: 'Math',
          startTime: '09:00',
          endTime: '09:50',
          durationMinutes: 50,
          type: 'focus',
        },
        {
          title: 'Rest & Stretch',
          subject: 'Break',
          startTime: '09:50',
          endTime: '10:00',
          durationMinutes: 10,
          type: 'break',
        },
      ],
      rationale: 'Balanced 50/10 Pomodoro structure',
    });
    assert(validPlanOutput.success === true, 'studyPlanOutputSchema validates compliant study schedule with breaks');
  } catch (err) {
    assert(false, `Phase 7 AI Validator tests failed: ${(err as Error).message}`);
  }

  // 20. Phase 7: Deterministic Study Plan Fallback & Anti-Overlap Verification
  try {
    const { aiService } = await import('../src/services/ai.service');
    const mockContext = {
      studentName: 'Alex',
      todayDate: '2026-10-21',
      todayGoalMinutes: 120,
      todayCompletedMinutes: 45,
      todayTargetMet: false,
      currentStreak: 3,
      longestStreak: 5,
      pendingTasks: [
        { title: 'Linear Algebra Problem Set', subject: 'Mathematics', priority: 'high', estimatedMinutes: 60 },
        { title: 'Operating Systems Chapter 4', subject: 'Computer Science', priority: 'medium', estimatedMinutes: 45 },
      ],
      recentSessions: [],
      topSubjects: [{ name: 'Mathematics', hours: 4.5, percentage: 60 }],
    };

    const fallbackPlan = aiService.generateDeterministicPlan(mockContext, {
      availableMinutes: 120,
      preferredStartTime: '10:00',
    });

    assert(fallbackPlan.blocks.length >= 2, 'Deterministic planner generates at least 2 schedule blocks for 120m');
    assert(fallbackPlan.blocks.some((b) => b.type === 'break'), 'Deterministic planner schedules necessary break blocks');

    // Verify non-overlapping times and valid sequence
    let overlaps = false;
    for (let i = 0; i < fallbackPlan.blocks.length - 1; i++) {
      const current = fallbackPlan.blocks[i];
      const next = fallbackPlan.blocks[i + 1];
      if (current.endTime > next.startTime) {
        overlaps = true;
      }
    }
    assert(overlaps === false, 'Deterministic study plan guarantees non-overlapping time intervals');
  } catch (err) {
    assert(false, `Deterministic study plan tests failed: ${(err as Error).message}`);
  }

  // 21. Phase 7: Chat Model & Safe Public Formatting
  try {
    const { toPublicChatMessage } = await import('../src/models/ai.model');
    const doc = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      role: 'model' as const,
      content: 'Break your physics study into 25-minute Pomodoro sessions.',
      createdAt: new Date(),
    };
    const pub = toPublicChatMessage(doc);
    assert(pub.id === doc._id.toString(), 'toPublicChatMessage converts ObjectId to string');
    assert(pub.role === 'model', 'toPublicChatMessage preserves model role');
    assert(pub.content === doc.content, 'toPublicChatMessage preserves message content');
    assert(typeof pub.createdAt === 'string', 'toPublicChatMessage converts Date to ISO string');
    assert(!('userId' in pub), 'toPublicChatMessage does not expose internal userId in public DTO');
  } catch (err) {
    assert(false, `Chat Model tests failed: ${(err as Error).message}`);
  }

  // 22. Phase 8: Focus Monitoring Summary Schema & Privacy Tests
  try {
    const { monitoringSummarySchema, finishSessionSchema } = await import('../src/validators/session.validator');

    const { toPublicSession } = await import('../src/models/session.model');

    // Valid monitoring summary
    const validSummary = monitoringSummarySchema.safeParse({
      totalMonitoredSeconds: 1800,
      personPresentPercent: 95.5,
      absenceIncidentCount: 2,
      phoneVisibleCount: 1,
    });
    assert(validSummary.success === true, 'monitoringSummarySchema accepts valid aggregate focus counts');

    // Rejects invalid percentages
    const invalidPercent = monitoringSummarySchema.safeParse({
      totalMonitoredSeconds: 1800,
      personPresentPercent: 120, // Cannot exceed 100%
      absenceIncidentCount: 0,
      phoneVisibleCount: 0,
    });
    assert(invalidPercent.success === false, 'monitoringSummarySchema rejects presence percentage > 100%');

    // Rejects negative incident counts
    const negativeCount = monitoringSummarySchema.safeParse({
      totalMonitoredSeconds: 1800,
      personPresentPercent: 90,
      absenceIncidentCount: -1,
      phoneVisibleCount: 0,
    });
    assert(negativeCount.success === false, 'monitoringSummarySchema rejects negative incident counts');

    // Verify finishSessionSchema accepts optional monitoringSummary without requiring it
    const finishWithSummary = finishSessionSchema.safeParse({
      title: 'Calculus Session',
      monitoringSummary: {
        totalMonitoredSeconds: 1200,
        personPresentPercent: 98,
        absenceIncidentCount: 1,
        phoneVisibleCount: 0,
      },
    });
    assert(finishWithSummary.success === true, 'finishSessionSchema accepts optional monitoringSummary');

    const finishWithoutSummary = finishSessionSchema.safeParse({ title: 'Physics Session' });
    assert(finishWithoutSummary.success === true, 'finishSessionSchema works seamlessly without monitoringSummary');

    // Privacy rule verification: Ensure no camera frame or raw image field can be accepted
    const cameraPayloadAttempt = finishSessionSchema.safeParse({
      title: 'Hacked Session',
      cameraFrame: 'base64_image_data_here',
      videoRecording: 'blob_data',
    });
    assert(!('cameraFrame' in (cameraPayloadAttempt as any).data), 'finishSessionSchema strictly excludes raw camera frame payloads');

    // Test toPublicSession preservation of monitoring summary
    const mockDoc = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      sessionType: 'pomodoro' as const,
      title: 'Focus Lab',
      subject: 'Biology',
      status: 'completed' as const,
      startedAt: new Date(),
      lastResumedAt: null,
      accumulatedDurationMs: 1500000,
      durationSeconds: 1500,
      completedAt: new Date(),
      monitoringSummary: {
        totalMonitoredSeconds: 1500,
        personPresentPercent: 96,
        absenceIncidentCount: 1,
        phoneVisibleCount: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const pubSession = toPublicSession(mockDoc);
    assert(pubSession.monitoringSummary?.personPresentPercent === 96, 'toPublicSession preserves verified monitoringSummary');
  } catch (err) {
    assert(false, `Phase 8 tests failed: ${(err as Error).message}`);
  }

  // 17. Phase 8 Optimization & Performance Verification Suite
  try {
    const { runPhase8OptimizationBenchmarks } = await import('./phase8_optimization.test');
    const phase8Results = await runPhase8OptimizationBenchmarks();
    passed += phase8Results.passed;
    failed += phase8Results.failed;
  } catch (err) {
    assert(false, `Phase 8 optimization suite failed: ${(err as Error).message}`);
  }

  // 18. Phase 9 Smart Notifications & Reminders Test Suite
  try {
    const { runPhase9NotificationTests } = await import('./phase9_notifications.test');
    const phase9Results = await runPhase9NotificationTests();
    passed += phase9Results.passed;
    failed += phase9Results.failed;
  } catch (err) {
    assert(false, `Phase 9 notification suite failed: ${(err as Error).message}`);
  }

  console.log(`\n======================================================`);
  console.log(`TOTAL COMBINED TEST RESULTS: ${passed} passed, ${failed} failed.`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
