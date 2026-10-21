import http from 'http';

interface RequestOptions {
  method: string;
  path: string;
  body?: any;
  cookie?: string;
  csrfToken?: string;
}

interface ApiResponse<T = any> {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  cookies: string[];
  data: T;
}

function request<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : '';
    const headers: http.OutgoingHttpHeaders = {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:5173',
      'Referer': 'http://localhost:5173/',
    };

    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (options.cookie) {
      headers['Cookie'] = options.cookie;
    }
    if (options.csrfToken) {
      headers['x-csrf-token'] = options.csrfToken;
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: options.path,
        method: options.method,
        headers,
      },
      (res) => {
        let rawData = '';
        const cookies = (res.headers['set-cookie'] as string[]) || [];

        res.on('data', (chunk) => {
          rawData += chunk;
        });

        res.on('end', () => {
          let data: any = rawData;
          try {
            data = JSON.parse(rawData);
          } catch {
            // Keep rawData
          }
          resolve({
            statusCode: res.statusCode || 500,
            headers: res.headers,
            cookies,
            data,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runPhase5LiveTests() {
  console.log('[Phase 5 Live E2E] Starting validation for Goals, Tasks & Streaks...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.error(`  ✗ ${name}`);
      failed++;
    }
  }

  try {
    // 1. Get CSRF token
    const csrfRes = await request({ method: 'GET', path: '/api/auth/csrf' });
    const csrfToken = csrfRes.data?.csrfToken;
    const csrfCookie = csrfRes.cookies.find((c) => c.startsWith('csrf_token='));
    assert(typeof csrfToken === 'string', 'CSRF token acquired');

    // 2. Register User A
    const randomSuffix = Math.floor(Math.random() * 100000);
    const userAEmail = `user_a_${randomSuffix}@example.com`;
    const signupA = await request({
      method: 'POST',
      path: '/api/auth/signup',
      body: {
        name: 'User A Discipline',
        email: userAEmail,
        password: 'Password123!',
      },
      cookie: csrfCookie,
      csrfToken,
    });
    assert(signupA.statusCode === 201, 'User A registered (HTTP 201)');
    const authCookieA = signupA.cookies.find((c) => c.startsWith('study_discipline_auth_token='));
    const cookiesA = [csrfCookie, authCookieA].filter(Boolean).map((c) => c!.split(';')[0]).join('; ');

    const todayStr = new Date().toISOString().split('T')[0];

    // 3. GET /api/goals/daily for unset date -> returns documented default 120 min
    const defaultGoalRes = await request({
      method: 'GET',
      path: `/api/goals/daily?date=${todayStr}`,
      cookie: cookiesA,
    });
    assert(defaultGoalRes.statusCode === 200, 'GET /api/goals/daily returns 200 OK');
    assert(defaultGoalRes.data?.goal?.targetMinutes === 120, 'Unset daily goal returns documented default of 120 minutes');
    assert(defaultGoalRes.data?.goal?.isCustom === false, 'Unset daily goal explicitly has isCustom=false');

    // 4. PUT /api/goals/daily -> configure custom target of 90 minutes
    const updateGoalRes = await request({
      method: 'PUT',
      path: '/api/goals/daily',
      body: {
        date: todayStr,
        targetMinutes: 90,
      },
      cookie: cookiesA,
      csrfToken,
    });
    assert(updateGoalRes.statusCode === 200, 'PUT /api/goals/daily updates target to 90 minutes (HTTP 200)');
    assert(updateGoalRes.data?.goal?.targetMinutes === 90, 'Updated goal returns targetMinutes=90');
    assert(updateGoalRes.data?.goal?.isCustom === true, 'Updated goal returns isCustom=true');

    // 5. GET /api/goals/daily/progress -> initially 0 minutes
    const initialProgressRes = await request({
      method: 'GET',
      path: `/api/goals/daily/progress?date=${todayStr}`,
      cookie: cookiesA,
    });
    assert(initialProgressRes.statusCode === 200, 'GET /api/goals/daily/progress returns 200 OK');
    assert(initialProgressRes.data?.progress?.targetMinutes === 90, 'Progress accurately reflects configured daily target');
    assert(initialProgressRes.data?.progress?.completedMinutes === 0, 'Progress initially reflects 0 completed minutes');
    assert(initialProgressRes.data?.progress?.isTargetMet === false, 'Initial isTargetMet=false');

    // 6. Complete a study session of 60 minutes for User A
    const sessionRes1 = await request({
      method: 'POST',
      path: '/api/sessions',
      body: {
        sessionType: 'pomodoro',
        subject: 'Mathematics',
        title: 'Calculus Session 1',
        pomodoroPhase: 'work',
      },
      cookie: cookiesA,
      csrfToken,
    });
    const sessId1 = sessionRes1.data?.session?.id;
    assert(typeof sessId1 === 'string', 'Created study session 1');

    await request({
      method: 'PATCH',
      path: `/api/sessions/${sessId1}/finish`,
      body: { title: 'Calculus 60m' },
      cookie: cookiesA,
      csrfToken,
    });

    // 7. Check updated progress
    const midProgressRes = await request({
      method: 'GET',
      path: `/api/goals/daily/progress?date=${todayStr}`,
      cookie: cookiesA,
    });
    assert(midProgressRes.statusCode === 200, 'Progress updated after session completion');
    assert(midProgressRes.data?.progress?.sessionsCount >= 1, 'Progress sessionsCount reflects finished sessions');

    // 8. Streak endpoint GET /api/goals/streak
    const streakRes = await request({
      method: 'GET',
      path: `/api/goals/streak?date=${todayStr}`,
      cookie: cookiesA,
    });
    assert(streakRes.statusCode === 200, 'GET /api/goals/streak returns 200 OK');
    assert(typeof streakRes.data?.streak?.currentStreak === 'number', 'Streak response includes currentStreak');
    assert(Array.isArray(streakRes.data?.streak?.weeklyLogs), 'Streak response includes 7-day weeklyLogs array');
    assert(streakRes.data?.streak?.weeklyLogs.length === 7, 'weeklyLogs array contains 7 days');

    // 9. Tasks CRUD: POST /api/tasks
    const createTaskRes = await request({
      method: 'POST',
      path: '/api/tasks',
      body: {
        title: 'Complete Linear Algebra HW #5',
        subject: 'Mathematics',
        priority: 'high',
        estimatedMinutes: 45,
        dueDate: 'Today',
        notes: 'Problems 1 to 12',
      },
      cookie: cookiesA,
      csrfToken,
    });
    assert(createTaskRes.statusCode === 201, 'POST /api/tasks creates task (HTTP 201)');
    const taskId = createTaskRes.data?.task?.id;
    assert(typeof taskId === 'string', 'Created task returns MongoDB ID');
    assert(createTaskRes.data?.task?.completed === false, 'Created task initial completed=false');

    // 10. GET /api/tasks with filters
    const listTasksRes = await request({
      method: 'GET',
      path: '/api/tasks?status=pending&priority=high',
      cookie: cookiesA,
    });
    assert(listTasksRes.statusCode === 200, 'GET /api/tasks lists tasks with filters (HTTP 200)');
    assert(Array.isArray(listTasksRes.data?.tasks), 'Response has tasks array');
    assert(listTasksRes.data?.tasks.some((t: any) => t.id === taskId), 'Filtered task list contains created task');

    // 11. GET /api/tasks/:id
    const getTaskRes = await request({
      method: 'GET',
      path: `/api/tasks/${taskId}`,
      cookie: cookiesA,
    });
    assert(getTaskRes.statusCode === 200, 'GET /api/tasks/:id returns 200 OK');
    assert(getTaskRes.data?.task?.title === 'Complete Linear Algebra HW #5', 'Retrieved task matches title');

    // 12. PATCH /api/tasks/:id
    const updateTaskRes = await request({
      method: 'PATCH',
      path: `/api/tasks/${taskId}`,
      body: {
        title: 'Complete Linear Algebra HW #5 (Revised)',
        estimatedMinutes: 60,
      },
      cookie: cookiesA,
      csrfToken,
    });
    assert(updateTaskRes.statusCode === 200, 'PATCH /api/tasks/:id updates task details (HTTP 200)');
    assert(updateTaskRes.data?.task?.estimatedMinutes === 60, 'Updated task duration reflects 60m');

    // 13. PATCH /api/tasks/:id/complete -> mark completed
    const completeTaskRes = await request({
      method: 'PATCH',
      path: `/api/tasks/${taskId}/complete`,
      body: { completed: true },
      cookie: cookiesA,
      csrfToken,
    });
    assert(completeTaskRes.statusCode === 200, 'PATCH /api/tasks/:id/complete marks task completed (HTTP 200)');
    assert(completeTaskRes.data?.task?.completed === true, 'Task completed property is true');
    assert(typeof completeTaskRes.data?.task?.completedAt === 'string', 'Task records completedAt timestamp');

    // 14. PATCH /api/tasks/:id/complete -> reopen task
    const reopenTaskRes = await request({
      method: 'PATCH',
      path: `/api/tasks/${taskId}/complete`,
      body: { completed: false },
      cookie: cookiesA,
      csrfToken,
    });
    assert(reopenTaskRes.statusCode === 200, 'Reopening task returns 200 OK');
    assert(reopenTaskRes.data?.task?.completed === false, 'Reopened task completed is false');
    assert(reopenTaskRes.data?.task?.completedAt === null, 'Reopened task completedAt is cleared to null');

    // 15. Multi-tenant data isolation test: User B cannot access or mutate User A's task
    const userBEmail = `user_b_${randomSuffix}@example.com`;
    const signupB = await request({
      method: 'POST',
      path: '/api/auth/signup',
      body: {
        name: 'User B',
        email: userBEmail,
        password: 'Password123!',
      },
      cookie: csrfCookie,
      csrfToken,
    });
    const authCookieB = signupB.cookies.find((c) => c.startsWith('study_discipline_auth_token='));
    const cookiesB = [csrfCookie, authCookieB].filter(Boolean).map((c) => c!.split(';')[0]).join('; ');

    // User B tries to view User A's task
    const userBGetTask = await request({
      method: 'GET',
      path: `/api/tasks/${taskId}`,
      cookie: cookiesB,
    });
    assert(userBGetTask.statusCode === 404, 'User B cannot view User A task (HTTP 404 isolation enforced)');

    // User B tries to update User A's task
    const userBUpdateTask = await request({
      method: 'PATCH',
      path: `/api/tasks/${taskId}`,
      body: { title: 'Compromised Title' },
      cookie: cookiesB,
      csrfToken,
    });
    assert(userBUpdateTask.statusCode === 404, 'User B cannot update User A task (HTTP 404 mutation forbidden)');

    // User B checks daily goal (should get default, not User A's custom 90m goal)
    const userBGoal = await request({
      method: 'GET',
      path: `/api/goals/daily?date=${todayStr}`,
      cookie: cookiesB,
    });
    assert(userBGoal.data?.goal?.isCustom === false, 'User B receives independent default goal, not User A custom goal');

    // 16. DELETE /api/tasks/:id
    const deleteTaskRes = await request({
      method: 'DELETE',
      path: `/api/tasks/${taskId}`,
      cookie: cookiesA,
      csrfToken,
    });
    assert(deleteTaskRes.statusCode === 200, 'DELETE /api/tasks/:id deletes task (HTTP 200)');

    const verifyDeleted = await request({
      method: 'GET',
      path: `/api/tasks/${taskId}`,
      cookie: cookiesA,
    });
    assert(verifyDeleted.statusCode === 404, 'Deleted task returns 404 Not Found');

    console.log(`\nPhase 5 Live Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Phase 5 E2E error:', err);
    process.exit(1);
  }
}

runPhase5LiveTests();
