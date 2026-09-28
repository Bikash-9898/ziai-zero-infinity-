// src/components/billing/PlanCard.tsx

import type { PlanComparison } from "@/api/billing";
import { ShinyButton } from "@/components/ui/shiny-button";
import { getPlanAccent } from "@/components/billing/planAccents";
import { cn } from "@/lib/utils";

const PLAN_META: Record<string, { color: string; glow: string; icon: string; tagline: string }> = {
  free:       { color: getPlanAccent("free"), glow: "#64748b22", icon: "◇", tagline: "Get started for free" },
  basic:      { color: getPlanAccent("basic"), glow: "#06b6d422", icon: "◈", tagline: "For individuals & hobbyists" },
  pro:        { color: getPlanAccent("pro"), glow: "#6366f133", icon: "⬡", tagline: "For power users & teams" },
  enterprise: { color: getPlanAccent("enterprise"), glow: "#f59e0b22", icon: "✦", tagline: "Unlimited everything" },
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
  const meta      = PLAN_META[plan.plan] ?? PLAN_META.free;
  const isPro     = plan.plan === "pro";
  const isCurrent = plan.action === "current";

  // FIX: Added "free" as a selectable downgrade target.
  // Previously btn label fell through to "Select" for free which was confusing.
  const btnLabel =
    isCurrent                     ? "Current Plan"
    : plan.action === "upgrade"   ? `Upgrade to ${cap(plan.plan)}`
    : plan.action === "downgrade" ? `Downgrade to ${cap(plan.plan)}`
    : "Select";

  return (
    <div
      className="relative flex flex-col gap-5 rounded-2xl p-7 transition-[border-color,transform] duration-200"
      style={{
        background:   isCurrent ? `linear-gradient(135deg, ${meta.glow}, #0f172a)` : "#0f172a",
        border:       `1px solid ${isCurrent ? meta.color + "66" : "#1e293b"}`,
        cursor:       isCurrent ? "default" : "pointer",
        boxShadow:    isCurrent ? `0 0 32px ${meta.glow}` : "none",
      }}
      onMouseEnter={e => {
        if (!isCurrent) (e.currentTarget as HTMLDivElement).style.borderColor = meta.color + "55";
      }}
      onMouseLeave={e => {
        if (!isCurrent) (e.currentTarget as HTMLDivElement).style.borderColor = "#1e293b";
      }}
    >
      {/* Popular badge */}
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-bold tracking-widest px-3.5 py-0.5 rounded-full uppercase whitespace-nowrap">
          Most Popular
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="text-[22px]" style={{ color: meta.color }}>{meta.icon}</span>
          <span className="text-[18px] font-extrabold text-slate-100 tracking-tight">
            {cap(plan.plan)}
          </span>
          {/* Current plan badge on card header */}
          {isCurrent && (
            <span
              className="text-[9px] font-bold uppercase tracking-[0.08em] px-1.75 py-0.5 rounded-full ml-1"
              style={{ background: meta.color + "22", color: meta.color }}
            >
              Active
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 m-0">{meta.tagline}</p>
      </div>

      {/* Price */}
      <div>
        {plan.price_npr === 0 ? (
          <span className="text-[32px] font-black text-slate-100 tracking-[-0.04em]">
            Free
          </span>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-[13px] text-slate-500 font-mono">NPR</span>
            <span
              className="text-[32px] font-black tracking-[-0.04em]"
              style={{ color: meta.color }}
            >
              {plan.price_npr.toLocaleString()}
            </span>
            <span className="text-xs text-slate-600">/mo</span>
          </div>
        )}
      </div>

      {/* Limits */}
      <div className="flex flex-col gap-2.5 flex-1">
        <LimitRow icon="⬡" label="Tokens"   value={fmt(plan.tokens_per_month)}                    color={meta.color} />
        <LimitRow icon="↗" label="Requests" value={fmt(plan.requests_per_month, "/mo")}           color={meta.color} />
        <LimitRow icon="◈" label="Images"   value={fmt(plan.image_generations_per_month, "/mo")}  color={meta.color} />
      </div>

      {/* CTA */}
      <ShinyButton
        disabled={isCurrent}
        aria-busy={loading}
        highlightColor={meta.color}
        onClick={() => !isCurrent && !loading && onSelect(plan)}
        className={cn(
          "w-full rounded-[10px] text-[13px] font-bold tracking-[0.04em]",
          "[--shiny-cta-padding:11px_0]",
          // Blend the button fill into the card and sweep the border in the
          // plan's accent. Skipped on the current plan, where the
          // :disabled rule in shiny-button.css owns the palette.
          !isCurrent && "[--shiny-cta-bg:#0f172a]",
        )}
      >
        {loading ? "Processing…" : btnLabel}
      </ShinyButton>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LimitRow({ icon, label, value, color }: {
  icon: string; label: string; value: string; color: string;
}) {
  const isUnlimited = value === "Unlimited";
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <span
        className="text-xs font-mono font-semibold"
        style={{ color: isUnlimited ? color : "#94a3b8" }}
      >
        {value}
      </span>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }