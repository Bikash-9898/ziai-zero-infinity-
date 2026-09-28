// src/pages/home.tsx
/**
 * Landing page (route: /).
 *
 * Chrome (navbar, background auras, footer) now comes from the shared
 * SiteNavbar / SiteShell components so the /services and /contact pages match
 * exactly. The hero and its prompt box are still page-specific.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, MessageSquare } from 'lucide-react';
import SiteNavbar from '@/components/SiteNavbar';
import SiteShell from '@/components/SiteShell';
import SignInModal from '@/components/SignInModal';
import { useAuth } from '@/context/useAuth';

export default function Home() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChatSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = chatPrompt.trim();
    if (!trimmedPrompt) return;
    if (!user) {
      setIsSignInOpen(true);
      return;
    }
    sessionStorage.setItem('zi_pending_prompt', trimmedPrompt);
    setChatPrompt('');
    navigate('/client/chat');
  };

  return (
    <div>
      <SiteNavbar onSignInClick={() => setIsSignInOpen(true)} accent="violet" />

      <SiteShell theme="violet">
        <div className="w-full max-w-3xl mx-auto text-center space-y-6 sm:space-y-7">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#9b8cff]/25 bg-[#9b8cff]/5 text-[#c1b8ff] text-[11px] font-medium animate-fade-in sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-400"></span>
            </span>
            Next Gen AI Infrastructure
          </div>

          <header>
            <h1 className="mb-4 text-[clamp(2.6rem,12vw,5.75rem)] font-black tracking-tight leading-[1.02] sm:mb-5">
              Create Smarter<br />
              <span className="bg-clip-text text-transparent bg-linear-to-b from-[#c6beff] to-[#7764ff]">
                with Zero Infinity.
              </span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-lg mx-auto font-light leading-relaxed">
              Empower your workflow with Zero Infinity's suite of ultra-intelligent tools.
            </p>
          </header>

          <form onSubmit={handleChatSubmit} className="max-w-xl mx-auto w-full pt-1 sm:pt-2">
            <div className="group">
              <div className="relative flex items-center bg-[#100d20]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl transition-all group-focus-within:border-[#9b8cff]/50 sm:p-1.5">
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
                  className="p-3 rounded-xl bg-linear-to-br from-[#a99cff] to-[#6550ed] text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale shadow-lg shadow-[#7764ff]/30 sm:p-3.5"
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
                  className="px-2.5 py-1 text-[10px] font-medium uppercase text-gray-500 border border-white/5 rounded-md hover:border-[#9b8cff]/60 hover:text-[#c1b8ff] transition-all sm:text-[11px]"
                >
                  {hint}
                </button>
              ))}
            </div>
          </form>
        </div>
      </SiteShell>

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </div>
  );
}
