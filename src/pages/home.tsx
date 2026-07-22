import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, LogOut, User, MessageSquare } from 'lucide-react';
import SignInModal from '@/components/SignInModal';
import { useAuth } from '@/context/useAuth';

const Navbar = ({ onSignInClick }: { onSignInClick: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navitems = [
    { name: 'Home', path : '/' },
    { name: 'Chat', path: '/client/chat'},
    { name: 'Services', path: '/services'},
    { name: 'Contact', path: '/contact' }
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-100 bg-[#06060c]/80 backdrop-blur-md border-b border-white/5 px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Logo */}
        <a href="/" className="flex min-w-0 items-center gap-2.5 group">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-linear-to-br from-purple-600 to-blue-500 flex shrink-0 items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)] group-hover:shadow-[0_0_25px_rgba(147,51,234,0.5)] transition-all">
            <img
              src="/images/logo/logo.png"
              alt="Logo"
              className="h-6 w-6 rounded-md object-contain"
            />
          </div>
          <span className="truncate text-base sm:text-lg font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white via-white to-purple-400">
            Zero Infinity
          </span>
        </a>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          {navitems.map((item) => (
            <a
              key={item.name}
              href={item.path}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {user ? (
            <div 
              onClick={() => navigate('/client')} 
              className="cursor-pointer flex max-w-[46vw] items-center gap-1.5 bg-white/5 border border-white/10 pl-1.5 pr-1 py-1 rounded-full sm:max-w-none sm:gap-2">
              <div className="flex items-center gap-2 px-2">
                <div className="w-6 h-6 shrink-0 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <User size={14} className="text-purple-400" />
                </div>
                <span className="truncate text-xs font-medium text-gray-200 sm:text-sm">{user.username}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-full transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="px-2.5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors sm:px-3"
            >
              Sign In
            </button>
          )}
          <button className="hidden sm:block px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-0.5 active:scale-95">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default function Dashboard() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const navigate = useNavigate();

  const handleChatSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = chatPrompt.trim();
    if (!trimmedPrompt) return;
    // No sign-in required — GuestGate on /client/chat auto-provisions a
    // guest session (small trial, admin-restricted model) if needed.
    sessionStorage.setItem('zi_pending_prompt', trimmedPrompt);
    setChatPrompt('');
    navigate('/client/chat');
  };

  return (
    <div className="relative min-h-screen bg-[#06060c] text-white font-sans selection:bg-purple-500/30 overflow-hidden">
      {/* Premium Background Auras */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <Navbar onSignInClick={() => setIsSignInOpen(true)} />

      <main className="relative z-10 min-h-screen px-4 pt-24 pb-10 flex flex-col items-center justify-center sm:px-6 lg:pt-20">
        <div className="w-full max-w-3xl mx-auto text-center space-y-6 sm:space-y-7">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-[11px] font-medium animate-fade-in sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Next Gen AI Infrastructure
          </div>

          <header>
            <h1 className="mb-4 text-[clamp(2.6rem,12vw,5.75rem)] font-black tracking-tight leading-[1.02] sm:mb-5">
              Create Smarter<br />
              <span className="bg-clip-text text-transparent bg-linear-to-b from-purple-400 to-purple-700">
                with Zero Infinity.
              </span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-lg mx-auto font-light leading-relaxed">
              Empower your workflow with Zero Infinity's suite of ultra-intelligent tools.
            </p>
          </header>

          <form onSubmit={handleChatSubmit} className="max-w-xl mx-auto w-full pt-1 sm:pt-2">
            <div className="group">
              <div className="relative flex items-center bg-[#0b0b1a]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl transition-all group-focus-within:border-white/20 sm:p-1.5">
                <div className="pl-3 text-gray-500 sm:pl-4">
                  <MessageSquare size={18} />
                </div>
                <input
                  type="text"
                  value={chatPrompt}
                  onChange={(event) => setChatPrompt(event.target.value)}
                  placeholder="Describe your next big idea..."
                  className="w-full min-w-0 bg-transparent py-3 px-3 text-sm text-white placeholder:text-gray-600 outline-none sm:px-4 sm:text-base"
                />
                <button
                  type="submit"
                  disabled={!chatPrompt.trim()}
                  className="p-3 rounded-xl bg-linear-to-br from-white to-gray-200 text-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale shadow-lg shadow-white/5 sm:p-3.5"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 sm:mt-5">
              {['Analyze Market', 'Generate UI', 'Write Logic'].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setChatPrompt(hint)}
                  className="px-2.5 py-1 text-[10px] font-medium uppercase text-gray-500 border border-white/5 rounded-md hover:border-purple-500/50 hover:text-purple-400 transition-all sm:text-[11px]"
                >
                  {hint}
                </button>
              ))}
            </div>
          </form>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 bg-[#06060c]/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <p className="text-gray-500 text-xs font-medium tracking-widest uppercase">Systems Operational</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-gray-500 text-xs font-medium sm:text-sm">
            <a href="#" className="hover:text-purple-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Privacy & Policy</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
          </div>
        </div>
      </footer>

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </div>
  );
}
