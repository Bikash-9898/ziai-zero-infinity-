// src/components/billing/UpgradeModal.tsx
// Pure UI — all logic lives in usePlanUpgrade hook
import { X, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { usePlanUpgrade } from '@/hooks/usePlanUpgrade';
import { type PlanComparison } from '@/api/billing';
import PlanCard from './PlanCard';
import KhaltiButton from '../payment/Khaltibutton';
import StripeButton from '../payment/StripeButton';
import { ShinyButton } from '@/components/ui/shiny-button';
import { getPlanAccent } from '@/components/billing/planAccents';

interface UpgradeModalProps {
  userId:       string;
  currentPlan:  string;
  onClose:      () => void;
  onPlanChanged?: (newPlan: string) => void;
}

export default function UpgradeModal({ userId, onClose, onPlanChanged }: UpgradeModalProps) {
  const {
    plans, loadingPlans, step, selected,
    actionLoading, error, esewaPayload, esewaFormRef,
    selectPlan, goBackToPlans, switchToFree, scheduleDowngrade, initiatePayment,
  } = usePlanUpgrade({ userId, onPlanChanged, onClose });

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-1000 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        className="bg-[#080e1c] border border-slate-800 rounded-[20px] w-full max-h-[90vh] overflow-y-auto px-7 py-8 relative transition-[max-width] duration-300 ease-in-out"
        style={{ maxWidth: step === 'plans' ? 960 : 480 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none text-slate-500 cursor-pointer p-1">
          <X size={20} />
        </button>

        {step !== 'plans' && step !== 'processing' && (
          <button
            onClick={goBackToPlans}
            className="flex items-center gap-1.5 bg-transparent border-none text-slate-500 cursor-pointer text-[13px] mb-5 p-0"
          >
            <ArrowLeft size={15} /> Back to plans
          </button>
        )}

        {step === 'plans' && (
          <PlanGrid
            plans={plans}
            loading={loadingPlans}
            error={error}
            onSelect={selectPlan}
          />
        )}

        {step === 'confirm-free' && selected && (
          <ConfirmBox
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

        {step === 'confirm-downgrade' && selected && (
          <ConfirmBox
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

        {step === 'payment' && selected && (
          <PaymentStep
            selected={selected}
            userId={userId}
            error={error}
            actionLoading={actionLoading}
            onPay={initiatePayment}
          />
        )}

        {step === 'processing' && esewaPayload && (
          <div className="text-center py-10">
            <Loader2 size={40} className="text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-base font-bold text-slate-100 mt-0 mb-2">Redirecting to eSewa…</p>
            <p className="text-[13px] text-slate-500">Please do not close this window.</p>
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

// ── Sub-components ─────────────────────────────────────────────────────────

function PlanGrid({ plans, loading, error, onSelect }: {
  plans: PlanComparison[];
  loading: boolean;
  error: string | null;
  onSelect: (plan: PlanComparison) => void;
}) {
  return (
    <>
      <div className="mb-7 text-center">
        <h2 className="text-[26px] font-black text-slate-100 mt-0 mb-2 tracking-[-0.03em]">Choose Your Plan</h2>
        <p className="text-sm text-slate-500 m-0">Prices are in Nepali Rupees (NPR) · Billed monthly</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="text-indigo-500 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center py-6">{error}</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4 pt-2">
          {plans.map(p => <PlanCard key={p.plan} plan={p} onSelect={onSelect} />)}
        </div>
      )}
    </>
  );
}

function PaymentStep({ selected, userId, error, actionLoading, onPay }: {
  selected: PlanComparison;
  userId: string;
  error: string | null;
  actionLoading: boolean;
  onPay: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-black text-slate-100 mt-0 mb-1.5 tracking-[-0.03em]">Complete Payment</h2>
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
        <ShinyButton
          onClick={onPay}
          disabled={actionLoading}
          aria-busy={actionLoading}
          highlightColor={getPlanAccent(selected.plan)}
          className="w-full rounded-[10px] text-[13px] font-bold [--shiny-cta-padding:11px_0] [--shiny-cta-font-size:13px] [--shiny-cta-bg:#0f172a]"
        >
          {actionLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <span className="inline-flex items-center justify-center gap-2.5">
              <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className="h-6 w-auto shrink-0 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
              Pay with eSewa
            </span>
          )}
        </ShinyButton>

        <StripeButton plan={selected.plan} userId={userId} />
        <KhaltiButton plan={selected.plan} userId={userId} />
      </div>

      <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs">
        <ShieldCheck size={14} />
        Secured &amp; verified by Stripe, eSewa, and Khalti payment gateways
      </div>
    </div>
  );
}

function ConfirmBox({ title, subtitle, highlights, confirmLabel, confirmColor, onConfirm, loading, error }: {
  title: string; subtitle: string; highlights: string[];
  confirmLabel: string; confirmColor: string;
  onConfirm: () => void; loading?: boolean; error?: string | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[22px] font-black text-slate-100 mt-0 mb-2 tracking-[-0.03em]">{title}</h2>
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
        className="py-3 rounded-[10px] border-none text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-opacity duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        style={{ background: `linear-gradient(135deg, ${confirmColor}, ${confirmColor}bb)` }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : confirmLabel}
      </button>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }