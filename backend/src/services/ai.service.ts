import { GoogleGenAI } from '@google/genai';
import { ObjectId } from 'mongodb';
import { env } from '../config/env';
import { goalRepository } from '../models/goal.model';
import { taskRepository } from '../models/task.model';
import { sessionRepository } from '../models/session.model';
import { analyticsRepository } from '../models/analytics.model';
import { aiChatRepository } from '../models/ai.model';
import {
  StudyPlanInput,
  StudyPlanOutput,
  studyPlanOutputSchema,
  SyllabusInput,
  SyllabusOutput,
  syllabusOutputSchema,
  QuestionsInput,
  QuestionItem,
  questionsOutputSchema,
} from '../validators/ai.validator';

export interface StudentContextData {
  studentName: string;
  todayDate: string;
  todayGoalMinutes: number;
  todayCompletedMinutes: number;
  todayTargetMet: boolean;
  currentStreak: number;
  longestStreak: number;
  pendingTasks: Array<{ title: string; subject: string; priority: string; estimatedMinutes: number; dueDate?: string }>;
  recentSessions: Array<{ title: string; subject: string; durationMinutes: number; completedAt: string }>;
  topSubjects: Array<{ name: string; hours: number; percentage: number }>;
}

export class AIService {
  /**
   * Check if Gemini API key is configured
   */
  public isConfigured(): boolean {
    return !!(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);
  }

  /**
   * Get an initialized instance of GoogleGenAI or null
   */
  private getClient(): GoogleGenAI | null {
    if (!this.isConfigured()) return null;
    return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
  }

  /**
   * Build bounded, server-derived context of the student's actual study data
   */
  public async buildStudentContext(userId: ObjectId, studentName: string): Promise<StudentContextData> {
    const todayStr = new Date().toISOString().split('T')[0];

    const [progress, streak, taskResult, sessionResult, subjectDistribution] = await Promise.all([
      goalRepository.calculateProgress(userId, todayStr),
      goalRepository.calculateStreak(userId, todayStr),
      taskRepository.listByUserId(userId, { status: 'pending', limit: 8 }),
      sessionRepository.listByUserId(userId, { status: 'completed', limit: 5 }),
      analyticsRepository.getSubjectDistribution(userId, 'month'),
    ]);

    const pendingTasks = taskResult.tasks.map((t) => ({
      title: t.title,
      subject: t.subject,
      priority: t.priority,
      estimatedMinutes: t.estimatedMinutes,
      dueDate: t.dueDate,
    }));

    const recentSessions = sessionResult.sessions.map((s) => ({
      title: s.title,
      subject: s.subject,
      durationMinutes: Math.floor((s.durationSeconds || 0) / 60),
      completedAt: s.completedAt ? s.completedAt.toISOString().split('T')[0] : 'Unknown',
    }));

    const topSubjects = subjectDistribution.slice(0, 4).map((s) => ({
      name: s.name,
      hours: s.hours,
      percentage: s.percentage,
    }));

    return {
      studentName,
      todayDate: todayStr,
      todayGoalMinutes: progress.targetMinutes,
      todayCompletedMinutes: progress.completedMinutes,
      todayTargetMet: progress.isTargetMet,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      pendingTasks,
      recentSessions,
      topSubjects,
    };
  }

  /**
   * Format context into a concise prompt text
   */
  private formatContextForPrompt(ctx: StudentContextData): string {
    return `STUDENT VERIFIED PROFILE & HISTORY:
- Student Name: ${ctx.studentName}
- Date: ${ctx.todayDate}
- Today's Focus Goal: ${ctx.todayGoalMinutes} minutes (Completed: ${ctx.todayCompletedMinutes}m, Goal Met: ${ctx.todayTargetMet})
- Streak: ${ctx.currentStreak} consecutive days (Best: ${ctx.longestStreak} days)
- Pending Coursework Tasks (${ctx.pendingTasks.length}):
${ctx.pendingTasks.length > 0 ? ctx.pendingTasks.map((t) => `  * [${t.priority.toUpperCase()}] ${t.title} (${t.subject}, est: ${t.estimatedMinutes}m${t.dueDate ? `, due: ${t.dueDate}` : ''})`).join('\n') : '  * None'}
- Recent Completed Sessions:
${ctx.recentSessions.length > 0 ? ctx.recentSessions.map((s) => `  * ${s.title} (${s.subject}, ${s.durationMinutes}m on ${s.completedAt})`).join('\n') : '  * No recent sessions recorded'}
- Top Subjects:
${ctx.topSubjects.length > 0 ? ctx.topSubjects.map((sub) => `  * ${sub.name}: ${sub.hours}h (${sub.percentage}%)`).join('\n') : '  * No subject data yet'}`;
  }

