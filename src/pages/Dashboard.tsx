// Dashboard page for AI platform
// Displays user's current plan, usage stats, and recent activity
import React from "react";
import UsageBar from "../components/billing/UsageBar";
import { useUsage, useBillingStatus, useUsageSummary, daysUntil, formatTokens } from "../hooks/useUsage";

const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001";

const PLAN_COLORS: Record<string, string> = {
  free: "#64748b",
  basic: "#06b6d4",
  pro: "#6366f1",
  enterprise: "#f59e0b",
};

export default function Dashboard() {
  const userId = DEMO_USER_ID;
  const { usage, loading: usageLoading } = useUsage(userId);
  const { status } = useBillingStatus(userId);
  const { summary } = useUsageSummary(userId, 7);

  const planColor = PLAN_COLORS[status?.current_plan ?? "free"] ?? "#6366f1";
  const daysLeft = daysUntil(status?.subscription.period_end ?? null);

  const totalTokens7d = summary?.daily_tokens.reduce((a, d) => a + d.tokens, 0) ?? 0;
  const totalReqs7d = summary?.daily_tokens.reduce((a, d) => a + d.requests, 0) ?? 0;

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 font-['Syne',sans-serif] px-6 py-12 pb-20 max-sm:px-4 max-sm:py-6 max-sm:pb-15">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div className="max-w-275 mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="text-[32px] font-extrabold tracking-[-0.04em] mb-1.5 mt-0">Dashboard</h1>
            <p className="text-sm text-slate-500 m-0">Welcome back — here's your AI platform overview</p>
          </div>
          {status && (
            <div
              className="flex items-center gap-2 bg-slate-900 border rounded-xl px-5 py-3 shrink-0"
              style={{ borderColor: `${planColor}44`, "--accent": planColor } as React.CSSProperties}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: planColor }}
              />
              <div>
                <div className="text-[11px] text-slate-500 uppercase tracking-[0.08em]">Active Plan</div>
                <div
                  className="text-lg font-extrabold tracking-[-0.02em]"
                  style={{ color: planColor }}
                >
                  {status.current_plan.charAt(0).toUpperCase() + status.current_plan.slice(1)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 max-sm:grid-cols-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2 transition-colors duration-200 hover:border-slate-700">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Tokens Used (7d)</span>
            <span className="text-[26px] font-extrabold tracking-[-0.04em] text-slate-100 tabular-nums">{formatTokens(totalTokens7d)}</span>
            <span className="text-xs text-slate-700 font-['JetBrains_Mono',monospace]">last 7 days</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2 transition-colors duration-200 hover:border-slate-700">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Requests (7d)</span>
            <span className="text-[26px] font-extrabold tracking-[-0.04em] text-slate-100 tabular-nums">{totalReqs7d.toLocaleString()}</span>
            <span className="text-xs text-slate-700 font-['JetBrains_Mono',monospace]">AI calls made</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2 transition-colors duration-200 hover:border-slate-700">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Days Remaining</span>
            <span className="text-[26px] font-extrabold tracking-[-0.04em] text-slate-100 tabular-nums">{daysLeft !== null ? daysLeft : "—"}</span>
            <span className="text-xs text-slate-700 font-['JetBrains_Mono',monospace]">
              {status?.subscription.period_end
                ? `Renews ${new Date(status.subscription.period_end).toLocaleDateString("en-NP")}`
                : "No active subscription"}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2 transition-colors duration-200 hover:border-slate-700">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Last Payment</span>
            <span className="text-[26px] font-extrabold tracking-[-0.04em] text-slate-100 tabular-nums">
              {status?.last_payment.amount ? `${Number(status.last_payment.amount).toLocaleString()}` : "—"}
            </span>
            <span className="text-xs text-slate-700 font-['JetBrains_Mono',monospace]">
              {status?.last_payment.provider ? `via ${status.last_payment.provider}` : "no payments yet"}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 flex-wrap">
          <a
            href="/billing"
            className="flex items-center gap-2 py-2.75 px-4.5 bg-linear-to-br from-indigo-500 to-indigo-600 border border-transparent rounded-xl text-white text-[13px] font-semibold no-underline shadow-[0_4px_16px_#6366f133] transition-all duration-150 hover:brightness-110 font-['Syne',sans-serif]"
          >
            <span className="text-base">⬡</span>
            Upgrade Plan
          </a>
          <a
            href="/billing"
            className="flex items-center gap-2 py-2.75 px-4.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-[13px] font-semibold no-underline transition-all duration-150 hover:bg-slate-800 hover:border-slate-700 hover:text-slate-100 font-['Syne',sans-serif]"
          >
            <span className="text-base">◈</span>
            Manage Billing
          </a>
          <a
            href="/usage"
            className="flex items-center gap-2 py-2.75 px-4.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-[13px] font-semibold no-underline transition-all duration-150 hover:bg-slate-800 hover:border-slate-700 hover:text-slate-100 font-['Syne',sans-serif]"
          >
            <span className="text-base">↗</span>
            View Full Usage
          </a>
        </div>

        {/* Usage bars */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-7 py-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 m-0">This Period's Usage</p>
            <a
              href="/usage"
              className="text-xs text-indigo-400 no-underline font-semibold px-2.5 py-1 rounded-md bg-indigo-500/5 transition-colors duration-150 hover:bg-indigo-500/10"
            >
              View all →
            </a>
          </div>
          {usageLoading ? (
            <div className="flex flex-col gap-4">
              <div className="h-10 rounded-[10px] bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-size-[200%_100%] animate-[shimmer_1.5s_infinite]" />
              <div className="h-10 rounded-[10px] bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-size-[200%_100%] animate-[shimmer_1.5s_infinite]" />
              <div className="h-10 rounded-[10px] bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-size-[200%_100%] animate-[shimmer_1.5s_infinite]" />
              <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
            </div>
          ) : usage ? (
            <div className="flex flex-col gap-5">
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
            <div className="flex justify-between items-center mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 m-0">Top Models (7d)</p>
            </div>
            <div className="flex flex-col gap-px">
              {summary.top_models.map((m) => (
                <div
                  key={m.model}
                  className="flex items-center justify-between py-3 border-b border-[#0f172a] last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0 bg-indigo-500" />
                    <span className="text-[13px] font-['JetBrains_Mono',monospace] text-slate-400">{m.model}</span>
                  </div>
                  <div className="flex gap-5 items-center">
                    <span className="text-xs text-slate-500">{formatTokens(m.tokens)} tokens</span>
                    <span className="text-[11px] text-slate-700 font-['JetBrains_Mono',monospace]">{m.count} reqs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}