import React, { useState, useRef, useEffect } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Users,
  Share2,
  FileText,
  Download,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  useGlobalVideoCall,
  useParticipantVideos,
} from "../../hooks/useGlobalVideoCall";
import { CallParticipant, FileItem } from "../../services/globalWebRTC";
import { useToast } from "../../hooks/useToast";

interface GlobalVideoCallProps {
  userData: CallParticipant;
  onClose?: () => void;
}

export const GlobalVideoCall: React.FC<GlobalVideoCallProps> = ({
  userData,
  onClose,
}) => {
  const [showParticipants, setShowParticipants] = useState(false);
  const [showFileSharing, setShowFileSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { success: showSuccess, error: showError } = useToast();

  const {
    callState,
    participants,
    sharedFiles,
    error,
    localVideoRef,
    getVideoRef,
    joinCall,
    leaveCall,
    toggleVideo,
    toggleAudio,
    shareFile,
    downloadFile,
    isInCall,
    isConnecting,
    isVideoEnabled,
    isAudioEnabled,
    participantCount,
    hasSharedFiles,
  } = useGlobalVideoCall({ userData });

  const { getVideoElement, setVideoStream } =
    useParticipantVideos(participants);

  // Handle joining/leaving call
  const handleJoinCall = async () => {
    try {
      await joinCall();
      showSuccess("Joined global video call!");
    } catch (err) {
      showError("Failed to join call");
    }
  };

  const handleLeaveCall = async () => {
    try {
      await leaveCall();
      showSuccess("Left video call");
      onClose?.();
    } catch (err) {
      showError("Failed to leave call");
    }
  };

  // Handle media controls
  const handleToggleVideo = async () => {
    const enabled = await toggleVideo();
    showSuccess(enabled ? "Camera turned on" : "Camera turned off");
  };

  const handleToggleAudio = async () => {
    const enabled = await toggleAudio();
    showSuccess(enabled ? "Microphone turned on" : "Microphone turned off");
  };

  // Handle file sharing
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        await shareFile(files[0]);
        showSuccess(`Shared ${files[0].name}`);
      } catch (err) {
        showError("Failed to share file");
      }
    }
    event.target.value = "";
  };

  const handleFileDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      try {
        await shareFile(files[0]);
        showSuccess(`Shared ${files[0].name}`);
      } catch (err) {
        showError("Failed to share file");
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Update remote video streams
  useEffect(() => {
    participants.forEach((participant) => {
      const stream = callState.remoteStreams.get(participant.userId);
      if (stream) {
        setVideoStream(participant.userId, stream);
      }
    });
  }, [participants, callState.remoteStreams, setVideoStream]);

  // Show error if any
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-900 text-white ${
        isFullscreen ? "fixed inset-0 z-50" : "rounded-lg overflow-hidden"
      }`}
      onDrop={handleFileDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag overlay */}
      {dragActive && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-50 flex items-center justify-center z-40">
          <div className="text-center">
            <Share2 className="w-16 h-16 mx-auto mb-4" />
            <p className="text-xl font-semibold">Drop file to share</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">Global Video Call</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Users className="w-4 h-4" />
              <span>{participantCount + (isInCall ? 1 : 0)} participants</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main video area */}
      <div className="relative h-96 bg-gray-800">
        {!isInCall ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">
                Join Global Video Call
              </h3>
              <p className="text-gray-400 mb-6">
                Connect with everyone in a single call
              </p>
              <button
                onClick={handleJoinCall}
                disabled={isConnecting}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                {isConnecting ? "Connecting..." : "Join Call"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 h-full">
            {/* Local video */}
            <div className="relative bg-gray-700 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
                You {!isVideoEnabled && "(Camera off)"}
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Remote videos */}
            {participants.map((participant) => (
              <div
                key={participant.userId}
                className="relative bg-gray-700 rounded-lg overflow-hidden"
              >
                <div
                  ref={(el) => {
                    if (el) {
                      const video = getVideoElement(participant.userId);
                      if (el.firstChild !== video) {
                        el.innerHTML = "";
                        el.appendChild(video);
                      }
                    }
                  }}
                  className="w-full h-full"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
                  {participant.name}{" "}
                  {!participant.isVideoEnabled && "(Camera off)"}
                </div>
                {!participant.isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      {isInCall && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleToggleVideo}
              className={`p-3 rounded-full transition-colors ${
                isVideoEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isVideoEnabled ? (
                <Video className="w-6 h-6" />
              ) : (
                <VideoOff className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={handleToggleAudio}
              className={`p-3 rounded-full transition-colors ${
                isAudioEnabled
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isAudioEnabled ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={handleFileSelect}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
            >
              <Share2 className="w-6 h-6" />
            </button>

            <button
              onClick={() => setShowFileSharing(!showFileSharing)}
              className={`p-3 rounded-full transition-colors ${
                hasSharedFiles
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <FileText className="w-6 h-6" />
            </button>

            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
            >
              <Users className="w-6 h-6" />
            </button>

            <button
              onClick={handleLeaveCall}
              className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Participants panel */}
      {showParticipants && isInCall && (
        <div className="absolute top-16 right-4 w-80 bg-gray-800 rounded-lg shadow-lg p-4 z-20">
          <h3 className="text-lg font-semibold mb-4">
            Participants ({participantCount + 1})
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                {userData.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{userData.name} (You)</p>
                <p className="text-sm text-gray-400">{userData.role}</p>
              </div>
            </div>
            {participants.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center space-x-3 p-2 bg-gray-700 rounded"
              >
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{participant.name}</p>
                  <p className="text-sm text-gray-400">{participant.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File sharing panel */}
      {showFileSharing && isInCall && (
        <div className="absolute top-16 left-4 w-80 bg-gray-800 rounded-lg shadow-lg p-4 z-20 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Shared Files ({sharedFiles.length})
            </h3>
            <div className="text-xs text-gray-400">
              {participantCount} peers
            </div>
          </div>
          {sharedFiles.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-2">No files shared yet</p>
              <p className="text-xs text-gray-500">
                Share files by dragging them here or clicking the share button
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sharedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {formatFileSize(file.size)} • {file.uploadedBy}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.url ? "Ready to download" : "Processing..."}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadFile(file)}
                    disabled={!file.url && !file.data}
                    className="ml-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="*/*"
      />
    </div>
  );
};
