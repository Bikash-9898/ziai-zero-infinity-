// src/store/chatStore.tsx
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import {
  sendMessage as apiSendMessage,
  getConversations as apiGetConversations,
  getMessages as apiGetMessages,
  deleteConversation as apiDeleteConversation,
  type ConversationItem,
  type MessageItem,
} from '../services/Api';
import { type Message } from './chatTypes';
import { ChatContext } from './useChatStore';
import { MODELS } from './models';

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('zi_active_conversation_id');
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const skipNextLoadRef = useRef(false);

  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);

  // ── Fetch conversations ──
  const fetchConversations = useCallback(async (): Promise<ConversationItem[]> => {
    setLoadingConversations(true);
    try {
      const data = await apiGetConversations();
      setConversations(data);
      return data;
    } catch (e) {
      console.error('fetchConversations:', e);
      return [];
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // ── Load messages for a conversation ──
  const loadConversationMessages = useCallback(async (convId: string) => {
    if (!convId) return;
    setLoadingMessages(true);
    setActiveConversationId(convId);
    try {
      const data: MessageItem[] = await apiGetMessages(convId);
      const mapped: Message[] = data.map((m) => ({ role: m.role, content: m.content }));
      setMessages(mapped);
    } catch (e) {
      // If the conversation doesn't exist (404), clear the invalid ID
      if (e instanceof Error && e.message.includes('404')) {
        console.debug('Conversation not found, clearing ID:', convId);
        setActiveConversationId(null);
        setMessages([]);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('zi_active_conversation_id');
        }
      } else {
        console.error('loadConversationMessages:', e);
      }
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ── Send a new user message ──
  const send = useCallback(
    async (text: string, options?: { replaceUserIndex?: number }) => {
      if (!text.trim() || sending) return;

      const replaceIndex =
        typeof options?.replaceUserIndex === 'number'
          ? Math.max(0, Math.min(options.replaceUserIndex, messages.length))
          : null;

      setMessages((prev) => {
        if (replaceIndex === null) {
          return [...prev, { role: 'user', content: text }];
        }
        return [...prev.slice(0, replaceIndex), { role: 'user', content: text }];
      });

      setSending(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const result = await apiSendMessage(
          {
            message: text,
            conversation_id: activeConversationId, // ✅ fixed typo
            model: selectedModel,
          },
          { signal: controller.signal },
        );

        setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);

        // If this was a new conversation, set the new ID and skip the automatic load
        if (!activeConversationId) {
          skipNextLoadRef.current = true;
          setActiveConversationId(result.conversation_id);
          await fetchConversations(); // update sidebar list
        }
        // If existing conversation, we already have the full message list in state
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' },
        ]);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setSending(false);
      }
    },
    [activeConversationId, selectedModel, sending, messages.length, fetchConversations],
  );

  const stopCurrentResponse = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const deleteConv = useCallback(
    async (convId: string) => {
      await apiDeleteConversation(convId);
      if (activeConversationId === convId) {
        setActiveConversationId(null);
        setMessages([]);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('zi_active_conversation_id');
        }
      }
      await fetchConversations();
    },
    [activeConversationId, fetchConversations],
  );

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('zi_active_conversation_id');
    }
  }, []);

  // ── Persist active conversation ID to localStorage ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeConversationId) {
      window.localStorage.setItem('zi_active_conversation_id', activeConversationId);
    } else {
      window.localStorage.removeItem('zi_active_conversation_id');
    }
  }, [activeConversationId]);

  // ── On mount: fetch conversations and validate stored ID ──
  useEffect(() => {
    const init = async () => {
      const convs = await fetchConversations();
      const storedId = window.localStorage.getItem('zi_active_conversation_id');

      if (storedId) {
        // Clear the stored ID if we have no conversations or the ID isn't in the list
        const isValid = convs.some((c) => c.id === storedId);
        if (!isValid) {
          // Stale ID – clear it
          setActiveConversationId(null);
          setMessages([]);
          window.localStorage.removeItem('zi_active_conversation_id');
          return; // done, no load
        }

        // Valid ID – load messages (unless skip flag is set)
        if (!skipNextLoadRef.current) {
          void loadConversationMessages(storedId);
        }
      }
      // If no storedId, we do nothing – activeConversationId stays null
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only once on mount

  // ── Load messages when active conversation changes (unless we just created it) ──
  useEffect(() => {
    if (!activeConversationId) return;

    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return;
    }

    void loadConversationMessages(activeConversationId);
  }, [activeConversationId, loadConversationMessages]);

  return (
    <ChatContext.Provider
      value={{
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
        stopCurrentResponse,
        deleteConv,
        startNewChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}