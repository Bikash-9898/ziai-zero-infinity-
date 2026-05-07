// // UsageBar component for displaying usage stats in billing and dashboard pages
// import React from "react";

// interface UsageBarProps {
//   label: string;
//   used: number;
//   limit: number;
//   isUnlimited: boolean;
//   percent: number | null;
//   unit?: string;
//   icon?: React.ReactNode;
// }

// function getBarColor(pct: number | null): string {
//   if (pct === null) return "#6366f1";
//   if (pct >= 90) return "#ef4444";
//   if (pct >= 70) return "#f59e0b";
//   return "#6366f1";
// }

// function formatValue(n: number): string {
//   if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
//   if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
//   return String(n);
// }

// export default function UsageBar({
//   label,
//   used,
//   limit,
//   isUnlimited,
//   percent,
//   unit = "",
//   icon,
// }: UsageBarProps) {
//   const pct = isUnlimited ? 0 : Math.min(percent ?? 0, 100);
//   const color = getBarColor(isUnlimited ? null : percent);
//   const isWarning = !isUnlimited && (percent ?? 0) >= 70;
//   const isDanger = !isUnlimited && (percent ?? 0) >= 90;

//   return (
//     <div className="usage-bar-wrapper">
//       <div className="usage-bar-header">
//         <div className="usage-bar-label">
//           {icon && <span className="usage-icon">{icon}</span>}
//           <span>{label}</span>
//         </div>
//         <div className="usage-bar-values">
//           {isUnlimited ? (
//             <span className="unlimited-badge">Unlimited</span>
//           ) : (
//             <span className={`usage-count ${isDanger ? "danger" : isWarning ? "warning" : ""}`}>
//               {formatValue(used)}{unit} / {formatValue(limit)}{unit}
//             </span>
//           )}
//           {!isUnlimited && percent !== null && (
//             <span className="usage-pct" style={{ color }}>{Math.round(percent)}%</span>
//           )}
//         </div>
//       </div>

//       <div className="bar-track">
//         <div
//           className="bar-fill"
//           style={{
//             width: isUnlimited ? "100%" : `${pct}%`,
//             background: isUnlimited
//               ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
//               : `linear-gradient(90deg, ${color}cc, ${color})`,
//             boxShadow: isUnlimited ? `0 0 8px #6366f155` : `0 0 8px ${color}55`,
//           }}
//         />
//       </div>

//       {isDanger && !isUnlimited && (
//         <p className="usage-warning-text">⚠ Approaching limit — consider upgrading</p>
//       )}

//       <style>{`
//         .usage-bar-wrapper {
//           display: flex;
//           flex-direction: column;
//           gap: 8px;
//         }
//         .usage-bar-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }
//         .usage-bar-label {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//           font-size: 13px;
//           font-weight: 500;
//           color: #94a3b8;
//           text-transform: uppercase;
//           letter-spacing: 0.06em;
//         }
//         .usage-icon { font-size: 14px; }
//         .usage-bar-values {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//         }
//         .usage-count {
//           font-size: 13px;
//           font-family: 'JetBrains Mono', monospace;
//           color: #cbd5e1;
//         }
//         .usage-count.warning { color: #f59e0b; }
//         .usage-count.danger { color: #ef4444; }
//         .usage-pct {
//           font-size: 12px;
//           font-family: 'JetBrains Mono', monospace;
//           font-weight: 700;
//         }
//         .unlimited-badge {
//           font-size: 11px;
//           font-weight: 600;
//           padding: 2px 8px;
//           border-radius: 999px;
//           background: linear-gradient(135deg, #6366f122, #8b5cf622);
//           border: 1px solid #6366f144;
//           color: #a78bfa;
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//         }
//         .bar-track {
//           height: 6px;
//           background: #1e293b;
//           border-radius: 999px;
//           overflow: hidden;
//         }
//         .bar-fill {
//           height: 100%;
//           border-radius: 999px;
//           transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
//         }
//         .usage-warning-text {
//           font-size: 11px;
//           color: #ef4444aa;
//           margin: 0;
//         }
//       `}</style>
//     </div>
//   );
// }

// src/components/billing/UsageBar.tsx
// This component was referenced in BillingPage but not provided — created here.
// src/components/billing/UsageBar.tsx

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  isUnlimited: boolean;
  percent: number | null;
  icon: string;
}

export default function UsageBar({
  label,
  used,
  limit,
  isUnlimited,
  percent,
  icon,
}: UsageBarProps) {
  const pct        = isUnlimited || percent === null ? null : Math.min(percent, 100);
  const isWarning  = pct !== null && pct >= 80;
  const isCritical = pct !== null && pct >= 95;

  const barColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#6366f1";

  function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Label row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: barColor }}>{icon}</span>
          <span className="text-[13px] text-slate-400 font-semibold">{label}</span>
        </div>
        <span className="text-xs font-mono text-slate-500">
          {isUnlimited ? (
            <span className="font-bold" style={{ color: barColor }}>Unlimited</span>
          ) : (
            `${fmt(used)} / ${fmt(limit)}`
          )}
          {!isUnlimited && pct !== null && (
            <span className="ml-1.5 font-bold" style={{ color: barColor }}>
              {pct.toFixed(0)}%
            </span>
          )}
        </span>
      </div>

      {/* Bar track */}
      {!isUnlimited && (
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-600 ease-in-out"
            style={{
              width: `${pct ?? 0}%`,
              background: isCritical
                ? "linear-gradient(90deg, #ef4444, #dc2626)"
                : isWarning
                  ? "linear-gradient(90deg, #f59e0b, #d97706)"
                  : "linear-gradient(90deg, #6366f1, #8b5cf6)",
            }}
          />
        </div>
      )}

      {/* Unlimited shimmer bar */}
      {isUnlimited && (
        <>
          <div
            className="h-1.5 rounded-full bg-size-[200%_100%] animate-[usage-shimmer_2s_linear_infinite]"
            style={{ background: `linear-gradient(90deg, ${barColor}44, ${barColor}88, ${barColor}44)` }}
          />
          <style>{`
            @keyframes usage-shimmer {
              0%   { background-position: 200% center; }
              100% { background-position: -200% center; }
            }
          `}</style>
        </>
      )}

    </div>
  );
}