  /**
   * AI Coach conversational advice endpoint
   */
  public async chatWithCoach(
    userId: ObjectId,
    userName: string,
    message: string,
    clientHistory?: Array<{ role: 'user' | 'model'; content: string }>
  ): Promise<{ reply: string; isConfigured: boolean }> {
    if (!this.isConfigured()) {
      throw new Error('GEMINI_NOT_CONFIGURED: Google Gemini API key is missing. Please add GEMINI_API_KEY to backend/.env.');
    }

    const ai = this.getClient()!;
    const studentContext = await this.buildStudentContext(userId, userName);
    const contextPrompt = this.formatContextForPrompt(studentContext);

    const systemInstruction = `You are the AI Study Discipline Coach for ${userName}.
You help students build sustained focus, defeat procrastination, manage academic coursework, and build consistent study habits.

STRICT ACCURACY & RESTRAINT GUIDELINES:
1. Always distinguish verified observed student data (provided below) from recommendations.
2. Never invent fake stats, task completion, or metrics that are not in the profile.
3. NEVER claim or imply you have camera, eye-tracking, biometric, or real-world physical surveillance capabilities. You are an academic time-management coach analyzing verified timer sessions and task logs.
4. Keep advice concise, empathetic, action-oriented, and structured (use bullet points or short steps).
5. Address the student's question directly.

CLEAN FORMATTING & STRUCTURE RULES:
- Use standard, clean markdown formatting.
- When organizing study blocks or session schedules, format each block clearly as:
  **Block 1: [Block Name] (25 minutes focus + 5 minutes break)**
  **Action:** [Immediate practical action to complete in this block]
- For sequential next steps or checklists, use a numbered list (1., 2., 3.).
- Use "### [Section Name]" for clear section separation (e.g. ### Recommended Roadmap, ### Next Steps).
- Never output malformed asterisks like "* **Action:*". Always properly close all bold tags like "**Action:**".

${contextPrompt}`;

    // Prepare contents: previous chat turns + current user message
    const contents: any[] = [];

    if (clientHistory && clientHistory.length > 0) {
      for (const h of clientHistory.slice(-6)) {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    try {
      const response = await ai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          temperature: 0.7,
        },
      });

      const reply = response.text || 'I am ready to help you plan your next focused study block. What topic would you like to tackle?';

      // Persist in chat history
      await aiChatRepository.saveMessage(userId, 'user', message);
      await aiChatRepository.saveMessage(userId, 'model', reply);

      return { reply, isConfigured: true };
    } catch (err: any) {
      console.error('Gemini API generateContent error:', err.message);
      throw new Error(`AI_PROVIDER_ERROR: ${err.message || 'Gemini service encountered an error'}`);
    }
  }

  /**
   * Deterministic fallback study plan builder (used if API key is absent or Gemini response is malformed)
   */
  public generateDeterministicPlan(
    studentContext: StudentContextData,
    input: StudyPlanInput
  ): StudyPlanOutput {
    const totalMinutes = input.availableMinutes;
    const startHourStr = input.preferredStartTime || '09:00';
    const [startH, startM] = startHourStr.split(':').map((n) => parseInt(n) || 0);

    let currentTime = new Date();
    currentTime.setHours(startH, startM, 0, 0);

    const blocks: StudyPlanOutput['blocks'] = [];
    let remainingMinutes = totalMinutes;

    // Pick top tasks or fallback subjects
    const tasks = studentContext.pendingTasks.slice(0, 4);
    let taskIndex = 0;

    while (remainingMinutes >= 25) {
      const isBreakTime = blocks.length > 0 && blocks[blocks.length - 1].type === 'focus';

      if (isBreakTime) {
        // 10 min break
        const breakDuration = Math.min(10, remainingMinutes);
        const startTimeStr = currentTime.toTimeString().substring(0, 5);
        currentTime = new Date(currentTime.getTime() + breakDuration * 60000);
        const endTimeStr = currentTime.toTimeString().substring(0, 5);

        blocks.push({
          title: 'Rest & Hydration Break',
          subject: 'Break',
          startTime: startTimeStr,
          endTime: endTimeStr,
          durationMinutes: breakDuration,
          type: 'break',
          notes: 'Step away from screen, hydrate, and stretch.',
        });

        remainingMinutes -= breakDuration;
      } else {
        // 25 - 45 min focus block
        const focusDuration = Math.min(Math.max(25, remainingMinutes >= 50 ? 45 : 25), remainingMinutes);
        const curTask = tasks[taskIndex % Math.max(1, tasks.length)];
        const subject = curTask?.subject || (studentContext.topSubjects[0]?.name || 'General Study');
        const title = curTask?.title ? `Focus: ${curTask.title}` : `${subject} Deep Work`;

        const startTimeStr = currentTime.toTimeString().substring(0, 5);
        currentTime = new Date(currentTime.getTime() + focusDuration * 60000);
        const endTimeStr = currentTime.toTimeString().substring(0, 5);

        blocks.push({
          title,
          subject,
          startTime: startTimeStr,
          endTime: endTimeStr,
          durationMinutes: focusDuration,
          type: 'focus',
          notes: curTask?.priority ? `Priority: ${curTask.priority}` : 'Target focused single-tasking.',
        });

        remainingMinutes -= focusDuration;
        taskIndex++;
      }
    }

    return {
      title: `Personalized Study Schedule (${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m)`,
      totalMinutes,
      blocks,
      rationale: `Balanced Pomodoro schedule tailored to your available ${totalMinutes}m window with structured breaks.`,
    };
  }

  /**
   * AI Personalized Study Plan generation with Gemini structured JSON output
   */
  public async generateStudyPlan(
    userId: ObjectId,
    userName: string,
    input: StudyPlanInput
  ): Promise<{ plan: StudyPlanOutput; isConfigured: boolean }> {
    const studentContext = await this.buildStudentContext(userId, userName);

    if (!this.isConfigured()) {
      // Graceful fallback to deterministic schedule
      const fallback = this.generateDeterministicPlan(studentContext, input);
      return { plan: fallback, isConfigured: false };
    }

    const ai = this.getClient()!;
    const contextPrompt = this.formatContextForPrompt(studentContext);

    const prompt = `Generate a realistic, non-overlapping daily study schedule for ${userName}.
Parameters:
- Available Total Focus Time: ${input.availableMinutes} minutes
- Preferred Start Time: ${input.preferredStartTime || '09:00'}
${input.preferredEndTime ? `- Preferred End Time: ${input.preferredEndTime}` : ''}
${input.focusSubjects && input.focusSubjects.length > 0 ? `- Focus Subjects Requested: ${input.focusSubjects.join(', ')}` : ''}

STUDENT CONTEXT:
${contextPrompt}

CRITICAL RULES:
1. Every block must have non-overlapping startTime and endTime (format HH:MM).
2. Include 5-15 minute break blocks between deep work sessions.
3. Total duration of all blocks must not exceed ${input.availableMinutes} minutes.
4. Align tasks with the student's pending coursework if applicable.
5. Return ONLY a valid JSON object matching this schema:
{
  "title": "Daily Schedule Title",
  "totalMinutes": ${input.availableMinutes},
  "blocks": [
    {
      "title": "Session / Break Name",
      "subject": "Subject name or Break",
      "startTime": "09:00",
      "endTime": "09:45",
      "durationMinutes": 45,
      "type": "focus",
      "notes": "Optional advice"
    }
  ],
  "rationale": "Why this schedule is structured this way"
}`;

    try {
      const response = await ai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const responseText = response.text || '';
      let parsedJson: any;

      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        // Strip code fences if present
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedJson = JSON.parse(cleaned);
      }

      const validated = studyPlanOutputSchema.safeParse(parsedJson);

      if (validated.success) {
        return { plan: validated.data, isConfigured: true };
      } else {
        console.warn('AI study plan output schema mismatch, using fallback plan:', validated.error.message);
        const fallback = this.generateDeterministicPlan(studentContext, input);
        return { plan: fallback, isConfigured: true };
      }
    } catch (err: any) {
      console.warn('Gemini study plan call failed, falling back to deterministic schedule:', err.message);
      const fallback = this.generateDeterministicPlan(studentContext, input);
      return { plan: fallback, isConfigured: true };
    }
  }

  /**
   * Smart Study Insights combining deterministic Phase 6 analytics with AI recommendations
   */
  public async generateInsights(userId: ObjectId, userName: string): Promise<{
    insights: {
      hasSufficientData: boolean;
      strongestDay: string | null;
      mostStudiedSubject: string | null;
      leastStudiedSubject: string | null;
      consistencyRating: 'Excellent' | 'Good' | 'Building Momentum' | 'Needs Attention';
      recommendations: string[];
    };
    isConfigured: boolean;
  }> {
    const [overview, subjects, consistency] = await Promise.all([
      analyticsRepository.getOverview(userId, 'month'),
      analyticsRepository.getSubjectDistribution(userId, 'month'),
      analyticsRepository.getConsistency(userId, 'month'),
    ]);

    const hasSufficientData = overview.totalSessions >= 2;

    // Deterministic stats
    let mostStudiedSubject: string | null = null;
    let leastStudiedSubject: string | null = null;
    if (subjects.length > 0) {
      mostStudiedSubject = subjects[0].name;
      leastStudiedSubject = subjects[subjects.length - 1].name;
    }

    // Determine strongest day from heatmap
    let strongestDay: string | null = null;
    if (consistency.heatmap.length > 0) {
      const dayTotals = new Map<number, number>();
      const dayCounts = new Map<number, number>();
      for (const item of consistency.heatmap) {
        dayTotals.set(item.dayOfWeek, (dayTotals.get(item.dayOfWeek) || 0) + item.actualMinutes);
        dayCounts.set(item.dayOfWeek, (dayCounts.get(item.dayOfWeek) || 0) + 1);
      }
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      let maxAvg = 0;
      let bestDayIndex = -1;
      dayTotals.forEach((total, dIdx) => {
        const count = dayCounts.get(dIdx) || 1;
        const avg = total / count;
        if (avg > maxAvg && avg > 0) {
          maxAvg = avg;
          bestDayIndex = dIdx;
        }
      });
      if (bestDayIndex >= 0) {
        strongestDay = dayNames[bestDayIndex];
      }
    }

    // Consistency rating
    let consistencyRating: 'Excellent' | 'Good' | 'Building Momentum' | 'Needs Attention' = 'Building Momentum';
    if (consistency.consistencyScore >= 70) consistencyRating = 'Excellent';
    else if (consistency.consistencyScore >= 45) consistencyRating = 'Good';
    else if (consistency.consistencyScore >= 20) consistencyRating = 'Building Momentum';
    else consistencyRating = 'Needs Attention';

    // Baseline deterministic recommendations
    const recommendations: string[] = [];

    if (!hasSufficientData) {
      recommendations.push('Complete 2 or more focus sessions with the timer to generate behavioral trends.');
      recommendations.push('Set a consistent 45-minute daily study target to build early momentum.');
    } else {
      if (overview.currentStreak > 0) {
        recommendations.push(`Keep your active streak of ${overview.currentStreak} day${overview.currentStreak > 1 ? 's' : ''} alive by logging at least one focus session today.`);
      } else {
        recommendations.push('Begin with a single 25-minute Pomodoro session today to restart your daily streak.');
      }

      if (leastStudiedSubject && leastStudiedSubject !== mostStudiedSubject) {
        recommendations.push(`Balance coursework: Allocate an initial 30m block to "${leastStudiedSubject}" which currently receives less focus.`);
      }

      if (strongestDay) {
        recommendations.push(`Capitalize on ${strongestDay}s when your focus endurance historically peaks.`);
      }
    }

    // If Gemini is configured and we have sufficient data, enhance with 1 tailored AI tip
    if (this.isConfigured() && hasSufficientData) {
      try {
        const ai = this.getClient()!;
        const prompt = `As an academic study coach for ${userName}, provide exactly 2 concise, practical study recommendations (1-2 sentences each).
Student Data:
- Total Monthly Study: ${overview.totalFocusedHours}h across ${overview.totalSessions} sessions
- Consistency Score: ${consistency.consistencyScore}%
- Streak: ${overview.currentStreak} days
- Top Subject: ${mostStudiedSubject || 'General Study'}
- Return ONLY 2 bullet points.`;

        const res = await ai.models.generateContent({
          model: env.GEMINI_MODEL,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { temperature: 0.5 },
        });

        const aiTips = res.text?.split('\n').filter((l) => l.trim().length > 10).map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim());
        if (aiTips && aiTips.length >= 1) {
          recommendations.splice(0, recommendations.length, ...aiTips.slice(0, 3));
        }
      } catch (err) {
        // Keep deterministic recommendations
      }
    }

    return {
      insights: {
        hasSufficientData,
        strongestDay,
        mostStudiedSubject,
        leastStudiedSubject,
        consistencyRating,
        recommendations,
      },
      isConfigured: this.isConfigured(),
    };
  }

  /**
   * Deterministic fallback syllabus when Gemini is unconfigured or unavailable
   */
  public generateFallbackSyllabus(track: string, targetName: string): SyllabusOutput {
    const isTech = track.toLowerCase().includes('tech') || targetName.toLowerCase().includes('dsa') || targetName.toLowerCase().includes('code');
    const isGovt = track.toLowerCase().includes('govt') || track.toLowerCase().includes('government') || targetName.toLowerCase().includes('ssc') || targetName.toLowerCase().includes('upsc');

    if (isTech) {
      return {
        targetName,
        track,
        summary: 'Comprehensive curriculum covering foundational to advanced Data Structures, Algorithms & Problem Solving.',
        totalEstimatedHours: 64,
        modules: [
          {
            id: 'm1',
            moduleTitle: 'Module 1: Array Manipulation, Strings & Pointers',
            topics: [
              {
                id: 't-arrays',
                name: 'Arrays & Vectors',
                description: 'Static & dynamic arrays, contiguous memory, prefix sums, sub-arrays.',
                estimatedHours: 6,
                subtopics: ['Prefix Sums', "Kadane's Algorithm", 'Two Pointers Technique', 'Sliding Window'],
              },
              {
                id: 't-strings',
                name: 'String Manipulation & Hashing',
                description: 'Character frequency arrays, palindromes, substring problems, string matching.',
                estimatedHours: 5,
                subtopics: ['Anagrams & Frequency Maps', 'Palindrome Checks', 'String Hashing basics'],
              },
              {
                id: 't-sorting',
                name: 'Binary Search & Sorting',
                description: 'Divide and conquer, search space reduction, lower/upper bounds.',
                estimatedHours: 6,
                subtopics: ['Binary Search on Answers', 'Merge Sort', 'Quick Sort', 'Two-way partitioned search'],
              },
            ],
          },
          {
            id: 'm2',
            moduleTitle: 'Module 2: Linear Data Structures',
            topics: [
              {
                id: 't-linkedlist',
                name: 'Linked Lists (Singly & Doubly)',
                description: 'Node chaining, pointer redirection, fast and slow pointers, cycle detection.',
                estimatedHours: 6,
                subtopics: ['Reversal of Linked List', 'Cycle Detection (Floyd)', 'Merge Two Sorted Lists'],
              },
              {
                id: 't-stack-queue',
                name: 'Stacks, Queues & Monotonic Patterns',
                description: 'LIFO & FIFO structures, monotonic stacks for nearest smaller/greater elements.',
                estimatedHours: 7,
                subtopics: ['Parentheses Balancing', 'Monotonic Stack (Next Greater Element)', 'Min Stack Implementation'],
              },
            ],
          },
          {
            id: 'm3',
            moduleTitle: 'Module 3: Non-Linear Trees & Dynamic Programming',
            topics: [
              {
                id: 't-trees',
                name: 'Binary Trees & Binary Search Trees',
                description: 'Hierarchical node traversal (Inorder, Preorder, Postorder, Level Order), tree depths.',
                estimatedHours: 10,
                subtopics: ['Lowest Common Ancestor (LCA)', 'Tree Traversals (BFS & DFS)', 'BST Validation'],
              },
              {
                id: 't-dp',
                name: 'Dynamic Programming & Memoization',
                description: 'Overlapping subproblems, optimal substructure, 1D & 2D memoization.',
                estimatedHours: 12,
                subtopics: ['1D DP (Climbing Stairs, House Robber)', '0/1 Knapsack Problem', 'Longest Common Subsequence'],
              },
            ],
          },
        ],
      };
    }

    if (isGovt) {
      return {
        targetName,
        track,
        summary: 'Targeted preparation roadmap for Quantitative Aptitude, Reasoning, General Awareness and English.',
        totalEstimatedHours: 75,
        modules: [
          {
            id: 'm1',
            moduleTitle: 'Module 1: Quantitative Aptitude & Numerical Ability',
            topics: [
              {
                id: 't-arithmetic',
                name: 'Arithmetic: Percentages, Profit & Loss',
                description: 'Foundational arithmetic concepts, ratio proportions, successive percentage changes.',
                estimatedHours: 10,
                subtopics: ['Percentage Calculations', 'Profit, Loss & Discount', 'Ratio & Proportion'],
              },
              {
                id: 't-time-work',
                name: 'Time, Speed, Distance & Work',
                description: 'Work efficiency equations, pipes & cisterns, relative speed, train problems.',
                estimatedHours: 10,
                subtopics: ['Time and Work Formulae', 'Pipes & Cisterns', 'Speed, Distance & Relative Velocity'],
              },
            ],
          },
          {
            id: 'm2',
            moduleTitle: 'Module 2: Logical Reasoning & General Awareness',
            topics: [
              {
                id: 't-verbal-reasoning',
                name: 'Syllogism, Blood Relations & Directions',
                description: 'Venn diagram deduction, family tree logic, cardinal compass navigation.',
                estimatedHours: 8,
                subtopics: ['Syllogism (All/Some/No)', 'Blood Relationship Trees', 'Direction & Distance'],
              },
              {
                id: 't-polity',
                name: 'Indian Polity & Constitution',
                description: 'Fundamental rights, preamble, parliamentary system, articles & amendments.',
                estimatedHours: 12,
                subtopics: ['Preamble & Fundamental Rights', 'President & Prime Minister', 'Constitutional Amendments'],
              },
            ],
          },
        ],
      };
    }

    // Default / School (Class 10/12 / Academic)
    return {
      targetName,
      track,
      summary: `Standard academic mastery syllabus for ${targetName} covering core principles, practical questions, and chapter-wise breakdowns.`,
      totalEstimatedHours: 50,
      modules: [
        {
          id: 'm1',
          moduleTitle: 'Module 1: Foundations & Core Mathematical Theories',
          topics: [
            {
              id: 't-maths-foundations',
              name: 'Real Numbers & Polynomials',
              description: 'Fundamental theorem of arithmetic, zeros of polynomials, factor theorems.',
              estimatedHours: 8,
              subtopics: ['Euclid division & Fundamental Theorem', 'Graphing Polynomial Zeros', 'Quadratic Equations'],
            },
            {
              id: 't-trigonometry',
              name: 'Trigonometry & Applications',
              description: 'Trigonometric ratios, standard angles (0°, 30°, 45°, 60°, 90°), heights & distances.',
              estimatedHours: 10,
              subtopics: ['Trigonometric Identities', 'Angle of Elevation & Depression', 'Complementary Angles'],
            },
          ],
        },
        {
          id: 'm2',
          moduleTitle: 'Module 2: Natural Sciences & Practical Lab Work',
          topics: [
            {
              id: 't-physics-light',
              name: 'Optics: Reflection & Refraction',
              description: 'Spherical mirrors, ray diagrams, lens formula, human eye and colorful world.',
              estimatedHours: 9,
              subtopics: ['Mirror & Lens Formulas', "Refraction & Snell's Law", 'Dispersion of Light in Prism'],
            },
            {
              id: 't-chemistry-reactions',
              name: 'Chemical Reactions, Acids, Bases & Metals',
              description: 'Balancing redox reactions, pH scale, properties of metals and non-metals.',
              estimatedHours: 9,
              subtopics: ['Balancing Chemical Equations', 'Acids, Bases & Salts reactions', 'Reactivity Series of Metals'],
            },
          ],
        },
      ],
    };
  }

  /**
   * AI Dynamic Syllabus Generation using Gemini with Schema Fallback
   */
  public async generateSyllabus(
    input: SyllabusInput
  ): Promise<{ syllabus: SyllabusOutput; isConfigured: boolean }> {
    if (!this.isConfigured()) {
      const fallback = this.generateFallbackSyllabus(input.track, input.targetName);
      return { syllabus: fallback, isConfigured: false };
    }

    const ai = this.getClient()!;
    const prompt = `You are a high-level educational curriculum architect.
Create a detailed, structured learning syllabus and roadmap for a student.
Target Field / Exam: "${input.targetName}"
Category / Track: "${input.track}"
${input.level ? `Current Student Level: "${input.level}"` : ''}

CRITICAL RULES:
1. Divide the syllabus into 3-4 logical, sequential modules.
2. Each module should have 2-4 concrete, high-yield study topics.
3. For each topic, provide a short description, estimated hours, and 3-4 key subtopics/concepts.
4. Output MUST be ONLY valid JSON matching this schema:
{
  "targetName": "${input.targetName}",
  "track": "${input.track}",
  "summary": "Brief 1-2 sentence overview of this syllabus roadmap",
  "totalEstimatedHours": 60,
  "modules": [
    {
      "id": "m1",
      "moduleTitle": "Module 1: Title",
      "topics": [
        {
          "id": "t1",
          "name": "Topic Name",
          "description": "Short description of focus area",
          "estimatedHours": 6,
          "subtopics": ["Subtopic A", "Subtopic B", "Subtopic C"]
        }
      ]
    }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const responseText = response.text || '';
      let parsedJson: any;

      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedJson = JSON.parse(cleaned);
      }

      const validated = syllabusOutputSchema.safeParse(parsedJson);
      if (validated.success) {
        return { syllabus: validated.data, isConfigured: true };
      } else {
        console.warn('Syllabus schema validation mismatch, using fallback:', validated.error.message);
        return { syllabus: this.generateFallbackSyllabus(input.track, input.targetName), isConfigured: true };
      }
    } catch (err: any) {
      console.warn('Gemini syllabus generation error, using fallback:', err.message);
      return { syllabus: this.generateFallbackSyllabus(input.track, input.targetName), isConfigured: true };
    }
  }

  /**
   * Deterministic fallback questions for a given topic
   */
  public generateFallbackQuestions(track: string, topic: string, subtopic?: string, excludeQuestions?: string[]): QuestionItem[] {
    const isExcluded = (title: string) => excludeQuestions?.some((e) => e.toLowerCase() === title.toLowerCase());

    const allCandidateQuestions: QuestionItem[] = [
      {
        id: `q-fallback-1`,
        title: `Two Sum: Target Pair in an Array`,
        difficulty: 'easy',
        problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input would have exactly one solution.',
        examplesOrContext: 'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1] (Because nums[0] + nums[1] == 9)',
        hints: [
          'Brute force checking all pairs takes O(n²). Can you use a hash map to look up complements in O(1)?',
          'For each number x, check if (target - x) is already present in your hash map.',
        ],
        keyTakeaway: 'Hash map lookup transforms O(n²) search into O(n) single-pass linear time.',
        estimatedMinutes: 25,
        subject: topic,
      },
      {
        id: `q-fallback-2`,
        title: `Maximum Subarray Sum (Kadane's Algorithm)`,
        difficulty: 'medium',
        problemStatement: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
        examplesOrContext: 'Input: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6 (Subarray [4,-1,2,1] has largest sum = 6)',
        hints: [
          'Keep a running sum: currentSum = max(num, currentSum + num).',
          "If currentSum drops below 0, reset it because it won't help future subarrays.",
        ],
        keyTakeaway: "Kadane's algorithm achieves O(n) time and O(1) auxiliary space by greedily restarting running sums.",
        estimatedMinutes: 30,
        subject: topic,
      },
      {
        id: `q-fallback-3`,
        title: `Best Time to Buy and Sell Stock`,
        difficulty: 'easy',
        problemStatement: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy and a different day in the future to sell.',
        examplesOrContext: 'Input: prices = [7,1,5,3,6,4]\nOutput: 5 (Buy on day 2 price 1, sell on day 5 price 6)',
        hints: [
          'Maintain the minimum price seen so far as you iterate through the list.',
          'At each step, calculate current profit = prices[i] - minPrice and update maxProfit.',
        ],
        keyTakeaway: 'Single-pass dynamic tracking avoids nested O(n²) loops.',
        estimatedMinutes: 20,
        subject: topic,
      },
      {
        id: `q-fallback-4`,
        title: `Trapping Rain Water (Two Pointer Optimization)`,
        difficulty: 'hard',
        problemStatement: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
        examplesOrContext: 'Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6 units of trapped water',
        hints: [
          'Water trapped above bar i is min(maxLeft, maxRight) - height[i].',
          'Use two pointers starting from left and right moving towards the peak to eliminate extra array storage.',
        ],
        keyTakeaway: 'Two pointers can maintain dynamic bounding leftMax and rightMax in O(1) space.',
        estimatedMinutes: 45,
        subject: topic,
      },
      {
        id: `q-fallback-5`,
        title: `Container With Most Water`,
        difficulty: 'medium',
        problemStatement: 'Given n heights representing vertical lines, find two lines that together with the x-axis form a container containing the most water.',
        examplesOrContext: 'Input: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49 (Between index 1 and index 8)',
        hints: [
          'Start pointers at both ends. Area = min(height[left], height[right]) * (right - left).',
          'Always move the pointer pointing to the shorter line inward.',
        ],
        keyTakeaway: 'Greedily moving the shorter edge gives the only chance of finding a taller boundary with a larger area.',
        estimatedMinutes: 30,
        subject: topic,
      },
    ];

    const available = allCandidateQuestions.filter((q) => !isExcluded(q.title));
    return available.length >= 1 ? available.slice(0, 3) : allCandidateQuestions.slice(0, 3);
  }

  /**
   * AI Dynamic Question & Challenge Generation using Gemini with Skip Exclusion
   */
  public async generateTopicQuestions(
    input: QuestionsInput
  ): Promise<{ questions: QuestionItem[]; isConfigured: boolean }> {
    if (!this.isConfigured()) {
      const fallback = this.generateFallbackQuestions(input.track, input.topic, input.subtopic, input.excludeQuestions);
      return { questions: fallback, isConfigured: false };
    }

    const ai = this.getClient()!;
    const excludeList = input.excludeQuestions && input.excludeQuestions.length > 0
      ? `DO NOT generate or repeat any of these questions (the student already knows or skipped them):\n- ${input.excludeQuestions.join('\n- ')}`
      : '';

    const prompt = `You are a master academic teacher and practice challenge curator.
Generate ${input.count} tailored practice problems/questions for a student.

Target Field / Track: "${input.track}"
Topic: "${input.topic}"
${input.subtopic ? `Specific Subtopic: "${input.subtopic}"` : ''}
${input.difficulty !== 'all' ? `Desired Difficulty: "${input.difficulty}"` : 'Mix of Easy, Medium, and Hard'}
${excludeList}

CRITICAL RULES:
1. Provide practical, high-yield questions suitable for exam prep or coding interviews.
2. For each question include:
   - title: concise descriptive name
   - difficulty: "easy", "medium", or "hard"
   - problemStatement: clear problem explanation with input/output or question details
   - examplesOrContext: sample test cases, example calculation, or conceptual context
   - hints: 2 short progressive hints
   - keyTakeaway: 1-sentence learning summary
   - estimatedMinutes: recommended focus time (e.g. 20, 30, 45)
   - subject: "${input.topic}"
3. Output MUST be ONLY valid JSON matching this schema:
{
  "topic": "${input.topic}",
  "questions": [
    {
      "id": "q1",
      "title": "Title here",
      "difficulty": "medium",
      "problemStatement": "Full problem description...",
      "examplesOrContext": "Input/Output or context...",
      "hints": ["Hint 1...", "Hint 2..."],
      "keyTakeaway": "Key concept learned...",
      "estimatedMinutes": 30,
      "subject": "${input.topic}"
    }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const responseText = response.text || '';
      let parsedJson: any;

      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedJson = JSON.parse(cleaned);
      }

      const validated = questionsOutputSchema.safeParse(parsedJson);
      if (validated.success && validated.data.questions.length > 0) {
        return { questions: validated.data.questions, isConfigured: true };
      } else {
        console.warn('Questions schema validation mismatch, using fallback:', validated.error?.message);
        return {
          questions: this.generateFallbackQuestions(input.track, input.topic, input.subtopic, input.excludeQuestions),
          isConfigured: true,
        };
      }
    } catch (err: any) {
      console.warn('Gemini questions generation error, using fallback:', err.message);
      return {
        questions: this.generateFallbackQuestions(input.track, input.topic, input.subtopic, input.excludeQuestions),
        isConfigured: true,
      };
    }
  }
}

export const aiService = new AIService();
