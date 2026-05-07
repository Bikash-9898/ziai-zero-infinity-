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
  const pct         = isUnlimited || percent === null ? null : Math.min(percent, 100);
  const isWarning   = pct !== null && pct >= 80;
  const isCritical  = pct !== null && pct >= 95;

  const barColor = isCritical
    ? "#ef4444"
    : isWarning
      ? "#f59e0b"
      : "#6366f1";

  function fmt(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Label row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: barColor, fontSize: 14 }}>{icon}</span>
          <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{label}</span>
        </div>
        <span style={{ fontSize: 12, fontFamily: "monospace", color: "#64748b" }}>
          {isUnlimited
            ? <span style={{ color: barColor, fontWeight: 700 }}>Unlimited</span>
            : `${fmt(used)} / ${fmt(limit)}`
          }
          {!isUnlimited && pct !== null && (
            <span style={{
              marginLeft: 6,
              color:      barColor,
              fontWeight: 700,
            }}>
              {pct.toFixed(0)}%
            </span>
          )}
        </span>
      </div>

      {/* Bar track */}
      {!isUnlimited && (
        <div style={{
          height:       6,
          background:   "#1e293b",
          borderRadius: 999,
          overflow:     "hidden",
        }}>
          <div style={{
            height:       "100%",
            width:        `${pct ?? 0}%`,
            background:   isCritical
              ? "linear-gradient(90deg, #ef4444, #dc2626)"
              : isWarning
                ? "linear-gradient(90deg, #f59e0b, #d97706)"
                : "linear-gradient(90deg, #6366f1, #8b5cf6)",
            borderRadius: 999,
            transition:   "width 0.6s ease",
          }} />
        </div>
      )}

      {/* Unlimited shimmer bar */}
      {isUnlimited && (
        <div style={{
          height:     6,
          background: `linear-gradient(90deg, ${barColor}44, ${barColor}88, ${barColor}44)`,
          borderRadius: 999,
          backgroundSize: "200% 100%",
          animation:  "usage-shimmer 2s linear infinite",
        }} />
      )}

      <style>{`
        @keyframes usage-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}