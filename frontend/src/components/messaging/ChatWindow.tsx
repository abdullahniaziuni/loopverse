import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Video,
  Phone,
  MoreVertical,
  X,
  Paperclip,
  Smile,
} from "lucide-react";
import { Button } from "../ui";
import { useAuth } from "../../contexts/AuthContext";
import { webSocketService } from "../../services/websocket";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: "text" | "file" | "system";
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  participant: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    isOnline?: boolean;
  };
  onStartVideoCall?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  participant,
  onStartVideoCall,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatId = `chat_${[user?.id, participant.id].sort().join("_")}`;

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket setup
  useEffect(() => {
    if (!isOpen || !user) return;

    const socket = webSocketService.socketInstance;
    if (!socket) return;

    // Join chat room
    socket.emit("join_chat", {
      chatId,
      userId: user.id,
      participantId: participant.id,
    });

    // Listen for messages
    const handleMessage = (data: any) => {
      if (data.chatId === chatId) {
        const message: Message = {
          id: data.messageId,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content,
          timestamp: new Date(data.timestamp),
          type: data.type || "text",
        };
        setMessages((prev) => [...prev, message]);
      }
    };

    // Listen for typing indicators
    const handleTyping = (data: any) => {
      if (data.chatId === chatId && data.userId !== user.id) {
        setIsTyping(data.isTyping);
      }
    };

    // Listen for global messages (secret global chat)
    const handleGlobalMessage = (data: any) => {
      const message: Message = {
        id: data.messageId,
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.content,
        timestamp: new Date(data.timestamp),
        type: data.type || "text",
      };
      setMessages((prev) => [...prev, message]);
    };

    // Listen for connection status
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
    };

    socket.on("chat_message", handleMessage);
    socket.on("global_chat_message", handleGlobalMessage); // Secret global listener
    socket.on("user_typing", handleTyping);
    webSocketService.onConnectionChange(handleConnectionChange);

    // Set initial connection status
    setIsConnected(socket.connected);

    return () => {
      socket.off("chat_message", handleMessage);
      socket.off("global_chat_message", handleGlobalMessage);
      socket.off("user_typing", handleTyping);
      socket.emit("leave_chat", { chatId, userId: user.id });
    };
  }, [isOpen, user, participant.id, chatId]);

  const sendMessage = () => {
    if (!newMessage.trim() || !user || !isConnected) return;

    const messageData = {
      chatId,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: user.id,
      senderName: user.name,
      recipientId: participant.id,
      content: newMessage.trim(),
      timestamp: new Date(),
      type: "text",
    };

    // Add message locally first
    const message: Message = {
      id: messageData.messageId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      content: messageData.content,
      timestamp: messageData.timestamp,
      type: "text",
    };
    setMessages((prev) => [...prev, message]);

    // Send via WebSocket - secretly goes to global chat
    const socket = webSocketService.socketInstance;
    if (socket) {
      // Use both the regular chat message and global message
      socket.emit("send_chat_message", messageData);
      socket.emit("send_global_message", {
        messageId: messageData.messageId,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        content: messageData.content,
        timestamp: messageData.timestamp,
        type: messageData.type,
      });
    }

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startVideoCall = () => {
    if (onStartVideoCall) {
      onStartVideoCall();
    } else {
      // Default: open video call in new tab
      const sessionId = `session_${Date.now()}`;
      window.open(`/video-call/${sessionId}`, "_blank");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {participant.avatar ? (
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <span className="text-sm font-medium text-blue-600">
                  {participant.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {participant.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {participant.name}
            </h3>
            <p className="text-xs text-gray-500 capitalize">
              {participant.role}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={startVideoCall}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white"
            title="Start video call"
          >
            <Video className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <p>Start a conversation with {participant.name}</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.senderId === user?.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.senderId === user?.id
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${participant.name}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={!isConnected}
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {!isConnected && (
          <p className="text-xs text-red-500 mt-1">
            Disconnected - trying to reconnect...
          </p>
        )}
      </div>
    </div>
  );
};
