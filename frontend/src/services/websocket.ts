import { io, Socket } from "socket.io-client";
import { WEBSOCKET_CONFIG } from "../config";

export interface WebSocketMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  message: string;
  type: "text" | "file" | "image";
  timestamp: Date;
}

export interface NotificationData {
  id: string;
  type: "booking_request" | "booking_response" | "session_update" | "general";
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
}

export interface SessionUpdate {
  sessionId: string;
  status: "pending" | "confirmed" | "started" | "completed" | "cancelled";
  timestamp: Date;
}

class WebSocketService {
  public socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = WEBSOCKET_CONFIG.RECONNECT_ATTEMPTS;
  private reconnectDelay = WEBSOCKET_CONFIG.RECONNECT_DELAY;
  private currentUserId: string | null = null;

  // Event listeners
  private messageListeners: ((message: WebSocketMessage) => void)[] = [];
  private notificationListeners: ((notification: NotificationData) => void)[] =
    [];
  private sessionUpdateListeners: ((update: SessionUpdate) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];

  connect(token: string, userId?: string): void {
    this.token = token;
    if (userId) {
      this.currentUserId = userId;
    }

    if (this.socket?.connected) {
      return;
    }

    const wsUrl = WEBSOCKET_CONFIG.URL.replace("http", "ws");

    this.socket = io(wsUrl, {
      auth: {
        token: this.token,
        userId: this.currentUserId,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  setUserId(userId: string): void {
    this.currentUserId = userId;
    if (this.socket?.connected) {
      this.socket.emit("set_user_id", { userId });
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected");
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
    });

    this.socket.on("disconnect", () => {
      console.log("❌ WebSocket disconnected");
      this.notifyConnectionListeners(false);
    });

    this.socket.on("connect_error", (error) => {
      console.error("💥 WebSocket connection error:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("🚫 Max reconnection attempts reached");
      }
    });

    // Message events
    this.socket.on("new_message", (data: WebSocketMessage) => {
      console.log("📨 New message received:", data);
      this.notifyMessageListeners(data);
    });

    // Notification events
    this.socket.on("notification", (data: NotificationData) => {
      console.log("🔔 Notification received:", data);
      this.notifyNotificationListeners(data);
    });

    this.socket.on("booking_request", (data: any) => {
      console.log("📅 Booking request received:", data);
      const notification: NotificationData = {
        id: Date.now().toString(),
        type: "booking_request",
        title: "New Booking Request",
        message: "You have a new session booking request",
        data: data.data,
        timestamp: new Date(data.timestamp),
      };
      this.notifyNotificationListeners(notification);
    });

    this.socket.on("booking_response", (data: any) => {
      console.log("📋 Booking response received:", data);
      const notification: NotificationData = {
        id: Date.now().toString(),
        type: "booking_response",
        title: "Booking Response",
        message: "Your booking request has been responded to",
        data: data.data,
        timestamp: new Date(data.timestamp),
      };
      this.notifyNotificationListeners(notification);
    });

    // Session events
    this.socket.on("session_update", (data: SessionUpdate) => {
      console.log("🎯 Session update received:", data);
      this.notifySessionUpdateListeners(data);
    });

    this.socket.on("session_status_changed", (data: SessionUpdate) => {
      console.log("🔄 Session status changed:", data);
      this.notifySessionUpdateListeners(data);
    });

    // Typing indicators
    this.socket.on(
      "user_typing",
      (data: { userId: string; userName: string }) => {
        console.log("⌨️ User typing:", data);
        // Handle typing indicator
      }
    );

    this.socket.on("user_stopped_typing", (data: { userId: string }) => {
      console.log("⏹️ User stopped typing:", data);
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
      this.socket.emit("join_session", sessionId);
      console.log(`🎯 Joined session: ${sessionId}`);
    }
  }

  leaveSession(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("leave_session", sessionId);
      console.log(`🚪 Left session: ${sessionId}`);
    }
  }

  // Messaging
  sendMessage(
    sessionId: string,
    message: string,
    senderName: string,
    type: "text" | "file" | "image" = "text"
  ): void {
    if (this.socket?.connected) {
      this.socket.emit("send_message", {
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
      this.socket.emit("typing_start", { sessionId, userName });
    }
  }

  stopTyping(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("typing_stop", { sessionId });
    }
  }

  // Global video call methods
  joinGlobalCall(userData: any): void {
    if (this.socket?.connected) {
      console.log("🎯 Emitting join_global_call with data:", userData);
      this.socket.emit("join_global_call", userData);
      console.log("🎯 Joined global video call");
    } else {
      console.error("❌ Cannot join global call - WebSocket not connected");
    }
  }

  leaveGlobalCall(): void {
    if (this.socket?.connected) {
      this.socket.emit("leave_global_call");
      console.log("🚪 Left global video call");
    }
  }

  // WebRTC signaling methods
  sendWebRTCOffer(
    targetUserId: string,
    offer: RTCSessionDescriptionInit
  ): void {
    if (this.socket?.connected) {
      console.log(`📞 Emitting webrtc_offer to ${targetUserId}:`, {
        targetUserId,
        offer,
      });
      this.socket.emit("webrtc_offer", { targetUserId, offer });
      console.log(`📞 Sent WebRTC offer to ${targetUserId}`);
    } else {
      console.error(
        `❌ Cannot send WebRTC offer to ${targetUserId} - WebSocket not connected`
      );
    }
  }

  sendWebRTCAnswer(
    targetUserId: string,
    answer: RTCSessionDescriptionInit
  ): void {
    if (this.socket?.connected) {
      this.socket.emit("webrtc_answer", { targetUserId, answer });
      console.log(`📞 Sent WebRTC answer to ${targetUserId}`);
    }
  }

  sendWebRTCIceCandidate(
    targetUserId: string,
    candidate: RTCIceCandidateInit
  ): void {
    if (this.socket?.connected) {
      this.socket.emit("webrtc_ice_candidate", { targetUserId, candidate });
      console.log(`🧊 Sent ICE candidate to ${targetUserId}`);
    }
  }

  // File sharing in call
  shareFileInCall(fileData: any): void {
    if (this.socket?.connected) {
      this.socket.emit("share_file_in_call", fileData);
      console.log("📁 Shared file in call");
    }
  }

  // Session video call methods (secretly uses global video call)
  joinSessionCall(sessionId: string, userData: any): void {
    if (this.socket?.connected) {
      console.log(
        `🎯 Joining session call ${sessionId} (secretly global) with data:`,
        userData
      );
      // Use the global video call handler instead of session-specific
      this.socket.emit("join_video_call", { sessionId, userData });
      console.log(
        `🎯 Joined global video call (frontend thinks: ${sessionId})`
      );
    } else {
      console.error("❌ Cannot join session call - WebSocket not connected");
    }
  }

  leaveSessionCall(sessionId: string): void {
    if (this.socket?.connected) {
      // Use the global video call leave handler
      this.socket.emit("leave_video_call", sessionId);
      console.log(`🚪 Left global video call (frontend thinks: ${sessionId})`);
    }
  }

  // Session WebRTC signaling methods (secretly uses global WebRTC)
  sendSessionWebRTCOffer(
    sessionId: string,
    targetUserId: string,
    offer: RTCSessionDescriptionInit
  ): void {
    if (this.socket?.connected) {
      console.log(
        `📞 Emitting session_webrtc_offer to ${targetUserId} in session ${sessionId}:`,
        { sessionId, targetUserId, offer }
      );
      // Use global WebRTC signaling instead of session-specific
      this.socket.emit("webrtc_offer", {
        targetUserId,
        offer,
      });
      console.log(`📞 Sent session WebRTC offer to ${targetUserId}`);
    } else {
      console.error(
        `❌ Cannot send session WebRTC offer to ${targetUserId} - WebSocket not connected`
      );
    }
  }

  sendSessionWebRTCAnswer(
    sessionId: string,
    targetUserId: string,
    answer: RTCSessionDescriptionInit
  ): void {
    if (this.socket?.connected) {
      console.log(
        `📞 Emitting session_webrtc_answer to ${targetUserId} in session ${sessionId}:`,
        { sessionId, targetUserId, answer }
      );
      // Use global WebRTC signaling instead of session-specific
      this.socket.emit("webrtc_answer", {
        targetUserId,
        answer,
      });
      console.log(`📞 Sent session WebRTC answer to ${targetUserId}`);
    } else {
      console.error(
        `❌ Cannot send session WebRTC answer to ${targetUserId} - WebSocket not connected`
      );
    }
  }

  sendSessionWebRTCIceCandidate(
    sessionId: string,
    targetUserId: string,
    candidate: RTCIceCandidateInit
  ): void {
    if (this.socket?.connected) {
      console.log(
        `🧊 Emitting session_webrtc_ice_candidate to ${targetUserId} in session ${sessionId}:`,
        { sessionId, targetUserId, candidate }
      );
      // Use global WebRTC signaling instead of session-specific
      this.socket.emit("webrtc_ice_candidate", {
        targetUserId,
        candidate,
      });
      console.log(`🧊 Sent session ICE candidate to ${targetUserId}`);
    } else {
      console.error(
        `❌ Cannot send session ICE candidate to ${targetUserId} - WebSocket not connected`
      );
    }
  }

  // File sharing in session
  shareFileInSession(sessionId: string, fileData: any): void {
    if (this.socket?.connected) {
      console.log(
        `📁 Emitting share_file_in_session for session ${sessionId}:`,
        fileData
      );
      this.socket.emit("share_file_in_session", { sessionId, fileData });
      console.log(`📁 Shared file in session: ${sessionId}`);
    } else {
      console.error(
        "❌ Cannot share file in session - WebSocket not connected"
      );
    }
  }

  // Session status updates
  updateSessionStatus(sessionId: string, status: string): void {
    if (this.socket?.connected) {
      this.socket.emit("session_status_update", { sessionId, status });
    }
  }

  // Event listener management
  onMessage(callback: (message: WebSocketMessage) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  onNotification(
    callback: (notification: NotificationData) => void
  ): () => void {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  onSessionUpdate(callback: (update: SessionUpdate) => void): () => void {
    this.sessionUpdateListeners.push(callback);
    return () => {
      this.sessionUpdateListeners = this.sessionUpdateListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  // Private notification methods
  private notifyMessageListeners(message: WebSocketMessage): void {
    this.messageListeners.forEach((callback) => callback(message));
  }

  private notifyNotificationListeners(notification: NotificationData): void {
    this.notificationListeners.forEach((callback) => callback(notification));
  }

  private notifySessionUpdateListeners(update: SessionUpdate): void {
    this.sessionUpdateListeners.forEach((callback) => callback(update));
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach((callback) => callback(connected));
  }

  // Getters
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get connectionState(): string {
    if (!this.socket) return "disconnected";
    return this.socket.connected ? "connected" : "disconnected";
  }

  get userId(): string | null {
    return this.currentUserId;
  }

  get socketInstance(): Socket | null {
    return this.socket;
  }
}

// Create and export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
