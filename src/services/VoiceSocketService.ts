export type VoiceSocketEvent =
  | { type: 'status'; status: string; event?: string; message?: string }
  | { type: 'pong'; status: string }
  | { type: 'error'; message: string };

export class VoiceSocketService {
  private socket: WebSocket | null = null;
  private listeners = new Set<(event: VoiceSocketEvent) => void>();
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private readonly baseUrl: string;

  constructor(baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    const wsUrl = `${this.baseUrl.replace(/^http/, 'ws')}/ws/voice/`;
    this.socket = new WebSocket(wsUrl);
    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit({ type: 'status', status: 'connected' });
    };
    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as VoiceSocketEvent;
        this.emit(payload);
      } catch {
        this.emit({ type: 'error', message: 'Invalid voice socket payload' });
      }
    };
    this.socket.onerror = () => {
      this.emit({ type: 'error', message: 'Voice socket connection failed' });
    };
    this.socket.onclose = () => {
      this.emit({ type: 'status', status: 'disconnected' });
      this.scheduleReconnect();
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendAudio(audio: ArrayBuffer | Blob) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(audio as unknown as string);
  }

  sendMessage(payload: Record<string, unknown>) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(payload));
  }

  onMessage(handler: (event: VoiceSocketEvent) => void) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  onError(handler: (message: string) => void) {
    return this.onMessage((event) => {
      if (event.type === 'error') handler(event.message);
    });
  }

  onReconnect(handler: () => void) {
    const subscription = this.onMessage((event) => {
      if (event.type === 'status' && event.status === 'connected') handler();
    });
    return subscription;
  }

  private emit(event: VoiceSocketEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * this.reconnectAttempts, 5000);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}
