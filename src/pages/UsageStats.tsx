import React from "react";
import { useUsage } from "../hooks/useUsage";
import UsageBar from "../components/billing/UsageBar";

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-slate-500 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      {sub && <p className="text-slate-400 text-sm mt-1">{sub}</p>}
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NP", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const UsageStats: React.FC = () => {
  const {
    usage,
    subscription,
    loading,
    error,
    refetch,
    tokenPercent,
    requestPercent,
    isNearLimit,
    isOverLimit,
  } = useUsage();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 flex items-center gap-3">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading usage…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400">{error}</p>
          <button
            onClick={refetch}
            className="text-sm text-slate-400 hover:text-white underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Usage Stats</h1>
            <p className="text-slate-400 mt-1 text-sm">
              {usage
                ? `Period: ${formatDate(usage.period_start)} – ${formatDate(usage.period_end)}`
                : "Current billing period"}
            </p>
          </div>
          <button
            onClick={refetch}
            className="text-slate-400 hover:text-white text-xs border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Alert Banner */}
        {isOverLimit && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 flex items-center gap-3">
            <span className="text-red-400 text-xl">⚠</span>
            <div>
              <p className="text-red-300 font-semibold text-sm">
                Usage limit reached
              </p>
              <p className="text-red-400/70 text-xs mt-0.5">
                Upgrade your plan to continue using the platform.
              </p>
            </div>
          </div>
        )}
        {isNearLimit && !isOverLimit && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4 flex items-center gap-3">
            <span className="text-amber-400 text-xl">◐</span>
            <div>
              <p className="text-amber-300 font-semibold text-sm">
                Approaching usage limit
              </p>
              <p className="text-amber-400/70 text-xs mt-0.5">
                Consider upgrading before you run out.
              </p>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        {usage && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon="⚡"
              label="Tokens Used"
              value={
                usage.tokens_used >= 1_000_000
                  ? `${(usage.tokens_used / 1_000_000).toFixed(1)}M`
                  : `${(usage.tokens_used / 1_000).toFixed(1)}K`
              }
              sub={`of ${(usage.token_limit / 1_000_000).toFixed(1)}M`}
            />
            <StatCard
              icon="📡"
              label="Requests"
              value={String(usage.request_count)}
              sub={`of ${usage.request_limit}`}
            />
            <StatCard
              icon="📋"
              label="Plan"
              value={subscription?.plan ?? "Free"}
              sub={subscription?.status ?? "active"}
            />
            <StatCard
              icon="📅"
              label="Renews"
              value={
                subscription?.current_period_end
                  ? formatDate(subscription.current_period_end)
                  : "—"
              }
            />
          </div>
        )}

        {/* Usage Bars */}
        {usage && (
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-6 space-y-6">
            <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-widest">
              Usage Breakdown
            </h2>
            <UsageBar
              label="Tokens"
              used={usage.tokens_used}
              limit={usage.token_limit}
              percent={tokenPercent}
            />
            <UsageBar
              label="API Requests"
              used={usage.request_count}
              limit={usage.request_limit}
              percent={requestPercent}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageStats;
