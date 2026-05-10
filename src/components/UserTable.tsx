// src/components/UserTable.tsx
import type { User } from '@/types/types';

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  free:       { bg: 'rgba(100,116,139,0.1)', text: '#64748b' },
  basic:      { bg: 'rgba(6,182,212,0.1)',   text: '#06b6d4' },
  pro:        { bg: 'rgba(99,102,241,0.1)',  text: '#6366f1' },
  enterprise: { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b' },
};

const UserTable = ({ users }: { users: User[] }) => {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest">
              <th className="p-5 font-semibold">User</th>
              <th className="p-5 font-semibold">Plan</th>
              <th className="p-5 font-semibold">Status</th>
              <th className="p-5 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {users.map((user) => {
              const planStyle = PLAN_COLORS[user.plan?.toLowerCase()] ?? PLAN_COLORS.free;
              return (
                <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="p-5">
                    <div className="font-medium text-slate-200">{user.username}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>

                  <td className="p-5">
                    <span
                      className="px-2 py-1 rounded text-[10px] font-bold uppercase"
                      style={{ background: planStyle.bg, color: planStyle.text }}
                    >
                      {user.plan}
                    </span>
                  </td>

                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-slate-300">
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>

                  <td className="p-5 text-sm text-slate-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
