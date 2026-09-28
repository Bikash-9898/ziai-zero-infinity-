interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-900 rounded-xl border border-slate-700 text-indigo-400 group-hover:text-indigo-300 transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-xs font-semibold text-slate-500 uppercase mt-1 tracking-widest">
        {title}
      </div>
    </div>
  );
}