import React, { useState, useEffect } from "react";
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
  BarChart3,
  Paperclip,
  Circle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { SessionVideoCall } from "../components/video/SessionVideoCall";
import { AIAssistant } from "../components/ai/AIAssistant";
import { SessionNotesManager } from "../components/ai/SessionNotesManager";
import { SessionSummary } from "../components/ai/SessionSummary";
import { FileSharing, SessionRecording } from "../components/session";
import { ChatPanel } from "../components/video/ChatPanel";
import { useSessionWebSocket } from "../hooks/useSessionWebSocket";
import { useVideoRecording } from "../hooks/useVideoRecording";
import { useToast } from "../hooks/useToast";
import { SessionParticipant } from "../services/sessionWebRTC";

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

  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [showSessionNotes, setShowSessionNotes] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [showFileSharing, setShowFileSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showRecordingPanel, setShowRecordingPanel] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // WebSocket integration for real-time messaging and notes sharing
  const {
    messages: chatMessages,
    sendMessage: sendChatMessage,
    setMessages: setChatMessages,
    isConnected: isChatConnected,
    sessionNotes,
    shareSessionNotes,
  } = useSessionWebSocket(sessionId || null);

  // Enhanced send message function with user info
  const handleSendChatMessage = (message: string) => {
    sendChatMessage(message);
  };

  // Video recording functionality
  const {
    state: recordingState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    clearRecording,
  } = useVideoRecording();

  // User data for video call
  const userData: SessionParticipant = {
    userId: user?.id || "",
    name: user?.name || "Unknown User",
    role: user?.role || "user",
    isVideoEnabled: false, // Camera disabled by default
    isAudioEnabled: true,
    isScreenSharing: false,
  };

  // Recording duration timer
  useEffect(() => {
    if (!isRecording) return;

    const timer = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartVideoCall = () => {
    setShowVideoCall(true);
  };

  const handleCloseVideoCall = () => {
    setShowVideoCall(false);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!sessionId) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Invalid Session</h2>
          <p className="text-gray-400 mb-6">
            Session ID is required to join the video call.
          </p>
          <Button
            onClick={handleGoBack}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900">
              Session #{sessionId}
            </span>
          </div>
          {isRecording && (
            <div className="text-sm text-red-600 flex items-center space-x-1">
              <Circle className="w-2 h-2 fill-current animate-pulse" />
              <span>Recording: {formatDuration(recordingDuration)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/global-video-call")}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <Users className="h-4 w-4 mr-1" />
            Global Call
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAIAssistantOpen(true)}
            className="text-gray-600"
          >
            <Bot className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Call Area */}
        <div className="flex-1 relative">
          {showVideoCall ? (
            <SessionVideoCall
              sessionId={sessionId}
              userData={userData}
              onClose={handleCloseVideoCall}
            />
          ) : (
            <div className="h-full bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">
                  Session Video Call
                </h3>
                <p className="text-gray-400 mb-6">
                  Start a video call for session #{sessionId}
                </p>
                <Button
                  onClick={handleStartVideoCall}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Start Video Call
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Session Tools
            </h3>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChatOpen(true)}
                  className={`flex items-center justify-center relative ${
                    chatMessages.length > 0 ? "border-blue-300 bg-blue-50" : ""
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Chat
                  {chatMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chatMessages.length > 9 ? "9+" : chatMessages.length}
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSessionNotes(true)}
                  className="flex items-center justify-center"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Notes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFileSharing(true)}
                  className="flex items-center justify-center"
                >
                  <Paperclip className="w-4 h-4 mr-1" />
                  Files
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecordingPanel(true)}
                  className="flex items-center justify-center"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Record
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSessionSummary(true)}
                  className="flex items-center justify-center"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Summary
                </Button>
              </div>
            </div>

            {/* Recording Controls */}
            {showRecordingPanel && (
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Session Recording
                </h4>
                <div className="space-y-3">
                  {/* Recording Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {recordingState.isRecording && (
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                      <span className="text-sm font-medium">
                        {recordingState.isRecording
                          ? recordingState.isPaused
                            ? "Paused"
                            : "Recording"
                          : "Ready to Record"}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {Math.floor(recordingState.duration / 60)}:
                      {(recordingState.duration % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                  </div>

                  {/* Recording Controls */}
                  <div className="flex space-x-2">
                    {!recordingState.isRecording ? (
                      <Button
                        onClick={async () => {
                          try {
                            await startRecording();
                            showSuccess("Recording started!");
                          } catch (error) {
                            showError(
                              "Failed to start recording. Please allow screen sharing."
                            );
                          }
                        }}
                        disabled={recordingState.isProcessing}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {recordingState.isProcessing
                          ? "Starting..."
                          : "Start Recording"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={async () => {
                            await stopRecording();
                            showSuccess("Recording stopped!");
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Stop
                        </Button>
                        {recordingState.isPaused ? (
                          <Button
                            onClick={resumeRecording}
                            size="sm"
                            variant="outline"
                          >
                            Resume
                          </Button>
                        ) : (
                          <Button
                            onClick={pauseRecording}
                            size="sm"
                            variant="outline"
                          >
                            Pause
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Download Recording */}
                  {recordingState.recordedBlob && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Recording ready (
                          {Math.round(
                            recordingState.recordedBlob.size / 1024 / 1024
                          )}
                          MB)
                        </span>
                        <div className="flex space-x-2">
                          <Button
                            onClick={downloadRecording}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Download
                          </Button>
                          <Button
                            onClick={clearRecording}
                            size="sm"
                            variant="outline"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File Sharing */}
            {showFileSharing && (
              <div className="p-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  File Sharing
                </h4>
                <FileSharing sessionId={sessionId || ""} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant Modal */}
      {isAIAssistantOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AIAssistant
              sessionId={sessionId || ""}
              onClose={() => setIsAIAssistantOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Session Notes Modal */}
      {showSessionNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <SessionNotesManager
              sessionData={{
                topic: `Session Video Call - ${sessionId}`,
                duration: recordingDuration,
                participants: [{ name: userData.name, role: userData.role }],
              }}
              chatMessages={chatMessages.map((msg) => ({
                id: msg.id,
                sender: msg.senderName,
                content: msg.message,
                timestamp: msg.timestamp,
                isOwn: msg.isOwn,
              }))}
              onSaveNotes={(notes) => {
                // Share notes with all participants
                if (notes) {
                  shareSessionNotes(notes);
                  showSuccess(
                    "Session notes saved and shared with all participants!"
                  );
                } else {
                  showSuccess("Session notes saved successfully!");
                }

                setShowSessionNotes(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      {showSessionSummary && sessionId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <SessionSummary
              sessionId={sessionId}
              sessionData={{
                title: "Session Video Call",
                duration: recordingState.duration || 0,
                participants: [{ name: userData.name, role: userData.role }],
                topic: `Video Session - ${sessionId}`,
              }}
              chatMessages={chatMessages.map((msg) => ({
                sender: msg.senderName,
                content: msg.message,
                timestamp: msg.timestamp,
              }))}
              onClose={() => setShowSessionSummary(false)}
            />
          </div>
        </div>
      )}

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
        isConnected={isChatConnected}
      />
    </div>
  );
};
