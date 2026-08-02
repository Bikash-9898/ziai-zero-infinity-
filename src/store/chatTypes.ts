import type { ConversationItem } from '@/services/Api';

export interface Message {
  role:    'user' | 'assistant';
  content: string;
}

export const WELCOME: Message = {
  role: 'assistant',
  content: 'Ready when you are',
};

/** Shape of the ChatContext value – consumed by useChatStore.ts */
export interface ChatState {
  conversations:             ConversationItem[];
  loadingConversations:      boolean;
  fetchConversations:        () => Promise<ConversationItem[]>;
  activeConversationId:      string | null;
  setActiveConversationId:   (id: string | null) => void;
  messages:                  Message[];
  loadingMessages:           boolean;
  loadConversationMessages:  (convId: string) => Promise<void>;
  sending:                   boolean;
  selectedModel:             string;
  setSelectedModel:          (m: string) => void;
  send:                      (text: string, options?: { replaceUserIndex?: number }) => Promise<void>;
  stopCurrentResponse:       () => void;
  deleteConv:                (convId: string) => Promise<void>;
  startNewChat:              () => void;
}
