/**
 * Frontend Service for Backend Health Connectivity (Phase 2)
 * Connects to the public backend health endpoints without leaking sensitive details.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface ServerHealthResponse {
  status: string;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
}

export interface DatabaseHealthResponse {
  status: string;
  database: string;
  databaseName?: string;
  latencyMs?: number;
  message?: string;
  timestamp: string;
}

export const healthService = {
  /**
   * Check general backend server status
   */
  async checkServerHealth(): Promise<ServerHealthResponse> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) {
      throw new Error(`Server health check failed with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Check live MongoDB Atlas connectivity through the backend
   */
  async checkDatabaseHealth(): Promise<DatabaseHealthResponse> {
    const res = await fetch(`${API_BASE_URL}/health/db`);
    return res.json();
  },
};
