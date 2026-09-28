// src/pages/BillingDashboard.tsx
import React from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import UsageBar from "../components/billing/UsageBar";
import WalletTopUpModal from "../components/billing/WalletTopUpModal";
import { useUsage, useBillingStatus, useUsageSummary, useWallet, daysUntil, formatTokens } from "../hooks/useUsage";
import { ShinyButton } from "@/components/ui/shiny-button";

const PLAN_COLORS: Record<string, string> = {
  free:       "#64748b",
  basic:      "#06b6d4",
  pro:        "#6366f1",
  enterprise: "#f59e0b",
};

export default function BillingDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate                       = useNavigate();

  const userId = user?.id ?? '';
  const skip   = !userId;

  const { usage, loading: usageLoading } = useUsage(skip ? undefined : userId);
  const { status }                       = useBillingStatus(skip ? undefined : userId);
  const { summary }                      = useUsageSummary(skip ? undefined : userId, 7);
  const { wallet, loading: walletLoading, refetch: refetchWallet } = useWallet(skip ? undefined : userId);

  const [showTopUp, setShowTopUp] = React.useState(false);

  const planColor    = PLAN_COLORS[status?.current_plan ?? "free"] ?? "#6366f1";
  const daysLeft     = daysUntil(status?.subscription.period_end ?? null);
  const totalTokens7d = summary?.daily_tokens.reduce((a, d) => a + d.tokens, 0) ?? 0;
  const totalReqs7d   = summary?.daily_tokens.reduce((a, d) => a + d.requests, 0) ?? 0;

  // Guard while auth loads
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#060c18] flex items-center justify-center">
        <Loader2 size={28} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 px-6 py-12 pb-20 max-sm:px-4 max-sm:py-6">
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>

      <div className="max-w-5xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="text-[32px] font-extrabold tracking-[-0.04em] mb-1.5 mt-0">Dashboard</h1>
            <p className="text-sm text-slate-500 m-0">
              Welcome back, <span className="text-slate-300">{user.username}</span> — here's your AI platform overview
            </p>
          </div>
          {status && (
            <div
              className="flex items-center gap-2 bg-slate-900 border rounded-xl px-5 py-3 shrink-0"
              style={{ borderColor: `${planColor}44` } as React.CSSProperties}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: planColor }} />
              <div>
                <div className="text-[11px] text-slate-500 uppercase tracking-[0.08em]">Active Plan</div>
                <div className="text-lg font-extrabold tracking-[-0.02em]" style={{ color: planColor }}>
                  {status.current_plan.charAt(0).toUpperCase() + status.current_plan.slice(1)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <StatCard
            label="Tokens Used (7d)"
            value={formatTokens(totalTokens7d)}
            sub="last 7 days"
          />
          <StatCard
            label="Requests (7d)"
            value={totalReqs7d.toLocaleString()}
            sub="AI calls made"
          />
          <StatCard
            label="Days Remaining"
            value={daysLeft !== null ? String(daysLeft) : "—"}
            sub={
              status?.subscription.period_end
                ? `Renews ${new Date(status.subscription.period_end).toLocaleDateString("en-NP")}`
                : "No active subscription"
            }
          />
          <StatCard
            label="Last Payment"
            value={status?.last_payment.amount ? `NPR ${Number(status.last_payment.amount).toLocaleString()}` : "—"}
            sub={status?.last_payment.provider ? `via ${status.last_payment.provider}` : "no payments yet"}
          />
          <StatCard
            label="Wallet Balance"
            value={walletLoading ? "…" : wallet ? `NPR ${wallet.credit_balance.toLocaleString()}` : "—"}
            sub={wallet?.on_trial ? `${formatTokens(wallet.trial_tokens_remaining)} trial tokens left` : "pay-as-you-go"}
          />
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 flex-wrap">
          <ShinyButton
            onClick={() => setShowTopUp(true)}
            highlightColor="#34d399"
            className="inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold [--shiny-cta-padding:10px_16px] [--shiny-cta-font-size:13px] [--shiny-cta-bg:#059669]"
          >
            <span>+</span> Add Funds
          </ShinyButton>
          <ShinyButton
            onClick={() => navigate('/plans')}
            highlightColor="#818cf8"
            className="inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold [--shiny-cta-padding:10px_16px] [--shiny-cta-font-size:13px] [--shiny-cta-bg:#4f46e5]"
          >
            <span>⬡</span> Upgrade Plan
          </ShinyButton>
          <ShinyButton
            onClick={() => navigate('/billing')}
            highlightColor="#60a5fa"
            className="inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold text-slate-100 [--shiny-cta-padding:10px_16px] [--shiny-cta-font-size:13px] [--shiny-cta-bg:#0f172a]"
          >
            <span>◈</span> Manage Billing
          </ShinyButton>
          <ShinyButton
            onClick={() => navigate('/usage')}
            highlightColor="#60a5fa"
            className="inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold text-slate-100 [--shiny-cta-padding:10px_16px] [--shiny-cta-font-size:13px] [--shiny-cta-bg:#0f172a]"
          >
            <span>↗</span> View Full Usage
          </ShinyButton>
        </div>

        {/* Usage bars */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-7 py-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 m-0">
              This Period's Usage
            </p>
            <button
              onClick={() => navigate('/usage')}
              className="text-xs text-indigo-400 font-semibold px-2.5 py-1 rounded-md bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors"
            >
              View all →
            </button>
          </div>

          {usageLoading ? (
            <div className="flex flex-col gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-10 rounded-[10px] bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-size-[200%_100%] animate-[shimmer_1.5s_infinite]" />
              ))}
            </div>
          ) : usage ? (
            <div className="flex flex-col gap-5">
              <UsageBar label="Tokens"   used={usage.tokens_used}   limit={usage.tokens_limit}   isUnlimited={usage.tokens_limit === -1}   percent={usage.percent_tokens_used}   icon="⬡" />
              <UsageBar label="Requests" used={usage.requests_used} limit={usage.requests_limit} isUnlimited={usage.requests_limit === -1} percent={usage.percent_requests_used} icon="↗" />
              <UsageBar
                label="Images"
                used={usage.images_used}
                limit={usage.images_limit}
                isUnlimited={usage.images_limit === -1}
                percent={usage.images_limit === -1 ? null : (usage.images_used / usage.images_limit) * 100}
                icon="◈"
              />
            </div>
          ) : (
            <p className="text-slate-700 text-[13px]">No usage data available</p>
          )}
        </div>

        {/* Top Models */}
        {summary && summary.top_models.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-7 py-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-6 mt-0">
              Top Models (7d)
            </p>
            <div className="flex flex-col gap-px">
              {summary.top_models.map(m => (
                <div key={m.model} className="flex items-center justify-between py-3 border-b border-[#0f172a] last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0 bg-indigo-500" />
                    <span className="text-[13px] font-mono text-slate-400">{m.model}</span>
                  </div>
                  <div className="flex gap-5 items-center">
                    <span className="text-xs text-slate-500">{formatTokens(m.tokens)} tokens</span>
                    <span className="text-[11px] text-slate-700 font-mono">{m.count} reqs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {showTopUp && (
        <WalletTopUpModal
          userId={userId}
          onClose={() => { setShowTopUp(false); refetchWallet(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2 hover:border-slate-700 transition-colors">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-[26px] font-extrabold tracking-[-0.04em] text-slate-100 tabular-nums">{value}</span>
      <span className="text-xs text-slate-700 font-mono">{sub}</span>
    </div>
  );
}
