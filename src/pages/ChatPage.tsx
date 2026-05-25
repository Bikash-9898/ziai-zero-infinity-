// src/pages/ChatPage.tsx
import { useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/context/useAuth';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import ModelSelector from '@/components/ModelSelector';

export default function ChatPage() {
  const { user }          = useAuth();
  const { send, sending } = useChatStore();

  // Fire any prompt stored before redirect (e.g. from landing page CTA)
  useEffect(() => {
    const pendingPrompt = sessionStorage.getItem('zi_pending_prompt');
    if (!pendingPrompt || !user?.email || sending) return;
    sessionStorage.removeItem('zi_pending_prompt');
    void send(pendingPrompt);
  }, [send, sending, user?.email]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Model selector bar — centred, minimal */}
      <div className="flex items-center justify-center py-2 border-b border-white/5 shrink-0">
        <ModelSelector />
      </div>

      {/* Messages — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-purple-500/30
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/60">
        <ChatWindow />
      </div>

      {/* Auto-resize input */}
      <MessageInput />
    </div>
  );
}
