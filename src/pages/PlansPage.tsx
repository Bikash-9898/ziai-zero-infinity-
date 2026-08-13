// // src/pages/PlansPage.tsx
// import { useState, useEffect } from 'react';
// import { Loader2 } from 'lucide-react';
// import { useAuth } from '@/context/useAuth';
// import { useBillingStatus } from '@/hooks/useUsage';
// import PlanCard from '@/components/billing/PlanCard';
// import UpgradeModal from '@/components/billing/UpgradeModal';
// import { comparePlans, type PlanComparison } from '@/api/billing';

// export default function PlansPage() {
//   const { user, loading: authLoading } = useAuth();
//   const userId                         = user?.id ?? '';
//   const { status, refetch }            = useBillingStatus(userId || null);
//   const [plans, setPlans]              = useState<PlanComparison[]>([]);
//   const [plansLoading, setPlansLoading]= useState(false);
//   const [plansError, setPlansError]    = useState<string | null>(null);
//   const [selected, setSelected]        = useState<PlanComparison | null>(null);

//   useEffect(() => {
//     if (!userId) return;
//     let cancelled = false;
//     Promise.resolve()
//       .then(() => { if (!cancelled) setPlansLoading(true); })
//       .then(() => comparePlans(userId))
//       .then(data  => { if (!cancelled) { setPlans(data); setPlansLoading(false); } })
//       .catch(()   => { if (!cancelled) { setPlansError('Failed to load plans.'); setPlansLoading(false); } });
//     return () => { cancelled = true; };
//   }, [userId]);

//   if (authLoading || !user) {
//     return (
//       <div className="min-h-screen bg-[#060c18] flex items-center justify-center">
//         <Loader2 size={28} className="text-indigo-500 animate-spin" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#060c18] text-slate-100 px-6 py-16 pb-20">
//       <div className="max-w-5xl mx-auto flex flex-col gap-10">
//         <div className="text-center">
//           <div className="inline-flex items-center gap-2 mb-5 px-4 py-1 text-xs font-medium text-purple-300 border border-purple-500/30 bg-purple-500/10 rounded-full">
//             <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
//             Choose a Plan
//           </div>
//           <h1 className="text-[36px] md:text-[48px] font-black tracking-[-0.04em] mb-3 mt-0">
//             Plans that grow with you
//           </h1>
//           <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
//             All prices in Nepali Rupees (NPR) · Billed monthly · No hidden fees
//           </p>
//           {status && (
//             <p className="mt-3 text-xs text-slate-600">
//               Current plan: <span className="text-slate-400 font-semibold">{status.current_plan}</span>
//             </p>
//           )}
//         </div>

//         {plansLoading ? (
//           <div className="flex justify-center py-16">
//             <Loader2 size={32} className="text-indigo-500 animate-spin" />
//           </div>
//         ) : plansError ? (
//           <p className="text-red-500 text-center py-8">{plansError}</p>
//         ) : (
//           <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
//             {plans.map(plan => (
//               <PlanCard key={plan.plan} plan={plan} onSelect={setSelected} />
//             ))}
//           </div>
//         )}

//         <p className="text-center text-xs text-slate-700">
//           Subscriptions renew monthly. Cancel anytime from your billing page.
//         </p>
//       </div>

//       {selected && (
//         <UpgradeModal
//           userId={userId}
//           currentPlan={status?.current_plan ?? 'free'}
//           onClose={() => setSelected(null)}
//           onPlanChanged={() => {
//             setSelected(null);
//             refetch();
//             comparePlans(userId).then(setPlans).catch(() => {});
//           }}
//         />
//       )}
//     </div>
//   );
// }

// src/pages/PlansPage.tsx
// Standalone plan selection page — uses usePlanUpgrade hook directly.
// No popup modal — the confirm/payment steps render inline on the page.
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useBillingStatus } from '@/hooks/useUsage';
import { usePlanUpgrade } from '@/hooks/usePlanUpgrade';
import PlanCard from '@/components/billing/PlanCard';
import KhaltiButton from '@/components/payment/Khaltibutton'; 
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StripeButton from '@/components/payment/StripeButton';

