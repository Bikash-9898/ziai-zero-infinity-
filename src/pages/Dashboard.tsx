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
    <div className="dash-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        .dash-page {
          min-height: 100vh;
          background: #060c18;
          color: #f1f5f9;
          font-family: 'Syne', sans-serif;
          padding: 48px 24px 80px;
        }
        .dash-inner { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; }

        /* Header */
        .dash-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .dash-header h1 { font-size: 32px; font-weight: 800; letter-spacing: -0.04em; margin: 0 0 6px; }
        .dash-header p { font-size: 14px; color: #475569; margin: 0; }
        .plan-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0f172a;
          border: 1px solid;
          border-radius: 12px;
          padding: 12px 20px;
          flex-shrink: 0;
        }
        .plan-badge-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .plan-badge-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
        .plan-badge-name { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; }

        /* Stat grid */
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .stat-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: border-color 0.2s;
        }
        .stat-card:hover { border-color: #334155; }
        .stat-card-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; }
        .stat-card-value { font-size: 26px; font-weight: 800; letter-spacing: -0.04em; color: #f1f5f9; font-variant-numeric: tabular-nums; }
        .stat-card-sub { font-size: 12px; color: #334155; font-family: 'JetBrains Mono', monospace; }
        .stat-card-accent { color: var(--accent); }

        /* Usage card */
        .usage-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 14px;
          padding: 24px 28px;
        }
        .usage-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #475569; margin: 0; }
        .view-link {
          font-size: 12px;
          color: #6366f1;
          text-decoration: none;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          background: #6366f111;
          transition: background 0.15s;
        }
        .view-link:hover { background: #6366f122; }
        .usage-bars { display: flex; flex-direction: column; gap: 20px; }

        /* Quick actions */
        .actions-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 18px;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 12px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s;
          font-family: 'Syne', sans-serif;
        }
        .action-btn:hover { background: #1e293b; border-color: #334155; color: #f1f5f9; }
        .action-btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 4px 16px #6366f133;
        }
        .action-btn-primary:hover { filter: brightness(1.1); color: #fff; }
        .action-icon { font-size: 16px; }

        /* Recent activity */
        .activity-list { display: flex; flex-direction: column; gap: 1px; }
        .activity-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #0f172a;
        }
        .activity-row:last-child { border-bottom: none; }
        .activity-left { display: flex; align-items: center; gap: 12px; }
        .activity-model {
          font-size: 13px;
          font-family: 'JetBrains Mono', monospace;
          color: #94a3b8;
        }
        .activity-tokens { font-size: 12px; color: #475569; }
        .activity-time { font-size: 11px; color: #334155; font-family: 'JetBrains Mono', monospace; }
        .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .skeleton { background: linear-gradient(90deg, #0f172a, #1e293b, #0f172a); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px; }
        @keyframes shimmer { to { background-position: -200% 0; } }

        @media (max-width: 640px) {
          .dash-page { padding: 24px 16px 60px; }
          .stat-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="dash-inner">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back — here's your AI platform overview</p>
          </div>
          {status && (
            <div
              className="plan-badge"
              style={{ borderColor: `${planColor}44`, "--accent": planColor } as React.CSSProperties}
            >
              <span className="plan-badge-dot" style={{ background: planColor }} />
              <div>
                <div className="plan-badge-label">Active Plan</div>
                <div className="plan-badge-name stat-card-accent">
                  {status.current_plan.charAt(0).toUpperCase() + status.current_plan.slice(1)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-card-label">Tokens Used (7d)</span>
            <span className="stat-card-value">{formatTokens(totalTokens7d)}</span>
            <span className="stat-card-sub">last 7 days</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Requests (7d)</span>
            <span className="stat-card-value">{totalReqs7d.toLocaleString()}</span>
            <span className="stat-card-sub">AI calls made</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Days Remaining</span>
            <span className="stat-card-value">{daysLeft !== null ? daysLeft : "—"}</span>
            <span className="stat-card-sub">
              {status?.subscription.period_end
                ? `Renews ${new Date(status.subscription.period_end).toLocaleDateString("en-NP")}`
                : "No active subscription"}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-card-label">Last Payment</span>
            <span className="stat-card-value">
              {status?.last_payment.amount ? `${Number(status.last_payment.amount).toLocaleString()}` : "—"}
            </span>
            <span className="stat-card-sub">
              {status?.last_payment.provider ? `via ${status.last_payment.provider}` : "no payments yet"}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="actions-row">
          <a href="/billing" className="action-btn action-btn-primary">
            <span className="action-icon">⬡</span>
            Upgrade Plan
          </a>
          <a href="/billing" className="action-btn">
            <span className="action-icon">◈</span>
            Manage Billing
          </a>
          <a href="/usage" className="action-btn">
            <span className="action-icon">↗</span>
            View Full Usage
          </a>
        </div>

        {/* Usage bars */}
        <div className="usage-card">
          <div className="usage-card-header">
            <p className="card-title">This Period's Usage</p>
            <a href="/usage" className="view-link">View all →</a>
          </div>
          {usageLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="skeleton" style={{ height: 40 }} />
              <div className="skeleton" style={{ height: 40 }} />
              <div className="skeleton" style={{ height: 40 }} />
            </div>
          ) : usage ? (
            <div className="usage-bars">
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
            <p style={{ color: "#334155", fontSize: 13 }}>No usage data available</p>
          )}
        </div>

        {/* Recent model activity */}
        {summary && summary.top_models.length > 0 && (
          <div className="usage-card">
            <div className="usage-card-header">
              <p className="card-title">Top Models (7d)</p>
            </div>
            <div className="activity-list">
              {summary.top_models.map((m) => (
                <div key={m.model} className="activity-row">
                  <div className="activity-left">
                    <span className="status-dot" style={{ background: "#6366f1" }} />
                    <span className="activity-model">{m.model}</span>
                  </div>
                  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <span className="activity-tokens">{formatTokens(m.tokens)} tokens</span>
                    <span className="activity-time">{m.count} reqs</span>
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
