import { webSocketService } from './websocket';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  video: boolean;
  audio: boolean;
}

export interface MediaDevices {
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
}

export interface CallState {
  isConnected: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private sessionId: string | null = null;
  private isInitiator = false;
  private dataChannel: RTCDataChannel | null = null;

  // Event listeners
  private onLocalStreamListeners: ((stream: MediaStream) => void)[] = [];
  private onRemoteStreamListeners: ((stream: MediaStream) => void)[] = [];
  private onCallStateListeners: ((state: CallState) => void)[] = [];
  private onDataChannelMessageListeners: ((data: any) => void)[] = [];

  private config: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
    video: true,
    audio: true,
  };

  async initializeCall(sessionId: string, isInitiator: boolean): Promise<void> {
    this.sessionId = sessionId;
    this.isInitiator = isInitiator;

    try {
      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.config.iceServers,
      });

      // Set up event listeners
      this.setupPeerConnectionListeners();

      // Get user media
      await this.getUserMedia();

      // Create data channel for file sharing and messaging
      if (this.isInitiator) {
        this.dataChannel = this.peerConnection.createDataChannel('messages', {
          ordered: true,
        });
        this.setupDataChannelListeners(this.dataChannel);
      } else {
        this.peerConnection.ondatachannel = (event) => {
          this.dataChannel = event.channel;
          this.setupDataChannelListeners(this.dataChannel);
        };
      }

      // Set up WebSocket signaling
      this.setupSignaling();

      if (this.isInitiator) {
        await this.createOffer();
      }

      console.log('✅ WebRTC call initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC call:', error);
      throw error;
    }
  }

  private async getUserMedia(): Promise<void> {
    try {
      const constraints = {
        video: this.config.video,
        audio: this.config.audio,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Add tracks to peer connection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      this.notifyLocalStreamListeners(this.localStream);
      console.log('✅ Local media stream obtained');
    } catch (error) {
      console.error('❌ Failed to get user media:', error);
      throw error;
    }
  }

  private setupPeerConnectionListeners(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.sessionId) {
        webSocketService.sendMessage(
          this.sessionId,
          JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
          }),
          'System',
          'text'
        );
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('📹 Remote track received');
      this.remoteStream = event.streams[0];
      this.notifyRemoteStreamListeners(this.remoteStream);
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', this.peerConnection?.connectionState);
      this.notifyCallStateListeners();
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', this.peerConnection?.iceConnectionState);
      this.notifyCallStateListeners();
    };
  }

  private setupDataChannelListeners(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('📡 Data channel opened');
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyDataChannelMessageListeners(data);
      } catch (error) {
        console.error('❌ Failed to parse data channel message:', error);
      }
    };

    channel.onerror = (error) => {
      console.error('❌ Data channel error:', error);
    };
  }

  private setupSignaling(): void {
    // Listen for WebSocket messages related to WebRTC signaling
    webSocketService.onMessage((message) => {
      if (message.sessionId === this.sessionId && message.type === 'text') {
        try {
          const data = JSON.parse(message.message);
          this.handleSignalingMessage(data);
        } catch (error) {
          // Not a signaling message, ignore
        }
      }
    });
  }

  private async handleSignalingMessage(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      switch (data.type) {
        case 'offer':
          await this.peerConnection.setRemoteDescription(data.offer);
          await this.createAnswer();
          break;

        case 'answer':
          await this.peerConnection.setRemoteDescription(data.answer);
          break;

        case 'ice-candidate':
          await this.peerConnection.addIceCandidate(data.candidate);
          break;

        default:
          console.log('Unknown signaling message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error handling signaling message:', error);
    }
  }

  private async createOffer(): Promise<void> {
    if (!this.peerConnection || !this.sessionId) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      webSocketService.sendMessage(
        this.sessionId,
        JSON.stringify({
          type: 'offer',
          offer: offer,
        }),
        'System',
        'text'
      );

      console.log('📤 Offer sent');
    } catch (error) {
      console.error('❌ Failed to create offer:', error);
    }
  }

  private async createAnswer(): Promise<void> {
    if (!this.peerConnection || !this.sessionId) return;

    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      webSocketService.sendMessage(
        this.sessionId,
        JSON.stringify({
          type: 'answer',
          answer: answer,
        }),
        'System',
        'text'
      );

      console.log('📤 Answer sent');
    } catch (error) {
      console.error('❌ Failed to create answer:', error);
    }
  }

  async toggleVideo(): Promise<boolean> {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.config.video = videoTrack.enabled;
      this.notifyCallStateListeners();
      return videoTrack.enabled;
    }
    return false;
  }

  async toggleAudio(): Promise<boolean> {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.config.audio = audioTrack.enabled;
      this.notifyCallStateListeners();
      return audioTrack.enabled;
    }
    return false;
  }

  async startScreenShare(): Promise<boolean> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      if (this.peerConnection && this.localStream) {
        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = this.peerConnection
          .getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Handle screen share end
        videoTrack.onended = () => {
          this.stopScreenShare();
        };

        this.notifyCallStateListeners();
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to start screen share:', error);
    }
    return false;
  }

  async stopScreenShare(): Promise<void> {
    if (this.peerConnection && this.localStream) {
      // Replace screen share with camera
      const videoTrack = this.localStream.getVideoTracks()[0];
      const sender = this.peerConnection
        .getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      this.notifyCallStateListeners();
    }
  }

  sendDataChannelMessage(data: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  async getMediaDevices(): Promise<MediaDevices> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    return {
      videoDevices: devices.filter(device => device.kind === 'videoinput'),
      audioDevices: devices.filter(device => device.kind === 'audioinput'),
      audioOutputDevices: devices.filter(device => device.kind === 'audiooutput'),
    };
  }

  getCallState(): CallState {
    return {
      isConnected: this.peerConnection?.connectionState === 'connected',
      isVideoEnabled: this.config.video,
      isAudioEnabled: this.config.audio,
      isScreenSharing: false, // TODO: Track screen sharing state
      connectionState: this.peerConnection?.connectionState || 'new',
      iceConnectionState: this.peerConnection?.iceConnectionState || 'new',
    };
  }

  endCall(): void {
    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Clear remote stream
    this.remoteStream = null;
    this.sessionId = null;

    console.log('📞 Call ended');
  }

  // Event listener management
  onLocalStream(callback: (stream: MediaStream) => void): () => void {
    this.onLocalStreamListeners.push(callback);
    return () => {
      this.onLocalStreamListeners = this.onLocalStreamListeners.filter(cb => cb !== callback);
    };
  }

  onRemoteStream(callback: (stream: MediaStream) => void): () => void {
    this.onRemoteStreamListeners.push(callback);
    return () => {
      this.onRemoteStreamListeners = this.onRemoteStreamListeners.filter(cb => cb !== callback);
    };
  }

  onCallStateChange(callback: (state: CallState) => void): () => void {
    this.onCallStateListeners.push(callback);
    return () => {
      this.onCallStateListeners = this.onCallStateListeners.filter(cb => cb !== callback);
    };
  }

  onDataChannelMessage(callback: (data: any) => void): () => void {
    this.onDataChannelMessageListeners.push(callback);
    return () => {
      this.onDataChannelMessageListeners = this.onDataChannelMessageListeners.filter(cb => cb !== callback);
    };
  }

  // Private notification methods
  private notifyLocalStreamListeners(stream: MediaStream): void {
    this.onLocalStreamListeners.forEach(callback => callback(stream));
  }

  private notifyRemoteStreamListeners(stream: MediaStream): void {
    this.onRemoteStreamListeners.forEach(callback => callback(stream));
  }

  private notifyCallStateListeners(): void {
    const state = this.getCallState();
    this.onCallStateListeners.forEach(callback => callback(state));
  }

  private notifyDataChannelMessageListeners(data: any): void {
    this.onDataChannelMessageListeners.forEach(callback => callback(data));
  }
}

// Create and export singleton instance
export const webRTCService = new WebRTCService();
export default webRTCService;
