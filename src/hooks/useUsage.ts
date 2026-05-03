import { useState, useEffect, useCallback } from "react";
import { fetchUsage, fetchSubscription, type UsageData, type Subscription } from "../api/billing";

export interface UseUsageReturn {
  usage: UsageData | null;
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  tokenPercent: number;
  requestPercent: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
}

export function useUsage(): UseUsageReturn {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, s] = await Promise.all([fetchUsage(), fetchSubscription()]);
      setUsage(u);
      setSubscription(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load usage data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, [load]);

  const tokenPercent = usage
    ? Math.min(100, (usage.tokens_used / usage.token_limit) * 100)
    : 0;

  const requestPercent = usage
    ? Math.min(100, (usage.request_count / usage.request_limit) * 100)
    : 0;

  const isNearLimit = tokenPercent >= 80 || requestPercent >= 80;
  const isOverLimit = tokenPercent >= 100 || requestPercent >= 100;

  return {
    usage,
    subscription,
    loading,
    error,
    refetch: load,
    tokenPercent,
    requestPercent,
    isNearLimit,
    isOverLimit,
  };
}
