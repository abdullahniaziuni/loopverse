import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, Copy, Settings } from 'lucide-react';
import { Button, Input, Modal } from '../ui';
import { useToast } from '../../hooks/useToast';

interface VideoCallManagerProps {
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'mentor' | 'learner';
  onCallEnd?: () => void;
}

interface CallState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isCallActive: boolean;
  isConnecting: boolean;
  participants: Array<{
    id: string;
    name: string;
    role: string;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
  }>;
  meetingCode: string;
}

export const VideoCallManager: React.FC<VideoCallManagerProps> = ({
  sessionId,
  currentUserId,
  currentUserName,
  currentUserRole,
  onCallEnd,
}) => {
  const [callState, setCallState] = useState<CallState>({
    isVideoEnabled: true,
    isAudioEnabled: true,
    isCallActive: false,
    isConnecting: false,
    participants: [],
    meetingCode: '',
  });
  
  const [showMeetingCode, setShowMeetingCode] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const { success: showSuccess, error: showError } = useToast();

  // Generate meeting code when component mounts
  useEffect(() => {
    const generateMeetingCode = () => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setCallState(prev => ({ ...prev, meetingCode: code }));
    };

    generateMeetingCode();
  }, [sessionId]);

  // Initialize local media stream
  const initializeLocalStream = async () => {
    try {
      console.log('🎥 VideoCallManager - Initializing local stream');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callState.isVideoEnabled,
        audio: callState.isAudioEnabled,
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      console.log('✅ VideoCallManager - Local stream initialized');
      return stream;
    } catch (error) {
      console.error('💥 VideoCallManager - Error accessing media devices:', error);
      showError('Failed to access camera/microphone. Please check permissions.');
      throw error;
    }
  };

  // Start call
  const startCall = async () => {
    try {
      setCallState(prev => ({ ...prev, isConnecting: true }));
      
      await initializeLocalStream();
      
      // TODO: Implement WebRTC connection logic here
      // For now, we'll simulate a call
      setTimeout(() => {
        setCallState(prev => ({
          ...prev,
          isCallActive: true,
          isConnecting: false,
          participants: [
            {
              id: currentUserId,
              name: currentUserName,
              role: currentUserRole,
              isVideoEnabled: prev.isVideoEnabled,
              isAudioEnabled: prev.isAudioEnabled,
            },
          ],
        }));
        
        showSuccess('Call started successfully!');
        console.log('✅ VideoCallManager - Call started');
      }, 2000);
      
    } catch (error) {
      setCallState(prev => ({ ...prev, isConnecting: false }));
      console.error('💥 VideoCallManager - Error starting call:', error);
    }
  };

  // End call
  const endCall = () => {
    console.log('📞 VideoCallManager - Ending call');
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    setCallState(prev => ({
      ...prev,
      isCallActive: false,
      isConnecting: false,
      participants: [],
    }));
    
    showSuccess('Call ended');
    onCallEnd?.();
  };

  // Toggle video
  const toggleVideo = () => {
    const newVideoState = !callState.isVideoEnabled;
    
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = newVideoState;
      }
    }
    
    setCallState(prev => ({ ...prev, isVideoEnabled: newVideoState }));
    console.log('🎥 VideoCallManager - Video toggled:', newVideoState);
  };

  // Toggle audio
  const toggleAudio = () => {
    const newAudioState = !callState.isAudioEnabled;
    
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = newAudioState;
      }
    }
    
    setCallState(prev => ({ ...prev, isAudioEnabled: newAudioState }));
    console.log('🎤 VideoCallManager - Audio toggled:', newAudioState);
  };

  // Copy meeting code
  const copyMeetingCode = () => {
    navigator.clipboard.writeText(callState.meetingCode);
    showSuccess('Meeting code copied to clipboard!');
  };

  // Join call with code
  const joinWithCode = async () => {
    if (!joinCode.trim()) {
      showError('Please enter a meeting code');
      return;
    }
    
    console.log('🔗 VideoCallManager - Joining call with code:', joinCode);
    
    try {
      setCallState(prev => ({ ...prev, isConnecting: true }));
      setShowJoinModal(false);
      
      await initializeLocalStream();
      
      // TODO: Implement actual join logic
      setTimeout(() => {
        setCallState(prev => ({
          ...prev,
          isCallActive: true,
          isConnecting: false,
          participants: [
            {
              id: currentUserId,
              name: currentUserName,
              role: currentUserRole,
              isVideoEnabled: prev.isVideoEnabled,
              isAudioEnabled: prev.isAudioEnabled,
            },
          ],
        }));
        
        showSuccess('Joined call successfully!');
      }, 2000);
      
    } catch (error) {
      setCallState(prev => ({ ...prev, isConnecting: false }));
      console.error('💥 VideoCallManager - Error joining call:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Video Call - Session {sessionId}
          </h3>
          <div className="flex items-center space-x-2">
            {currentUserRole === 'mentor' && (
              <Button
                onClick={() => setShowMeetingCode(!showMeetingCode)}
                size="sm"
                variant="outline"
                className="flex items-center space-x-1"
              >
                <Users className="h-4 w-4" />
                <span>Meeting Code</span>
              </Button>
            )}
            <Button
              onClick={() => setShowJoinModal(true)}
              size="sm"
              variant="outline"
              className="flex items-center space-x-1"
            >
              <Video className="h-4 w-4" />
              <span>Join Call</span>
            </Button>
          </div>
        </div>
        
        {/* Meeting Code Display */}
        {showMeetingCode && currentUserRole === 'mentor' && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Meeting Code:</p>
                <p className="text-lg font-mono font-bold text-blue-700">{callState.meetingCode}</p>
                <p className="text-xs text-blue-600">Share this code with your student to join the call</p>
              </div>
              <Button
                onClick={copyMeetingCode}
                size="sm"
                className="flex items-center space-x-1"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Video Area */}
      <div className="relative h-96 bg-gray-900">
        {callState.isCallActive ? (
          <div className="grid grid-cols-1 md:grid-cols-2 h-full">
            {/* Local Video */}
            <div className="relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You ({currentUserRole})
              </div>
            </div>
            
            {/* Remote Video */}
            <div className="relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-gray-800"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {callState.participants.length > 1 ? 'Remote User' : 'Waiting for participant...'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              {callState.isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Connecting...</p>
                </>
              ) : (
                <>
                  <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Click "Start Call" to begin video session</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4">
          {callState.isCallActive ? (
            <>
              <Button
                onClick={toggleVideo}
                variant={callState.isVideoEnabled ? "default" : "destructive"}
                size="sm"
                className="flex items-center space-x-1"
              >
                {callState.isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                <span>{callState.isVideoEnabled ? 'Video On' : 'Video Off'}</span>
              </Button>
              
              <Button
                onClick={toggleAudio}
                variant={callState.isAudioEnabled ? "default" : "destructive"}
                size="sm"
                className="flex items-center space-x-1"
              >
                {callState.isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                <span>{callState.isAudioEnabled ? 'Mic On' : 'Mic Off'}</span>
              </Button>
              
              <Button
                onClick={endCall}
                variant="destructive"
                size="sm"
                className="flex items-center space-x-1"
              >
                <PhoneOff className="h-4 w-4" />
                <span>End Call</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={startCall}
              disabled={callState.isConnecting}
              className="flex items-center space-x-1"
            >
              <Phone className="h-4 w-4" />
              <span>{callState.isConnecting ? 'Connecting...' : 'Start Call'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Join Call Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Video Call"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter the meeting code provided by your mentor to join the video call.
          </p>
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter meeting code (e.g., ABC123)"
            className="w-full text-center font-mono text-lg"
            maxLength={6}
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowJoinModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={joinWithCode}
              disabled={!joinCode.trim() || callState.isConnecting}
            >
              {callState.isConnecting ? 'Joining...' : 'Join Call'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
