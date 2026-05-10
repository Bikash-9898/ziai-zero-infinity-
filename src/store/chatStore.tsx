// src/store/chatStore.tsx
import { useState, useCallback, type ReactNode } from 'react';
import {
  sendMessage as apiSendMessage,
  getConversations as apiGetConversations,
  getMessages as apiGetMessages,
  deleteConversation as apiDeleteConversation,
  type ConversationItem,
  type MessageItem,
} from '../services/Api';
import { type Message, WELCOME } from './chatTypes';
import { ChatContext } from './useChatStore';
import { MODELS } from './models';

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations]               = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages]                         = useState<Message[]>([WELCOME]);
  const [loadingMessages, setLoadingMessages]           = useState(false);
  const [sending, setSending]                           = useState(false);

  // Default synced with backend AVAILABLE_MODELS
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);

  // ── Fetch conversations — no email needed, JWT carries identity ──
  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const data = await apiGetConversations();
      setConversations(data);
    } catch (e) {
      console.error('fetchConversations:', e);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadConversationMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    setActiveConversationId(convId);
    try {
      const data: MessageItem[] = await apiGetMessages(convId);
      const mapped: Message[]   = data.map((m) => ({ role: m.role, content: m.content }));
      setMessages(mapped.length ? mapped : [WELCOME]);
    } catch (e) {
      console.error('loadConversationMessages:', e);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ── Send — no user email param needed ───────────────────────
  const send = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);
    try {
      const result = await apiSendMessage({
        message:         text,
        conversation_id: activeConversationId,
        model:           selectedModel,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
      if (!activeConversationId) {
        setActiveConversationId(result.conversation_id);
        await fetchConversations();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  }, [activeConversationId, selectedModel, sending, fetchConversations]);

  const deleteConv = useCallback(async (convId: string) => {
    await apiDeleteConversation(convId);
    if (activeConversationId === convId) {
      setActiveConversationId(null);
      setMessages([WELCOME]);
    }
    await fetchConversations();
  }, [activeConversationId, fetchConversations]);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([WELCOME]);
  }, []);

  return (
    <ChatContext.Provider value={{
      conversations,
      loadingConversations,
      fetchConversations,
      activeConversationId,
      setActiveConversationId,
      messages,
      loadingMessages,
      loadConversationMessages,
      sending,
      selectedModel,
      setSelectedModel,
      send,
      deleteConv,
      startNewChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
