// src/hooks/usePlanUpgrade.ts
import { useState, useEffect, useRef } from 'react';
import { comparePlans, initiateEsewa, type PlanComparison } from '@/api/billing';
import { apiFetch } from '@/api/apiClient';

export type UpgradeStep = 'plans' | 'confirm-free' | 'confirm-downgrade' | 'payment' | 'processing';

export interface EsewaPayload {
  form_url: string;
  payload:  Record<string, string>;
}

interface UsePlanUpgradeOptions {
  userId:        string;
  onPlanChanged?: (newPlan: string) => void;
  onClose?:       () => void;
}

export function usePlanUpgrade({ userId, onPlanChanged, onClose }: UsePlanUpgradeOptions) {
  const [plans, setPlans]               = useState<PlanComparison[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [step, setStep]                 = useState<UpgradeStep>('plans');
  const [selected, setSelected]         = useState<PlanComparison | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [esewaPayload, setEsewaPayload] = useState<EsewaPayload | null>(null);
  const esewaFormRef                    = useRef<HTMLFormElement>(null);

  // ── Load plans ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    comparePlans(userId)
      .then(data  => { if (!cancelled) setPlans(data); })
      .catch(()   => { if (!cancelled) setError('Failed to load plans'); })
      .finally(() => { if (!cancelled) setLoadingPlans(false); });
    return () => { cancelled = true; };
  }, [userId]);

  // ── Plan selection routing ────────────────────────────────────────────────
  const selectPlan = (plan: PlanComparison) => {
    setSelected(plan);
    setError(null);
    if (plan.plan === 'free')             setStep('confirm-free');
    else if (plan.action === 'downgrade') setStep('confirm-downgrade');
    else                                  setStep('payment');
  };

  const goBackToPlans = () => {
    setStep('plans');
    setError(null);
  };

  // ── Switch to free ────────────────────────────────────────────────────────
  const switchToFree = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await apiFetch(`/billing/switch-free/${userId}`, { method: 'POST' });
      onPlanChanged?.('free');
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch to free plan');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Schedule downgrade ────────────────────────────────────────────────────
  const scheduleDowngrade = async () => {
    if (!selected) return;
    setActionLoading(true);
    setError(null);
    try {
      await apiFetch(`/billing/cancel/${userId}`, { method: 'POST' });
      onPlanChanged?.(selected.plan);
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule downgrade');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Initiate eSewa payment ────────────────────────────────────────────────
  const initiatePayment = async () => {
    if (!selected) return;
    setActionLoading(true);
    setError(null);
    try {
      const data = await initiateEsewa(selected.plan, userId);
      setEsewaPayload({ form_url: data.form_url, payload: data.payload });
      setStep('processing');
      // Auto-submit the hidden form after a short delay
      setTimeout(() => esewaFormRef.current?.submit(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
      setActionLoading(false);
    }
  };

  return {
    // State
    plans,
    loadingPlans,
    step,
    selected,
    actionLoading,
    error,
    esewaPayload,
    esewaFormRef,

    // Actions
    selectPlan,
    goBackToPlans,
    switchToFree,
    scheduleDowngrade,
    initiatePayment,
  };
}
