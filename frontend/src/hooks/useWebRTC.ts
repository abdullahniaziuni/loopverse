import { useEffect, useState, useRef, useCallback } from 'react';
import { webRTCService, CallState, MediaDevices } from '../services/webrtc';

export interface UseWebRTCOptions {
  sessionId: string;
  isInitiator: boolean;
  autoStart?: boolean;
}

export function useWebRTC({ sessionId, isInitiator, autoStart = false }: UseWebRTCOptions) {
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isScreenSharing: false,
    connectionState: 'new',
    iceConnectionState: 'new',
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaDevices, setMediaDevices] = useState<MediaDevices>({
    videoDevices: [],
    audioDevices: [],
    audioOutputDevices: [],
  });
  const [isCallActive, setIsCallActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize call
  const startCall = useCallback(async () => {
    try {
      setError(null);
      await webRTCService.initializeCall(sessionId, isInitiator);
      setIsCallActive(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start call';
      setError(errorMessage);
      console.error('Failed to start call:', err);
    }
  }, [sessionId, isInitiator]);

  // End call
  const endCall = useCallback(() => {
    webRTCService.endCall();
    setIsCallActive(false);
    setLocalStream(null);
    setRemoteStream(null);
    setCallState({
      isConnected: false,
      isVideoEnabled: true,
      isAudioEnabled: true,
      isScreenSharing: false,
      connectionState: 'closed',
      iceConnectionState: 'closed',
    });
  }, []);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      const enabled = await webRTCService.toggleVideo();
      setCallState(prev => ({ ...prev, isVideoEnabled: enabled }));
      return enabled;
    } catch (err) {
      console.error('Failed to toggle video:', err);
      return false;
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    try {
      const enabled = await webRTCService.toggleAudio();
      setCallState(prev => ({ ...prev, isAudioEnabled: enabled }));
      return enabled;
    } catch (err) {
      console.error('Failed to toggle audio:', err);
      return false;
    }
  }, []);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    try {
      const success = await webRTCService.startScreenShare();
      if (success) {
        setCallState(prev => ({ ...prev, isScreenSharing: true }));
      }
      return success;
    } catch (err) {
      console.error('Failed to start screen share:', err);
      return false;
    }
  }, []);

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    try {
      await webRTCService.stopScreenShare();
      setCallState(prev => ({ ...prev, isScreenSharing: false }));
    } catch (err) {
      console.error('Failed to stop screen share:', err);
    }
  }, []);

  // Send data channel message
  const sendDataMessage = useCallback((data: any) => {
    webRTCService.sendDataChannelMessage(data);
  }, []);

  // Get available media devices
  const refreshMediaDevices = useCallback(async () => {
    try {
      const devices = await webRTCService.getMediaDevices();
      setMediaDevices(devices);
    } catch (err) {
      console.error('Failed to get media devices:', err);
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const unsubscribeLocalStream = webRTCService.onLocalStream((stream) => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

    const unsubscribeRemoteStream = webRTCService.onRemoteStream((stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    const unsubscribeCallState = webRTCService.onCallStateChange((state) => {
      setCallState(state);
    });

    return () => {
      unsubscribeLocalStream();
      unsubscribeRemoteStream();
      unsubscribeCallState();
    };
  }, []);

  // Auto-start call if requested
  useEffect(() => {
    if (autoStart && sessionId && !isCallActive) {
      startCall();
    }
  }, [autoStart, sessionId, isCallActive, startCall]);

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Get media devices on mount
  useEffect(() => {
    refreshMediaDevices();
  }, [refreshMediaDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCallActive) {
        endCall();
      }
    };
  }, [isCallActive, endCall]);

  return {
    // State
    callState,
    localStream,
    remoteStream,
    mediaDevices,
    isCallActive,
    error,

    // Refs for video elements
    localVideoRef,
    remoteVideoRef,

    // Actions
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    sendDataMessage,
    refreshMediaDevices,

    // Computed values
    isConnected: callState.isConnected,
    isVideoEnabled: callState.isVideoEnabled,
    isAudioEnabled: callState.isAudioEnabled,
    isScreenSharing: callState.isScreenSharing,
    connectionState: callState.connectionState,
    iceConnectionState: callState.iceConnectionState,
  };
}

// Hook for data channel messaging
export function useDataChannel(sessionId: string) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = webRTCService.onDataChannelMessage((data) => {
      setMessages(prev => [...prev, { ...data, timestamp: new Date() }]);
    });

    return unsubscribe;
  }, []);

  const sendMessage = useCallback((data: any) => {
    webRTCService.sendDataChannelMessage(data);
    // Add to local messages for immediate feedback
    setMessages(prev => [...prev, { ...data, timestamp: new Date(), isOwn: true }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
  };
}

// Hook for media device management
export function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDevices>({
    videoDevices: [],
    audioDevices: [],
    audioOutputDevices: [],
  });
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');

  const refreshDevices = useCallback(async () => {
    try {
      const mediaDevices = await webRTCService.getMediaDevices();
      setDevices(mediaDevices);

      // Set default devices if not already selected
      if (!selectedVideoDevice && mediaDevices.videoDevices.length > 0) {
        setSelectedVideoDevice(mediaDevices.videoDevices[0].deviceId);
      }
      if (!selectedAudioDevice && mediaDevices.audioDevices.length > 0) {
        setSelectedAudioDevice(mediaDevices.audioDevices[0].deviceId);
      }
      if (!selectedAudioOutput && mediaDevices.audioOutputDevices.length > 0) {
        setSelectedAudioOutput(mediaDevices.audioOutputDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to refresh media devices:', error);
    }
  }, [selectedVideoDevice, selectedAudioDevice, selectedAudioOutput]);

  useEffect(() => {
    refreshDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      refreshDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  return {
    devices,
    selectedVideoDevice,
    selectedAudioDevice,
    selectedAudioOutput,
    setSelectedVideoDevice,
    setSelectedAudioDevice,
    setSelectedAudioOutput,
    refreshDevices,
  };
}
