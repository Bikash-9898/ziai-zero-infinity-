import React from "react";
import { useUsage } from "../hooks/useUsage";
import UsageBar from "../components/billing/UsageBar";

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const Dashboard: React.FC = () => {
  const {
    usage,
    subscription,
    loading,
    tokenPercent,
    requestPercent,
    isNearLimit,
  } = useUsage();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Welcome */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Hey, {user?.username ?? "there"} 👋
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Here's your AI platform overview
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="capitalize bg-violet-500/15 text-violet-300 border border-violet-500/20 text-xs font-semibold px-3 py-1 rounded-full">
              {subscription?.plan ?? "free"} plan
            </span>
            {isNearLimit && (
              <span className="text-amber-400 text-xs">⚠ Nearing limit</span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        {!loading && usage && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Tokens Used",
                value: formatTokens(usage.tokens_used),
                icon: "⚡",
                sub: `of ${formatTokens(usage.token_limit)}`,
              },
              {
                label: "Requests",
                value: String(usage.request_count),
                icon: "📡",
                sub: `of ${usage.request_limit}`,
              },
              {
                label: "Token Usage",
                value: `${tokenPercent.toFixed(0)}%`,
                icon: "◎",
                sub: "this period",
              },
              {
                label: "Request Usage",
                value: `${requestPercent.toFixed(0)}%`,
                icon: "◐",
                sub: "this period",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5"
              >
                <span className="text-2xl">{s.icon}</span>
                <p className="text-2xl font-black text-white mt-2">{s.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                <p className="text-slate-600 text-xs">{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Usage bars */}
        {!loading && usage && (
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-widest">
                Usage Overview
              </h2>
              <a
                href="/usage"
                className="text-violet-400 hover:text-violet-300 text-xs transition-colors"
              >
                View Details →
              </a>
            </div>
            <UsageBar
              label="Tokens"
              used={usage.tokens_used}
              limit={usage.token_limit}
              percent={tokenPercent}
            />
            <UsageBar
              label="Requests"
              used={usage.request_count}
              limit={usage.request_limit}
              percent={requestPercent}
            />
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/billing"
            className="group bg-slate-800/50 border border-slate-700/40 hover:border-violet-500/40 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-lg">
                ◈
              </div>
              <div>
                <p className="text-white font-bold">Manage Billing</p>
                <p className="text-slate-400 text-sm">
                  Upgrade plan or view invoices
                </p>
              </div>
            </div>
          </a>
          <a
            href="/usage"
            className="group bg-slate-800/50 border border-slate-700/40 hover:border-emerald-500/40 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-lg">
                📊
              </div>
              <div>
                <p className="text-white font-bold">Usage Details</p>
                <p className="text-slate-400 text-sm">
                  Detailed stats for this period
                </p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
