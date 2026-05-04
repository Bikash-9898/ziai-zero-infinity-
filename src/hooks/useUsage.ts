import { useState, useEffect, useCallback } from "react";
import {
  getUsage,
  getUsageHistory,
  getUsageSummary,
  getBillingStatus,
  comparePlans,
  type UsageResponse,
  type UsageHistoryResponse,
  type UsageSummaryResponse,
  type BillingStatus,
  type PlanComparison,
  PaymentRecord,
  getPaymentHistory,
} from "../api/billing";

// ── useUsage ─────────────────────────────────────────────────────────────────

export function useUsage(userId: string | null) {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getUsage(userId!);
        if (!cancelled) setUsage(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch usage");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [userId]);

  const refetch = useCallback(() => {
    if (!userId) return;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getUsage(userId!);
        setUsage(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch usage");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [userId]);

  return { usage, loading, error, refetch };
}

// ── useUsageHistory ───────────────────────────────────────────────────────────

export function useUsageHistory(userId: string | null, pageSize = 20) {
  const [data, setData] = useState<UsageHistoryResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const result = await getUsageHistory(userId!, 1, pageSize);
        if (!cancelled) {
          setData(result);
          setPage(1);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [userId, pageSize]);

  const goToPage = useCallback(
    (p: number) => {
      if (!userId) return;

      async function run() {
        setLoading(true);
        setError(null);
        try {
          const result = await getUsageHistory(userId!, p, pageSize);
          setData(result);
          setPage(p);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to fetch history");
        } finally {
          setLoading(false);
        }
      }

      run();
    },
    [userId, pageSize]
  );

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return {
    requests: data?.requests ?? [],
    total: data?.total ?? 0,
    page,
    totalPages,
    loading,
    error,
    goToPage,
  };
}

// ── useUsageSummary ───────────────────────────────────────────────────────────

export function useUsageSummary(userId: string | null, days = 30) {
  const [summary, setSummary] = useState<UsageSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getUsageSummary(userId!, days);
        if (!cancelled) setSummary(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch usage summary");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [userId, days]);

  return { summary, loading, error };
}

// ── useBillingStatus ──────────────────────────────────────────────────────────

export function useBillingStatus(userId: string | null) {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getBillingStatus(userId!);
        if (!cancelled) setStatus(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch billing status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [userId]);

  const refetch = useCallback(() => {
    if (!userId) return;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getBillingStatus(userId!);
        setStatus(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch billing status");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [userId]);

  return { status, loading, error, refetch };
}

// ── usePlanComparison ─────────────────────────────────────────────────────────

export function usePlanComparison(userId: string | null) {
  const [plans, setPlans] = useState<PlanComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await comparePlans(userId!);
        if (!cancelled) setPlans(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch plans");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [userId]);

  return { plans, loading, error };
}

// ── Utility helpers ───────────────────────────────────────────────────────────

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function formatNPR(amount: number): string {
  return new Intl.NumberFormat("ne-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Extend useUsage hooks ─────────────────────────────────────────────────────

export function usePaymentHistory(userId: string) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) return;
    getPaymentHistory(userId).then(setPayments).finally(() => setLoading(false));
  }, [userId]);
  return { payments, loading };
}

// export function useBillingStatus(userId: string) {
//   const [status, setStatus] = useState<BillingStatus | null>(null);
//   const [loading, setLoading] = useState(true);
//   const refetch = () => { getBillingStatus(userId).then(setStatus).finally(() => setLoading(false)); };
//   useEffect(() => { if (userId) refetch(); }, [userId]);
//   return { status, loading, refetch };
// }