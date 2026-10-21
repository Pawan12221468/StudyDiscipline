import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { StudyTask } from '../types';
import { INITIAL_DEMO_TASKS } from '../data/initialData';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { useAuth } from './AuthContext';
import { taskService, BackendTask } from '../services/taskService';
import confetti from 'canvas-confetti';

interface TaskContextType {
  tasks: StudyTask[];
  isLoading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
  addTask: (task: Omit<StudyTask, 'id' | 'createdAt' | 'completed'>) => Promise<StudyTask | null>;
  updateTask: (id: string, updates: Partial<StudyTask>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  resetDemoTasks: () => void;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  todayChecklist: StudyTask[];
  hasRealTasks: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

function mapBackendTaskToStudyTask(t: BackendTask): StudyTask {
  return {
    id: t.id,
    title: t.title,
    subject: t.subject,
    priority: t.priority,
    estimatedMinutes: t.estimatedMinutes,
    completed: t.completed,
    completedAt: t.completedAt || undefined,
    dueDate: t.dueDate,
    notes: t.notes,
    createdAt: t.createdAt,
    isDemo: false,
  };
}

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    return getFromStorage<StudyTask[]>(STORAGE_KEYS.TASKS, INITIAL_DEMO_TASKS);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRealTasks, setHasRealTasks] = useState<boolean>(false);

  // Synchronize local fallback cache
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  // Fetch real study tasks from backend
  const refreshTasks = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await taskService.listTasks({ limit: 100 });
      if (data?.tasks && Array.isArray(data.tasks)) {
        if (data.tasks.length > 0) {
          setTasks(data.tasks.map(mapBackendTaskToStudyTask));
          setHasRealTasks(true);
        } else {
          setTasks([]);
          setHasRealTasks(false);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch backend tasks:', err);
      setError(err.message || 'Unable to load tasks from server.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const addTask = async (taskData: Omit<StudyTask, 'id' | 'createdAt' | 'completed'>): Promise<StudyTask | null> => {
    // Optimistic temporary task
    const tempId = `task-${Date.now()}`;
    const optimisticTask: StudyTask = {
      ...taskData,
      id: tempId,
      completed: false,
      createdAt: new Date().toISOString(),
      isDemo: false,
    };
    setTasks((prev) => [optimisticTask, ...prev]);
    setHasRealTasks(true);

    if (isAuthenticated) {
      try {
        const res = await taskService.createTask({
          title: taskData.title,
          subject: taskData.subject,
          priority: taskData.priority,
          estimatedMinutes: taskData.estimatedMinutes,
          dueDate: taskData.dueDate,
          notes: taskData.notes,
        });

        if (res?.task) {
          const realTask = mapBackendTaskToStudyTask(res.task);
          setTasks((prev) => prev.map((t) => (t.id === tempId ? realTask : t)));
          return realTask;
        }
      } catch (err) {
        console.error('Failed to create task on server:', err);
      }
    }
    return optimisticTask;
  };

  const updateTask = async (id: string, updates: Partial<StudyTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    if (isAuthenticated && !id.startsWith('task-')) {
      try {
        await taskService.updateTask(id, {
          title: updates.title,
          subject: updates.subject,
          priority: updates.priority,
          estimatedMinutes: updates.estimatedMinutes,
          dueDate: updates.dueDate,
          notes: updates.notes,
          completed: updates.completed,
        });
      } catch (err) {
        console.error('Failed to update task on server:', err);
      }
    }
  };

  const toggleTask = async (id: string) => {
    let nextCompleted = false;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          nextCompleted = !t.completed;
          if (nextCompleted) {
            try {
              confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#16a34a', '#22c55e', '#86efac', '#3b82f6'],
              });
            } catch {
              // Ignore if canvas isn't supported
            }
          }
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );

    if (isAuthenticated && !id.startsWith('task-')) {
      try {
        await taskService.toggleComplete(id, nextCompleted);
      } catch (err) {
        console.error('Failed to toggle task on server:', err);
      }
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    if (isAuthenticated && !id.startsWith('task-')) {
      try {
        await taskService.deleteTask(id);
      } catch (err) {
        console.error('Failed to delete task on server:', err);
      }
    }
  };

  const resetDemoTasks = () => {
    setTasks(INITIAL_DEMO_TASKS);
    setHasRealTasks(false);
  };

  const totalTasks = tasks.length;
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayChecklist = useMemo(() => {
    // Show pending tasks first, followed by recently completed tasks
    const pending = tasks.filter((t) => !t.completed);
    const completed = tasks.filter((t) => t.completed);
    return [...pending, ...completed].slice(0, 5);
  }, [tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        refreshTasks,
        addTask,
        updateTask,
        toggleTask,
        deleteTask,
        resetDemoTasks,
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate,
        todayChecklist,
        hasRealTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
