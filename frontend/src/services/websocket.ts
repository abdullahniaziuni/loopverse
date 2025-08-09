import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_CONFIG } from '../config';

export interface WebSocketMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  type: 'text' | 'file' | 'image';
  timestamp: Date;
}

export interface NotificationData {
  id: string;
  type: 'booking_request' | 'booking_response' | 'session_update' | 'general';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
}

export interface SessionUpdate {
  sessionId: string;
  status: 'pending' | 'confirmed' | 'started' | 'completed' | 'cancelled';
  timestamp: Date;
}

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS;
  private reconnectDelay = WEBSOCKET_CONFIG.RECONNECT_DELAY;

  // Event listeners
  private messageListeners: ((message: WebSocketMessage) => void)[] = [];
  private notificationListeners: ((notification: NotificationData) => void)[] = [];
  private sessionUpdateListeners: ((update: SessionUpdate) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];

  connect(token: string): void {
    this.token = token;
    
    if (this.socket?.connected) {
      return;
    }

    const wsUrl = WEBSOCKET_CONFIG.URL.replace('http', 'ws');
    
    this.socket = io(wsUrl, {
      auth: {
        token: this.token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      this.notifyConnectionListeners(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('💥 WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🚫 Max reconnection attempts reached');
      }
    });

    // Message events
    this.socket.on('new_message', (data: WebSocketMessage) => {
      console.log('📨 New message received:', data);
      this.notifyMessageListeners(data);
    });

    // Notification events
    this.socket.on('notification', (data: NotificationData) => {
      console.log('🔔 Notification received:', data);
      this.notifyNotificationListeners(data);
    });

    this.socket.on('booking_request', (data: any) => {
      console.log('📅 Booking request received:', data);
      const notification: NotificationData = {
        id: Date.now().toString(),
        type: 'booking_request',
        title: 'New Booking Request',
        message: 'You have a new session booking request',
        data: data.data,
        timestamp: new Date(data.timestamp),
      };
      this.notifyNotificationListeners(notification);
    });

    this.socket.on('booking_response', (data: any) => {
      console.log('📋 Booking response received:', data);
      const notification: NotificationData = {
        id: Date.now().toString(),
        type: 'booking_response',
        title: 'Booking Response',
        message: 'Your booking request has been responded to',
        data: data.data,
        timestamp: new Date(data.timestamp),
      };
      this.notifyNotificationListeners(notification);
    });

    // Session events
    this.socket.on('session_update', (data: SessionUpdate) => {
      console.log('🎯 Session update received:', data);
      this.notifySessionUpdateListeners(data);
    });

    this.socket.on('session_status_changed', (data: SessionUpdate) => {
      console.log('🔄 Session status changed:', data);
      this.notifySessionUpdateListeners(data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data: { userId: string; userName: string }) => {
      console.log('⌨️ User typing:', data);
      // Handle typing indicator
    });

    this.socket.on('user_stopped_typing', (data: { userId: string }) => {
      console.log('⏹️ User stopped typing:', data);
      // Handle stop typing indicator
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.notifyConnectionListeners(false);
  }

  // Session management
  joinSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_session', sessionId);
      console.log(`🎯 Joined session: ${sessionId}`);
    }
  }

  leaveSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_session', sessionId);
      console.log(`🚪 Left session: ${sessionId}`);
    }
  }

  // Messaging
  sendMessage(sessionId: string, message: string, senderName: string, type: 'text' | 'file' | 'image' = 'text'): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        sessionId,
        message,
        senderName,
        type,
      });
      console.log(`📤 Message sent to session ${sessionId}:`, message);
    }
  }

  // Typing indicators
  startTyping(sessionId: string, userName: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { sessionId, userName });
    }
  }

  stopTyping(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { sessionId });
    }
  }

  // Session status updates
  updateSessionStatus(sessionId: string, status: string): void {
    if (this.socket?.connected) {
      this.socket.emit('session_status_update', { sessionId, status });
    }
  }

  // Event listener management
  onMessage(callback: (message: WebSocketMessage) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  onNotification(callback: (notification: NotificationData) => void): () => void {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(cb => cb !== callback);
    };
  }

  onSessionUpdate(callback: (update: SessionUpdate) => void): () => void {
    this.sessionUpdateListeners.push(callback);
    return () => {
      this.sessionUpdateListeners = this.sessionUpdateListeners.filter(cb => cb !== callback);
    };
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
    };
  }

  // Private notification methods
  private notifyMessageListeners(message: WebSocketMessage): void {
    this.messageListeners.forEach(callback => callback(message));
  }

  private notifyNotificationListeners(notification: NotificationData): void {
    this.notificationListeners.forEach(callback => callback(notification));
  }

  private notifySessionUpdateListeners(update: SessionUpdate): void {
    this.sessionUpdateListeners.forEach(callback => callback(update));
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(callback => callback(connected));
  }

  // Getters
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get connectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }
}

// Create and export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
