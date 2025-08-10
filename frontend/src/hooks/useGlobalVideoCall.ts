import { useState, useEffect, useRef, useCallback } from "react";
import {
  globalWebRTCService,
  CallParticipant,
  GlobalCallState,
  FileItem,
} from "../services/globalWebRTC";

export interface UseGlobalVideoCallOptions {
  autoJoin?: boolean;
  userData?: CallParticipant;
}

export function useGlobalVideoCall({
  autoJoin = false,
  userData,
}: UseGlobalVideoCallOptions = {}) {
  const [callState, setCallState] = useState<GlobalCallState>({
    isInCall: false,
    isConnecting: false,
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    isVideoEnabled: false, // Camera disabled by default
    isAudioEnabled: true,
    isScreenSharing: false,
    sharedFiles: [],
  });

  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [sharedFiles, setSharedFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Join call
  const joinCall = useCallback(
    async (userInfo?: CallParticipant) => {
      try {
        setError(null);
        setCallState((prev) => ({ ...prev, isConnecting: true }));

        const userToJoin = userInfo || userData;
        if (!userToJoin) {
          throw new Error("User data is required to join call");
        }

        console.log(
          "🚀 Attempting to join global video call with user:",
          userToJoin
        );
        await globalWebRTCService.joinCall(userToJoin);
        console.log("✅ Successfully joined global video call");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to join call";
        setError(errorMessage);
        setCallState((prev) => ({ ...prev, isConnecting: false }));
        console.error("❌ Failed to join call:", err);
      }
    },
    [userData]
  );

  // Leave call
  const leaveCall = useCallback(async () => {
    try {
      setError(null);
      await globalWebRTCService.leaveCall();
      setParticipants([]);
      setSharedFiles([]);
      console.log("✅ Successfully left global video call");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to leave call";
      setError(errorMessage);
      console.error("❌ Failed to leave call:", err);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      const isEnabled = await globalWebRTCService.toggleVideo();
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
      const isEnabled = await globalWebRTCService.toggleAudio();
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
      await globalWebRTCService.shareFile(file);
      console.log("✅ File shared successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to share file";
      setError(errorMessage);
      console.error("❌ Failed to share file:", err);
      throw err;
    }
  }, []);

  // Download file
  const downloadFile = useCallback((file: FileItem) => {
    try {
      if (file.url) {
        const link = document.createElement("a");
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`✅ Downloaded file: ${file.name}`);
      } else if (file.data) {
        const blob = new Blob([file.data], { type: file.type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log(`✅ Downloaded file: ${file.name}`);
      }
    } catch (err) {
      console.error("❌ Failed to download file:", err);
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
    const unsubscribeStateChange = globalWebRTCService.onStateChange(
      (state) => {
        setCallState(state);
      }
    );

    const unsubscribeParticipantJoined =
      globalWebRTCService.onParticipantJoined((participant) => {
        setParticipants((prev) => {
          const exists = prev.find((p) => p.userId === participant.userId);
          if (exists) return prev;
          return [...prev, participant];
        });
        console.log(`👤 Participant joined: ${participant.name}`);
      });

    const unsubscribeParticipantLeft = globalWebRTCService.onParticipantLeft(
      (userId) => {
        setParticipants((prev) => prev.filter((p) => p.userId !== userId));

        // Clean up video ref
        const videoRef = remoteVideoRefs.current.get(userId);
        if (videoRef) {
          videoRef.srcObject = null;
          remoteVideoRefs.current.delete(userId);
        }

        console.log(`👤 Participant left: ${userId}`);
      }
    );

    const unsubscribeFileShared = globalWebRTCService.onFileShared((file) => {
      setSharedFiles((prev) => {
        const exists = prev.find((f) => f.id === file.id);
        if (exists) return prev;
        return [...prev, file];
      });
      console.log(`📁 File shared: ${file.name}`);
    });

    const unsubscribeRemoteStream = globalWebRTCService.onRemoteStream(
      (userId, stream) => {
        const videoRef = getVideoRef(userId);
        if (videoRef) {
          videoRef.srcObject = stream;
        }
        console.log(`📹 Remote stream received from: ${userId}`);
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
  };
}

// Hook for managing video elements for multiple participants
export function useParticipantVideos(participants: CallParticipant[]) {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const getVideoElement = useCallback((userId: string): HTMLVideoElement => {
    if (!videoRefs.current.has(userId)) {
      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = false;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      videoRefs.current.set(userId, video);
    }
    return videoRefs.current.get(userId)!;
  }, []);

  const setVideoStream = useCallback(
    (userId: string, stream: MediaStream | null) => {
      const video = getVideoElement(userId);
      video.srcObject = stream;
    },
    [getVideoElement]
  );

  const removeVideoElement = useCallback((userId: string) => {
    const video = videoRefs.current.get(userId);
    if (video) {
      video.srcObject = null;
      videoRefs.current.delete(userId);
    }
  }, []);

  // Clean up removed participants
  useEffect(() => {
    const currentParticipantIds = new Set(participants.map((p) => p.userId));
    const videoRefIds = Array.from(videoRefs.current.keys());

    videoRefIds.forEach((userId) => {
      if (!currentParticipantIds.has(userId)) {
        removeVideoElement(userId);
      }
    });
  }, [participants, removeVideoElement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      videoRefs.current.forEach((video) => {
        video.srcObject = null;
      });
      videoRefs.current.clear();
    };
  }, []);

  return {
    getVideoElement,
    setVideoStream,
    removeVideoElement,
  };
}
