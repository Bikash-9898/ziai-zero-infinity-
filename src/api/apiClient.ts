// src/api/apiClient.ts
/**
 * Thin wrapper around fetch that:
 * 1. Prepends the base URL
 * 2. Attaches the JWT Authorization header automatically
 * 3. Throws on non-2xx with a readable error message
 * 4. Redirects to home and clears auth on 401
 */
import { tokenStore } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handle401() {
  tokenStore.clear();
  localStorage.removeItem('zi_user');
  window.location.href = '/';
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = tokenStore.get();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    await handle401();
    throw new ApiError(401, 'Session expired — please sign in again');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? `Request failed: ${res.status}`);
  }

  return res;
}

export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, options);
  return res.json() as Promise<T>;
}
