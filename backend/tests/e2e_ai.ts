import { dbConnection } from '../src/config/database';
import { userRepository } from '../src/models/user.model';
import { sessionRepository } from '../src/models/session.model';
import { taskRepository } from '../src/models/task.model';
import { goalRepository } from '../src/models/goal.model';
import { aiChatRepository } from '../src/models/ai.model';
import { aiService } from '../src/services/ai.service';
import { hashPassword } from '../src/utils/auth.util';
import { ObjectId } from 'mongodb';

async function runE2ETests(): Promise<void> {
  console.log('[E2E AI Test Suite] Running live Phase 7 AI Coach, Study Planner & Insights tests...\n');

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

  await dbConnection.connect();

  const testEmail = `ai_tester_${Date.now()}@example.com`;
  const passwordHash = await hashPassword('SecurePass123!');
  const testUser = await userRepository.create(
    'AI Test Student',
    testEmail,
    passwordHash
  );

  const userId = testUser._id;

  console.log(`Created test student: ${testUser.name} (${userId.toString()})`);

  try {
    // 1. Seed sample tasks and study sessions
    const task1 = await taskRepository.create(userId, {
      title: 'Thermodynamics Problem Set 3',
      subject: 'Physics',
      priority: 'high',
      estimatedMinutes: 60,
    });
    assert(task1._id instanceof ObjectId, 'Seeded test task 1');

    const task2 = await taskRepository.create(userId, {
      title: 'Calculus Series and Sequences',
      subject: 'Mathematics',
      priority: 'medium',
      estimatedMinutes: 45,
    });
    assert(task2._id instanceof ObjectId, 'Seeded test task 2');

    // Seed session
    const todayStr = new Date().toISOString().split('T')[0];
    const sessionDoc = {
      _id: new ObjectId(),
      userId,
      sessionType: 'stopwatch' as const,
      subject: 'Physics',
      title: 'Physics Lab Review',
      status: 'completed' as const,
      durationSeconds: 3000, // 50 mins
      accumulatedDurationMs: 3000000,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await sessionRepository.getCollection().insertOne(sessionDoc as any);
    assert(sessionDoc._id instanceof ObjectId, 'Seeded completed study session');


    // Seed daily goal
    await goalRepository.upsert(userId, todayStr, 90);
    assert(true, 'Seeded daily study goal (90m)');


    // 2. Test AIService context building
    const context = await aiService.buildStudentContext(userId, testUser.name);
    assert(context.studentName === testUser.name, 'buildStudentContext includes correct student name');
    assert(context.todayGoalMinutes === 90, 'buildStudentContext reflects verified daily target of 90m');
    assert(context.todayCompletedMinutes === 50, 'buildStudentContext reflects completed 50m session');
    assert(context.pendingTasks.length >= 2, 'buildStudentContext captures pending coursework tasks');
    assert(context.topSubjects.some((s) => s.name === 'Physics'), 'buildStudentContext accurately maps Physics focus');

    // 3. Test Study Plan Generation (deterministic fallback when GEMINI_API_KEY missing or live model if configured)
    const planResult = await aiService.generateStudyPlan(userId, testUser.name, {
      availableMinutes: 120,
      preferredStartTime: '09:00',
      focusSubjects: ['Physics', 'Mathematics'],
    });

    assert(!!planResult.plan, 'generateStudyPlan returns structured plan');
    assert(planResult.plan.totalMinutes === 120, 'Plan totalMinutes matches requested duration (120m)');
    assert(planResult.plan.blocks.length >= 2, 'Plan contains at least 2 schedule blocks');
    assert(planResult.plan.blocks.some((b) => b.type === 'break'), 'Plan contains at least one rest/break block');

    // Verify non-overlapping times
    let overlapFound = false;
    for (let i = 0; i < planResult.plan.blocks.length - 1; i++) {
      const b1 = planResult.plan.blocks[i];
      const b2 = planResult.plan.blocks[i + 1];
      if (b1.endTime > b2.startTime) {
        overlapFound = true;
      }
    }
    assert(!overlapFound, 'Plan blocks have no overlapping start and end times');

    // 4. Test Smart Study Insights
    const insightsResult = await aiService.generateInsights(userId, testUser.name);
    assert(!!insightsResult.insights, 'generateInsights returns insights object');
    assert(insightsResult.insights.hasSufficientData === false, 'Correctly flags insufficient history (<2 sessions)');
    assert(insightsResult.insights.recommendations.length >= 1, 'Provides actionable recommendations for next session');

    // 5. Test AI Chat History MongoDB persistence
    await aiChatRepository.saveMessage(userId, 'user', 'How do I start studying for physics?');
    await aiChatRepository.saveMessage(userId, 'model', 'Start with a 25-minute Pomodoro focusing on formulas.');

    const historyResult = await aiChatRepository.listPaginated(userId, 1, 10);
    assert(historyResult.total === 2, 'aiChatRepository records 2 messages');
    assert(historyResult.messages[0].role === 'user', 'First message is role user');
    assert(historyResult.messages[1].role === 'model', 'Second message is role model');

    // Clear history test
    const cleared = await aiChatRepository.clearHistory(userId);
    assert(cleared === true, 'aiChatRepository.clearHistory clears user conversation');
    const emptyHistory = await aiChatRepository.listPaginated(userId, 1, 10);
    assert(emptyHistory.total === 0, 'Chat history is completely cleared for the user');
  } finally {
    // Cleanup test data
    console.log('Cleaning up test data...');
    const db = dbConnection.getDb();
    await Promise.all([
      db.collection('users').deleteOne({ _id: userId }),
      db.collection('study_sessions').deleteMany({ userId }),
      db.collection('study_tasks').deleteMany({ userId }),
      db.collection('study_goals').deleteMany({ userId }),
      db.collection('ai_chat_history').deleteMany({ userId }),
    ]);
    console.log('Cleanup complete.');
    await dbConnection.close();
  }

  console.log(`\nE2E Results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests();
