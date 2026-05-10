// src/api/auth.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const TOKEN_KEY = 'zi_token';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string)   => localStorage.setItem(TOKEN_KEY, token),
  clear: ()              => localStorage.removeItem(TOKEN_KEY),
};

export const authApi = {
  async verifyGoogleToken(accessToken: string) {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: accessToken }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? 'Auth failed');
    }
    const data = await res.json();
    // Store the JWT the backend now returns
    if (data.access_token) {
      tokenStore.set(data.access_token);
    }
    return data;
  },
};
