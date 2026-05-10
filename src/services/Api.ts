// src/services/Api.ts
/**
 * All chat API calls.
 * user_email is NO LONGER sent in the request body — the backend
 * reads the user identity from the JWT Authorization header instead.
 */
import { apiJson } from '@/api/apiClient';

export interface ConversationItem {
  id:         string;
  title:      string;
  model:      string;
  created_at: string;
}

export interface MessageItem {
  id:         string;
  role:       'user' | 'assistant';
  content:    string;
  created_at: string;
}

export interface SendMessageParams {
  message:         string;
  conversation_id: string | null;
  model:           string;
}

export interface SendMessageResponse {
  conversation_id: string;
  reply:           string;
  model:           string;
  tokens:          number;
}

// ── Chat ──────────────────────────────────────────────────────

export async function sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
  return apiJson<SendMessageResponse>('/api/chat/send', {
    method: 'POST',
    body: JSON.stringify({
      message:         params.message,
      conversation_id: params.conversation_id,
      model:           params.model,
    }),
  });
}

// No longer needs user_email — identity comes from JWT
export async function getConversations(): Promise<ConversationItem[]> {
  return apiJson<ConversationItem[]>('/api/chat/conversations');
}

export async function getMessages(conversationId: string): Promise<MessageItem[]> {
  return apiJson<MessageItem[]>(`/api/chat/messages/${conversationId}`);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await apiJson<{ deleted: boolean }>(`/api/chat/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}
