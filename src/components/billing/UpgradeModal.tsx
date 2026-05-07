// src/components/billing/UpgradeModal.tsx

import { useState, useEffect, useRef } from "react";
import { X, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { comparePlans, initiateEsewa, type PlanComparison } from "@/api/billing";
import PlanCard from "./PlanCard";

const API = "http://localhost:8000";

interface UpgradeModalProps {
  userId: string;
  currentPlan: string;
  onClose: () => void;
  onPlanChanged?: (newPlan: string) => void;
}

// FIX: Added "downgrade-payment" as a separate step from "confirm-downgrade".
// Previously, confirm-downgrade called handleInitiateEsewa which launched a
// paid eSewa flow — wrong for downgrades that should just schedule a plan change.
// Now:
//   confirm-free      → switch-free endpoint (no payment)
//   confirm-downgrade → schedule-downgrade endpoint (no payment, takes effect next cycle)
//   payment           → eSewa flow (upgrades only)
//   processing        → redirecting to eSewa gateway
// src/components/billing/UpgradeModal.tsx
type Step = "plans" | "confirm-free" | "confirm-downgrade" | "payment" | "processing";

export default function UpgradeModal({ userId, currentPlan, onClose, onPlanChanged }: UpgradeModalProps) {
  const [plans, setPlans]                 = useState<PlanComparison[]>([]);
  const [loading, setLoading]             = useState(true);
  const [step, setStep]                   = useState<Step>("plans");
  const [selected, setSelected]           = useState<PlanComparison | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const esewaFormRef                      = useRef<HTMLFormElement>(null);
  const [esewaPayload, setEsewaPayload]   = useState<{
    form_url: string;
    payload: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    comparePlans(userId)
      .then(setPlans)
      .catch(() => setError("Failed to load plans"))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ── Plan selection routing ───────────────────────────────────────────────
  const handleSelectPlan = (plan: PlanComparison) => {
    setSelected(plan);
    setError(null);
    if (plan.plan === "free") {
      setStep("confirm-free");
    } else if (plan.action === "downgrade") {
      setStep("confirm-downgrade");
    } else {
      setStep("payment");
    }
  };

  // ── Free plan switch ─────────────────────────────────────────────────────
  const handleSwitchFree = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/billing/switch-free/${userId}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "Switch failed");
      }
      onPlanChanged?.("free");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to switch to free plan");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Downgrade ────────────────────────────────────────────────────────────
  const handleScheduleDowngrade = async () => {
    if (!selected) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/billing/cancel/${userId}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "Failed to schedule downgrade");
      }
      onPlanChanged?.(selected.plan);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to schedule downgrade");
    } finally {
      setActionLoading(false);
    }
  };

  // ── eSewa payment (upgrades only) ────────────────────────────────────────
  const handleInitiateEsewa = async () => {
    if (!selected) return;
    setActionLoading(true);
    setError(null);
    try {
      const data = await initiateEsewa(selected.plan, userId);
      setEsewaPayload({ form_url: data.form_url, payload: data.payload });
      setStep("processing");
      setTimeout(() => esewaFormRef.current?.submit(), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
      setActionLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-1000 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        className="bg-[#080e1c] border border-slate-800 rounded-[20px] w-full max-h-[90vh] overflow-y-auto px-7 py-8 relative transition-[max-width] duration-300 ease-in-out"
        style={{ maxWidth: step === "plans" ? 960 : 480 }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-slate-500 cursor-pointer p-1"
        >
          <X size={20} />
        </button>

        {/* Back button */}
        {step !== "plans" && step !== "processing" && (
          <button
            onClick={() => { setStep("plans"); setError(null); }}
            className="flex items-center gap-1.5 bg-transparent border-none text-slate-500 cursor-pointer text-[13px] mb-5 p-0"
          >
            <ArrowLeft size={15} /> Back to plans
          </button>
        )}

        {/* ── STEP: Plans grid ─────────────────────────────────────────── */}
        {step === "plans" && (
          <>
            <div className="mb-7 text-center">
              <h2 className="text-[26px] font-black text-slate-100 mt-0 mb-2 tracking-[-0.03em]">
                Choose Your Plan
              </h2>
              <p className="text-sm text-slate-500 m-0">
                Prices are in Nepali Rupees (NPR) · Billed monthly
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={28} className="text-indigo-500 animate-[modal-spin_1s_linear_infinite]" />
              </div>
            ) : error ? (
              <p className="text-red-500 text-center py-6">{error}</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4 pt-2">
                {plans.map(p => (
                  <PlanCard key={p.plan} plan={p} onSelect={handleSelectPlan} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── STEP: Confirm free switch ─────────────────────────────────── */}
        {step === "confirm-free" && selected && (
          <ConfirmBox
            title="Switch to Free Plan?"
            subtitle="You'll lose access to your current plan's limits immediately."
            highlights={[
              "100K tokens / month",
              "500 requests / month",
              "10 image generations",
              "No charges going forward",
            ]}
            confirmLabel="Yes, switch to Free"
            confirmColor="#64748b"
            onConfirm={handleSwitchFree}
            loading={actionLoading}
            error={error}
          />
        )}

        {/* ── STEP: Confirm downgrade ───────────────────────────────────── */}
        {step === "confirm-downgrade" && selected && (
          <ConfirmBox
            title={`Downgrade to ${cap(selected.plan)}?`}
            subtitle="Your current plan stays active until the billing period ends. After that, you'll be moved to the new plan."
            highlights={[
              "Access continues until period end",
              "New limits apply from next cycle",
              "No refunds for unused time",
            ]}
            confirmLabel={`Confirm Downgrade to ${cap(selected.plan)}`}
            confirmColor="#f59e0b"
            onConfirm={handleScheduleDowngrade}
            loading={actionLoading}
            error={error}
          />
        )}

        {/* ── STEP: Payment (upgrades only) ─────────────────────────────── */}
        {step === "payment" && selected && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-[22px] font-black text-slate-100 mt-0 mb-1.5 tracking-[-0.03em]">
                Complete Payment
              </h2>
              <p className="text-[13px] text-slate-500 m-0">
                You're upgrading to{" "}
                <strong className="text-slate-100">{cap(selected.plan)}</strong> for{" "}
                <strong className="text-indigo-400">
                  NPR {selected.price_npr.toLocaleString()}/month
                </strong>
              </p>
            </div>

            {/* Order summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0 mb-3">
                Order Summary
              </p>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>{cap(selected.plan)} Plan — 1 month</span>
                <span className="font-mono">NPR {selected.price_npr.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-800 pt-2.5 flex justify-between font-bold text-slate-100">
                <span>Total</span>
                <span className="font-mono text-indigo-400">
                  NPR {selected.price_npr.toLocaleString()}
                </span>
              </div>
            </div>

            {error && <p className="text-red-500 text-[13px]">{error}</p>}

            {/* eSewa button */}
            <button
              onClick={handleInitiateEsewa}
              disabled={actionLoading}
              className="w-full py-3.5 rounded-xl bg-linear-to-br from-[#60BB46] to-[#48a836] border-none cursor-pointer flex items-center justify-center gap-2.5 font-bold text-[15px] text-white tracking-[0.02em] shadow-[0_4px_20px_#60BB4633] transition-opacity duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <Loader2 size={18} className="animate-[modal-spin_1s_linear_infinite]" />
              ) : (
                <>
                  <img
                    src="https://esewa.com.np/common/images/esewa_logo.png"
                    alt="eSewa"
                    className="h-5.5 brightness-0 invert"
                    onError={e => (e.currentTarget.style.display = "none")}
                  />
                  Pay with eSewa
                </>
              )}
            </button>

            {/* Trust note */}
            <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs">
              <ShieldCheck size={14} />
              Secured &amp; verified by eSewa Payment Gateway
            </div>
          </div>
        )}

        {/* ── STEP: Processing / Redirecting ───────────────────────────── */}
        {step === "processing" && esewaPayload && (
          <div className="text-center py-10">
            <Loader2
              size={40}
              className="text-indigo-500 animate-[modal-spin_1s_linear_infinite] mx-auto mb-4"
            />
            <p className="text-base font-bold text-slate-100 mt-0 mb-2">
              Redirecting to eSewa…
            </p>
            <p className="text-[13px] text-slate-500">
              Please do not close this window.
            </p>

            {/* Hidden auto-submit form */}
            <form
              ref={esewaFormRef}
              action={esewaPayload.form_url}
              method="POST"
              className="hidden"
            >
              {Object.entries(esewaPayload.payload).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            </form>
          </div>
        )}
      </div>

      <style>{`@keyframes modal-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Shared confirm box ───────────────────────────────────────────────────────

function ConfirmBox({
  title,
  subtitle,
  highlights,
  confirmLabel,
  confirmColor,
  onConfirm,
  loading,
  error,
}: {
  title: string;
  subtitle: string;
  highlights: string[];
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[22px] font-black text-slate-100 mt-0 mb-2 tracking-[-0.03em]">
          {title}
        </h2>
        <p className="text-[13px] text-slate-500 m-0">{subtitle}</p>
      </div>

      <ul className="m-0 p-0 list-none flex flex-col gap-2">
        {highlights.map(h => (
          <li key={h} className="flex items-center gap-2.5 text-[13px] text-slate-400">
            <span className="text-base" style={{ color: confirmColor }}>✓</span>
            {h}
          </li>
        ))}
      </ul>

      {error && <p className="text-red-500 text-[13px]">{error}</p>}

      <button
        onClick={onConfirm}
        disabled={loading}
        className="py-[13px] rounded-[10px] border-none text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-opacity duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        style={{ background: `linear-gradient(135deg, ${confirmColor}, ${confirmColor}bb)` }}
      >
        {loading
          ? <Loader2 size={16} className="animate-[modal-spin_1s_linear_infinite]" />
          : confirmLabel
        }
      </button>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }