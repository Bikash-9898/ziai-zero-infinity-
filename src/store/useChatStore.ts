// src/store/useChatStore.ts
import { createContext, useContext } from 'react';
// import { ChatContext } from './chatStore';
import type { ChatState } from './chatTypes';

export const ChatContext = createContext<ChatState | null>(null);

export function useChatStore(): ChatState {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatStore must be used inside ChatProvider');
  return ctx;
}