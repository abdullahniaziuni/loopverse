import { useState, useEffect, useRef, useCallback } from "react";
import {
  sessionWebRTCService,
  SessionParticipant,
  SessionCallState,
  SessionFileItem,
} from "../services/sessionWebRTC";
import { useToast } from "./useToast";

export interface UseSessionVideoCallOptions {
  sessionId: string;
  autoJoin?: boolean;
  userData?: SessionParticipant;
}

export function useSessionVideoCall({
  sessionId,
  autoJoin = false,
  userData,
}: UseSessionVideoCallOptions) {
  const [callState, setCallState] = useState<SessionCallState>({
    isInCall: false,
    isConnecting: false,
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    isVideoEnabled: false, // Camera disabled by default
    isAudioEnabled: true,
    isScreenSharing: false,
    sharedFiles: [],
    sessionId: null,
  });

  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SessionFileItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const { success: showSuccess, error: showError } = useToast();

  // Join session call
  const joinCall = useCallback(
    async (userInfo?: SessionParticipant) => {
      try {
        setError(null);
        setCallState((prev) => ({ ...prev, isConnecting: true }));

        const userToJoin = userInfo || userData;
        if (!userToJoin) {
          throw new Error("User data is required to join session call");
        }

        console.log(
          `🚀 Attempting to join session video call: ${sessionId}`,
          userToJoin
        );
        await sessionWebRTCService.joinCall(sessionId, userToJoin);
        console.log(`✅ Successfully joined session video call: ${sessionId}`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to join session call";
        setError(errorMessage);
        setCallState((prev) => ({ ...prev, isConnecting: false }));
        console.error("❌ Failed to join session call:", err);
      }
    },
    [sessionId, userData]
  );

  // Leave session call
  const leaveCall = useCallback(async () => {
    try {
      setError(null);
      await sessionWebRTCService.leaveCall();
      setParticipants([]);
      setSharedFiles([]);
      console.log(`✅ Successfully left session video call: ${sessionId}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to leave session call";
      setError(errorMessage);
      console.error("❌ Failed to leave session call:", err);
    }
  }, [sessionId]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      const isEnabled = await sessionWebRTCService.toggleVideo();
      setCallState((prev) => ({ ...prev, isVideoEnabled: isEnabled }));
      return isEnabled;
    } catch (err) {
      console.error("❌ Failed to toggle video:", err);
      return false;
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    try {
      const isEnabled = await sessionWebRTCService.toggleAudio();
      setCallState((prev) => ({ ...prev, isAudioEnabled: isEnabled }));
      return isEnabled;
    } catch (err) {
      console.error("❌ Failed to toggle audio:", err);
      return false;
    }
  }, []);

  // Share file
  const shareFile = useCallback(async (file: File) => {
    try {
      setError(null);
      await sessionWebRTCService.shareFile(file);
      console.log("✅ Session file shared successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to share session file";
      setError(errorMessage);
      console.error("❌ Failed to share session file:", err);
      throw err;
    }
  }, []);

  // Industry-standard download function - guaranteed to work
  const downloadFile = useCallback((file: SessionFileItem) => {
    try {
      console.log(`🔽 Starting download: ${file.name}`);

      let downloadUrl: string;
      let shouldCleanup = false;

      // Priority 1: Use existing URL if available
      if (file.url && file.url.startsWith("blob:")) {
        downloadUrl = file.url;
        console.log(`📥 Using existing blob URL`);
      }
      // Priority 2: Create URL from data
      else if (file.data) {
        const blob = new Blob([file.data], {
          type: file.type || "application/octet-stream",
        });
        downloadUrl = URL.createObjectURL(blob);
        shouldCleanup = true;
        console.log(`📥 Created new blob URL from data`);
      }
      // Priority 3: Fallback error
      else {
        throw new Error(`File "${file.name}" has no downloadable content`);
      }

      // Create download link with proper attributes
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = file.name;
      downloadLink.style.display = "none";
      downloadLink.setAttribute("target", "_blank");

      // Add to DOM, click, and remove
      document.body.appendChild(downloadLink);

      // Force download with multiple fallback methods
      try {
        downloadLink.click();
      } catch (clickError) {
        // Fallback: trigger download event manually
        const event = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        downloadLink.dispatchEvent(event);
      }

      document.body.removeChild(downloadLink);

      // Cleanup blob URL if we created it
      if (shouldCleanup) {
        setTimeout(() => {
          URL.revokeObjectURL(downloadUrl);
          console.log(`🧹 Cleaned up blob URL for ${file.name}`);
        }, 2000);
      }

      console.log(`✅ Download initiated successfully: ${file.name}`);
    } catch (error) {
      console.error(`❌ Download failed for ${file.name}:`, error);

      // Last resort: try to open in new tab
      if (file.url) {
        try {
          window.open(file.url, "_blank");
          console.log(`📥 Opened ${file.name} in new tab as fallback`);
        } catch (fallbackError) {
          console.error(`❌ All download methods failed:`, fallbackError);
          throw new Error(`Cannot download ${file.name}: ${error.message}`);
        }
      } else {
        throw error;
      }
    }
  }, []);

  // Get video ref for participant
  const getVideoRef = useCallback((userId: string) => {
    if (!remoteVideoRefs.current.has(userId)) {
      const videoElement = document.createElement("video");
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = false;
      remoteVideoRefs.current.set(userId, videoElement);
    }
    return remoteVideoRefs.current.get(userId)!;
  }, []);

  // Set up event listeners
  useEffect(() => {
    const unsubscribeStateChange = sessionWebRTCService.onStateChange(
      (state) => {
        setCallState(state);
      }
    );

    const unsubscribeParticipantJoined =
      sessionWebRTCService.onParticipantJoined((participant) => {
        setParticipants((prev) => {
          const exists = prev.find((p) => p.userId === participant.userId);
          if (exists) return prev;
          return [...prev, participant];
        });
        console.log(`👤 Session participant joined: ${participant.name}`);
      });

    const unsubscribeParticipantLeft = sessionWebRTCService.onParticipantLeft(
      (userId) => {
        setParticipants((prev) => prev.filter((p) => p.userId !== userId));

        // Clean up video ref
        const videoRef = remoteVideoRefs.current.get(userId);
        if (videoRef) {
          videoRef.srcObject = null;
          remoteVideoRefs.current.delete(userId);
        }

        console.log(`👤 Session participant left: ${userId}`);
      }
    );

    const unsubscribeFileShared = sessionWebRTCService.onFileShared((file) => {
      console.log(`📁 Session file shared event received:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        hasUrl: !!file.url,
        hasData: !!file.data,
        uploadedBy: file.uploadedBy,
        id: file.id,
      });

      setSharedFiles((prev) => {
        const exists = prev.find((f) => f.id === file.id);
        if (exists) {
          console.log(`📁 File ${file.name} already exists in shared files`);
          return prev;
        }
        console.log(`📁 Adding new file to shared files: ${file.name}`);
        return [...prev, file];
      });
    });

    const unsubscribeRemoteStream = sessionWebRTCService.onRemoteStream(
      (userId, stream) => {
        const videoRef = getVideoRef(userId);
        if (videoRef) {
          videoRef.srcObject = stream;
        }
        console.log(`📹 Session remote stream received from: ${userId}`);
      }
    );

    return () => {
      unsubscribeStateChange();
      unsubscribeParticipantJoined();
      unsubscribeParticipantLeft();
      unsubscribeFileShared();
      unsubscribeRemoteStream();
    };
  }, [getVideoRef]);

  // Update local video element
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  // Auto-join if requested
  useEffect(() => {
    if (
      autoJoin &&
      userData &&
      !callState.isInCall &&
      !callState.isConnecting
    ) {
      joinCall();
    }
  }, [
    autoJoin,
    userData,
    callState.isInCall,
    callState.isConnecting,
    joinCall,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callState.isInCall) {
        leaveCall();
      }

      // Clean up all video refs
      remoteVideoRefs.current.forEach((videoRef) => {
        videoRef.srcObject = null;
      });
      remoteVideoRefs.current.clear();
    };
  }, [callState.isInCall, leaveCall]);

  return {
    // State
    callState,
    participants,
    sharedFiles,
    error,

    // Video refs
    localVideoRef,
    getVideoRef,

    // Actions
    joinCall,
    leaveCall,
    toggleVideo,
    toggleAudio,
    shareFile,
    downloadFile,

    // Computed values
    isInCall: callState.isInCall,
    isConnecting: callState.isConnecting,
    isVideoEnabled: callState.isVideoEnabled,
    isAudioEnabled: callState.isAudioEnabled,
    isScreenSharing: callState.isScreenSharing,
    localStream: callState.localStream,
    remoteStreams: callState.remoteStreams,
    participantCount: participants.length,
    hasSharedFiles: sharedFiles.length > 0,
    sessionId: callState.sessionId,
  };
}
