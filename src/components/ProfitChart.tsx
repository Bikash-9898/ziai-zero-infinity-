// src/components/ProfitChart.tsx
import { useEffect, useState } from 'react';
import { BASE_URL, ADMIN_SECRET_KEY } from '@/config';
import type { ProfitAnalyticsResponse, ProfitAnalyticsPoint } from '@/types/types';

function fmtNpr(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

function buildLinePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export default function ProfitChart({ days = 30 }: { days?: number }) {
  const [result, setResult]   = useState<ProfitAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/admin/analytics/profit?days=${days}`, {
      headers: { 'X-Admin-Key': ADMIN_SECRET_KEY },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setResult)
      .catch(() => setError('Failed to load profit analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="h-56 rounded-2xl bg-slate-800/40 animate-pulse" />;
  if (error || !result) {
    return (
      <div className="text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
        {error ?? 'No data available'}
      </div>
    );
  }

  const data: ProfitAnalyticsPoint[] = result.daily;

  if (data.length === 0) {
    return (
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl px-6 py-10 text-center text-slate-600 text-sm">
        No revenue or cost recorded yet. Charts will populate once payments and AI requests start coming in.
      </div>
    );
  }

  const width  = 700;
  const height = 220;
  const padL   = 46;
  const padB   = 24;
  const chartW = width - padL - 10;
  const chartH = height - padB - 14;

  const allValues = data.flatMap(d => [d.revenue_npr, d.cost_npr, d.profit_npr]);
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range  = maxVal - minVal || 1;

  const xFor = (i: number) => padL + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const yFor = (v: number) => 10 + chartH - ((v - minVal) / range) * chartH;
  const zeroY = yFor(0);

  const revenuePoints = data.map((d, i) => ({ x: xFor(i), y: yFor(d.revenue_npr) }));
  const costPoints    = data.map((d, i) => ({ x: xFor(i), y: yFor(d.cost_npr) }));
  const profitPoints  = data.map((d, i) => ({ x: xFor(i), y: yFor(d.profit_npr) }));

  return (
    <div className="bg-[#0d1224] border border-slate-800 rounded-2xl px-6 py-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0">
          Revenue vs Cost vs Profit — Last {days} Days
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 mt-3">
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wide m-0">Revenue</p>
          <p className="text-lg font-bold text-cyan-400 m-0">NPR {fmtNpr(result.total_revenue_npr)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wide m-0">Cost</p>
          <p className="text-lg font-bold text-rose-400 m-0">NPR {fmtNpr(result.total_cost_npr)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wide m-0">Profit</p>
          <p className={`text-lg font-bold m-0 ${result.total_profit_npr >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
            NPR {fmtNpr(result.total_profit_npr)}
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Revenue, cost and profit line chart">
        {/* gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = 10 + chartH - t * chartH;
          const val = minVal + t * range;
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={width - 10} y2={y} stroke="#1e293b" strokeWidth={1} />
              <text x={padL - 8} y={y + 3} textAnchor="end" fontSize={9} fill="#475569">
                {fmtNpr(val)}
              </text>
            </g>
          );
        })}

        {/* zero line, emphasized */}
        <line x1={padL} y1={zeroY} x2={width - 10} y2={zeroY} stroke="#334155" strokeWidth={1.5} />

        {/* lines */}
        <path d={buildLinePath(costPoints)}    fill="none" stroke="#fb7185" strokeWidth={2} />
        <path d={buildLinePath(revenuePoints)} fill="none" stroke="#22d3ee" strokeWidth={2} />
        <path d={buildLinePath(profitPoints)}  fill="none" stroke="#34d399" strokeWidth={2.5} />

        {/* x labels */}
        {data.map((d, i) => {
          if (data.length > 10 && i % Math.ceil(data.length / 6) !== 0) return null;
          const label = new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          return (
            <text key={d.date} x={xFor(i)} y={height - 6} textAnchor="middle" fontSize={9} fill="#475569">
              {label}
            </text>
          );
        })}
      </svg>

      <div className="flex items-center gap-5 mt-2">
        <Legend color="#22d3ee" label="Revenue" />
        <Legend color="#fb7185" label="Cost" />
        <Legend color="#34d399" label="Profit" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}
