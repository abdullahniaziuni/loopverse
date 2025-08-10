import { webSocketService } from "./websocket";
import { WEBRTC_CONFIG } from "../config";

export interface CallParticipant {
  userId: string;
  name: string;
  role: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
}

export interface GlobalCallState {
  isInCall: boolean;
  isConnecting: boolean;
  participants: CallParticipant[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  sharedFiles: FileItem[];
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  data?: ArrayBuffer;
  uploadedBy: string;
  uploadedAt: Date;
}

class GlobalWebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private currentUser: CallParticipant | null = null;
  private participants: Map<string, CallParticipant> = new Map();
  private isInCall = false;

  // File chunk management
  private fileChunks: Map<
    string,
    { metadata: any; chunks: any[]; receivedChunks: number }
  > = new Map();

  // Event listeners
  private onStateChangeListeners: ((state: GlobalCallState) => void)[] = [];
  private onParticipantJoinedListeners: ((
    participant: CallParticipant
  ) => void)[] = [];
  private onParticipantLeftListeners: ((userId: string) => void)[] = [];
  private onFileSharedListeners: ((file: FileItem) => void)[] = [];
  private onRemoteStreamListeners: ((
    userId: string,
    stream: MediaStream
  ) => void)[] = [];

  private config = {
    iceServers: WEBRTC_CONFIG.ICE_SERVERS,
    video: false, // Camera disabled by default
    audio: WEBRTC_CONFIG.AUDIO_CONSTRAINTS,
  };

  constructor() {
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners(): void {
    // Listen for WebSocket events
    webSocketService.onConnectionChange((isConnected) => {
      if (!isConnected && this.isInCall) {
        this.leaveCall();
      }

      // Re-setup listeners when connection is established
      if (isConnected) {
        this.attachSocketListeners();
      }
    });

    // Initial setup if already connected
    if (webSocketService.socket?.connected) {
      this.attachSocketListeners();
    }
  }

  private attachSocketListeners(): void {
    const socket = webSocketService.socket;
    if (!socket) return;

    // Remove existing listeners to prevent duplicates
    socket.off("user_joined_call");
    socket.off("user_left_call");
    socket.off("current_call_participants");
    socket.off("webrtc_offer");
    socket.off("webrtc_answer");
    socket.off("webrtc_ice_candidate");
    socket.off("file_shared_in_call");

    // Handle new participants joining
    socket.on("user_joined_call", (data: { userId: string; userData: any }) => {
      console.log("🔔 Received user_joined_call event:", data);
      this.handleUserJoinedCall(data.userId, data.userData);
    });

    // Handle participants leaving
    socket.on("user_left_call", (data: { userId: string }) => {
      console.log("🔔 Received user_left_call event:", data);
      this.handleUserLeftCall(data.userId);
    });

    // Handle current participants when joining
    socket.on("current_call_participants", (participants: any[]) => {
      console.log("🔔 Received current_call_participants event:", participants);
      this.handleCurrentParticipants(participants);
    });

    // Handle WebRTC signaling
    socket.on(
      "webrtc_offer",
      (data: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
        console.log("🔔 Received webrtc_offer event:", data);
        this.handleOffer(data.fromUserId, data.offer);
      }
    );

    socket.on(
      "webrtc_answer",
      (data: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
        console.log("🔔 Received webrtc_answer event:", data);
        this.handleAnswer(data.fromUserId, data.answer);
      }
    );

    socket.on(
      "webrtc_ice_candidate",
      (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
        console.log("🔔 Received webrtc_ice_candidate event:", data);
        this.handleIceCandidate(data.fromUserId, data.candidate);
      }
    );

    // Handle file sharing
    socket.on(
      "file_shared_in_call",
      (data: { fromUserId: string; fromUserName: string; fileData: any }) => {
        console.log("🔔 Received file_shared_in_call event:", data);
        this.handleFileShared(
          data.fromUserId,
          data.fromUserName,
          data.fileData
        );
      }
    );

    console.log("✅ WebSocket listeners attached for global video call");
  }

  async joinCall(userData: CallParticipant): Promise<void> {
    try {
      this.currentUser = userData;
      this.isInCall = true;

      // Ensure WebSocket is connected
      if (!webSocketService.isConnected) {
        console.log("🔌 WebSocket not connected, waiting for connection...");
        // Wait for connection or timeout after 5 seconds
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("WebSocket connection timeout"));
          }, 5000);

          const checkConnection = () => {
            if (webSocketService.isConnected) {
              clearTimeout(timeout);
              resolve(true);
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }

      // Ensure listeners are attached
      this.attachSocketListeners();

      // Get user media
      await this.getUserMedia();

      // Join the global call room via WebSocket
      webSocketService.joinGlobalCall(userData);

      this.notifyStateChange();
      console.log("✅ Joined global video call");
    } catch (error) {
      this.isInCall = false;
      console.error("❌ Failed to join global call:", error);
      throw error;
    }
  }

