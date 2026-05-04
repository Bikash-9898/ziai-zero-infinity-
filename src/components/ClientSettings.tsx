import { useAuth } from "@/context/useAuth";

const ClientSettings = () => {

    const { user } = useAuth();

    return (
        <div>
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-xl font-bold mb-6">Settings</h2>
                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-2">
                                <div className="bg-slate-600 border border-slate-500 rounded-md w-16 h-16" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">User Profile</h3>
                                <p className="text-slate-400 text-sm">Manage your account settings</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                                <input
                                    type="text"
                                    defaultValue={user?.username}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    defaultValue={user?.email}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ClientSettings