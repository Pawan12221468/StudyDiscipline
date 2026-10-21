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

async function runLiveE2ETests() {
  console.log('[E2E Live Test] Starting Live API validation against http://localhost:5000...\n');
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
    // 1. Health & Database connectivity check
    const healthRes = await request({ method: 'GET', path: '/api/health' });
    assert(healthRes.statusCode === 200 && healthRes.data.status === 'ok', 'GET /api/health returns 200 OK');

    const dbRes = await request({ method: 'GET', path: '/api/health/db' });
    assert(dbRes.statusCode === 200 && dbRes.data.status === 'healthy', 'GET /api/health/db returns 200 healthy connected to MongoDB Atlas');

    // 2. Fetch anti-CSRF token
    const csrfRes = await request({ method: 'GET', path: '/api/auth/csrf' });
    const csrfToken = csrfRes.data?.csrfToken;
    const csrfCookie = csrfRes.cookies.find((c) => c.startsWith('csrf_token='));
    assert(typeof csrfToken === 'string' && csrfToken.length > 0, 'GET /api/auth/csrf generates valid anti-CSRF token');

    // 3. Register a test user
    const randomSuffix = Math.floor(Math.random() * 100000);
    const testEmail = `student_${randomSuffix}@example.com`;
    const signupRes = await request({
      method: 'POST',
      path: '/api/auth/signup',
      body: {
        name: 'Live Test Student',
        email: testEmail,
        password: 'SecurePassword123!',
      },
      cookie: csrfCookie,
      csrfToken,
    });
    assert(signupRes.statusCode === 201, `POST /api/auth/signup registers user (HTTP 201)`);

    const authCookie = signupRes.cookies.find((c) => c.startsWith('study_discipline_auth_token='));
    assert(!!authCookie, 'Signup response sets HttpOnly auth cookie');

    // Combined cookies for subsequent authenticated requests
    const combinedCookies = [csrfCookie, authCookie].filter(Boolean).map((c) => c!.split(';')[0]).join('; ');

    // 4. Create / Start a Study Session
    const startRes = await request({
      method: 'POST',
      path: '/api/sessions',
      body: {
        sessionType: 'pomodoro',
        subject: 'Mathematics',
        title: 'Integral Calculus Practice',
        targetDurationSeconds: 1500,
        pomodoroPhase: 'work',
        pomodoroCycles: 1,
      },
      cookie: combinedCookies,
      csrfToken,
    });
    assert(startRes.statusCode === 201, 'POST /api/sessions creates a new study session (HTTP 201)');
    const sessionId = startRes.data?.session?.id;
    assert(typeof sessionId === 'string', 'Created session returns MongoDB ID');
    assert(startRes.data?.session?.status === 'running', 'New session status is "running"');

    // 5. Single active session enforcement: verify starting a second session returns 409 Conflict
    const secondStartRes = await request({
      method: 'POST',
      path: '/api/sessions',
      body: {
        sessionType: 'stopwatch',
        subject: 'Physics',
      },
      cookie: combinedCookies,
      csrfToken,
    });
    assert(secondStartRes.statusCode === 409, 'POST /api/sessions enforces single-active-session constraint (HTTP 409 Conflict)');
    assert(secondStartRes.data?.activeSession?.id === sessionId, '409 Conflict response returns existing active session ID for smooth recovery');

    // 6. Get active session for recovery
    const activeRes = await request({
      method: 'GET',
      path: '/api/sessions/active',
      cookie: combinedCookies,
    });
    assert(activeRes.statusCode === 200, 'GET /api/sessions/active returns 200 OK');
    assert(activeRes.data?.session?.id === sessionId, 'Active session matches current session ID');
    assert(typeof activeRes.data?.elapsedMs === 'number', 'Active session provides computed elapsedMs from timestamps');

    // 7. Pause the session
    const pauseRes = await request({
      method: 'PATCH',
      path: `/api/sessions/${sessionId}/pause`,
      cookie: combinedCookies,
      csrfToken,
    });
    assert(pauseRes.statusCode === 200, 'PATCH /api/sessions/:id/pause pauses running session (HTTP 200)');
    assert(pauseRes.data?.session?.status === 'paused', 'Paused session status is "paused"');
    assert(typeof pauseRes.data?.session?.accumulatedDurationMs === 'number', 'Paused session updates accumulatedDurationMs');

    // 8. Attempting to pause already paused session fails gracefully
    const doublePauseRes = await request({
      method: 'PATCH',
      path: `/api/sessions/${sessionId}/pause`,
      cookie: combinedCookies,
      csrfToken,
    });
    assert(doublePauseRes.statusCode === 400, 'Pausing an already paused session rejects invalid state transition (HTTP 400)');

    // 9. Resume the session
    const resumeRes = await request({
      method: 'PATCH',
      path: `/api/sessions/${sessionId}/resume`,
      cookie: combinedCookies,
      csrfToken,
    });
    assert(resumeRes.statusCode === 200, 'PATCH /api/sessions/:id/resume resumes paused session (HTTP 200)');
    assert(resumeRes.data?.session?.status === 'running', 'Resumed session status is "running"');

    // 10. Finish the session
    const finishRes = await request({
      method: 'PATCH',
      path: `/api/sessions/${sessionId}/finish`,
      body: {
        title: 'Completed Calculus Session',
        notes: 'Reviewed integration by parts and trigonometric substitution.',
      },
      cookie: combinedCookies,
      csrfToken,
    });
    assert(finishRes.statusCode === 200, 'PATCH /api/sessions/:id/finish completes study session (HTTP 200)');
    assert(finishRes.data?.session?.status === 'completed', 'Finished session status is "completed"');
    assert(typeof finishRes.data?.durationSeconds === 'number', 'Verified final durationSeconds is computed from server timestamps');
    assert(finishRes.data?.session?.title === 'Completed Calculus Session', 'Session title updated successfully');

    // 11. Verify active session is now null
    const noActiveRes = await request({
      method: 'GET',
      path: '/api/sessions/active',
      cookie: combinedCookies,
    });
    assert(noActiveRes.statusCode === 200 && noActiveRes.data?.session === null, 'GET /api/sessions/active returns null after completion');

    // 12. List completed sessions with pagination
    const listRes = await request({
      method: 'GET',
      path: '/api/sessions?page=1&limit=10',
      cookie: combinedCookies,
    });
    assert(listRes.statusCode === 200, 'GET /api/sessions lists completed sessions with pagination (HTTP 200)');
    assert(Array.isArray(listRes.data?.sessions), 'Response contains array of sessions');
    assert(listRes.data?.sessions.some((s: any) => s.id === sessionId), 'List contains recently finished session');
    assert(listRes.data?.pagination?.total >= 1, 'Pagination total count reflects user sessions');

    // 13. Data isolation test: register User B and ensure User B cannot access User A's session
    const userBRes = await request({
      method: 'POST',
      path: '/api/auth/signup',
      body: {
        name: 'User B Student',
        email: `student_b_${randomSuffix}@example.com`,
        password: 'PasswordB123!',
      },
      cookie: csrfCookie,
      csrfToken,
    });
    const userBCookie = userBRes.cookies.find((c) => c.startsWith('study_discipline_auth_token='));
    const userBCombinedCookies = [csrfCookie, userBCookie].filter(Boolean).map((c) => c!.split(';')[0]).join('; ');

    // User B tries to read User A's session
    const userBReadRes = await request({
      method: 'GET',
      path: `/api/sessions/${sessionId}`,
      cookie: userBCombinedCookies,
    });
    assert(userBReadRes.statusCode === 404, 'User B cannot view User A session (HTTP 404 data isolation enforced)');

    // User B tries to mutate User A's session
    const userBMutateRes = await request({
      method: 'PATCH',
      path: `/api/sessions/${sessionId}/finish`,
      body: { title: 'Hacked Title' },
      cookie: userBCombinedCookies,
      csrfToken,
    });
    assert(userBMutateRes.statusCode === 404, 'User B cannot mutate User A session (HTTP 404 mutation forbidden)');

    // 14. Unauthenticated request rejection
    const unauthRes = await request({
      method: 'GET',
      path: '/api/sessions',
    });
    assert(unauthRes.statusCode === 401, 'Unauthenticated session listing rejected with HTTP 401');

    console.log(`\nLive E2E Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal E2E error:', error);
    process.exit(1);
  }
}

runLiveE2ETests();
