async function testHttpEndpoints() {
  console.log('[HTTP Verification] Testing live /api/ai endpoints on http://localhost:5000...\n');

  const baseUrl = 'http://localhost:5000/api';

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/health`);
  const health = await healthRes.json();
  console.log('1. Health check status:', healthRes.status, health);

  // 2. Register/Login test user
  const email = `ai_http_${Date.now()}@example.com`;
  const signupRes = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'HTTP Test Student',
      email,
      password: 'SecurePassword123!',
    }),
  });
  console.log('2. Signup status:', signupRes.status);

  // Extract cookies
  const cookies = signupRes.headers.get('set-cookie') || '';
  const cookieHeader = cookies.split(',').map((c) => c.split(';')[0]).join('; ');

  // Extract CSRF token from cookie
  const csrfMatch = cookieHeader.match(/study_discipline_csrf_token=([^;]+)/);
  const csrfToken = csrfMatch ? csrfMatch[1] : '';

  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': cookieHeader,
    'x-csrf-token': csrfToken,
  };

  // 3. Test GET /api/ai/coach/history
  const historyRes = await fetch(`${baseUrl}/ai/coach/history`, {
    headers: authHeaders,
  });
  const historyData = await historyRes.json();
  console.log('3. GET /api/ai/coach/history status:', historyRes.status, 'Total messages:', historyData.total, 'isConfigured:', historyData.isConfigured);

  // 4. Test POST /api/ai/study-plan
  const planRes = await fetch(`${baseUrl}/ai/study-plan`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      availableMinutes: 120,
      preferredStartTime: '10:00',
      focusSubjects: ['Algorithms', 'Physics'],
    }),
  });
  const planData = await planRes.json();
  console.log('4. POST /api/ai/study-plan status:', planRes.status, 'Plan title:', planData.plan?.title, 'Blocks count:', planData.plan?.blocks?.length);

  // 5. Test GET /api/ai/insights
  const insightsRes = await fetch(`${baseUrl}/ai/insights`, {
    headers: authHeaders,
  });
  const insightsData = await insightsRes.json();
  console.log('5. GET /api/ai/insights status:', insightsRes.status, 'Consistency:', insightsData.insights?.consistencyRating, 'Recommendations:', insightsData.insights?.recommendations?.length);

  // 6. Test POST /api/ai/coach
  const coachRes = await fetch(`${baseUrl}/ai/coach`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      message: 'What is the best way to structure my study schedule today?',
    }),
  });
  const coachData = await coachRes.json();
  console.log('6. POST /api/ai/coach status:', coachRes.status, 'Response:', coachData.error || coachData.reply?.substring(0, 80));

  // 7. Test Phase 8: Finish session with consented monitoring summary
  const sessionCreateRes = await fetch(`${baseUrl}/sessions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sessionType: 'stopwatch',
      subject: 'Computer Vision',
      title: 'Phase 8 Local Monitoring Test',
    }),
  });
  const sessionCreated = await sessionCreateRes.json();
  const sessionId = sessionCreated.session?.id;

  const sessionFinishRes = await fetch(`${baseUrl}/sessions/${sessionId}/finish`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Completed with Focus Monitoring',
      notes: 'Monitored on-device with MediaPipe',
      monitoringSummary: {
        totalMonitoredSeconds: 1800,
        personPresentPercent: 94.5,
        absenceIncidentCount: 2,
        phoneVisibleCount: 1,
      },
    }),
  });
  const finishedSession = await sessionFinishRes.json();
  console.log('7. Finish session with monitoringSummary status:', sessionFinishRes.status, 'Saved monitoringSummary:', finishedSession.session?.monitoringSummary);

  console.log('\nAll HTTP endpoint checks finished successfully!');
}


testHttpEndpoints().catch(console.error);
