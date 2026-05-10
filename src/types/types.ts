// Types for user, billing, and usage data in the React frontend
// These types are used across components, contexts, and API clients to ensure consistent data structures and type safety

export interface User {
  id: string;        // UUID comes in as a string
  email: string;
  username: string;
  plan: string;
  is_active: boolean;
  created_at: string; // ISO timestamp string
}

export type View = 'overview' | 'users' | 'api-keys' | 'settings';

export interface sensitiveData {
  prompt: string;
  files: string[];
  images: string[];
  chathistory: string; // This could be an array of message objects if you want to store more structured chat history or response data
}

export interface technicalData {
  modelUsed: string;
  responseTime: number; // in milliseconds
  tokensUsed: number;
  timestamp: string; // ISO date string
  browserInfo: string; // User agent string or parsed browser info
  deviceInfo: string; // Parsed device info (e.g., desktop, mobile, tablet)
  usagelog: string; // This could be an array of log entries or a structured log object depending on your needs
}

export interface CredentialResponse {
  client_id: string;
  credential: string;
  select_by: 'user' | 'auto' | 'btn' | 'icon';
}