import React from "react";
import type { Plan } from "../../api/billing";

interface PlanCardProps {
  plan: Plan;
  currentPlan: string;
  onSelect: (plan: Plan) => void;
  loading?: boolean;
}

const PLAN_ICONS: Record<string, string> = {
  free: "✦",
  pro: "◈",
  enterprise: "⬡",
};

const PLAN_ACCENT: Record<string, string> = {
  free: "from-slate-600 to-slate-700",
  pro: "from-violet-600 to-indigo-600",
  enterprise: "from-amber-500 to-orange-500",
};

const PLAN_BORDER: Record<string, string> = {
  free: "border-slate-600/40",
  pro: "border-violet-500/50",
  enterprise: "border-amber-500/50",
};

const PLAN_GLOW: Record<string, string> = {
  free: "",
  pro: "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
  enterprise: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
};

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return String(n);
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentPlan,
  onSelect,
  loading,
}) => {
  const isCurrent = currentPlan === plan.id;
  const isPro = plan.id === "pro";
  const icon = PLAN_ICONS[plan.id] ?? "◆";
  const accent = PLAN_ACCENT[plan.id] ?? PLAN_ACCENT.free;
  const border = PLAN_BORDER[plan.id] ?? PLAN_BORDER.free;
  const glow = PLAN_GLOW[plan.id] ?? "";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-slate-800/50 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 ${border} ${glow}`}
    >
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase">
            Popular
          </span>
        </div>
      )}

      {/* Icon + Name */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white text-lg`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-white font-bold text-lg capitalize">
            {plan.name}
          </h3>
          <p className="text-slate-400 text-xs">
            {plan.id === "free"
              ? "Get started"
              : plan.id === "pro"
              ? "Most popular"
              : "Custom scale"}
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black text-white">
            {plan.price === 0 ? "Free" : `Rs ${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span className="text-slate-400 mb-1 text-sm">/month</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-slate-700/40 rounded-lg p-3 text-center">
          <p className="text-white font-bold text-sm">
            {formatTokens(plan.tokens)}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">Tokens</p>
        </div>
        <div className="flex-1 bg-slate-700/40 rounded-lg p-3 text-center">
          <p className="text-white font-bold text-sm">
            {formatTokens(plan.requests)}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">Requests</p>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <span className="text-emerald-400 mt-0.5 text-xs">✓</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <div className="w-full py-2.5 rounded-xl bg-slate-700/50 text-slate-400 text-sm font-semibold text-center border border-slate-600/50">
          Current Plan
        </div>
      ) : (
        <button
          onClick={() => onSelect(plan)}
          disabled={loading}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 bg-gradient-to-r ${accent} text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? "Processing…" : plan.price === 0 ? "Use Free" : "Upgrade"}
        </button>
      )}
    </div>
  );
};

export default PlanCard;
