/**
 * Study Discipline - Client Storage Service
 * Provides higher-level persistence methods for Phase 1.
 * Ready for Phase 2 API sync integration.
 */

import { getFromStorage, saveToStorage, removeFromStorage, STORAGE_KEYS } from '../utils/storage';
import { StudySession, StudyTask, UserSettings, ActiveTimerData } from '../types';

export const storageService = {
  getSessions: (defaultVal: StudySession[]): StudySession[] => {
    return getFromStorage(STORAGE_KEYS.SESSIONS, defaultVal);
  },
  saveSessions: (sessions: StudySession[]): void => {
    saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
  },
  getTasks: (defaultVal: StudyTask[]): StudyTask[] => {
    return getFromStorage(STORAGE_KEYS.TASKS, defaultVal);
  },
  saveTasks: (tasks: StudyTask[]): void => {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  },
  getSettings: (defaultVal: UserSettings): UserSettings => {
    return getFromStorage(STORAGE_KEYS.SETTINGS, defaultVal);
  },
  saveSettings: (settings: UserSettings): void => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  },
  getActiveTimer: (defaultVal: ActiveTimerData): ActiveTimerData => {
    return getFromStorage(STORAGE_KEYS.ACTIVE_TIMER, defaultVal);
  },
  saveActiveTimer: (timer: ActiveTimerData): void => {
    saveToStorage(STORAGE_KEYS.ACTIVE_TIMER, timer);
  },
  clearAll: (): void => {
    removeFromStorage(STORAGE_KEYS.SESSIONS);
    removeFromStorage(STORAGE_KEYS.TASKS);
    removeFromStorage(STORAGE_KEYS.ACTIVE_TIMER);
  },
};
