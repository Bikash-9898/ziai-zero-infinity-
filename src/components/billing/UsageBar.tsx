
import React from "react";

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  percent: number;
  unit?: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getBarColor(percent: number): string {
  if (percent >= 100) return "bg-red-500";
  if (percent >= 80) return "bg-amber-400";
  return "bg-emerald-400";
}

function getTextColor(percent: number): string {
  if (percent >= 100) return "text-red-400";
  if (percent >= 80) return "text-amber-400";
  return "text-emerald-400";
}

const UsageBar: React.FC<UsageBarProps> = ({
  label,
  used,
  limit,
  percent,
  unit = "",
}) => {
  const barColor = getBarColor(percent);
  const textColor = getTextColor(percent);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300 font-medium tracking-wide uppercase text-xs">
          {label}
        </span>
        <span className={`font-mono font-semibold ${textColor}`}>
          {formatNumber(used)}
          {unit} / {formatNumber(limit)}
          {unit}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-2 bg-slate-700/60 rounded-full overflow-hidden">
        {/* Glow layer */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full blur-sm opacity-60 transition-all duration-700 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
        {/* Solid bar */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{percent.toFixed(1)}% used</span>
        {percent >= 80 && percent < 100 && (
          <span className="text-amber-400">Nearing limit</span>
        )}
        {percent >= 100 && (
          <span className="text-red-400 font-semibold">Limit reached</span>
        )}
      </div>
    </div>
  );
};

export default UsageBar;
