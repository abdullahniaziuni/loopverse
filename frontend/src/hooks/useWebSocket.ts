import { useEffect, useState, useCallback } from 'react';
import { webSocketService, WebSocketMessage, NotificationData, SessionUpdate } from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';

// Hook for WebSocket connection management
export function useWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        webSocketService.connect(token);
      }
    }

    // Listen for connection changes
    const unsubscribe = webSocketService.onConnectionChange((connected) => {
      setIsConnected(connected);
      setConnectionState(webSocketService.connectionState);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionState,
    connect: (token: string) => webSocketService.connect(token),
    disconnect: () => webSocketService.disconnect(),
  };
}

// Hook for session-specific WebSocket functionality
export function useSessionWebSocket(sessionId: string | null) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isTyping, setIsTyping] = useState<{ [userId: string]: string }>({});

  useEffect(() => {
    if (!sessionId) return;

    // Join session room
    webSocketService.joinSession(sessionId);

    // Listen for messages
    const unsubscribeMessages = webSocketService.onMessage((message) => {
      if (message.sessionId === sessionId) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      unsubscribeMessages();
      webSocketService.leaveSession(sessionId);
    };
  }, [sessionId]);

  const sendMessage = useCallback((message: string, senderName: string, type: 'text' | 'file' | 'image' = 'text') => {
    if (sessionId) {
      webSocketService.sendMessage(sessionId, message, senderName, type);
    }
  }, [sessionId]);

  const startTyping = useCallback((userName: string) => {
    if (sessionId) {
      webSocketService.startTyping(sessionId, userName);
    }
  }, [sessionId]);

  const stopTyping = useCallback(() => {
    if (sessionId) {
      webSocketService.stopTyping(sessionId);
    }
  }, [sessionId]);

  const updateSessionStatus = useCallback((status: string) => {
    if (sessionId) {
      webSocketService.updateSessionStatus(sessionId, status);
    }
  }, [sessionId]);

  return {
    messages,
    isTyping,
    sendMessage,
    startTyping,
    stopTyping,
    updateSessionStatus,
    setMessages, // For manual message management
  };
}

// Hook for real-time notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = webSocketService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true } 
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

// Hook for session status updates
export function useSessionUpdates() {
  const [sessionUpdates, setSessionUpdates] = useState<SessionUpdate[]>([]);

  useEffect(() => {
    const unsubscribe = webSocketService.onSessionUpdate((update) => {
      setSessionUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
    });

    return unsubscribe;
  }, []);

  const getSessionStatus = useCallback((sessionId: string) => {
    const latestUpdate = sessionUpdates.find(update => update.sessionId === sessionId);
    return latestUpdate?.status || 'unknown';
  }, [sessionUpdates]);

  return {
    sessionUpdates,
    getSessionStatus,
  };
}

// Hook for real-time data with WebSocket fallback
export function useRealTimeData<T>(
  endpoint: string,
  initialData: T | null = null,
  pollInterval?: number
) {
  const [data, setData] = useState<T | null>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Listen for connection changes
    const unsubscribe = webSocketService.onConnectionChange((connected) => {
      setIsConnected(connected);
      
      if (!connected && pollInterval) {
        // Fallback to polling if WebSocket is not connected
        const interval = setInterval(() => {
          // This would fetch data via REST API as fallback
          // Implementation depends on the specific endpoint
        }, pollInterval);

        return () => clearInterval(interval);
      }
    });

    return unsubscribe;
  }, [endpoint, pollInterval]);

  const updateData = useCallback((newData: T) => {
    setData(newData);
    setLastUpdated(new Date());
    setError(null);
  }, []);

  const setErrorState = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  return {
    data,
    isConnected,
    error,
    lastUpdated,
    updateData,
    setErrorState,
  };
}

// Hook for typing indicators
export function useTypingIndicator(sessionId: string | null, userName: string) {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});

  useEffect(() => {
    if (!sessionId) return;

    let typingTimeout: NodeJS.Timeout;

    const handleTyping = () => {
      if (!isTyping) {
        setIsTyping(true);
        webSocketService.startTyping(sessionId, userName);
      }

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        setIsTyping(false);
        webSocketService.stopTyping(sessionId);
      }, 1000);
    };

    return () => {
      clearTimeout(typingTimeout);
      if (isTyping) {
        webSocketService.stopTyping(sessionId);
      }
    };
  }, [sessionId, userName, isTyping]);

  return {
    isTyping,
    typingUsers,
    handleTyping: () => {
      // This would be called on input change
    },
  };
}

// Hook for connection status with retry logic
export function useConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = webSocketService.onConnectionChange((connected) => {
      if (connected) {
        setStatus('connected');
        setRetryCount(0);
        setLastError(null);
      } else {
        setStatus('disconnected');
      }
    });

    return unsubscribe;
  }, []);

  const retry = useCallback(() => {
    setStatus('connecting');
    setRetryCount(prev => prev + 1);
    
    const token = localStorage.getItem('auth_token');
    if (token) {
      webSocketService.connect(token);
    }
  }, []);

  return {
    status,
    retryCount,
    lastError,
    retry,
    isConnected: status === 'connected',
  };
}
