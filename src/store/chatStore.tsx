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

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState('zephyr');

  const fetchConversations = useCallback(async (email: string) => {
    setLoadingConversations(true);
    try {
      const data = await apiGetConversations(email);
      setConversations(data);
    } catch (e) { console.error(e); }
    finally { setLoadingConversations(false); }
  }, []);

  const loadConversationMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    setActiveConversationId(convId);
    try {
      const data: MessageItem[] = await apiGetMessages(convId);
      const mapped: Message[] = data.map((m) => ({ role: m.role, content: m.content }));
      setMessages(mapped.length ? mapped : [WELCOME]);
    } catch (e) { console.error(e); }
    finally { setLoadingMessages(false); }
  }, []);

  const send = useCallback(async (text: string, userEmail: string) => {
    if (!text.trim() || sending) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);
    try {
      const result = await apiSendMessage({
        message: text,
        conversation_id: activeConversationId,
        model: selectedModel,
        user_email: userEmail,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
      if (!activeConversationId) {
        setActiveConversationId(result.conversation_id);
        await fetchConversations(userEmail);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }]);
    } finally { setSending(false); }
  }, [activeConversationId, selectedModel, sending, fetchConversations]);

  const deleteConv = useCallback(async (convId: string, userEmail: string) => {
    await apiDeleteConversation(convId);
    if (activeConversationId === convId) {
      setActiveConversationId(null);
      setMessages([WELCOME]);
    }
    await fetchConversations(userEmail);
  }, [activeConversationId, fetchConversations]);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([WELCOME]);
  }, []);

  return (
    <ChatContext.Provider value={{
      conversations, loadingConversations, fetchConversations,
      activeConversationId, setActiveConversationId,
      messages, loadingMessages, loadConversationMessages,
      sending, selectedModel, setSelectedModel,
      send, deleteConv, startNewChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
}