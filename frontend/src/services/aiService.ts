import { apiRequest } from './apiClient';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  createdAt?: string;
}

export interface StudyPlanBlock {
  id?: string;
  title: string;
  subject: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: 'focus' | 'break';
  taskId?: string;
  notes?: string;
}

export interface StudyPlanOutput {
  title: string;
  totalMinutes: number;
  blocks: StudyPlanBlock[];
  rationale: string;
}

export interface StudyPlanInput {
  availableMinutes: number;
  preferredStartTime?: string;
  preferredEndTime?: string;
  focusSubjects?: string[];
}

export interface StudyInsights {
  hasSufficientData: boolean;
  strongestDay: string | null;
  mostStudiedSubject: string | null;
  leastStudiedSubject: string | null;
  consistencyRating: 'Excellent' | 'Good' | 'Building Momentum' | 'Needs Attention';
  recommendations: string[];
}

export interface ChatResponse {
  reply: string;
  isConfigured: boolean;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  isConfigured: boolean;
}

export interface StudyPlanResponse {
  plan: StudyPlanOutput;
  isConfigured: boolean;
}

export interface InsightsResponse {
  insights: StudyInsights;
  isConfigured: boolean;
}

export interface SyllabusTopic {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  subtopics: string[];
}

export interface SyllabusModule {
  id: string;
  moduleTitle: string;
  topics: SyllabusTopic[];
}

export interface SyllabusOutput {
  targetName: string;
  track: string;
  summary: string;
  totalEstimatedHours: number;
  modules: SyllabusModule[];
}

export interface SyllabusResponse {
  syllabus: SyllabusOutput;
  isConfigured: boolean;
}

export interface QuestionItem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  problemStatement: string;
  examplesOrContext?: string;
  hints: string[];
  keyTakeaway?: string;
  estimatedMinutes: number;
  subject: string;
}

export interface QuestionsResponse {
  questions: QuestionItem[];
  isConfigured: boolean;
}

export interface SyllabusInput {
  track: string;
  targetName: string;
  level?: string;
}

export interface QuestionsInput {
  track: string;
  topic: string;
  subtopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'all';
  excludeQuestions?: string[];
  count?: number;
}

export const aiService = {
  /**
   * Send a question or message to the AI Study Coach
   */
  async chat(message: string, history?: Array<{ role: 'user' | 'model'; content: string }>): Promise<ChatResponse> {
    return apiRequest<ChatResponse>('/ai/coach', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  },

  /**
   * Retrieve paginated chat history for the authenticated user
   */
  async getHistory(page: number = 1, limit: number = 20): Promise<ChatHistoryResponse> {
    return apiRequest<ChatHistoryResponse>(`/ai/coach/history?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  },

  /**
   * Clear user's AI chat conversation history
   */
  async clearHistory(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/ai/coach/history', {
      method: 'DELETE',
    });
  },

  /**
   * Generate an optimized, non-overlapping daily study schedule
   */
  async generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanResponse> {
    return apiRequest<StudyPlanResponse>('/ai/study-plan', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Retrieve smart study insights and evidence-based suggestions
   */
  async getInsights(): Promise<InsightsResponse> {
    return apiRequest<InsightsResponse>('/ai/insights', {
      method: 'GET',
    });
  },

  /**
   * Generate tailored curriculum & syllabus roadmap via Gemini
   */
  async generateSyllabus(input: SyllabusInput): Promise<SyllabusResponse> {
    return apiRequest<SyllabusResponse>('/ai/syllabus', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Generate curated practice questions & daily challenges via Gemini with skip exclusion
   */
  async generateQuestions(input: QuestionsInput): Promise<QuestionsResponse> {
    return apiRequest<QuestionsResponse>('/ai/questions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
