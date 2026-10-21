/**
 * Reusable Typed API Client with HttpOnly Cookie credentials and CSRF protection
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers as Record<string, string>),
  };

  // Attach anti-CSRF token from cookie if available
  const csrfToken = getCookie('study_discipline_csrf_token');
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Crucial for sending and receiving HttpOnly authentication cookies
  });

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, errorMessage, data);
  }

  return data as T;
}
