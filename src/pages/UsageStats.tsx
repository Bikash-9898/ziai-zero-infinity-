// Usage statistics and analytics page
// Shows current usage, historical trends, and request details
import { useState } from "react";
import UsageBar from "../components/billing/UsageBar";
import { useUsage, useUsageSummary, useUsageHistory, formatTokens } from "../hooks/useUsage";

const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001";

const STATUS_COLORS: Record<string, string> = {
  success: "#22c55e",
  error: "#ef4444",
};

export default function UsageStats() {
  const userId = DEMO_USER_ID;
  const [days, setDays] = useState(30);
  const { usage, loading: usageLoading } = useUsage(userId);
  const { summary, loading: summaryLoading } = useUsageSummary(userId, days);
  const { requests, total, page, totalPages, loading: histLoading, goToPage } = useUsageHistory(userId, 15);

  const maxDailyTokens = summary
    ? Math.max(...summary.daily_tokens.map((d) => d.tokens), 1)
    : 1;

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 font-['Syne',sans-serif] px-6 py-12 pb-20 max-sm:px-4 max-sm:py-6 max-sm:pb-15">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>

      <div className="max-w-[1100px] mx-auto flex flex-col gap-10">

        {/* Header */}
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-0.04em] mb-1.5 mt-0 bg-linear-to-br from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Usage &amp; Analytics
          </h1>
          <p className="text-[15px] text-slate-500 m-0">
            Monitor your AI usage, token consumption, and request history
          </p>
        </div>

        {/* Current period usage bars */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-7 py-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-5 mt-0">
            Current Period Usage
          </p>
          {usage && (
            <div className="flex gap-6 px-[18px] py-3.5 bg-slate-800 rounded-[10px] mb-5 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Plan</span>
                <span className="text-[13px] font-['JetBrains_Mono',monospace] text-slate-400">{usage.plan}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Period Start</span>
                <span className="text-[13px] font-['JetBrains_Mono',monospace] text-slate-400">
                  {new Date(usage.period_start).toLocaleDateString("en-NP")}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Period End</span>
                <span className="text-[13px] font-['JetBrains_Mono',monospace] text-slate-400">
                  {new Date(usage.period_end).toLocaleDateString("en-NP")}
                </span>
              </div>
            </div>
          )}
          {usageLoading ? (
            <div className="h-[120px] rounded-[10px] bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
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
                label="Image Generations"
                used={usage.images_used}
                limit={usage.images_limit}
                isUnlimited={usage.images_limit === -1}
                percent={usage.images_limit === -1 ? null : (usage.images_used / usage.images_limit) * 100}
                icon="◈"
              />
            </div>
          ) : null}
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
            <div className="bg-slate-800 rounded-xl px-[18px] py-4 flex flex-col gap-1">
              <span className="text-[11px] text-slate-500 uppercase tracking-[0.08em]">Total Tokens</span>
              <span className="text-[22px] font-extrabold text-slate-100 tracking-[-0.03em] tabular-nums">
                {formatTokens(summary.daily_tokens.reduce((a, d) => a + d.tokens, 0))}
              </span>
            </div>
            <div className="bg-slate-800 rounded-xl px-[18px] py-4 flex flex-col gap-1">
              <span className="text-[11px] text-slate-500 uppercase tracking-[0.08em]">Total Requests</span>
              <span className="text-[22px] font-extrabold text-slate-100 tracking-[-0.03em] tabular-nums">
                {summary.daily_tokens.reduce((a, d) => a + d.requests, 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-800 rounded-xl px-[18px] py-4 flex flex-col gap-1">
              <span className="text-[11px] text-slate-500 uppercase tracking-[0.08em]">Total Cost</span>
              <span className="text-[22px] font-extrabold text-slate-100 tracking-[-0.03em] tabular-nums">
                NPR {Number(summary.total_cost).toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-800 rounded-xl px-[18px] py-4 flex flex-col gap-1">
              <span className="text-[11px] text-slate-500 uppercase tracking-[0.08em]">Avg Latency</span>
              <span className="text-[22px] font-extrabold text-slate-100 tracking-[-0.03em] tabular-nums">
                {summary.avg_latency_ms ? `${Math.round(summary.avg_latency_ms)}ms` : "—"}
              </span>
            </div>
          </div>
        )}

        {/* Daily chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-7 py-6">
          <div className="flex justify-between items-center mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 m-0">
              Daily Token Usage
            </p>
            <div className="flex gap-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-[5px] rounded-lg text-xs font-semibold cursor-pointer border transition-all duration-150 font-['Syne',sans-serif] ${
                    days === d
                      ? "bg-slate-800 border-slate-700 text-slate-400"
                      : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {summaryLoading ? (
            <div className="h-[120px] rounded-[10px] bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
          ) : summary && summary.daily_tokens.length > 0 ? (
            <div className="flex items-end gap-[3px] h-[100px]">
              {summary.daily_tokens.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full rounded-t-[4px] bg-linear-to-b from-indigo-500 to-indigo-700 min-h-[2px] transition-[height] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer hover:brightness-125"
                    style={{ height: `${Math.max((d.tokens / maxDailyTokens) * 100, 2)}%` }}
                    title={`${new Date(d.date).toLocaleDateString("en-NP")}: ${formatTokens(d.tokens)} tokens, ${d.requests} requests`}
                  />
                  <span className="text-[9px] text-slate-700 whitespace-nowrap">
                    {new Date(d.date).toLocaleDateString("en-NP", { day: "2-digit", month: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-700 text-[13px] text-center py-8">No data for this period</p>
          )}
        </div>

        {/* Top models */}
        {summary && summary.top_models.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-7 py-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-5 mt-0">
              Top Models Used
            </p>
            <div className="flex flex-col gap-3">
              {summary.top_models.map((m) => {
                const maxCount = summary.top_models[0]?.count ?? 1;
                return (
                  <div key={m.model} className="flex items-center gap-3">
                    <span className="text-[13px] text-slate-400 font-['JetBrains_Mono',monospace] w-40 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap">
                      {m.model}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500"
                        style={{ width: `${(m.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-['JetBrains_Mono',monospace] text-slate-500 w-10 text-right shrink-0">
                      {m.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Request history */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-7 py-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-5 mt-0">
            Request History ({total.toLocaleString()} total)
          </p>
          {histLoading ? (
            <div className="h-[120px] rounded-[10px] bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
          ) : (
            <>
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {["Model", "Tokens In", "Tokens Out", "Cost", "Latency", "Status", "Time"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-700 pb-3 border-b border-slate-800"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 border-b border-[#0f172a] text-slate-100 font-['JetBrains_Mono',monospace] text-xs last:border-b-0">
                        {r.model}
                      </td>
                      <td className="py-3 border-b border-[#0f172a] text-slate-400 font-['JetBrains_Mono',monospace] last:border-b-0">
                        {r.tokens_input?.toLocaleString() ?? "—"}
                      </td>
                      <td className="py-3 border-b border-[#0f172a] text-slate-400 font-['JetBrains_Mono',monospace] last:border-b-0">
                        {r.tokens_output?.toLocaleString() ?? "—"}
                      </td>
                      <td className="py-3 border-b border-[#0f172a] text-slate-400 font-['JetBrains_Mono',monospace] last:border-b-0">
                        {r.cost != null ? `NPR ${Number(r.cost).toFixed(4)}` : "—"}
                      </td>
                      <td className="py-3 border-b border-[#0f172a] text-slate-400 font-['JetBrains_Mono',monospace] last:border-b-0">
                        {r.latency_ms != null ? `${r.latency_ms}ms` : "—"}
                      </td>
                      <td className="py-3 border-b border-[#0f172a] text-slate-400 last:border-b-0">
                        <span
                          className="inline-block w-[7px] h-[7px] rounded-full mr-1.5"
                          style={{ background: STATUS_COLORS[r.status] ?? "#64748b" }}
                        />
                        {r.status}
                      </td>
                      <td className="py-3 border-b border-[#0f172a] text-slate-500 font-['JetBrains_Mono',monospace] text-[11px] last:border-b-0">
                        {new Date(r.created_at).toLocaleString("en-NP", {
                          hour12: false,
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex gap-2 justify-center mt-4">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer border border-slate-800 bg-transparent text-slate-500 font-['Syne',sans-serif] transition-all duration-150 hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer border font-['Syne',sans-serif] transition-all duration-150 hover:bg-slate-800 hover:text-slate-300 ${
                        p === page
                          ? "bg-slate-800 border-indigo-500 text-indigo-400"
                          : "bg-transparent border-slate-800 text-slate-500"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer border border-slate-800 bg-transparent text-slate-500 font-['Syne',sans-serif] transition-all duration-150 hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}