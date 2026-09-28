import React from "react";
import type { PlanComparison } from "../../api/billing";

interface PlanCardProps {
  plan: PlanComparison;
  onSelect: (plan: string) => void;
  loading?: boolean;
}

const PLAN_ICONS: Record<string, string> = {
  free: "◇",
  basic: "◈",
  pro: "◉",
  enterprise: "⬡",
};

const PLAN_COLORS: Record<string, { accent: string; glow: string; border: string }> = {
  free:       { accent: "#64748b", glow: "#64748b22", border: "#64748b44" },
  basic:      { accent: "#06b6d4", glow: "#06b6d422", border: "#06b6d444" },
  pro:        { accent: "#6366f1", glow: "#6366f133", border: "#6366f166" },
  enterprise: { accent: "#f59e0b", glow: "#f59e0b22", border: "#f59e0b44" },
};

function formatStat(n: number, suffix = ""): string {
  if (n === -1) return "Unlimited";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M${suffix}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K${suffix}`;
  return `${n}${suffix}`;
}

export default function PlanCard({ plan, onSelect, loading }: PlanCardProps) {
  const colors = PLAN_COLORS[plan.plan] ?? PLAN_COLORS.free;
  const isCurrent = plan.action === "current";
  const isUpgrade = plan.action === "upgrade";

  const btnLabel = isCurrent
    ? "Current Plan"
    : isUpgrade
    ? `Upgrade to ${plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1)}`
    : "Switch Plan";

  return (
    <div
      className={`plan-card ${isCurrent ? "current" : ""} ${plan.plan === "pro" ? "featured" : ""}`}
      style={{
        "--accent": colors.accent,
        "--glow": colors.glow,
        "--border-col": colors.border,
      } as React.CSSProperties}
    >
      {plan.plan === "pro" && <div className="featured-tag">Most Popular</div>}

      <div className="plan-icon">{PLAN_ICONS[plan.plan] ?? "◇"}</div>
      <h3 className="plan-name">{plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1)}</h3>

      <div className="plan-price">
        {plan.price_npr === 0 ? (
          <span className="price-main">Free</span>
        ) : (
          <>
            <span className="price-currency">NPR</span>
            <span className="price-main">{plan.price_npr.toLocaleString()}</span>
            <span className="price-period">/mo</span>
          </>
        )}
      </div>

      <ul className="plan-features">
        <li>
          <span className="feature-icon">⬡</span>
          <span>{formatStat(plan.tokens_per_month)} tokens/mo</span>
        </li>
        <li>
          <span className="feature-icon">↗</span>
          <span>{formatStat(plan.requests_per_month)} requests/mo</span>
        </li>
        <li>
          <span className="feature-icon">◈</span>
          <span>{formatStat(plan.image_generations_per_month)} images/mo</span>
        </li>
        {plan.is_unlimited && (
          <li>
            <span className="feature-icon">∞</span>
            <span>No rate limits</span>
          </li>
        )}
      </ul>

      <button
        className={`plan-btn ${isCurrent ? "btn-current" : isUpgrade ? "btn-upgrade" : "btn-switch"}`}
        onClick={() => !isCurrent && onSelect(plan.plan)}
        disabled={isCurrent || loading}
      >
        {loading ? <span className="btn-spinner" /> : btnLabel}
      </button>

      <style>{`
        .plan-card {
          position: relative;
          background: linear-gradient(160deg, #0f172a, #0a0f1e);
          border: 1px solid var(--border-col);
          border-radius: 16px;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 0 0 transparent;
        }
        .plan-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px var(--glow), 0 0 0 1px var(--border-col);
        }
        .plan-card.current {
          border-color: var(--accent);
          box-shadow: 0 0 24px var(--glow);
        }
        .plan-card.featured {
          background: linear-gradient(160deg, #13102b, #0d0b1f);
        }
        .featured-tag {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 4px 14px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .plan-icon {
          font-size: 28px;
          color: var(--accent);
          line-height: 1;
        }
        .plan-name {
          font-size: 18px;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .plan-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .price-currency {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }
        .price-main {
          font-size: 32px;
          font-weight: 800;
          color: var(--accent);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.04em;
        }
        .price-period {
          font-size: 13px;
          color: #475569;
        }
        .plan-features {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .plan-features li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94a3b8;
        }
        .feature-icon {
          color: var(--accent);
          font-size: 12px;
          width: 16px;
          text-align: center;
          flex-shrink: 0;
        }
        .plan-btn {
          width: 100%;
          padding: 11px 0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .btn-upgrade {
          background: linear-gradient(135deg, var(--accent), var(--accent)cc);
          color: #fff;
          box-shadow: 0 4px 16px var(--glow);
        }
        .btn-upgrade:hover { filter: brightness(1.12); transform: translateY(-1px); }
        .btn-current {
          background: transparent;
          border: 1px solid var(--border-col);
          color: var(--accent);
          cursor: default;
        }
        .btn-switch {
          background: #1e293b;
          color: #94a3b8;
          border: 1px solid #334155;
        }
        .btn-switch:hover { background: #273344; color: #cbd5e1; }
        .plan-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #ffffff44;
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