export default function PlansPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate                       = useNavigate();
  const userId                         = user?.id ?? '';
  const { status, refetch }            = useBillingStatus(userId || null);

  const {
    plans, loadingPlans, step, selected,
    actionLoading, error, esewaPayload, esewaFormRef,
    selectPlan, goBackToPlans, switchToFree, scheduleDowngrade, initiatePayment,
  } = usePlanUpgrade({
    userId,
    onPlanChanged: () => {
      refetch();
      navigate('/billing?payment=success');
    },
    onClose: () => navigate('/billing'),
  });

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

        {/* Back button when in a sub-step */}
        {step !== 'plans' && step !== 'processing' && (
          <button
            onClick={goBackToPlans}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors self-start"
          >
            <ArrowLeft size={15} /> Back to plans
          </button>
        )}

        {/* ── Plans grid ── */}
        {step === 'plans' && (
          <>
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

            {loadingPlans ? (
              <div className="flex justify-center py-16">
                <Loader2 size={32} className="text-indigo-500 animate-spin" />
              </div>
            ) : error ? (
              <p className="text-red-500 text-center py-8">{error}</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
                {plans.map(plan => (
                  <PlanCard key={plan.plan} plan={plan} onSelect={selectPlan} />
                ))}
              </div>
            )}

            <p className="text-center text-xs text-slate-700">
              Subscriptions renew monthly. Cancel anytime from your billing page.
            </p>
          </>
        )}

        {/* ── Confirm free ── */}
        {step === 'confirm-free' && (
          <ConfirmSection
            title="Switch to Free Plan?"
            subtitle="You'll lose access to your current plan's limits immediately."
            highlights={['100K tokens / month', '500 requests / month', '10 image generations', 'No charges going forward']}
            confirmLabel="Yes, switch to Free"
            confirmColor="#64748b"
            onConfirm={switchToFree}
            loading={actionLoading}
            error={error}
          />
        )}

        {/* ── Confirm downgrade ── */}
        {step === 'confirm-downgrade' && selected && (
          <ConfirmSection
            title={`Downgrade to ${cap(selected.plan)}?`}
            subtitle="Your current plan stays active until the billing period ends."
            highlights={['Access continues until period end', 'New limits apply from next cycle', 'No refunds for unused time']}
            confirmLabel={`Confirm Downgrade to ${cap(selected.plan)}`}
            confirmColor="#f59e0b"
            onConfirm={scheduleDowngrade}
            loading={actionLoading}
            error={error}
          />
        )}

        {/* ── Payment ── */}
        {step === 'payment' && selected && (
          <div className="max-w-md mx-auto w-full flex flex-col gap-6">
            <div>
              <h2 className="text-[26px] font-black text-slate-100 mt-0 mb-2 tracking-[-0.03em]">Complete Payment</h2>
              <p className="text-[13px] text-slate-500 m-0">
                Upgrading to <strong className="text-slate-100">{cap(selected.plan)}</strong> for{' '}
                <strong className="text-indigo-400">NPR {selected.price_npr.toLocaleString()}/month</strong>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0 mb-3">Order Summary</p>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>{cap(selected.plan)} Plan — 1 month</span>
                <span className="font-mono">NPR {selected.price_npr.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-800 pt-2.5 flex justify-between font-bold text-slate-100">
                <span>Total</span>
                <span className="font-mono text-indigo-400">NPR {selected.price_npr.toLocaleString()}</span>
              </div>
            </div>

            {error && <p className="text-red-500 text-[13px]">{error}</p>}

            <div className="flex flex-col gap-3">
              <button
                onClick={initiatePayment}
                disabled={actionLoading}
                className="w-full py-3.5 rounded-xl bg-[#60BB46] border-none cursor-pointer flex items-center justify-center gap-2.5 font-bold text-[15px] text-white transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className="h-5 brightness-0 invert" onError={e => (e.currentTarget.style.display = 'none')} />
                    Pay with eSewa
                  </>
                )}
              </button>

              <KhaltiButton plan={selected.plan} userId={userId} />
              <StripeButton plan={selected.plan} userId={userId} />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs">
              <ShieldCheck size={14} />
              Secured &amp; verified by eSewa and Khalti payment gateways
            </div>
          </div>
        )}

        {/* ── Processing / redirecting ── */}
        {step === 'processing' && esewaPayload && (
          <div className="text-center py-20">
            <Loader2 size={48} className="text-indigo-500 animate-spin mx-auto mb-6" />
            <p className="text-xl font-bold text-slate-100 mb-2">Redirecting to eSewa…</p>
            <p className="text-sm text-slate-500">Please do not close this window.</p>
            <form ref={esewaFormRef} action={esewaPayload.form_url} method="POST" className="hidden">
              {Object.entries(esewaPayload.payload).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

function ConfirmSection({ title, subtitle, highlights, confirmLabel, confirmColor, onConfirm, loading, error }: {
  title: string; subtitle: string; highlights: string[];
  confirmLabel: string; confirmColor: string;
  onConfirm: () => void; loading?: boolean; error?: string | null;
}) {
  return (
    <div className="max-w-md mx-auto w-full flex flex-col gap-5">
      <div>
        <h2 className="text-[26px] font-black text-slate-100 mt-0 mb-2 tracking-[-0.03em]">{title}</h2>
        <p className="text-[13px] text-slate-500 m-0">{subtitle}</p>
      </div>
      <ul className="m-0 p-0 list-none flex flex-col gap-2">
        {highlights.map(h => (
          <li key={h} className="flex items-center gap-2.5 text-[13px] text-slate-400">
            <span style={{ color: confirmColor }}>✓</span> {h}
          </li>
        ))}
      </ul>
      {error && <p className="text-red-500 text-[13px]">{error}</p>}
      <button
        onClick={onConfirm}
        disabled={loading}
        className="py-3 rounded-[10px] border-none text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
        style={{ background: `linear-gradient(135deg, ${confirmColor}, ${confirmColor}bb)` }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : confirmLabel}
      </button>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