  async leaveCall(): Promise<void> {
    try {
      // Close all peer connections
      this.peerConnections.forEach((pc, userId) => {
        pc.close();
      });
      this.peerConnections.clear();

      // Close data channels
      this.dataChannels.clear();

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
        this.localStream = null;
      }

      // Clear remote streams
      this.remoteStreams.clear();

      // Clear participants
      this.participants.clear();

      // Clear file chunks
      this.fileChunks.clear();

      // Leave the global call room via WebSocket
      webSocketService.leaveGlobalCall();

      this.isInCall = false;
      this.currentUser = null;

      this.notifyStateChange();
      console.log("✅ Left global video call");
    } catch (error) {
      console.error("❌ Failed to leave global call:", error);
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

      // Update current user video state
      if (this.currentUser) {
        this.currentUser.isVideoEnabled = !!this.config.video;
      }

      console.log("✅ Local media stream obtained", constraints);
    } catch (error) {
      console.error("❌ Failed to get user media:", error);
      throw error;
    }
  }

  private async createPeerConnection(
    userId: string
  ): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log(`📹 Remote track received from ${userId}`);
      const remoteStream = event.streams[0];
      this.remoteStreams.set(userId, remoteStream);
      this.onRemoteStreamListeners.forEach((listener) =>
        listener(userId, remoteStream)
      );
      this.notifyStateChange();
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        webSocketService.sendWebRTCIceCandidate(userId, event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(
        `🔗 Connection state with ${userId}:`,
        peerConnection.connectionState
      );
      if (
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "disconnected"
      ) {
        this.handleUserLeftCall(userId);
      }
    };

    // Create data channel for file sharing
    const dataChannel = peerConnection.createDataChannel("fileSharing", {
      ordered: true,
    });
    this.setupDataChannel(userId, dataChannel);

    // Handle incoming data channels
    peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(userId, event.channel);
    };

    this.peerConnections.set(userId, peerConnection);
    return peerConnection;
  }

  private setupDataChannel(userId: string, channel: RTCDataChannel): void {
    this.dataChannels.set(userId, channel);

    channel.onopen = () => {
      console.log(`📡 Data channel opened with ${userId}`);
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(
          `📨 Received data channel message from ${userId}:`,
          data.type
        );

        switch (data.type) {
          case "file":
            this.handleFileReceived(userId, data);
            break;
          case "file_metadata":
            this.handleFileMetadata(userId, data);
            break;
          case "file_chunk":
            this.handleFileChunk(userId, data);
            break;
          default:
            console.warn(`Unknown data channel message type: ${data.type}`);
        }
      } catch (error) {
        console.error("❌ Failed to parse data channel message:", error);
      }
    };

    channel.onerror = (error) => {
      console.error(`❌ Data channel error with ${userId}:`, error);
    };
  }

  private async handleUserJoinedCall(
    userId: string,
    userData: any
  ): Promise<void> {
    if (userId === this.currentUser?.userId) {
      console.log(`🚫 Ignoring self join event for user ${userId}`);
      return;
    }

    console.log(`👤 User ${userId} joined the call with data:`, userData);

    try {
      // Create peer connection and send offer
      const peerConnection = await this.createPeerConnection(userId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      console.log(`📞 Sending offer to user ${userId}`);
      webSocketService.sendWebRTCOffer(userId, offer);

      const participant: CallParticipant = {
        userId,
        name: userData.name || "Unknown",
        role: userData.role || "user",
        isVideoEnabled: false, // Camera disabled by default
        isAudioEnabled: true,
        isScreenSharing: false,
      };

      // Store participant
      this.participants.set(userId, participant);

      console.log(`✅ Added participant:`, participant);
      this.onParticipantJoinedListeners.forEach((listener) =>
        listener(participant)
      );
      this.notifyStateChange();
    } catch (error) {
      console.error(`❌ Failed to handle user ${userId} joining:`, error);
    }
  }

  private handleUserLeftCall(userId: string): void {
    console.log(`👤 User ${userId} left the call`);

    // Close peer connection
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }

    // Remove data channel
    this.dataChannels.delete(userId);

    // Remove remote stream
    this.remoteStreams.delete(userId);

    // Remove participant
    this.participants.delete(userId);

    this.onParticipantLeftListeners.forEach((listener) => listener(userId));
    this.notifyStateChange();
  }

  private async handleCurrentParticipants(participants: any[]): Promise<void> {
    console.log(`📋 Current participants:`, participants);

    // Create peer connections for existing participants
    for (const participant of participants) {
      await this.handleUserJoinedCall(participant.userId, participant.userData);
    }
  }

  private async handleOffer(
    fromUserId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    console.log(`📞 Received offer from ${fromUserId}`, offer);

    try {
      const peerConnection = await this.createPeerConnection(fromUserId);
      await peerConnection.setRemoteDescription(offer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log(`📞 Sending answer to ${fromUserId}`);
      webSocketService.sendWebRTCAnswer(fromUserId, answer);
    } catch (error) {
      console.error(`❌ Failed to handle offer from ${fromUserId}:`, error);
    }
  }

  private async handleAnswer(
    fromUserId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    console.log(`📞 Received answer from ${fromUserId}`, answer);

    try {
      const peerConnection = this.peerConnections.get(fromUserId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
        console.log(`✅ Set remote description for ${fromUserId}`);
      } else {
        console.error(`❌ No peer connection found for ${fromUserId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to handle answer from ${fromUserId}:`, error);
    }
  }

  private async handleIceCandidate(
    fromUserId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    console.log(`🧊 Received ICE candidate from ${fromUserId}`, candidate);

    try {
      const peerConnection = this.peerConnections.get(fromUserId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
        console.log(`✅ Added ICE candidate for ${fromUserId}`);
      } else {
        console.error(`❌ No peer connection found for ${fromUserId}`);
      }
    } catch (error) {
      console.error(
        `❌ Failed to add ICE candidate from ${fromUserId}:`,
        error
      );
    }
  }

  // Media controls
  async toggleVideo(): Promise<boolean> {
    try {
      if (!this.localStream) return false;

      const videoTrack = this.localStream.getVideoTracks()[0];

      if (videoTrack) {
        // Video track exists, toggle it
        videoTrack.enabled = !videoTrack.enabled;
        if (this.currentUser) {
          this.currentUser.isVideoEnabled = videoTrack.enabled;
        }
        this.notifyStateChange();
        return videoTrack.enabled;
      } else {
        // No video track, need to add one
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: WEBRTC_CONFIG.VIDEO_CONSTRAINTS,
        });

        const newVideoTrack = videoStream.getVideoTracks()[0];
        if (newVideoTrack) {
          // Add video track to existing stream
          this.localStream.addTrack(newVideoTrack);

          // Add track to all peer connections
          this.peerConnections.forEach((pc) => {
            pc.addTrack(newVideoTrack, this.localStream!);
          });

          if (this.currentUser) {
            this.currentUser.isVideoEnabled = true;
          }
          this.notifyStateChange();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("❌ Failed to toggle video:", error);
      return false;
    }
  }

  async toggleAudio(): Promise<boolean> {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      if (this.currentUser) {
        this.currentUser.isAudioEnabled = audioTrack.enabled;
      }
      this.notifyStateChange();
      return audioTrack.enabled;
    }
    return false;
  }

  // File sharing
  async shareFile(file: File): Promise<void> {
    try {
      const fileData = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedBy: this.currentUser?.name || "Unknown",
        uploadedAt: new Date(),
      };

      console.log(`📁 Sharing file: ${file.name} (${file.size} bytes)`);

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Send via WebSocket for immediate notification (without file data)
      webSocketService.shareFileInCall(fileData);

      // Send file data via data channels
      const fileMessage = {
        type: "file",
        ...fileData,
        data: Array.from(new Uint8Array(arrayBuffer)),
      };

      const messageString = JSON.stringify(fileMessage);
      console.log(
        `📡 Sending file via data channels to ${this.dataChannels.size} peers`
      );

      let successCount = 0;
      this.dataChannels.forEach((channel, userId) => {
        if (channel.readyState === "open") {
          try {
            // Check if message is too large for data channel
            if (messageString.length > 65536) {
              // 64KB limit
              console.warn(
                `⚠️ File too large for data channel to ${userId}, splitting...`
              );
              this.sendFileInChunks(channel, fileMessage, userId);
            } else {
              channel.send(messageString);
              successCount++;
              console.log(`✅ Sent file to ${userId} via data channel`);
            }
          } catch (error) {
            console.error(`❌ Failed to send file to ${userId}:`, error);
          }
        } else {
          console.warn(
            `⚠️ Data channel to ${userId} not open (state: ${channel.readyState})`
          );
        }
      });

      if (successCount === 0 && this.dataChannels.size > 0) {
        throw new Error("Failed to send file to any participants");
      }

      console.log(
        `✅ File shared successfully to ${successCount} participants`
      );
    } catch (error) {
      console.error("❌ Failed to share file:", error);
      throw error;
    }
  }

  private sendFileInChunks(
    channel: RTCDataChannel,
    fileMessage: any,
    userId: string
  ): void {
    const CHUNK_SIZE = 16384; // 16KB chunks
    const data = fileMessage.data;
    const totalChunks = Math.ceil(data.length / CHUNK_SIZE);

    console.log(`📦 Sending file in ${totalChunks} chunks to ${userId}`);

    // Send metadata first
    const metadata = {
      type: "file_metadata",
      id: fileMessage.id,
      name: fileMessage.name,
      size: fileMessage.size,
      fileType: fileMessage.type,
      uploadedBy: fileMessage.uploadedBy,
      uploadedAt: fileMessage.uploadedAt,
      totalChunks: totalChunks,
    };

    channel.send(JSON.stringify(metadata));

    // Send chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, data.length);
      const chunk = data.slice(start, end);

      const chunkMessage = {
        type: "file_chunk",
        id: fileMessage.id,
        chunkIndex: i,
        totalChunks: totalChunks,
        data: chunk,
      };

      channel.send(JSON.stringify(chunkMessage));
    }

    console.log(`✅ Sent ${totalChunks} chunks to ${userId}`);
  }

  private handleFileShared(
    fromUserId: string,
    fromUserName: string,
    fileData: any
  ): void {
    const fileItem: FileItem = {
      ...fileData,
      uploadedBy: fromUserName,
    };

    this.onFileSharedListeners.forEach((listener) => listener(fileItem));
  }

  private handleFileMetadata(fromUserId: string, metadata: any): void {
    console.log(`📋 Received file metadata from ${fromUserId}:`, metadata.name);

    this.fileChunks.set(metadata.id, {
      metadata: metadata,
      chunks: new Array(metadata.totalChunks),
      receivedChunks: 0,
    });
  }

  private handleFileChunk(fromUserId: string, chunkData: any): void {
    const fileId = chunkData.id;
    const fileInfo = this.fileChunks.get(fileId);

    if (!fileInfo) {
      console.error(`❌ Received chunk for unknown file: ${fileId}`);
      return;
    }

    console.log(
      `📦 Received chunk ${chunkData.chunkIndex + 1}/${
        chunkData.totalChunks
      } for ${fileInfo.metadata.name}`
    );

    // Store the chunk
    fileInfo.chunks[chunkData.chunkIndex] = chunkData.data;
    fileInfo.receivedChunks++;

    // Check if all chunks received
    if (fileInfo.receivedChunks === fileInfo.metadata.totalChunks) {
      console.log(
        `✅ All chunks received for ${fileInfo.metadata.name}, assembling file...`
      );
      this.assembleFile(fileId, fileInfo);
      this.fileChunks.delete(fileId);
    }
  }

  private assembleFile(fileId: string, fileInfo: any): void {
    try {
      // Combine all chunks
      const allData: number[] = [];
      for (const chunk of fileInfo.chunks) {
        allData.push(...chunk);
      }

      const fileItem: FileItem = {
        id: fileId,
        name: fileInfo.metadata.name,
        size: fileInfo.metadata.size,
        type: fileInfo.metadata.fileType,
        data: new Uint8Array(allData).buffer,
        uploadedBy: fileInfo.metadata.uploadedBy,
        uploadedAt: new Date(fileInfo.metadata.uploadedAt),
      };

      // Create blob URL for download
      const blob = new Blob([fileItem.data!], { type: fileItem.type });
      fileItem.url = URL.createObjectURL(blob);

      console.log(`🎉 File assembled successfully: ${fileItem.name}`);
      this.onFileSharedListeners.forEach((listener) => listener(fileItem));
    } catch (error) {
      console.error("❌ Failed to assemble file:", error);
    }
  }

  private handleFileReceived(fromUserId: string, data: any): void {
    try {
      console.log(`📁 Received complete file from ${fromUserId}:`, data.name);

      const fileItem: FileItem = {
        id: data.id,
        name: data.name,
        size: data.size,
        type: data.type,
        data: new Uint8Array(data.data).buffer,
        uploadedBy: data.uploadedBy,
        uploadedAt: new Date(data.uploadedAt),
      };

      // Create blob URL for download
      const blob = new Blob([fileItem.data!], { type: fileItem.type });
      fileItem.url = URL.createObjectURL(blob);

      console.log(`✅ File ready for download: ${fileItem.name}`);
      this.onFileSharedListeners.forEach((listener) => listener(fileItem));
    } catch (error) {
      console.error("❌ Failed to handle received file:", error);
    }
  }

  // Event listeners
  onStateChange(listener: (state: GlobalCallState) => void): () => void {
    this.onStateChangeListeners.push(listener);
    return () => {
      const index = this.onStateChangeListeners.indexOf(listener);
      if (index > -1) {
        this.onStateChangeListeners.splice(index, 1);
      }
    };
  }

  onParticipantJoined(
    listener: (participant: CallParticipant) => void
  ): () => void {
    this.onParticipantJoinedListeners.push(listener);
    return () => {
      const index = this.onParticipantJoinedListeners.indexOf(listener);
      if (index > -1) {
        this.onParticipantJoinedListeners.splice(index, 1);
      }
    };
  }

  onParticipantLeft(listener: (userId: string) => void): () => void {
    this.onParticipantLeftListeners.push(listener);
    return () => {
      const index = this.onParticipantLeftListeners.indexOf(listener);
      if (index > -1) {
        this.onParticipantLeftListeners.splice(index, 1);
      }
    };
  }

  onFileShared(listener: (file: FileItem) => void): () => void {
    this.onFileSharedListeners.push(listener);
    return () => {
      const index = this.onFileSharedListeners.indexOf(listener);
      if (index > -1) {
        this.onFileSharedListeners.splice(index, 1);
      }
    };
  }

  onRemoteStream(
    listener: (userId: string, stream: MediaStream) => void
  ): () => void {
    this.onRemoteStreamListeners.push(listener);
    return () => {
      const index = this.onRemoteStreamListeners.indexOf(listener);
      if (index > -1) {
        this.onRemoteStreamListeners.splice(index, 1);
      }
    };
  }

  private notifyStateChange(): void {
    const state: GlobalCallState = {
      isInCall: this.isInCall,
      isConnecting: false,
      participants: Array.from(this.participants.values()),
      localStream: this.localStream,
      remoteStreams: this.remoteStreams,
      isVideoEnabled: this.currentUser?.isVideoEnabled || false,
      isAudioEnabled: this.currentUser?.isAudioEnabled || false,
      isScreenSharing: this.currentUser?.isScreenSharing || false,
      sharedFiles: [],
    };

    console.log("🔄 State change notification:", state);
    this.onStateChangeListeners.forEach((listener) => listener(state));
  }

  // Getters
  get localVideoStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(userId: string): MediaStream | null {
    return this.remoteStreams.get(userId) || null;
  }

  get isConnected(): boolean {
    return this.isInCall;
  }
}

export const globalWebRTCService = new GlobalWebRTCService();
