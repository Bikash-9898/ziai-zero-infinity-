// import React from 'react';
import type { User } from '../types';

// interface UserTableProps {
//   users: User[];
// }

// const UserTable: React.FC<UserTableProps> = ({ users }) => {
//   return (
//     <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full text-left border-collapse min-w-[600px]">
//           <thead>
//             <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest">
//               <th className="p-5 font-semibold">User</th>
//               <th className="p-5 font-semibold">Plan</th>
//               <th className="p-5 font-semibold">Created At</th>
//               <th className="p-5 font-semibold">Token Usage</th>
//               <th className="p-5 font-semibold">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-700/50">
//             {users.map((user) => (
//               <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
//                 <td className="p-5">
//                   <div className="font-medium text-slate-200">{user.username}</div>
//                   <div className="text-xs text-slate-500">{user.email}</div>
//                 </td>
//                 <td className="p-5">
//                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
//                     user.plan === 'Premium' 
//                       ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
//                       : 'bg-slate-700 text-slate-300'
//                   }`}>
//                     {user.plan}
//                   </span>
//                 </td>
//                 <td className="p-5">
//                   <div className="text-sm text-slate-400">{user.createdAt}</div>
//                 </td>
//                 <td className="p-5">
//                   <div className="w-32 h-1.5 bg-slate-700/50 rounded-full mb-1.5">
//                     <div 
//                       className="h-full bg-indigo-500 rounded-full" 
//                       style={{ width: `${(user.tokenUsed / user.tokenLimit) * 100}%` }}
//                     />
//                   </div>
//                   <div className="text-[10px] text-slate-500 font-mono">
//                     {user.tokenUsed.toLocaleString()} / {user.tokenLimit.toLocaleString()}
//                   </div>
//                 </td>
//                 <td className="p-5">
//                   <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
//                     Manage
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

const UserTable = ({ users }: { users: User[] }) => {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-150">
          <thead>
            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest">
              <th className="p-5 font-semibold">User</th>
              <th className="p-5 font-semibold">Plan</th>
              <th className="p-5 font-semibold">Status</th>
              <th className="p-5 font-semibold">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                {/* USER COLUMN */}
                <td className="p-5">
                  <div className="font-medium text-slate-200">{user.username}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>

                {/* PLAN COLUMN */}
                <td className="p-5">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    user.plan.toLowerCase() === 'premium' 
                      ? 'bg-amber-500/10 text-amber-500' 
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {user.plan}
                  </span>
                </td>

                {/* ACTIVE STATUS COLUMN */}
                <td className="p-5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-slate-300">
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>

                {/* DATE COLUMN */}
                <td className="p-5 text-sm text-slate-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default UserTable;

