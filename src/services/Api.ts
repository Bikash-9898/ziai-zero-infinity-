const BASE_URL = 'http://localhost:8000/api';

export interface SendMessageParams {
  message: string;
  conversation_id?: string | null;
  model?: string;
  user_email: string;
}

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  model: string;
  created_at: string;
}

export interface SendMessageResponse {
  conversation_id: string;
  reply: string;
  model: string;
  tokens: number;
}

// Send a message (creates or continues a conversation)
export const sendMessage = async (params: SendMessageParams): Promise<SendMessageResponse> => {
  const res = await fetch(`${BASE_URL}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Chat request failed: ${res.status}`);
  return res.json();
};

// Get all conversations for a user
export const getConversations = async (userEmail: string) => {
  const res = await fetch(`${BASE_URL}/chat/user/${encodeURIComponent(userEmail)}/conversations`);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
};

// Get all messages in a conversation
export const getMessages = async (conversationId: string) => {
  const res = await fetch(`${BASE_URL}/chat/messages/${conversationId}`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
};

// Delete a conversation
export const deleteConversation = async (conversationId: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.status}`);
};

// Google auth
export const googleAuth = async (token: string) => {
  const res = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error('Google auth failed');
  return res.json();
};
