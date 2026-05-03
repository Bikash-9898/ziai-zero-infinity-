// src/store/chatTypes.ts
import type { ConversationItem } from '@/services/Api';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatState {
  conversations: ConversationItem[];
  loadingConversations: boolean;
  fetchConversations: (email: string) => Promise<void>;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  messages: Message[];
  loadingMessages: boolean;
  loadConversationMessages: (convId: string) => Promise<void>;
  sending: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  send: (text: string, userEmail: string) => Promise<void>;
  deleteConv: (convId: string, userEmail: string) => Promise<void>;
  startNewChat: () => void;
}

export const WELCOME: Message = {
  role: 'assistant',
  content: "Welcome to **ZeroInfinity AI**. I'm **K**, your intelligent assistant. How can I help you today?",
};

// export const ChatContext = import('react').then(() => null) as any;