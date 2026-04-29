import { useEffect, useState } from 'react';
import { Activity, Database, Users } from 'lucide-react';
import StatCard from "./StatCard"

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
    fetch('http://localhost:8000/api/admin/stats')
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
        value={`${(stats.total_tokens / 1000000).toFixed(1)}M`} 
        icon={<Database size={24} />} 
      />
      
      <StatCard 
        title="New Users" 
        value={`+${stats.new_users}`} 
        icon={<Users size={24} />} 
      />
    </div>
  );
}