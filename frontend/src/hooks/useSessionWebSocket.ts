import { useState, useEffect, useCallback } from "react";
import { webSocketService } from "../services/websocket";
import { useAuth } from "../contexts/AuthContext";

export interface ChatMessage {
  id: string;
  sender: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
  sessionId: string;
}

export interface SessionNotes {
  id: string;
  sessionId: string;
  generatedBy: string;
  generatedByName: string;
  notes: {
    sessionSummary: string;
    learningObjectives: string[];
    keyTakeaways: string[];
    nextSteps: string[];
    mentorInsights: string[];
    recommendedFollowUp: string[];
  };
  timestamp: Date;
}

export interface UseSessionWebSocketReturn {
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isConnected: boolean;
  sessionNotes: SessionNotes[];
  shareSessionNotes: (notes: SessionNotes["notes"]) => void;
}

export const useSessionWebSocket = (
  sessionId: string | null
): UseSessionWebSocketReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionNotes, setSessionNotes] = useState<SessionNotes[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  // Send message function
  const sendMessage = useCallback(
    (message: string) => {
      if (!sessionId || !message.trim()) return;

      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender: webSocketService.userId || "unknown",
        senderName: user?.name || "You",
        message: message.trim(),
        timestamp: new Date(),
        isOwn: true,
        sessionId,
      };

      // Add message locally first for immediate feedback
      setMessages((prev) => [...prev, chatMessage]);

      // Send via WebSocket
      const socket = webSocketService.socketInstance;
      if (socket) {
        socket.emit("session_chat_message", {
          sessionId,
          messageId: chatMessage.id,
          message: chatMessage.message,
          timestamp: chatMessage.timestamp,
          sender: chatMessage.sender,
          senderName: chatMessage.senderName,
        });

        console.log("📨 Sent session chat message:", chatMessage);
      } else {
        console.error("❌ WebSocket not connected, cannot send message");
      }
    },
    [sessionId, user]
  );

  // Share session notes with all participants
  const shareSessionNotes = useCallback(
    (notes: SessionNotes["notes"]) => {
      if (!sessionId || !user) return;

      const sessionNotesData: SessionNotes = {
        id: `notes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        generatedBy: user.id,
        generatedByName: user.name,
        notes,
        timestamp: new Date(),
      };

      // Add to local state immediately
      setSessionNotes((prev) => {
        const exists = prev.find((n) => n.id === sessionNotesData.id);
        if (exists) return prev;
        return [...prev, sessionNotesData];
      });

      // Send via WebSocket to other participants
      const socket = webSocketService.socketInstance;
      if (socket) {
        socket.emit("session_notes_shared", {
          sessionId,
          notesId: sessionNotesData.id,
          generatedBy: sessionNotesData.generatedBy,
          generatedByName: sessionNotesData.generatedByName,
          notes: sessionNotesData.notes,
          timestamp: sessionNotesData.timestamp,
        });

        console.log("📝 Shared session notes with participants");
      } else {
        console.error("❌ WebSocket not connected, cannot share notes");
      }
    },
    [sessionId, user]
  );

  // Set up WebSocket listeners
  useEffect(() => {
    if (!sessionId) return;

    const socket = webSocketService.socketInstance;
    if (!socket) {
      console.warn("⚠️ WebSocket not available for session chat");
      return;
    }

    // Update connection status
    setIsConnected(webSocketService.isConnected);

    // Listen for incoming chat messages
    const handleIncomingMessage = (data: {
      sessionId: string;
      messageId: string;
      message: string;
      timestamp: string;
      sender: string;
      senderName: string;
    }) => {
      // Only handle messages for this session
      if (data.sessionId !== sessionId) return;

      // Don't add our own messages again
      if (data.sender === webSocketService.userId) return;

      const chatMessage: ChatMessage = {
        id: data.messageId,
        sender: data.sender,
        senderName: data.senderName || "Unknown User",
        message: data.message,
        timestamp: new Date(data.timestamp),
        isOwn: false,
        sessionId: data.sessionId,
      };

      setMessages((prev) => {
        // Check if message already exists to prevent duplicates
        const exists = prev.some((msg) => msg.id === chatMessage.id);
        if (exists) return prev;

        return [...prev, chatMessage];
      });

      console.log("📨 Received session chat message:", chatMessage);
    };

    // Listen for incoming session notes
    const handleIncomingNotes = (data: {
      sessionId: string;
      notesId: string;
      generatedBy: string;
      generatedByName: string;
      notes: SessionNotes["notes"];
      timestamp: string;
    }) => {
      // Only handle notes for this session
      if (data.sessionId !== sessionId) return;

      // Don't add our own notes again
      if (data.generatedBy === user?.id) return;

      const sessionNotesData: SessionNotes = {
        id: data.notesId,
        sessionId: data.sessionId,
        generatedBy: data.generatedBy,
        generatedByName: data.generatedByName,
        notes: data.notes,
        timestamp: new Date(data.timestamp),
      };

      setSessionNotes((prev) => {
        const exists = prev.find((n) => n.id === sessionNotesData.id);
        if (exists) return prev;
        return [...prev, sessionNotesData];
      });

      console.log("📝 Received session notes from:", data.generatedByName);
    };

    // Listen for connection status changes
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      console.log(
        `🔌 Session chat connection status: ${
          connected ? "Connected" : "Disconnected"
        }`
      );
    };

    // Set up event listeners
    socket.on("session_chat_message", handleIncomingMessage);
    socket.on("session_notes_shared", handleIncomingNotes);
    webSocketService.onConnectionChange(handleConnectionChange);

    // Join session chat room
    socket.emit("join_session_chat", { sessionId });
    console.log(`💬 Joined session chat room: ${sessionId}`);

    // Cleanup function
    return () => {
      socket.off("session_chat_message", handleIncomingMessage);
      socket.off("session_notes_shared", handleIncomingNotes);
      socket.emit("leave_session_chat", { sessionId });
      console.log(`👋 Left session chat room: ${sessionId}`);
    };
  }, [sessionId, user]);

  return {
    messages,
    sendMessage,
    setMessages,
    isConnected,
    sessionNotes,
    shareSessionNotes,
  };
};
