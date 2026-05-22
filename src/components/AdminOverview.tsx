import { useEffect, useState } from 'react';
import { Activity, Database, Users } from 'lucide-react';
import StatCard from "./StatCard"
import { ADMIN_SECRET_KEY, BASE_URL } from '@/config';

interface Stats {
  active_requests: number;
  total_tokens: number;
  new_users: number;
  quota_used: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/admin/stats`, {
      headers: { 'X-Admin-Key': ADMIN_SECRET_KEY },
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch admin stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="bg-indigo- text-slate-500 animate-pulse">Loading Statistics...</div>;
  if (!stats) return <div className="text-red-400">Failed to load dashboard data.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard 
        title="Active Requests" 
        value={stats.active_requests.toLocaleString()} 
        icon={<Activity size={24} />} 
      />
      
      <StatCard 
        title="Total Tokens" 
        // value={`${(stats.total_tokens / 1000000).toFixed(1)}M`} 
        value={formatTokens(stats.total_tokens)}   // smart unit
        icon={<Database size={24} />} 
      />
      
      <StatCard 
        title="New Users" 
        value={`+${stats.new_cmsusers}`} 
        icon={<Users size={24} />} 
      />
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}