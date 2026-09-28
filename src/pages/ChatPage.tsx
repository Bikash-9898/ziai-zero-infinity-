// src/pages/ChatPage.tsx
import { useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuth } from '@/context/useAuth';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';

export default function ChatPage() {
  const { user } = useAuth();
  const { send, sending, messages } = useChatStore();

  useEffect(() => {
    const pendingPrompt = sessionStorage.getItem('zi_pending_prompt');
    if (!pendingPrompt || !user?.email || sending) return;
    sessionStorage.removeItem('zi_pending_prompt');
    void send(pendingPrompt);
  }, [send, sending, user?.email]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(ellipse_at_50%_115%,rgba(112,91,255,0.2),transparent_58%),#030308]">
      <div className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-purple-500/30
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/60">
        <ChatWindow />
      </div>
      {(messages.length > 0 || sending) && <MessageInput />}
    </div>
  );
}
