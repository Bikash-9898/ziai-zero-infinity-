import type { User } from '../types';

const API_URL = 'http://localhost:8000/api';

export const authApi = {
  // Verifies the Google Token with your backend
  verifyGoogleToken: async (token: string): Promise<{ verified: boolean; user: User }> => {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Authentication failed');
    }

    return response.json();
  },

  // You can add more later, like logout or getCurrentUser
};