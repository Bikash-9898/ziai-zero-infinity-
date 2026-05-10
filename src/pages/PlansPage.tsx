// src/pages/PlansPage.tsx
// Standalone plan selection page — replaces the static UpgradePlans mock.
// Fetches real plan data from the backend via comparePlans(), renders PlanCard
// components, and opens UpgradeModal at the correct step on selection.

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useBillingStatus } from '@/hooks/useUsage';
import PlanCard from '@/components/billing/PlanCard';
import UpgradeModal from '@/components/billing/UpgradeModal';
import { type PlanComparison } from '@/api/billing';
import { useEffect } from 'react';
import { comparePlans } from '@/api/billing';

export default function PlansPage() {
  const { user, loading: authLoading }     = useAuth();
  const userId                             = user?.id ?? '';
  const { status, refetch }                = useBillingStatus(userId || null);
  const [plans, setPlans]                  = useState<PlanComparison[]>([]);
  const [plansLoading, setPlansLoading]    = useState(true);
  const [plansError, setPlansError]        = useState<string | null>(null);
  const [selected, setSelected]            = useState<PlanComparison | null>(null);

  useEffect(() => {
    if (!userId) return;
    setPlansLoading(true);
    comparePlans(userId)
      .then(setPlans)
      .catch(() => setPlansError('Failed to load plans. Please try again.'))
      .finally(() => setPlansLoading(false));
  }, [userId]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#060c18] flex items-center justify-center">
        <Loader2 size={28} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 px-6 py-16 pb-20">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1 text-xs font-medium text-purple-300 border border-purple-500/30 bg-purple-500/10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            Choose a Plan
          </div>
          <h1 className="text-[36px] md:text-[48px] font-black tracking-[-0.04em] mb-3 mt-0">
            Plans that grow with you
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
            All prices in Nepali Rupees (NPR) · Billed monthly · No hidden fees
          </p>
          {status && (
            <p className="mt-3 text-xs text-slate-600">
              Current plan: <span className="text-slate-400 font-semibold">{status.current_plan}</span>
            </p>
          )}
        </div>

        {/* Plan cards */}
        {plansLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="text-indigo-500 animate-spin" />
          </div>
        ) : plansError ? (
          <p className="text-red-500 text-center py-8">{plansError}</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
            {plans.map(plan => (
              <PlanCard
                key={plan.plan}
                plan={plan}
                onSelect={p => setSelected(p)}
              />
            ))}
          </div>
        )}

        {/* FAQ / footer note */}
        <p className="text-center text-xs text-slate-700">
          Subscriptions renew monthly. Cancel anytime from your billing page.
          Enterprise limits are unlimited — contact us for custom pricing.
        </p>
      </div>

      {/* UpgradeModal — opens at payment step for the selected plan */}
      {selected && (
        <UpgradeModal
          userId={userId}
          currentPlan={status?.current_plan ?? 'free'}
          onClose={() => setSelected(null)}
          onPlanChanged={() => {
            setSelected(null);
            refetch();
            // Re-fetch plans so current badge updates
            comparePlans(userId).then(setPlans).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
