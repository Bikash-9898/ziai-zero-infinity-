import { useAuth } from "@/context/useAuth";

const ClientSettings = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 overflow-auto p-6 bg-[#06060c] min-h-full">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-linear-to-r from-white to-purple-400">
          Settings
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2">
              <div className="bg-linear-to-br from-purple-600 to-blue-500 rounded-md w-16 h-16" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">User Profile</h3>
              <p className="text-gray-400 text-sm">Manage your account settings</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input
                type="text"
                defaultValue={user?.username}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                defaultValue={user?.email}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
              />
            </div>
            <button className="bg-linear-to-r from-purple-600 to-blue-500 hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-opacity">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;