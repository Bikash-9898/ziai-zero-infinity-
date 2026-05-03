const BASE_URL = "http://localhost:8000/api";

export interface Plan {
  id: string;
  name: string;
  price: number;
  tokens: number;
  requests: number;
  features: string[];
}

export interface UsageData {
  tokens_used: number;
  request_count: number;
  period_start: string;
  period_end: string;
  token_limit: number;
  request_limit: number;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
}

export interface PaymentInitResponse {
  payment_url: string;
  transaction_id: string;
  product_code?: string;
  amount: number;
}

function getAuthHeaders(): HeadersInit {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return {
    "Content-Type": "application/json",
    ...(user?.email ? { "X-User-Email": user.email } : {}),
  };
}

export async function fetchPlans(): Promise<Plan[]> {
  const res = await fetch(`${BASE_URL}/plans`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch plans");
  return res.json();
}

export async function fetchUsage(): Promise<UsageData> {
  const res = await fetch(`${BASE_URL}/usage/current`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch usage");
  return res.json();
}

export async function fetchSubscription(): Promise<Subscription | null> {
  const res = await fetch(`${BASE_URL}/subscriptions/current`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch subscription");
  return res.json();
}

export async function initiateEsewaPayment(
  planId: string
): Promise<PaymentInitResponse> {
  const res = await fetch(`${BASE_URL}/esewa/initiate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ plan_id: planId }),
  });
  if (!res.ok) throw new Error("Failed to initiate eSewa payment");
  return res.json();
}

// export async function initiateKhaltiPayment(
//   planId: string
// ): Promise<PaymentInitResponse> {
//   const res = await fetch(`${BASE_URL}/khalti/initiate`, {
//     method: "POST",
//     headers: getAuthHeaders(),
//     body: JSON.stringify({ plan_id: planId }),
//   });
//   if (!res.ok) throw new Error("Failed to initiate Khalti payment");
//   return res.json();
// }

export async function verifyEsewaPayment(params: {
  oid: string;
  amt: string;
  refId: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/esewa/verify`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("eSewa verification failed");
  return res.json();
}

// export async function verifyKhaltiPayment(params: {
//   token: string;
//   amount: number;
// }): Promise<{ success: boolean; message: string }> {
//   const res = await fetch(`${BASE_URL}/khalti/verify`, {
//     method: "POST",
//     headers: getAuthHeaders(),
//     body: JSON.stringify(params),
//   });
//   if (!res.ok) throw new Error("Khalti verification failed");
//   return res.json();
// }

export async function fetchBillingHistory(): Promise<
  {
    id: string;
    plan: string;
    amount: number;
    method: string;
    status: string;
    created_at: string;
  }[]
> {
  const res = await fetch(`${BASE_URL}/billing/history`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch billing history");
  return res.json();
}
