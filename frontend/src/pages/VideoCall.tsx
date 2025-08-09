import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  MessageSquare,
  Settings,
  Users,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Bot,
  FileText,
} from "lucide-react";
import { Button } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { AIAssistant } from "../components/ai/AIAssistant";
import { SessionNotesManager } from "../components/ai/SessionNotesManager";

interface CallState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isFullscreen: boolean;
  isMuted: boolean;
  callDuration: number;
  connectionStatus: "connecting" | "connected" | "disconnected" | "failed";
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

export const VideoCall: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const [callState, setCallState] = useState<CallState>({
    isVideoEnabled: true,
    isAudioEnabled: true,
    isScreenSharing: false,
    isChatOpen: false,
    isFullscreen: false,
    isMuted: false,
    callDuration: 0,
    connectionStatus: "connecting",
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [showSessionNotes, setShowSessionNotes] = useState(false);
  const [participants] = useState([
    { id: "1", name: "John Doe", role: "mentor", isConnected: true },
    { id: "2", name: user?.name || "You", role: "learner", isConnected: true },
  ]);

  // Simulate call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallState((prev) => ({
        ...prev,
        callDuration: prev.callDuration + 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleVideo = () => {
    setCallState((prev) => ({
      ...prev,
      isVideoEnabled: !prev.isVideoEnabled,
    }));
    // TODO: Implement actual video toggle with WebRTC
  };

  const toggleAudio = () => {
    setCallState((prev) => ({
      ...prev,
      isAudioEnabled: !prev.isAudioEnabled,
    }));
    // TODO: Implement actual audio toggle with WebRTC
  };

  const toggleScreenShare = () => {
    setCallState((prev) => ({
      ...prev,
      isScreenSharing: !prev.isScreenSharing,
    }));
    // TODO: Implement screen sharing with WebRTC
  };

  const toggleChat = () => {
    setCallState((prev) => ({
      ...prev,
      isChatOpen: !prev.isChatOpen,
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setCallState((prev) => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setCallState((prev) => ({ ...prev, isFullscreen: false }));
    }
  };

  const endCall = () => {
    // TODO: Implement call ending logic
    showSuccess("Call ended successfully");
    navigate("/learner/dashboard");
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: user?.name || "You",
      message: newMessage,
      timestamp: new Date(),
      isOwn: true,
    };

    setChatMessages((prev) => [...prev, message]);
    setNewMessage("");
    // TODO: Send message via WebSocket
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900">
              Session #{sessionId}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Duration: {formatDuration(callState.callDuration)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-600"
          >
            {callState.isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/learner/dashboard")}
            className="text-gray-600"
          >
            Exit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative bg-gray-900">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
          />

          {/* Local Video */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {!callState.isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Participants List */}
          <div className="absolute top-4 left-4 bg-white rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                Participants
              </span>
            </div>
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center space-x-2 text-sm"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    participant.isConnected ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-gray-700">{participant.name}</span>
                <span className="text-gray-500 text-xs">
                  ({participant.role})
                </span>
              </div>
            ))}
          </div>

          {/* Connection Status */}
          {callState.connectionStatus !== "connected" && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-900 font-medium">
                  {callState.connectionStatus === "connecting" &&
                    "Connecting..."}
                  {callState.connectionStatus === "failed" &&
                    "Connection Failed"}
                  {callState.connectionStatus === "disconnected" &&
                    "Disconnected"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {callState.isChatOpen && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isOwn ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.isOwn
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isOwn ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={sendMessage} size="sm">
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Session Notes Panel */}
        {showSessionNotes && (
          <div className="w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto">
            <SessionNotesManager
              sessionData={{
                topic: "React Development Session",
                duration: Math.floor(callState.callDuration / 60),
                participants: participants.map((p) => ({
                  name: p.name,
                  role: p.role,
                })),
              }}
              chatMessages={chatMessages}
              onSaveNotes={(notes) => {
                console.log("Session notes saved:", notes);
                // Here you would typically save to your backend
              }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={callState.isAudioEnabled ? "outline" : "danger"}
            size="sm"
            onClick={toggleAudio}
            className="w-12 h-12 rounded-full"
          >
            {callState.isAudioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={callState.isVideoEnabled ? "outline" : "danger"}
            size="sm"
            onClick={toggleVideo}
            className="w-12 h-12 rounded-full"
          >
            {callState.isVideoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={callState.isScreenSharing ? "primary" : "outline"}
            size="sm"
            onClick={toggleScreenShare}
            className="w-12 h-12 rounded-full"
          >
            <Monitor className="h-5 w-5" />
          </Button>

          <Button
            variant={callState.isChatOpen ? "primary" : "outline"}
            size="sm"
            onClick={toggleChat}
            className="w-12 h-12 rounded-full"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          <Button
            variant={isAIAssistantOpen ? "primary" : "outline"}
            size="sm"
            onClick={() => setIsAIAssistantOpen(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
          >
            <Bot className="h-5 w-5" />
          </Button>

          <Button
            variant={showSessionNotes ? "primary" : "outline"}
            size="sm"
            onClick={() => setShowSessionNotes(!showSessionNotes)}
            className="w-12 h-12 rounded-full"
          >
            <FileText className="h-5 w-5" />
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={endCall}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        context={{
          sessionTopic: "React Development Session",
          mentorExpertise: ["React", "JavaScript", "Frontend Development"],
          learnerGoals: [
            "Learn React Hooks",
            "Build Components",
            "State Management",
          ],
          userRole: user?.role as "learner" | "mentor",
        }}
      />
    </div>
  );
};
