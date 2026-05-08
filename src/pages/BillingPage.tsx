// src/pages/BillingPage.tsx

import { useState } from "react";
import { CreditCard, Zap, Clock, ChevronRight, RotateCcw } from "lucide-react";
import {
  useBillingStatus,
  usePaymentHistory,
  // useComparePlans,   ← kept for future use / admin side
} from "@/hooks/useUsage";
import { useAuth } from "@/context/useAuth";
import UpgradeModal from "@/components/billing/UpgradeModal";
import UsageBar from "@/components/billing/UsageBar";
import { useUsage } from "@/hooks/useUsage";
import { cancelSubscription } from "@/api/billing";

// ── Plan display metadata ────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  free:       "#64748b",
  basic:      "#06b6d4",
  pro:        "#6366f1",
  enterprise: "#f59e0b",
};

const PLAN_ICONS: Record<string, string> = {
  free: "◇", basic: "◈", pro: "⬡", enterprise: "✦",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { user }                             = useAuth();
  const userId                               = user?.id ?? "";
  const { status, refetch: refetchStatus }   = useBillingStatus(userId);
  const { usage, loading: usageLoading }     = useUsage(userId);
  const { payments, loading: payLoading }    = usePaymentHistory(userId);
  const [showUpgrade, setShowUpgrade]        = useState(false);
  const [canceling, setCanceling]            = useState(false);
  const [cancelMsg, setCancelMsg]            = useState<string | null>(null);

  const planColor = PLAN_COLORS[status?.current_plan ?? "free"] ?? "#6366f1";
  const planIcon  = PLAN_ICONS[status?.current_plan  ?? "free"] ?? "◇";

  // ── Cancel subscription ──────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll keep access until the period ends.")) return;
    setCanceling(true);
    setCancelMsg(null);
    try {
      const res = await cancelSubscription(userId);
      setCancelMsg(
        `Subscription canceled. Access until ${new Date(res.period_end).toLocaleDateString("en-NP")}`
      );
      refetchStatus();
    } catch (err) {
      setCancelMsg(
        err instanceof Error ? err.message : "Failed to cancel. Please try again."
      );
    } finally {
      setCanceling(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 font-['Syne',sans-serif] px-6 py-12 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div className="max-w-225 mx-auto flex flex-col gap-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-[30px] font-black tracking-[-0.04em] mb-1.5 mt-0">
              Billing &amp; Plans
            </h1>
            <p className="text-sm text-slate-500 m-0">
              Manage your subscription, payment history, and usage
            </p>
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            className="px-5.5 py-2.75 bg-linear-to-br from-indigo-500 to-indigo-600 border-none rounded-xl text-white text-[13px] font-bold cursor-pointer tracking-[0.04em] shadow-[0_4px_16px_#6366f133] flex items-center gap-2"
          >
            <Zap size={15} />
            Upgrade Plan
          </button>
        </div>

        {/* ── Current plan card ─────────────────────────────────────────── */}
        <div
          className="border rounded-2xl px-7 py-6 flex justify-between items-center flex-wrap gap-5"
          style={{
            background:  `linear-gradient(135deg, ${planColor}11, #0f172a)`,
            borderColor: `${planColor}44`,
            boxShadow:   `0 0 40px ${planColor}11`,
          }}
        >
          <div className="flex items-center gap-4">
            {/* Plan icon */}
            <div
              className="w-14 h-14 rounded-[14px] flex items-center justify-center text-[26px]"
              style={{
                background:  `${planColor}22`,
                border:      `1px solid ${planColor}44`,
                color:       planColor,
              }}
            >
              {planIcon}
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1 mt-0">
                Active Plan
              </p>
              <p className="text-[22px] font-black text-slate-100 mb-0.5 mt-0 tracking-[-0.02em]">
                {cap(status?.current_plan ?? "free")}
              </p>
              <p className="text-xs text-slate-600 m-0 font-mono">
                {status?.subscription.status === "active" && status.subscription.period_end
                  ? `Renews ${new Date(status.subscription.period_end).toLocaleDateString("en-NP")}`
                  : status?.subscription.status === "canceled"
                    ? `Access until ${new Date(status.subscription.period_end!).toLocaleDateString("en-NP")}`
                    : "No active subscription"
                }
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            {status?.subscription.status === "active" && status.current_plan !== "free" && (
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="px-4 py-2.25 bg-transparent border border-red-500/25 rounded-[10px] text-red-500 text-xs font-semibold flex items-center gap-1.5 transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <RotateCcw size={13} />
                {canceling ? "Canceling…" : "Cancel Plan"}
              </button>
            )}
            <button
              onClick={() => setShowUpgrade(true)}
              className="px-4 py-2.25 bg-slate-800 border border-slate-700 rounded-[10px] text-slate-400 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            >
              Change Plan <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Cancel message */}
        {cancelMsg && (
          <p className="text-[13px] text-amber-400 bg-amber-400/5 border border-amber-400/20 rounded-lg px-3.5 py-2.5">
            {cancelMsg}
          </p>
        )}

        {/* ── Usage this period ─────────────────────────────────────────── */}
        <Section title="This Period's Usage" icon={<Zap size={14} />}>
          {usageLoading ? (
            <Skeleton />
          ) : usage ? (
            <div className="flex flex-col gap-4.5">
              <UsageBar
                label="Tokens"
                used={usage.tokens_used}
                limit={usage.tokens_limit}
                isUnlimited={usage.tokens_limit === -1}
                percent={usage.percent_tokens_used}
                icon="⬡"
              />
              <UsageBar
                label="Requests"
                used={usage.requests_used}
                limit={usage.requests_limit}
                isUnlimited={usage.requests_limit === -1}
                percent={usage.percent_requests_used}
                icon="↗"
              />
              <UsageBar
                label="Images"
                used={usage.images_used}
                limit={usage.images_limit}
                isUnlimited={usage.images_limit === -1}
                percent={
                  usage.images_limit === -1
                    ? null
                    : usage.images_limit > 0
                      ? (usage.images_used / usage.images_limit) * 100
                      : 0
                }
                icon="◈"
              />
            </div>
          ) : (
            <p className="text-slate-700 text-[13px]">No usage data</p>
          )}
        </Section>

        {/* ── Payment history ───────────────────────────────────────────── */}
        <Section title="Payment History" icon={<CreditCard size={14} />}>
          {payLoading ? (
            <Skeleton />
          ) : !payments || payments.length === 0 ? (
            <p className="text-[13px] text-slate-700 py-4">
              No payment records yet.
            </p>
          ) : (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Date", "Plan", "Amount", "Provider", "Status"].map(h => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-700 pb-2.5 border-b border-slate-800"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="py-2.75 border-b border-[#0f172a] text-slate-500 font-mono text-[11px]">
                      {new Date(p.created_at).toLocaleDateString("en-NP")}
                    </td>
                    <td className="py-2.75 border-b border-[#0f172a] text-slate-100 font-semibold">
                      {cap(p.plan)}
                    </td>
                    <td className="py-2.75 border-b border-[#0f172a] text-slate-400 font-mono">
                      NPR {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="py-2.75 border-b border-[#0f172a] text-slate-500 capitalize">
                      {p.provider}
                    </td>
                    <td className="py-2.75 border-b border-[#0f172a]">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* ── Last payment detail ───────────────────────────────────────── */}
        {status?.last_payment.amount && (
          <Section title="Last Successful Payment" icon={<Clock size={14} />}>
            <div className="flex gap-6 flex-wrap">
              <InfoItem
                label="Amount"
                value={`NPR ${Number(status.last_payment.amount).toLocaleString()}`}
              />
              <InfoItem
                label="Provider"
                value={status.last_payment.provider ?? "—"}
              />
              <InfoItem
                label="Date"
                value={
                  status.last_payment.date
                    ? new Date(status.last_payment.date).toLocaleDateString("en-NP")
                    : "—"
                }
              />
            </div>
          </Section>
        )}

      </div>

      {/* ── Upgrade Modal ────────────────────────────────────────────────── */}
      {showUpgrade && (
        <UpgradeModal
          userId={userId}
          currentPlan={status?.current_plan ?? "free"}
          onClose={() => setShowUpgrade(false)}
          onPlanChanged={() => {
            setShowUpgrade(false);
            refetchStatus();
          }}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6.5 py-5.5">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-slate-500">{icon}</span>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 m-0">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      <span className="text-sm text-slate-400 font-mono">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    success:  ["bg-green-500/10 text-green-500", ""],
    pending:  ["bg-amber-500/10 text-amber-500", ""],
    failed:   ["bg-red-500/10 text-red-500",     ""],
    refunded: ["bg-indigo-500/10 text-indigo-500", ""],
  };
  const cls = colors[status]?.[0] ?? "bg-slate-700/10 text-slate-500";
  return (
    <span className={`text-[10px] font-bold uppercase tracking-[0.06em] px-2 py-0.75 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

function Skeleton() {
  return (
    <>
      <div className="h-20 rounded-[10px] animate-[billing-shimmer_1.5s_infinite] bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-size-[200%_100%]" />
      <style>{`
        @keyframes billing-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }