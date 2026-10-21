import { apiRequest } from './apiClient';
import { StudyTask, TaskPriority } from '../types';

export interface BackendTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  subject: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  dueDate?: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListTasksResponse {
  tasks: BackendTask[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const taskService = {
  /**
   * Create a new study task
   */
  async createTask(params: {
    title: string;
    subject: string;
    priority?: TaskPriority;
    estimatedMinutes?: number;
    dueDate?: string;
    notes?: string;
  }): Promise<{ message: string; task: BackendTask }> {
    return apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * List tasks with optional status, priority, subject, and pagination
   */
  async listTasks(options: {
    page?: number;
    limit?: number;
    status?: string;
    subject?: string;
    priority?: string;
    search?: string;
  } = {}): Promise<ListTasksResponse> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status) params.append('status', options.status);
    if (options.subject) params.append('subject', options.subject);
    if (options.priority) params.append('priority', options.priority);
    if (options.search) params.append('search', options.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<ListTasksResponse>(`/tasks${queryString}`, {
      method: 'GET',
    });
  },

  /**
   * Retrieve a single task by ID
   */
  async getTask(id: string): Promise<{ task: BackendTask }> {
    return apiRequest<{ task: BackendTask }>(`/tasks/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Update task fields
   */
  async updateTask(
    id: string,
    updates: Partial<{
      title: string;
      subject: string;
      priority: TaskPriority;
      estimatedMinutes: number;
      dueDate?: string;
      notes?: string;
      status?: 'pending' | 'in_progress' | 'completed';
      completed?: boolean;
    }>
  ): Promise<{ message: string; task: BackendTask }> {
    return apiRequest(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Complete or reopen a task
   */
  async toggleComplete(id: string, completed?: boolean): Promise<{ message: string; task: BackendTask }> {
    return apiRequest(`/tasks/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(completed !== undefined ? { completed } : {}),
    });
  },

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<{ message: string; taskId: string }> {
    return apiRequest(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};
