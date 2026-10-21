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

async function runAnalyticsLiveTests() {
  console.log('[Analytics Live E2E] Starting validation for Real-Data Analytics & Insights...\n');
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

    // 2. Register test user for Analytics
    const randomSuffix = Math.floor(Math.random() * 100000);
    const testEmail = `student_analytics_${randomSuffix}@example.com`;
    const signup = await request({
      method: 'POST',
      path: '/api/auth/signup',
      body: {
        name: 'Analytics Student',
        email: testEmail,
        password: 'Password123!',
      },
      cookie: csrfCookie,
      csrfToken,
    });
    assert(signup.statusCode === 201, 'Student registered (HTTP 201)');
    const authCookie = signup.cookies.find((c) => c.startsWith('study_discipline_auth_token='));
    const cookies = [csrfCookie, authCookie].filter(Boolean).map((c) => c!.split(';')[0]).join('; ');

    // 3. GET /api/analytics/overview when user has zero sessions
    const emptyOverview = await request({
      method: 'GET',
      path: '/api/analytics/overview?period=week',
      cookie: cookies,
    });
    assert(emptyOverview.statusCode === 200, 'GET /api/analytics/overview handles empty dataset cleanly (HTTP 200)');
    assert(emptyOverview.data?.overview?.totalFocusedSeconds === 0, 'Empty overview reflects 0 totalFocusedSeconds');
    assert(emptyOverview.data?.overview?.activeDays === 0, 'Empty overview reflects 0 activeDays');
    assert(emptyOverview.data?.overview?.comparison?.previousFocusedSeconds === 0, 'Comparison metrics handled safely with 0 previous duration');

    // 4. Create and complete 2 study sessions: 1 Mathematics, 1 Physics
    const mathSession = await request({
      method: 'POST',
      path: '/api/sessions',
      body: {
        sessionType: 'pomodoro',
        subject: 'Mathematics',
        title: 'Linear Algebra Review',
        pomodoroPhase: 'work',
      },
      cookie: cookies,
      csrfToken,
    });
    const mathId = mathSession.data?.session?.id;
    assert(typeof mathId === 'string', 'Created math session');

    await request({
      method: 'PATCH',
      path: `/api/sessions/${mathId}/finish`,
      body: { title: 'Linear Algebra (Done)' },
      cookie: cookies,
      csrfToken,
    });

    const physicsSession = await request({
      method: 'POST',
      path: '/api/sessions',
      body: {
        sessionType: 'stopwatch',
        subject: 'Physics',
        title: 'Optics Lab Study',
      },
      cookie: cookies,
      csrfToken,
    });
    const physicsId = physicsSession.data?.session?.id;
    assert(typeof physicsId === 'string', 'Created physics session');

    await request({
      method: 'PATCH',
      path: `/api/sessions/${physicsId}/finish`,
      body: { title: 'Optics Lab (Done)' },
      cookie: cookies,
      csrfToken,
    });

    // 5. GET /api/analytics/overview with populated sessions
    const populatedOverview = await request({
      method: 'GET',
      path: '/api/analytics/overview?period=week',
      cookie: cookies,
    });
    assert(populatedOverview.statusCode === 200, 'GET /api/analytics/overview returns 200 with populated data');
    assert(populatedOverview.data?.overview?.totalSessions === 2, 'Overview reflects 2 completed sessions');
    assert(populatedOverview.data?.overview?.activeDays === 1, 'Overview reflects 1 active study day');
    assert(populatedOverview.data?.overview?.totalFocusedSeconds >= 2, 'Total focused seconds accurately aggregated');

    // 6. GET /api/analytics/daily?period=week
    const dailyRes = await request({
      method: 'GET',
      path: '/api/analytics/daily?period=week',
      cookie: cookies,
    });
    assert(dailyRes.statusCode === 200, 'GET /api/analytics/daily returns 200 OK');
    assert(Array.isArray(dailyRes.data?.daily), 'daily endpoint returns array');
    assert(dailyRes.data?.daily.length === 7, 'period=week returns 7 daily bar chart items');
    const todayItem = dailyRes.data?.daily[dailyRes.data?.daily.length - 1];
    assert(todayItem?.sessionsCount >= 2, 'Today entry in daily chart accurately counts 2 completed sessions');

    // 7. GET /api/analytics/subjects?period=week
    const subjectsRes = await request({
      method: 'GET',
      path: '/api/analytics/subjects?period=week',
      cookie: cookies,
    });
    assert(subjectsRes.statusCode === 200, 'GET /api/analytics/subjects returns 200 OK');
    assert(Array.isArray(subjectsRes.data?.subjects), 'subjects endpoint returns array');
    const subjectNames = subjectsRes.data?.subjects.map((s: any) => s.name);
    assert(subjectNames.includes('Mathematics'), 'Subjects breakdown includes Mathematics');
    assert(subjectNames.includes('Physics'), 'Subjects breakdown includes Physics');

    // 8. GET /api/analytics/goals?period=month
    const goalsRes = await request({
      method: 'GET',
      path: '/api/analytics/goals?period=month',
      cookie: cookies,
    });
    assert(goalsRes.statusCode === 200, 'GET /api/analytics/goals returns 200 OK');
    assert(typeof goalsRes.data?.goals?.achievementRate === 'number', 'Goals analytics includes achievementRate percentage');

    // 9. GET /api/analytics/consistency?period=month
    const consistencyRes = await request({
      method: 'GET',
      path: '/api/analytics/consistency?period=month',
      cookie: cookies,
    });
    assert(consistencyRes.statusCode === 200, 'GET /api/analytics/consistency returns 200 OK');
    assert(Array.isArray(consistencyRes.data?.consistency?.heatmap), 'Consistency response includes heatmap array');
    assert(typeof consistencyRes.data?.consistency?.consistencyScore === 'number', 'Consistency score is numeric');

    // 10. Data isolation: Register User B and verify User B cannot see User A's analytics
    const userBEmail = `student_b_analytics_${randomSuffix}@example.com`;
    const signupB = await request({
      method: 'POST',
      path: '/api/auth/signup',
      body: {
        name: 'User B Analytics',
        email: userBEmail,
        password: 'Password123!',
      },
      cookie: csrfCookie,
      csrfToken,
    });
    const authCookieB = signupB.cookies.find((c) => c.startsWith('study_discipline_auth_token='));
    const cookiesB = [csrfCookie, authCookieB].filter(Boolean).map((c) => c!.split(';')[0]).join('; ');

    const userBOverview = await request({
      method: 'GET',
      path: '/api/analytics/overview?period=week',
      cookie: cookiesB,
    });
    assert(userBOverview.data?.overview?.totalSessions === 0, 'User B analytics strictly isolated: totalSessions=0 (User A data excluded)');
    assert(userBOverview.data?.overview?.totalFocusedSeconds === 0, 'User B totalFocusedSeconds is 0');

    // 11. Unauthenticated request rejected with 401
    const unauthRes = await request({
      method: 'GET',
      path: '/api/analytics/overview',
    });
    assert(unauthRes.statusCode === 401, 'Unauthenticated analytics request rejected with HTTP 401');

    console.log(`\nPhase 6 Live Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Analytics E2E error:', err);
    process.exit(1);
  }
}

runAnalyticsLiveTests();
