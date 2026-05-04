// src/components/billing/PlanCard.tsx

import type { PlanComparison } from "@/api/billing";

const PLAN_META: Record<string, { color: string; glow: string; icon: string; tagline: string }> = {
  free:       { color: "#64748b", glow: "#64748b22", icon: "◇", tagline: "Get started for free"        },
  basic:      { color: "#06b6d4", glow: "#06b6d422", icon: "◈", tagline: "For individuals & hobbyists" },
  pro:        { color: "#6366f1", glow: "#6366f133", icon: "⬡", tagline: "For power users & teams"     },
  enterprise: { color: "#f59e0b", glow: "#f59e0b22", icon: "✦", tagline: "Unlimited everything"        },
};

function fmt(n: number, suffix = ""): string {
  if (n === -1) return "Unlimited";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M${suffix}`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K${suffix}`;
  return `${n}${suffix}`;
}

interface PlanCardProps {
  plan: PlanComparison;
  onSelect: (plan: PlanComparison) => void;
  loading?: boolean;
}

export default function PlanCard({ plan, onSelect, loading }: PlanCardProps) {
  const meta   = PLAN_META[plan.plan] ?? PLAN_META.free;
  const isPro  = plan.plan === "pro";
  const isCurrent = plan.action === "current";

  const btnLabel =
    isCurrent        ? "Current Plan"
    : plan.action === "upgrade"   ? `Upgrade to ${cap(plan.plan)}`
    : plan.action === "downgrade" ? `Downgrade to ${cap(plan.plan)}`
    : "Select";

  return (
    <div
      style={{
        position:      "relative",
        background:    isCurrent ? `linear-gradient(135deg, ${meta.glow}, #0f172a)` : "#0f172a",
        border:        `1px solid ${isCurrent ? meta.color + "66" : "#1e293b"}`,
        borderRadius:  16,
        padding:       "28px 24px",
        display:       "flex",
        flexDirection: "column",
        gap:           20,
        transition:    "border-color 0.2s, transform 0.2s",
        cursor:        isCurrent ? "default" : "pointer",
        boxShadow:     isCurrent ? `0 0 32px ${meta.glow}` : "none",
      }}
      onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLDivElement).style.borderColor = meta.color + "55"; }}
      onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLDivElement).style.borderColor = "#1e293b"; }}
    >
      {/* Popular badge */}
      {isPro && (
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
          color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          padding: "3px 14px", borderRadius: 999, textTransform: "uppercase", whiteSpace: "nowrap",
        }}>
          Most Popular
        </div>
      )}

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22, color: meta.color }}>{meta.icon}</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
            {cap(plan.plan)}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{meta.tagline}</p>
      </div>

      {/* Price */}
      <div>
        {plan.price_npr === 0 ? (
          <span style={{ fontSize: 32, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.04em" }}>
            Free
          </span>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 13, color: "#64748b", fontFamily: "monospace" }}>NPR</span>
            <span style={{ fontSize: 32, fontWeight: 900, color: meta.color, letterSpacing: "-0.04em" }}>
              {plan.price_npr.toLocaleString()}
            </span>
            <span style={{ fontSize: 12, color: "#475569" }}>/mo</span>
          </div>
        )}
      </div>

      {/* Limits */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <LimitRow icon="⬡" label="Tokens"   value={fmt(plan.tokens_per_month)}              color={meta.color} />
        <LimitRow icon="↗" label="Requests" value={fmt(plan.requests_per_month, "/mo")}     color={meta.color} />
        <LimitRow icon="◈" label="Images"   value={fmt(plan.image_generations_per_month, "/mo")} color={meta.color} />
      </div>

      {/* CTA */}
      <button
        disabled={isCurrent || loading}
        onClick={() => !isCurrent && onSelect(plan)}
        style={{
          width:         "100%",
          padding:       "12px 0",
          borderRadius:  10,
          fontSize:      13,
          fontWeight:    700,
          letterSpacing: "0.04em",
          cursor:        isCurrent ? "default" : "pointer",
          border:        "none",
          transition:    "all 0.15s",
          background:    isCurrent
            ? "#1e293b"
            : plan.action === "upgrade"
              ? `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`
              : "#1e293b",
          color:  isCurrent ? "#475569" : plan.action === "upgrade" ? "#fff" : meta.color,
          boxShadow: (!isCurrent && plan.action === "upgrade") ? `0 4px 16px ${meta.glow}` : "none",
        }}
      >
        {loading ? "Processing…" : btnLabel}
      </button>
    </div>
  );
}

function LimitRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const isUnlimited = value === "Unlimited";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <span style={{
        fontSize:   12,
        fontFamily: "monospace",
        fontWeight: 600,
        color:      isUnlimited ? color : "#94a3b8",
      }}>
        {value}
      </span>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
