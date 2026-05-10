// src/pages/UsageStats.tsx
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import UsageBar from '../components/billing/UsageBar';
import { useUsage, useUsageSummary, useUsageHistory, formatTokens } from '../hooks/useUsage';

const STATUS_COLORS: Record<string, string> = {
  success: '#22c55e',
  error:   '#ef4444',
};

export default function UsageStats() {
  const { user, loading: authLoading } = useAuth();
  const [days, setDays]                = useState(30);

  const userId = user?.id ?? '';
  const skip   = !userId;

  const { usage, loading: usageLoading }                                         = useUsage(skip ? null : userId);
  const { summary, loading: summaryLoading }                                     = useUsageSummary(skip ? null : userId, days);
  const { requests, total, page, totalPages, loading: histLoading, goToPage }   = useUsageHistory(skip ? null : userId, 15);

  // Fix: guard against empty array before Math.max spread
  const maxDailyTokens = summary?.daily_tokens.length
    ? Math.max(...summary.daily_tokens.map(d => d.tokens), 1)
    : 1;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#060c18] flex items-center justify-center">
        <Loader2 size={28} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 px-6 py-12 pb-20">
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>

      <div className="max-w-5xl mx-auto flex flex-col gap-10">

        {/* Header */}
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-0.04em] mb-1.5 mt-0">
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
            <div className="flex gap-6 px-4 py-3 bg-slate-800 rounded-[10px] mb-5 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Plan</span>
                <span className="text-[13px] font-mono text-slate-400">{usage.plan}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Period Start</span>
                <span className="text-[13px] font-mono text-slate-400">{new Date(usage.period_start).toLocaleDateString('en-NP')}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Period End</span>
                <span className="text-[13px] font-mono text-slate-400">{new Date(usage.period_end).toLocaleDateString('en-NP')}</span>
              </div>
            </div>
          )}
          {usageLoading ? (
            <div className="h-28 rounded-[10px] bg-slate-800 animate-pulse" />
          ) : usage ? (
            <div className="flex flex-col gap-5">
              <UsageBar label="Tokens"            used={usage.tokens_used}   limit={usage.tokens_limit}   isUnlimited={usage.tokens_limit === -1}   percent={usage.percent_tokens_used}   icon="⬡" />
              <UsageBar label="Requests"          used={usage.requests_used} limit={usage.requests_limit} isUnlimited={usage.requests_limit === -1} percent={usage.percent_requests_used} icon="↗" />
              <UsageBar label="Image Generations" used={usage.images_used}   limit={usage.images_limit}   isUnlimited={usage.images_limit === -1}   percent={usage.images_limit === -1 ? null : (usage.images_used / usage.images_limit) * 100} icon="◈" />
            </div>
          ) : null}
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
            {[
              { label: 'Total Tokens',   value: formatTokens(summary.daily_tokens.reduce((a, d) => a + d.tokens, 0)) },
              { label: 'Total Requests', value: summary.daily_tokens.reduce((a, d) => a + d.requests, 0).toLocaleString() },
              { label: 'Total Cost',     value: `NPR ${Number(summary.total_cost).toFixed(2)}` },
              { label: 'Avg Latency',    value: summary.avg_latency_ms ? `${Math.round(summary.avg_latency_ms)}ms` : '—' },
            ].map(c => (
              <div key={c.label} className="bg-slate-800 rounded-xl px-4 py-4 flex flex-col gap-1">
                <span className="text-[11px] text-slate-500 uppercase tracking-[0.08em]">{c.label}</span>
                <span className="text-[22px] font-extrabold text-slate-100 tracking-[-0.03em] tabular-nums">{c.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Daily chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-7 py-6">
          <div className="flex justify-between items-center mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 m-0">
              Daily Token Usage
            </p>
            <div className="flex gap-1">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                    days === d
                      ? 'bg-slate-800 border-slate-700 text-slate-400'
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {summaryLoading ? (
            <div className="h-28 rounded-[10px] bg-slate-800 animate-pulse" />
          ) : summary && summary.daily_tokens.length > 0 ? (
            <div className="flex items-end gap-1 h-24">
              {summary.daily_tokens.map(d => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full rounded-t-sm bg-indigo-600 min-h-[2px] transition-[height] duration-300"
                    style={{ height: `${Math.max((d.tokens / maxDailyTokens) * 100, 2)}%` }}
                    title={`${new Date(d.date).toLocaleDateString('en-NP')}: ${formatTokens(d.tokens)} tokens, ${d.requests} requests`}
                  />
                  <span className="text-[9px] text-slate-700 whitespace-nowrap">
                    {new Date(d.date).toLocaleDateString('en-NP', { day: '2-digit', month: '2-digit' })}
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
              {summary.top_models.map(m => {
                const maxCount = summary.top_models[0]?.count ?? 1;
                return (
                  <div key={m.model} className="flex items-center gap-3">
                    <span className="text-[13px] text-slate-400 font-mono w-40 shrink-0 overflow-hidden text-ellipsis whitespace-nowrap">{m.model}</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(m.count / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-slate-500 w-10 text-right shrink-0">{m.count}</span>
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
            <div className="h-28 rounded-[10px] bg-slate-800 animate-pulse" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px] min-w-[640px]">
                  <thead>
                    <tr>
                      {['Model', 'Tokens In', 'Tokens Out', 'Cost', 'Latency', 'Status', 'Time'].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-700 pb-3 border-b border-slate-800">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id}>
                        <td className="py-3 border-b border-[#0f172a] text-slate-100 font-mono text-xs">{r.model}</td>
                        <td className="py-3 border-b border-[#0f172a] text-slate-400 font-mono">{r.tokens_input?.toLocaleString() ?? '—'}</td>
                        <td className="py-3 border-b border-[#0f172a] text-slate-400 font-mono">{r.tokens_output?.toLocaleString() ?? '—'}</td>
                        <td className="py-3 border-b border-[#0f172a] text-slate-400 font-mono">{r.cost != null ? `NPR ${Number(r.cost).toFixed(4)}` : '—'}</td>
                        <td className="py-3 border-b border-[#0f172a] text-slate-400 font-mono">{r.latency_ms != null ? `${r.latency_ms}ms` : '—'}</td>
                        <td className="py-3 border-b border-[#0f172a] text-slate-400">
                          <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: STATUS_COLORS[r.status] ?? '#64748b' }} />
                          {r.status}
                        </td>
                        <td className="py-3 border-b border-[#0f172a] text-slate-500 font-mono text-[11px]">
                          {new Date(r.created_at).toLocaleString('en-NP', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex gap-2 justify-center mt-4">
                  <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer border border-slate-800 bg-transparent text-slate-500 transition-all hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed">←</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => goToPage(p)} className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer border transition-all hover:bg-slate-800 hover:text-slate-300 ${p === page ? 'bg-slate-800 border-indigo-500 text-indigo-400' : 'bg-transparent border-slate-800 text-slate-500'}`}>{p}</button>
                  ))}
                  <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer border border-slate-800 bg-transparent text-slate-500 transition-all hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed">→</button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
