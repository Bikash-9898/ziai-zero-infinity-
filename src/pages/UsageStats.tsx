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
    <div className="usage-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        .usage-page {
          min-height: 100vh;
          background: #060c18;
          color: #f1f5f9;
          font-family: 'Syne', sans-serif;
          padding: 48px 24px 80px;
        }
        .usage-inner { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 40px; }
        h1 {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.04em;
          margin: 0 0 6px;
          background: linear-gradient(135deg, #f1f5f9, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .page-sub { font-size: 15px; color: #475569; margin: 0; }

        /* Cards */
        .card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 24px 28px;
        }
        .card-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #475569;
          margin: 0 0 20px;
        }

        /* Usage bars */
        .bars-grid { display: flex; flex-direction: column; gap: 20px; }

        /* Period info */
        .period-strip {
          display: flex;
          gap: 24px;
          padding: 14px 18px;
          background: #1e293b;
          border-radius: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .period-item { display: flex; flex-direction: column; gap: 2px; }
        .period-key {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #475569;
        }
        .period-val {
          font-size: 13px;
          font-family: 'JetBrains Mono', monospace;
          color: #94a3b8;
        }

        /* Summary row */
        .summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
        .summary-card {
          background: #1e293b;
          border-radius: 12px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .summary-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
        .summary-val {
          font-size: 22px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
        }

        /* Chart */
        .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .days-tabs { display: flex; gap: 4px; }
        .day-tab {
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          background: transparent;
          color: #475569;
          font-family: 'Syne', sans-serif;
          transition: all 0.15s;
        }
        .day-tab.active { background: #1e293b; border-color: #334155; color: #94a3b8; }
        .day-tab:hover { color: #cbd5e1; }
        .bar-chart { display: flex; align-items: flex-end; gap: 3px; height: 100px; }
        .bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          height: 100%;
          justify-content: flex-end;
        }
        .bar-seg {
          width: 100%;
          border-radius: 4px 4px 0 0;
          background: linear-gradient(180deg, #6366f1, #4338ca);
          min-height: 2px;
          transition: height 0.4s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer;
        }
        .bar-seg:hover { filter: brightness(1.3); }
        .bar-label { font-size: 9px; color: #334155; white-space: nowrap; }

        /* Top models */
        .model-list { display: flex; flex-direction: column; gap: 12px; }
        .model-row { display: flex; align-items: center; gap: 12px; }
        .model-name { font-size: 13px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; width: 160px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .model-bar-wrap { flex: 1; height: 6px; background: #1e293b; border-radius: 999px; overflow: hidden; }
        .model-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #6366f1, #8b5cf6); }
        .model-count { font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #475569; width: 40px; text-align: right; flex-shrink: 0; }

        /* Request history */
        .history-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .history-table th {
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #334155;
          padding: 0 0 12px;
          border-bottom: 1px solid #1e293b;
        }
        .history-table td { padding: 12px 0; border-bottom: 1px solid #0f172a; color: #94a3b8; }
        .history-table tr:last-child td { border-bottom: none; }
        .history-table td:first-child { color: #f1f5f9; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
        .status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        /* Pagination */
        .pagination { display: flex; gap: 8px; justify-content: center; margin-top: 16px; }
        .page-btn {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #1e293b;
          background: transparent;
          color: #64748b;
          font-family: 'Syne', sans-serif;
          transition: all 0.15s;
        }
        .page-btn:hover:not(:disabled) { background: #1e293b; color: #cbd5e1; }
        .page-btn.active { background: #1e293b; border-color: #6366f1; color: #6366f1; }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .loading-block { height: 120px; background: linear-gradient(90deg, #0f172a, #1e293b, #0f172a); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px; }
        @keyframes shimmer { to { background-position: -200% 0; } }

        @media (max-width: 640px) {
          .usage-page { padding: 24px 16px 60px; }
        }
      `}</style>

      <div className="usage-inner">
        <div>
          <h1>Usage & Analytics</h1>
          <p className="page-sub">Monitor your AI usage, token consumption, and request history</p>
        </div>

        {/* Current period usage bars */}
        <div className="card">
          <p className="card-title">Current Period Usage</p>
          {usage && (
            <div className="period-strip">
              <div className="period-item">
                <span className="period-key">Plan</span>
                <span className="period-val">{usage.plan}</span>
              </div>
              <div className="period-item">
                <span className="period-key">Period Start</span>
                <span className="period-val">{new Date(usage.period_start).toLocaleDateString("en-NP")}</span>
              </div>
              <div className="period-item">
                <span className="period-key">Period End</span>
                <span className="period-val">{new Date(usage.period_end).toLocaleDateString("en-NP")}</span>
              </div>
            </div>
          )}
          {usageLoading ? (
            <div className="loading-block" />
          ) : usage ? (
            <div className="bars-grid">
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
          <div className="summary-row">
            <div className="summary-card">
              <span className="summary-label">Total Tokens</span>
              <span className="summary-val">{formatTokens(summary.daily_tokens.reduce((a, d) => a + d.tokens, 0))}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Requests</span>
              <span className="summary-val">{summary.daily_tokens.reduce((a, d) => a + d.requests, 0).toLocaleString()}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Total Cost</span>
              <span className="summary-val">NPR {Number(summary.total_cost).toFixed(2)}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Avg Latency</span>
              <span className="summary-val">{summary.avg_latency_ms ? `${Math.round(summary.avg_latency_ms)}ms` : "—"}</span>
            </div>
          </div>
        )}

        {/* Daily chart */}
        <div className="card">
          <div className="chart-header">
            <p className="card-title" style={{ margin: 0 }}>Daily Token Usage</p>
            <div className="days-tabs">
              {[7, 14, 30].map((d) => (
                <button key={d} className={`day-tab ${days === d ? "active" : ""}`} onClick={() => setDays(d)}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {summaryLoading ? (
            <div className="loading-block" />
          ) : summary && summary.daily_tokens.length > 0 ? (
            <div className="bar-chart">
              {summary.daily_tokens.map((d) => (
                <div key={d.date} className="bar-col">
                  <div
                    className="bar-seg"
                    style={{ height: `${Math.max((d.tokens / maxDailyTokens) * 100, 2)}%` }}
                    title={`${new Date(d.date).toLocaleDateString("en-NP")}: ${formatTokens(d.tokens)} tokens, ${d.requests} requests`}
                  />
                  <span className="bar-label">{new Date(d.date).toLocaleDateString("en-NP", { day: "2-digit", month: "2-digit" })}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#334155", fontSize: 13, textAlign: "center", padding: "32px 0" }}>No data for this period</p>
          )}
        </div>

        {/* Top models */}
        {summary && summary.top_models.length > 0 && (
          <div className="card">
            <p className="card-title">Top Models Used</p>
            <div className="model-list">
              {summary.top_models.map((m) => {
                const maxCount = summary.top_models[0]?.count ?? 1;
                return (
                  <div key={m.model} className="model-row">
                    <span className="model-name">{m.model}</span>
                    <div className="model-bar-wrap">
                      <div className="model-bar-fill" style={{ width: `${(m.count / maxCount) * 100}%` }} />
                    </div>
                    <span className="model-count">{m.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Request history */}
        <div className="card">
          <p className="card-title">Request History ({total.toLocaleString()} total)</p>
          {histLoading ? (
            <div className="loading-block" />
          ) : (
            <>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Tokens In</th>
                    <th>Tokens Out</th>
                    <th>Cost</th>
                    <th>Latency</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.model}</td>
                      <td className="mono">{r.tokens_input?.toLocaleString() ?? "—"}</td>
                      <td className="mono">{r.tokens_output?.toLocaleString() ?? "—"}</td>
                      <td className="mono">{r.cost != null ? `NPR ${Number(r.cost).toFixed(4)}` : "—"}</td>
                      <td className="mono">{r.latency_ms != null ? `${r.latency_ms}ms` : "—"}</td>
                      <td>
                        <span className="status-dot" style={{ background: STATUS_COLORS[r.status] ?? "#64748b" }} />
                        {r.status}
                      </td>
                      <td className="mono" style={{ fontSize: 11, color: "#475569" }}>
                        {new Date(r.created_at).toLocaleString("en-NP", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" onClick={() => goToPage(page - 1)} disabled={page === 1}>←</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => goToPage(p)}>{p}</button>
                  ))}
                  <button className="page-btn" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>→</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
