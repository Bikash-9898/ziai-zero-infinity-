// src/components/TokenUsageChart.tsx
import { useEffect, useState } from 'react';
import { BASE_URL, ADMIN_SECRET_KEY } from '@/config';
import type { TokenAnalyticsResponse, TokenAnalyticsPoint } from '@/types/types';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export default function TokenUsageChart({ days = 30 }: { days?: number }) {
  const [data, setData]       = useState<TokenAnalyticsPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/admin/analytics/tokens?days=${days}`, {
      headers: { 'X-Admin-Key': ADMIN_SECRET_KEY },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((res: TokenAnalyticsResponse) => setData(res.daily))
      .catch(() => setError('Failed to load token analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return <div className="h-40 rounded-xl bg-slate-800/40 animate-pulse" />;
  }
  if (error || !data) {
    return (
      <div className="text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
        {error ?? 'No data available'}
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl px-6 py-10 text-center text-slate-600 text-sm">
        No token usage recorded yet.
      </div>
    );
  }

  const width  = 700;
  const height = 180;
  const padL   = 40;
  const padB   = 24;
  const chartW = width - padL - 10;
  const chartH = height - padB - 10;

  const maxTokens = Math.max(...data.map(d => d.tokens), 1);
  const barGap    = 4;
  const barWidth  = Math.max((chartW / data.length) - barGap, 2);

  return (
    <div className="bg-[#0d1224] border border-slate-800 rounded-2xl px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0">
          Token Usage — Last {days} Days
        </p>
        <p className="text-[11px] text-slate-600 m-0">
          Peak day: {formatTokens(maxTokens)} tokens
        </p>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Daily token usage bar chart">
        {/* Y-axis gridlines */}
        {[0, 0.5, 1].map((t) => {
          const y = 10 + chartH - t * chartH;
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={width - 10} y2={y} stroke="#1e293b" strokeWidth={1} />
              <text x={padL - 8} y={y + 3} textAnchor="end" fontSize={9} fill="#475569">
                {formatTokens(Math.round(maxTokens * t))}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = maxTokens > 0 ? (d.tokens / maxTokens) * chartH : 0;
          const x = padL + i * (chartW / data.length);
          const y = 10 + chartH - barH;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={2}
                fill="#6366f1"
                fillOpacity={0.85}
              >
                <title>{`${d.date}: ${d.tokens.toLocaleString()} tokens, ${d.requests} requests`}</title>
              </rect>
            </g>
          );
        })}

        {/* X-axis labels (sparse) */}
        {data.map((d, i) => {
          if (data.length > 10 && i % Math.ceil(data.length / 6) !== 0) return null;
          const x = padL + i * (chartW / data.length) + barWidth / 2;
          const label = new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          return (
            <text key={d.date} x={x} y={height - 6} textAnchor="middle" fontSize={9} fill="#475569">
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
