// src/store/chatTypes.ts
import type { ConversationItem } from '@/services/Api';

export interface Message {
  role:    'user' | 'assistant';
  content: string;
}

export interface ChatState {
  conversations:           ConversationItem[];
  loadingConversations:    boolean;
  // No longer takes email — JWT handles identity
  fetchConversations:      () => Promise<void>;
  activeConversationId:    string | null;
  setActiveConversationId: (id: string | null) => void;
  messages:                Message[];
  loadingMessages:         boolean;
  loadConversationMessages:(convId: string) => Promise<void>;
  sending:                 boolean;
  selectedModel:           string;
  setSelectedModel:        (model: string) => void;
  // No longer takes userEmail
  send:                    (text: string) => Promise<void>;
  deleteConv:              (convId: string) => Promise<void>;
  startNewChat:            () => void;
}

export const WELCOME: Message = {
  role:    'assistant',
  content: "Welcome to **ZeroInfinity AI**. I'm **K**, your intelligent assistant. How can I help you today?",
};
