// Types for user, billing, and usage data in the React frontend
// These types are used across components, contexts, and API clients to ensure consistent data structures and type safety

export interface User {
  id: string;        // UUID comes in as a string
  email: string;
  username: string;
  plan: string;
  is_active: boolean;
  created_at: string; // ISO timestamp string
  role?: string;
  is_guest?: boolean;
}

// Returned by GET /api/admin/users — User + aggregate usage/wallet info
export interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  trial_tokens_remaining: number;
  credit_balance_npr: number;
  total_tokens: number;
  total_cost_usd: number;
  total_requests: number;
}

export interface TokenAnalyticsPoint {
  date: string;
  tokens: number;
  requests: number;
}

export interface TokenAnalyticsResponse {
  daily: TokenAnalyticsPoint[];
}

export interface ProfitAnalyticsPoint {
  date: string;
  revenue_npr: number;
  cost_npr: number;
  profit_npr: number;
}

export interface ProfitAnalyticsResponse {
  daily: ProfitAnalyticsPoint[];
  total_revenue_npr: number;
  total_cost_npr: number;
  total_profit_npr: number;
}

// Returned by GET/POST/PUT /api/admin/image-models — the image model registry
export interface ImageModelRow {
  id: string;
  display_name: string;
  provider: string;               // 'huggingface' | 'fal' | 'pollinations'
  provider_model_id: string;
  credits_per_image: number;
  is_active: boolean;
  sort_order: number;
}
export interface AIModelRow {
  id: string;
  label: string;
  provider: string;                 // 'huggingface' | 'openai' | 'anthropic'
  provider_model_id: string;
  input_price_per_million: number;
  output_price_per_million: number;
  is_active: boolean;
  sort_order: number;
  tier: 'fast' | 'balanced' | 'flagship';
  supports_images: boolean;
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