import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Clock,
  User,
  MessageCircle,
  Bell,
  CheckCircle,
} from "lucide-react";
import { Button, Input, Modal } from "../ui";
import { useToast } from "../../hooks/useToast";
import { formatDate, formatTime } from "../../utils";

interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderRole: "mentor" | "learner";
  content: string;
  timestamp: Date;
  type: "text" | "reminder" | "system";
  isRead: boolean;
}

interface Session {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerAvatar?: string;
  mentorId: string;
  mentorName: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "completed" | "cancelled";
  isUpcoming: boolean;
  minutesUntilStart?: number;
}

interface MessageCenterProps {
  currentUserId: string;
  currentUserRole: "mentor" | "learner";
  currentUserName: string;
}

export const MessageCenter: React.FC<MessageCenterProps> = ({
  currentUserId,
  currentUserRole,
  currentUserName,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { success: showSuccess, error: showError } = useToast();

  // Fetch real sessions data
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        console.log("💬 MessageCenter - Fetching sessions");
        setIsLoading(true);

        // Fetch confirmed sessions for messaging
        const response = await fetch("/api/bookings?status=confirmed", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("💬 MessageCenter - Sessions response:", data);

          if (data.success && data.data) {
            const transformedSessions = data.data.map((session: any) => {
              const sessionDate = new Date(session.startTime);
              const now = new Date();
              const minutesUntilStart = Math.max(
                0,
                Math.floor(
                  (sessionDate.getTime() - now.getTime()) / (1000 * 60)
                )
              );

              return {
                id: session.id,
                learnerId: session.learner.id,
                learnerName: session.learner.name,
                learnerAvatar: session.learner.profilePicture,
                mentorId: session.mentor.id,
                mentorName: session.mentor.name,
                title: session.title,
                date: sessionDate.toISOString().split("T")[0],
                startTime: sessionDate.toTimeString().slice(0, 5),
                endTime: new Date(session.endTime).toTimeString().slice(0, 5),
                status: session.status,
                isUpcoming: sessionDate > now,
                minutesUntilStart: minutesUntilStart,
              };
            });

            setSessions(transformedSessions);
            console.log(
              "✅ MessageCenter - Sessions loaded:",
              transformedSessions
            );
          }
        } else {
          console.error("❌ MessageCenter - Failed to fetch sessions");
        }
      } catch (error) {
        console.error("💥 MessageCenter - Error fetching sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Fetch messages for selected session
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedSession) {
        setMessages([]);
        return;
      }

      try {
        console.log(
          "💬 MessageCenter - Fetching messages for session:",
          selectedSession.id
        );

        // For now, we'll use an empty array since we don't have a messages API yet
        // TODO: Implement real message fetching when message storage is added
        setMessages([]);

        console.log(
          "✅ MessageCenter - Messages loaded for session:",
          selectedSession.id
        );
      } catch (error) {
        console.error("💥 MessageCenter - Error fetching messages:", error);
        setMessages([]);
      }
    };

    fetchMessages();
  }, [selectedSession]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    setIsLoading(true);
    try {
      const message: Message = {
        id: Date.now().toString(),
        sessionId: selectedSession.id,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        content: newMessage.trim(),
        timestamp: new Date(),
        type: "text",
        isRead: false,
      };

      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      showSuccess("Message sent successfully!");

      // TODO: Send via WebSocket or API
      console.log("Sending message:", message);
    } catch (error) {
      showError("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const sendReminder = async () => {
    if (!reminderMessage.trim() || !selectedSession) return;

    setIsLoading(true);
    try {
      const message: Message = {
        id: Date.now().toString(),
        sessionId: selectedSession.id,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        content: reminderMessage.trim(),
        timestamp: new Date(),
        type: "reminder",
        isRead: false,
      };

      setMessages((prev) => [...prev, message]);
      setReminderMessage("");
      setShowReminderModal(false);
      showSuccess("Reminder sent successfully!");

      // TODO: Send via WebSocket or API
      console.log("Sending reminder:", message);
    } catch (error) {
      showError("Failed to send reminder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSessionStatusColor = (session: Session) => {
    if (session.minutesUntilStart && session.minutesUntilStart <= 60) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (session.minutesUntilStart && session.minutesUntilStart <= 1440) {
      // 24 hours
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getTimeUntilSession = (session: Session) => {
    if (!session.minutesUntilStart) return "";

    if (session.minutesUntilStart < 60) {
      return `${session.minutesUntilStart}m`;
    }
    if (session.minutesUntilStart < 1440) {
      return `${Math.floor(session.minutesUntilStart / 60)}h`;
    }
    return `${Math.floor(session.minutesUntilStart / 1440)}d`;
  };

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Sessions List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentUserRole === "mentor" ? "Your Students" : "Your Mentors"}
          </h3>
          <p className="text-sm text-gray-600">Upcoming sessions</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No upcoming sessions</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedSession?.id === session.id
                    ? "bg-blue-50 border-blue-200"
                    : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={session.learnerAvatar || "/api/placeholder/40/40"}
                    alt={
                      currentUserRole === "mentor"
                        ? session.learnerName
                        : session.mentorName
                    }
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {currentUserRole === "mentor"
                        ? session.learnerName
                        : session.mentorName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session.title}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(session.date)} at {session.startTime}
                      </span>
                      {session.isUpcoming && session.minutesUntilStart && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full border ${getSessionStatusColor(
                            session
                          )}`}
                        >
                          {getTimeUntilSession(session)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      selectedSession.learnerAvatar || "/api/placeholder/40/40"
                    }
                    alt={
                      currentUserRole === "mentor"
                        ? selectedSession.learnerName
                        : selectedSession.mentorName
                    }
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {currentUserRole === "mentor"
                        ? selectedSession.learnerName
                        : selectedSession.mentorName}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {selectedSession.title}
                    </p>
                  </div>
                </div>
                {currentUserRole === "mentor" && selectedSession.isUpcoming && (
                  <Button
                    onClick={() => setShowReminderModal(true)}
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Send Reminder</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === currentUserId
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === currentUserId
                        ? "bg-blue-600 text-white"
                        : message.type === "reminder"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.type === "reminder" && (
                      <div className="flex items-center space-x-1 mb-1">
                        <Bell className="h-3 w-3" />
                        <span className="text-xs font-medium">Reminder</span>
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderId === currentUserId
                          ? "text-blue-100"
                          : message.type === "reminder"
                          ? "text-yellow-600"
                          : "text-gray-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  className="flex items-center space-x-1"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a session to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Reminder Modal */}
      <Modal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        title="Send Session Reminder"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Send a reminder message to {selectedSession?.learnerName} about your
            upcoming session.
          </p>
          <Input
            value={reminderMessage}
            onChange={(e) => setReminderMessage(e.target.value)}
            placeholder="e.g., Don't forget about our session in 30 minutes!"
            className="w-full"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowReminderModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={sendReminder}
              disabled={!reminderMessage.trim() || isLoading}
            >
              Send Reminder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
