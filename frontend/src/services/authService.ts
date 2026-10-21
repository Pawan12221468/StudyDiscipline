import { apiRequest } from './apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  csrfToken?: string;
}

export const authService = {
  /**
   * Register a new user account
   */
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  /**
   * Log into existing user account
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Clear HttpOnly session cookie and log out
   */
  async logout(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Fetch currently authenticated user session
   */
  async getMe(): Promise<{ user: User; csrfToken?: string }> {
    return apiRequest<{ user: User; csrfToken?: string }>('/auth/me', {
      method: 'GET',
    });
  },

  /**
   * Initialize anti-CSRF token cookie
   */
  async fetchCsrfToken(): Promise<{ csrfToken: string }> {
    return apiRequest<{ csrfToken: string }>('/auth/csrf', {
      method: 'GET',
    });
  },
};
