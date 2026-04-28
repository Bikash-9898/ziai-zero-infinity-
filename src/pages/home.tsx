import { useState } from 'react';
// import { Link } from 'react-router-dom'
import SignInModal from '../components/SignInModal';
import { GoogleOAuthProvider } from '@react-oauth/google';


const Navbar = ({ onSignInClick }: { onSignInClick: () => void }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-999 bg-[#0b0b1a]/70 backdrop-blur-xl border-b border-white/5 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-linear-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <img 
              src="https://zeroinfinitytechnologies.com/images/logo-1771865164119.webp?t=1777117488383" 
              alt="Logo" 
              className="h-8 w-8 rounded-full"
            />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-purple-400">
            Zero Infinity
          </span>
        </a>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-8">
          {['Home', 'About', 'Services', 'Contact'].map((item) => (
            <a 
              key={item} 
              href={`/${item.toLowerCase()}`} 
              className="text-sm font-medium text-purple-100 hover:text-purple-400 transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* <button className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white transition-colors">
            <Link 
              to="/signin" 
              className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </Link>
          </button> */}
          <button 
            onClick={onSignInClick}// Open Function
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-purple-50 transition-all transform hover:scale-105 active:scale-95 shadow-xl">
            Get Started
          </button>
        </div>
        {/* Mobile Toggle (Placeholder for functionality) */}
        {/* <button className="lg:hidden p-2 rounded-xl border border-purple-500/30 bg-purple-500/10">
          <div className="w-5 h-0.5 bg-purple-300 mb-1"></div>
          <div className="w-5 h-0.5 bg-purple-300 mb-1"></div>
          <div className="w-5 h-0.5 bg-purple-300"></div>
        </button> */}
      </div>
    </nav>
  );
};

export default function Dashboard() {
  // State to track if modal is open
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  return (
    <GoogleOAuthProvider clientId="201164829072-ge4gi27vgbb9jaaava23ob0kbu9nc0cb.apps.googleusercontent.com">
    <div className="min-h-screen bg-[#06060c] text-white font-sans selection:bg-purple-500/30">
      <Navbar onSignInClick={() => setIsSignInOpen(true)} />

      {/* Hero / Header Section */}
      <main className="px-6 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <header className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              System Online
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
              Welcome to ZI, <span className="text-purple-500">Creator.</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              ........
            </p>
          </header>

          {/* Stats Grid - High Visual Impact */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: "Total Revenue", value: "$24,500", grow: "+12%", color: "from-blue-600/20" },
              { label: "Active Nodes", value: "1,284", grow: "+5.4%", color: "from-purple-600/20" },
              { label: "System Health", value: "99.9%", grow: "Stable", color: "from-emerald-600/20" }
            ].map((stat, i) => (
              <div key={i} className={`relative group overflow-hidden p-8 rounded-3xl bg-linear-to-b ${stat.color} to-transparent border border-white/5 hover:border-purple-500/30 transition-all duration-500`}>
                <div className="relative z-10">
                  <p className="text-gray-400 text-sm font-medium mb-2">{stat.label}</p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold">{stat.value}</h3>
                    <span className={`text-xs font-bold mb-1.5 px-2 py-0.5 rounded-md ${stat.grow.includes('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {stat.grow}
                    </span>
                  </div>
                </div>
                {/* Decorative Background Glow */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
              </div>
            ))}
          </section>

          {/* Main Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Main Visual/Graph Area */}
            <div className="lg:col-span-8 group">
              <div className="h-full min-h-100 rounded-3xl bg-[#0f0f1a] border border-white/5 p-8 overflow-hidden relative transition-all hover:shadow-2xl hover:shadow-purple-500/5">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold">Network Performance</h3>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  </div>
                </div>
                <div className="w-full h-64 border-b border-l border-white/10 relative flex items-end justify-around px-4">
                  {/* Visual Placeholder for a Chart */}
                  {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="w-8 bg-linear-to-t from-purple-600 to-blue-400 rounded-t-lg opacity-40 hover:opacity-100 transition-opacity cursor-pointer"></div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-gray-500 text-center italic">Live data stream from global edge locations.</p>
              </div>
            </div>

            {/* Quick Controls Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-8 rounded-3xl bg-[#0f0f1a] border border-white/5">
                <h3 className="text-xl font-bold mb-6">Operations</h3>
                <div className="space-y-3">
                  <button className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 font-bold text-sm transition-all shadow-lg shadow-purple-600/20">
                    Deploy New Instance
                  </button>
                  <button className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-sm transition-all">
                    View API Logs
                  </button>
                  <button className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-sm transition-all">
                    Support Terminal
                  </button>
                </div>
              </div>

              {/* Newsletter/Alert Box */}
              <div className="p-8 rounded-3xl bg-linear-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
                <h4 className="text-lg font-bold mb-2 relative z-10">Pro Plan Available</h4>
                <p className="text-white/80 text-sm mb-6 relative z-10">Unlock dedicated GPU clusters and priority routing.</p>
                <button className="px-4 py-2 bg-black rounded-xl text-xs font-bold relative z-10">Upgrade Now</button>
                {/* Abstract circle decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* MODAL COMPONENT */}
      <SignInModal 
        isOpen={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)} 
      />

      {/* Subtle Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© 2026 Zero Infinity Technologies. All rights reserved.</p>
          <div className="flex gap-6 text-gray-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Status</a>
          </div>
        </div>
      </footer>
    </div>
    </GoogleOAuthProvider>
  );
}