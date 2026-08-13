// src/api/billing.ts
import { apiJson } from './apiClient';   // ← sends JWT automatically, handles 401

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlanInfo {
  plan: string;
  tokens_per_month: number;
  requests_per_month: number;
  image_generations_per_month: number;
  price_npr: number;
  is_unlimited: boolean;
}

export interface PlanComparison extends PlanInfo {
  is_current: boolean;
  action: 'current' | 'upgrade' | 'downgrade';
}

export interface SubscriptionResponse {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  provider: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface BillingStatus {
  user_id: string;
  current_plan: string;
  is_active: boolean;
  subscription: {
    status: string | null;
    period_start: string | null;
    period_end: string | null;
  };
  last_payment: {
    provider: string | null;
    amount: string | null;
    date: string | null;
  };
}

export interface UsageResponse {
  user_id: string;
  plan: string;
  tokens_used: number;
  tokens_limit: number;
  requests_used: number;
  requests_limit: number;
  images_used: number;
  images_limit: number;
  period_start: string;
  period_end: string;
  percent_tokens_used: number | null;
  percent_requests_used: number | null;
}

export interface AiRequestRecord {
  id: string;
  user_id: string;
  model: string;
  tokens_input: number | null;
  tokens_output: number | null;
  total_tokens: number;
  cost: number | null;
  latency_ms: number | null;
  status: string;
  created_at: string;
}

export interface UsageHistoryResponse {
  requests: AiRequestRecord[];
  total: number;
  page: number;
  page_size: number;
}

export interface UsageSummaryResponse {
  daily_tokens: { date: string; tokens: number; requests: number }[];
  top_models:   { model: string; count: number; tokens: number }[];
  total_cost:   number;
  avg_latency_ms: number | null;
}

export interface EsewaPayloadResponse {
  form_url: string;
  payload: Record<string, string>;
  transaction_uuid: string;
}

export interface WalletStatus {
  user_id: string;
  trial_tokens_remaining: number;
  trial_tokens_total: number;
  on_trial: boolean;
  credit_balance: number;
}

export interface StripeCheckoutSessionResponse {
  id: string;
  url?: string;
}

// ── Plans ─────────────────────────────────────────────────────────────────────

export const getPlans       = (): Promise<PlanInfo[]>        => apiJson('/plans/');
export const getPlan        = (plan: string): Promise<PlanInfo> => apiJson(`/plans/${plan}`);
export const comparePlans   = (userId: string): Promise<PlanComparison[]> =>
  apiJson(`/plans/compare/${userId}`);

// ── Billing ───────────────────────────────────────────────────────────────────

export const getBillingStatus = (userId: string): Promise<BillingStatus> =>
  apiJson(`/billing/status/${userId}`);

export const getWalletStatus = (userId: string): Promise<WalletStatus> =>
  apiJson(`/billing/wallet/${userId}`);

export const getSubscription = (userId: string): Promise<SubscriptionResponse> =>
  apiJson(`/billing/subscription/${userId}`);

export const getPaymentHistory = (
  userId: string,
  limit  = 20,
  offset = 0,
): Promise<PaymentRecord[]> =>
  apiJson(`/billing/payments/${userId}?limit=${limit}&offset=${offset}`);

export const cancelSubscription = (
  userId: string,
): Promise<{ message: string; period_end: string }> =>
  apiJson(`/billing/cancel/${userId}`, { method: 'POST' });

// ── Payments ──────────────────────────────────────────────────────────────────

export const initiateEsewa = (plan: string, userId: string): Promise<EsewaPayloadResponse> =>
  apiJson(`/billing/esewa/initiate?plan=${plan}&user_id=${userId}`, { method: 'POST' });

// Wallet top-up: arbitrary NPR amount, not tied to a subscription plan.
// Only eSewa supports this today — see app/controllers/esewa_controller.py.
// Khalti/Stripe wallet top-up aren't wired on the backend yet.
export const initiateEsewaTopup = (amountNpr: number, userId: string): Promise<EsewaPayloadResponse> =>
  apiJson(`/billing/esewa/topup/initiate?amount_npr=${amountNpr}&user_id=${userId}`, { method: 'POST' });

export interface KhaltiInitiateResponse {
  payment_url: string;
  pidx: string;
  order_id: string;
}

export const initiateKhalti = (plan: string, userId: string): Promise<KhaltiInitiateResponse> =>
  apiJson(`/billing/khalti/initiate?plan=${plan}&user_id=${userId}`, { method: 'POST' });

interface KhaltiVerifyPayload {
  pidx: string;
  order_id: string;
}

export const verifyKhalti = (payload: KhaltiVerifyPayload): Promise<{ verified: boolean; detail?: string }> =>
  apiJson(`/billing/khalti/verify`, { method: 'POST', body: JSON.stringify(payload) });

export const createStripeCheckoutSession = (
  plan: string,
  userId: string,
): Promise<StripeCheckoutSessionResponse> =>
  apiJson(`/billing/stripe/initiate?plan=${plan}&user_id=${userId}`, { method: 'POST' });


// ── Usage ─────────────────────────────────────────────────────────────────────

export const getUsage = (userId: string): Promise<UsageResponse> =>
  apiJson(`/usage/${userId}`);

export const getUsageHistory = (
  userId: string,
  page     = 1,
  pageSize = 20,
): Promise<UsageHistoryResponse> =>
  apiJson(`/usage/${userId}/history?page=${page}&page_size=${pageSize}`);

export const getUsageSummary = (userId: string, days = 30): Promise<UsageSummaryResponse> =>
  apiJson(`/usage/${userId}/summary?days=${days}`);
