import { webSocketService } from "./websocket";
import { WEBRTC_CONFIG } from "../config";

export interface SessionParticipant {
  userId: string;
  name: string;
  role: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
}

export interface SessionCallState {
  isInCall: boolean;
  isConnecting: boolean;
  participants: SessionParticipant[];
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  sharedFiles: SessionFileItem[];
  sessionId: string | null;
}

export interface SessionFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  data?: ArrayBuffer;
  uploadedBy: string;
  uploadedAt: Date;
  sessionId: string;
}

class SessionWebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private currentUser: SessionParticipant | null = null;
  private participants: Map<string, SessionParticipant> = new Map();
  private sessionId: string | null = null;
  private isInCall = false;

  // File chunk management
  private fileChunks: Map<
    string,
    { metadata: any; chunks: any[]; receivedChunks: number }
  > = new Map();

  // Event listeners
  private onStateChangeListeners: ((state: SessionCallState) => void)[] = [];
  private onParticipantJoinedListeners: ((
    participant: SessionParticipant
  ) => void)[] = [];
  private onParticipantLeftListeners: ((userId: string) => void)[] = [];
  private onFileSharedListeners: ((file: SessionFileItem) => void)[] = [];
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
      console.log(
        `🔌 Session WebRTC: WebSocket connection changed: ${isConnected}`
      );

      if (!isConnected && this.isInCall) {
        console.log("⚠️ WebSocket disconnected during call, leaving call");
        this.leaveCall();
      }

      // Re-setup listeners when connection is established
      if (isConnected) {
        console.log("🔄 Re-attaching session WebSocket listeners");
        this.attachSocketListeners();
      }
    });

    // Initial setup if already connected
    if (webSocketService.isConnected) {
      console.log("✅ WebSocket already connected, attaching listeners");
      this.attachSocketListeners();
    } else {
      console.log("⚠️ WebSocket not connected yet, waiting for connection");
    }
  }

  private attachSocketListeners(): void {
    const socket = webSocketService.socketInstance;
    if (!socket) {
      console.warn(
        "⚠️ Cannot attach session WebSocket listeners - socket not available"
      );
      return;
    }

    // Remove existing listeners to prevent duplicates
    socket.off("user_joined_session_call");
    socket.off("user_left_session_call");
    socket.off("current_session_participants");
    socket.off("session_webrtc_offer");
    socket.off("session_webrtc_answer");
    socket.off("session_webrtc_ice_candidate");
    socket.off("file_shared_in_session");

    // Handle new participants joining session call
    socket.on(
      "user_joined_session_call",
      (data: { userId: string; userData: any; sessionId: string }) => {
        if (data.sessionId === this.sessionId) {
          console.log("🔔 Received user_joined_session_call event:", data);
          this.handleUserJoinedCall(data.userId, data.userData);
        }
      }
    );

    // Handle participants leaving session call
    socket.on(
      "user_left_session_call",
      (data: { userId: string; sessionId: string }) => {
        if (data.sessionId === this.sessionId) {
          console.log("🔔 Received user_left_session_call event:", data);
          this.handleUserLeftCall(data.userId);
        }
      }
    );

    // Handle current participants when joining session
    socket.on(
      "current_session_participants",
      (data: { participants: any[]; sessionId: string }) => {
        if (data.sessionId === this.sessionId) {
          console.log("🔔 Received current_session_participants event:", data);
          this.handleCurrentParticipants(data.participants);
        }
      }
    );

    // Handle WebRTC signaling for session
    socket.on(
      "session_webrtc_offer",
      (data: {
        fromUserId: string;
        offer: RTCSessionDescriptionInit;
        sessionId: string;
      }) => {
        if (data.sessionId === this.sessionId) {
          console.log("🔔 Received session_webrtc_offer event:", data);
          this.handleOffer(data.fromUserId, data.offer);
        }
      }
    );

    socket.on(
      "session_webrtc_answer",
      (data: {
        fromUserId: string;
        answer: RTCSessionDescriptionInit;
        sessionId: string;
      }) => {
        if (data.sessionId === this.sessionId) {
          console.log("🔔 Received session_webrtc_answer event:", data);
          this.handleAnswer(data.fromUserId, data.answer);
        }
      }
    );

    socket.on(
      "session_webrtc_ice_candidate",
      (data: {
        fromUserId: string;
        candidate: RTCIceCandidateInit;
        sessionId: string;
      }) => {
        if (data.sessionId === this.sessionId) {
          console.log("🔔 Received session_webrtc_ice_candidate event:", data);
          this.handleIceCandidate(data.fromUserId, data.candidate);
        }
      }
    );

    // Handle file sharing in session
    socket.on(
      "file_shared_in_session",
      (data: {
        fromUserId: string;
        fromUserName: string;
        fileData: any;
        sessionId: string;
      }) => {
        if (data.sessionId === this.sessionId) {
          console.log("🔔 Received file_shared_in_session event:", data);
          this.handleFileShared(
            data.fromUserId,
            data.fromUserName,
            data.fileData
          );
        }
      }
    );

    console.log("✅ WebSocket listeners attached for session video call");
  }

  async joinCall(
    sessionId: string,
    userData: SessionParticipant
  ): Promise<void> {
    try {
      console.log(
        `🚀 Starting session call join process for session: ${sessionId}`,
        userData
      );

      this.sessionId = sessionId;
      this.currentUser = userData;
      this.isInCall = true;

      // Ensure WebSocket is connected
      if (!webSocketService.isConnected) {
        console.log("🔌 WebSocket not connected, waiting for connection...");
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("WebSocket connection timeout"));
          }, 10000); // Increased timeout to 10 seconds

          const checkConnection = () => {
            if (webSocketService.isConnected) {
              clearTimeout(timeout);
              console.log("✅ WebSocket connection established");
              resolve(true);
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      } else {
        console.log("✅ WebSocket already connected");
      }

      // Ensure listeners are attached
      this.attachSocketListeners();

      // Get user media
      await this.getUserMedia();

      // Join the session call room via WebSocket
      webSocketService.joinSessionCall(sessionId, userData);

      this.notifyStateChange();
      console.log(`✅ Joined session video call: ${sessionId}`);
    } catch (error) {
      this.isInCall = false;
      console.error("❌ Failed to join session call:", error);
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

      // Leave the session call room via WebSocket
      if (this.sessionId) {
        webSocketService.leaveSessionCall(this.sessionId);
      }

      this.isInCall = false;
      this.currentUser = null;
      this.sessionId = null;

      this.notifyStateChange();
      console.log("✅ Left session video call");
    } catch (error) {
      console.error("❌ Failed to leave session call:", error);
      throw error;
    }
  }

  private async getUserMedia(): Promise<void> {
    try {
      const constraints = {
        video: this.config.video,
        audio: this.config.audio,
      };

      console.log("🎥 Requesting user media with constraints:", constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Update current user video state
      if (this.currentUser) {
        this.currentUser.isVideoEnabled = !!this.config.video;
        this.currentUser.isAudioEnabled = !!this.config.audio;
      }

      console.log("✅ Local media stream obtained successfully", {
        video: this.localStream.getVideoTracks().length > 0,
        audio: this.localStream.getAudioTracks().length > 0,
      });
    } catch (error) {
      console.error("❌ Failed to get user media:", error);

      // Try with audio only if video fails
      if (this.config.video) {
        console.log("🔄 Retrying with audio only...");
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: this.config.audio,
          });

          if (this.currentUser) {
            this.currentUser.isVideoEnabled = false;
            this.currentUser.isAudioEnabled = !!this.config.audio;
          }

          console.log("✅ Audio-only stream obtained");
          return;
        } catch (audioError) {
          console.error("❌ Failed to get audio-only stream:", audioError);
        }
      }

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
      if (event.candidate && this.sessionId) {
        webSocketService.sendSessionWebRTCIceCandidate(
          this.sessionId,
          userId,
          event.candidate
        );
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
    const dataChannel = peerConnection.createDataChannel("sessionFileSharing", {
      ordered: true,
      maxRetransmits: 3,
    });
    this.setupDataChannel(userId, dataChannel);

    // Handle incoming data channels
    peerConnection.ondatachannel = (event) => {
      console.log(
        `📡 Received data channel from ${userId}:`,
        event.channel.label
      );
      this.setupDataChannel(userId, event.channel);
    };

    this.peerConnections.set(userId, peerConnection);
    return peerConnection;
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

  get currentSessionId(): string | null {
    return this.sessionId;
  }

  // File sharing - Industry standard implementation
  async shareFile(file: File): Promise<void> {
    try {
      console.log(`📁 Starting file share: ${file.name} (${file.size} bytes)`);

      // Create file metadata
      const fileId = `file_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const fileData = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedBy: this.currentUser?.name || "Unknown",
        uploadedAt: new Date(),
        sessionId: this.sessionId,
      };

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // ALWAYS add to local files first - this ensures sender can download immediately
      const blob = new Blob([arrayBuffer], {
        type: file.type || "application/octet-stream",
      });
      const blobUrl = URL.createObjectURL(blob);

      const localFileItem: SessionFileItem = {
        ...fileData,
        data: arrayBuffer,
        url: blobUrl,
      };

      console.log(`✅ File prepared for download:`, {
        name: localFileItem.name,
        size: localFileItem.size,
        type: localFileItem.type,
        hasData: !!localFileItem.data,
        hasUrl: !!localFileItem.url,
        urlValid: blobUrl.startsWith("blob:"),
      });

      // Immediately add to shared files so sender can download
      this.onFileSharedListeners.forEach((listener) => listener(localFileItem));

      // Send to other participants via WebSocket notification
      if (this.sessionId) {
        webSocketService.shareFileInSession(this.sessionId, fileData);
      }

      // Send file data to connected peers via data channels
      if (this.dataChannels.size > 0) {
        const fileMessage = {
          type: "file",
          ...fileData,
          data: Array.from(new Uint8Array(arrayBuffer)),
        };

        let successCount = 0;
        this.dataChannels.forEach((channel, userId) => {
          if (channel.readyState === "open") {
            try {
              const messageString = JSON.stringify(fileMessage);
              if (messageString.length > 65536) {
                this.sendFileInChunks(channel, fileMessage, userId);
              } else {
                channel.send(messageString);
              }
              successCount++;
              console.log(`✅ Sent file to peer: ${userId}`);
            } catch (error) {
              console.error(`❌ Failed to send to ${userId}:`, error);
            }
          }
        });

        console.log(
          `📡 File sent to ${successCount}/${this.dataChannels.size} peers`
        );
      } else {
        console.log(`📡 No peers connected, file available locally only`);
      }

      console.log(`✅ File sharing completed: ${file.name}`);
    } catch (error) {
      console.error("❌ File sharing failed:", error);
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

    console.log(
      `📦 Sending session file in ${totalChunks} chunks to ${userId}`
    );

    // Send metadata first
    const metadata = {
      type: "file_metadata",
      id: fileMessage.id,
      name: fileMessage.name,
      size: fileMessage.size,
      fileType: fileMessage.type,
      uploadedBy: fileMessage.uploadedBy,
      uploadedAt: fileMessage.uploadedAt,
      sessionId: fileMessage.sessionId,
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

    console.log(`✅ Sent ${totalChunks} session file chunks to ${userId}`);
  }

  private handleFileShared(
    fromUserId: string,
    fromUserName: string,
    fileData: any
  ): void {
    const fileItem: SessionFileItem = {
      ...fileData,
      uploadedBy: fromUserName,
      sessionId: this.sessionId || "",
    };

    this.onFileSharedListeners.forEach((listener) => listener(fileItem));
  }

  private handleFileMetadata(fromUserId: string, metadata: any): void {
    console.log(
      `📋 Received session file metadata from ${fromUserId}:`,
      metadata.name
    );

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
      console.error(`❌ Received session chunk for unknown file: ${fileId}`);
      return;
    }

    console.log(
      `📦 Received session chunk ${chunkData.chunkIndex + 1}/${
        chunkData.totalChunks
      } for ${fileInfo.metadata.name}`
    );

    // Store the chunk
    fileInfo.chunks[chunkData.chunkIndex] = chunkData.data;
    fileInfo.receivedChunks++;

    // Check if all chunks received
    if (fileInfo.receivedChunks === fileInfo.metadata.totalChunks) {
      console.log(
        `✅ All session chunks received for ${fileInfo.metadata.name}, assembling file...`
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

      const fileItem: SessionFileItem = {
        id: fileId,
        name: fileInfo.metadata.name,
        size: fileInfo.metadata.size,
        type: fileInfo.metadata.fileType,
        data: new Uint8Array(allData).buffer,
        uploadedBy: fileInfo.metadata.uploadedBy,
        uploadedAt: new Date(fileInfo.metadata.uploadedAt),
        sessionId: fileInfo.metadata.sessionId || this.sessionId || "",
      };

      // Create blob URL for download
      const blob = new Blob([fileItem.data!], { type: fileItem.type });
      fileItem.url = URL.createObjectURL(blob);

      console.log(`🎉 Session file assembled successfully: ${fileItem.name}`);
      this.onFileSharedListeners.forEach((listener) => listener(fileItem));
    } catch (error) {
      console.error("❌ Failed to assemble session file:", error);
    }
  }

  private handleFileReceived(fromUserId: string, data: any): void {
    try {
      console.log(
        `📁 Received complete session file from ${fromUserId}:`,
        data.name
      );

      const fileItem: SessionFileItem = {
        id: data.id,
        name: data.name,
        size: data.size,
        type: data.type,
        data: new Uint8Array(data.data).buffer,
        uploadedBy: data.uploadedBy,
        uploadedAt: new Date(data.uploadedAt),
        sessionId: data.sessionId || this.sessionId || "",
      };

      // Create blob URL for download
      const blob = new Blob([fileItem.data!], { type: fileItem.type });
      fileItem.url = URL.createObjectURL(blob);

      console.log(`✅ Session file ready for download: ${fileItem.name}`);
      this.onFileSharedListeners.forEach((listener) => listener(fileItem));
    } catch (error) {
      console.error("❌ Failed to handle received session file:", error);
    }
  }

  private setupDataChannel(userId: string, channel: RTCDataChannel): void {
    this.dataChannels.set(userId, channel);

    channel.onopen = () => {
      console.log(`📡 Session data channel opened with ${userId}`);
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(
          `📨 Received session data channel message from ${userId}:`,
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
            console.warn(
              `Unknown session data channel message type: ${data.type}`
            );
        }
      } catch (error) {
        console.error(
          "❌ Failed to parse session data channel message:",
          error
        );
      }
    };

    channel.onerror = (error) => {
      console.error(`❌ Session data channel error with ${userId}:`, error);
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

    // Check if participant already exists
    if (this.participants.has(userId)) {
      console.log(`🔄 User ${userId} already in session, updating data`);
      const existingParticipant = this.participants.get(userId)!;
      existingParticipant.name = userData.name || existingParticipant.name;
      existingParticipant.role = userData.role || existingParticipant.role;
      this.notifyStateChange();
      return;
    }

    console.log(`👤 User ${userId} joined session call with data:`, userData);

    try {
      // Create peer connection and send offer
      const peerConnection = await this.createPeerConnection(userId);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peerConnection.setLocalDescription(offer);

      console.log(`📞 Sending session offer to user ${userId}`);
      if (this.sessionId) {
        webSocketService.sendSessionWebRTCOffer(this.sessionId, userId, offer);
      }

      const participant: SessionParticipant = {
        userId,
        name: userData.name || "Unknown",
        role: userData.role || "user",
        isVideoEnabled: false, // Camera disabled by default
        isAudioEnabled: true,
        isScreenSharing: false,
      };

      // Store participant
      this.participants.set(userId, participant);

      console.log(`✅ Added session participant:`, participant);
      this.onParticipantJoinedListeners.forEach((listener) =>
        listener(participant)
      );
      this.notifyStateChange();
    } catch (error) {
      console.error(
        `❌ Failed to handle user ${userId} joining session:`,
        error
      );

      // Clean up on error
      const peerConnection = this.peerConnections.get(userId);
      if (peerConnection) {
        peerConnection.close();
        this.peerConnections.delete(userId);
      }
      this.dataChannels.delete(userId);
      this.participants.delete(userId);
    }
  }

  private handleUserLeftCall(userId: string): void {
    console.log(`👤 User ${userId} left session call`);

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
    console.log(`📋 Current session participants:`, participants);

    // Create peer connections for existing participants
    for (const participant of participants) {
      await this.handleUserJoinedCall(participant.userId, participant.userData);
    }
  }

  private async handleOffer(
    fromUserId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    console.log(`📞 Received session offer from ${fromUserId}`, offer);

    try {
      const peerConnection = await this.createPeerConnection(fromUserId);
      await peerConnection.setRemoteDescription(offer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log(`📞 Sending session answer to ${fromUserId}`);
      if (this.sessionId) {
        webSocketService.sendSessionWebRTCAnswer(
          this.sessionId,
          fromUserId,
          answer
        );
      }
    } catch (error) {
      console.error(
        `❌ Failed to handle session offer from ${fromUserId}:`,
        error
      );
    }
  }

  private async handleAnswer(
    fromUserId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    console.log(`📞 Received session answer from ${fromUserId}`, answer);

    try {
      const peerConnection = this.peerConnections.get(fromUserId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
        console.log(`✅ Set remote description for session peer ${fromUserId}`);
      } else {
        console.error(`❌ No session peer connection found for ${fromUserId}`);
      }
    } catch (error) {
      console.error(
        `❌ Failed to handle session answer from ${fromUserId}:`,
        error
      );
    }
  }

  private async handleIceCandidate(
    fromUserId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    console.log(
      `🧊 Received session ICE candidate from ${fromUserId}`,
      candidate
    );

    try {
      const peerConnection = this.peerConnections.get(fromUserId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
        console.log(`✅ Added session ICE candidate for ${fromUserId}`);
      } else {
        console.error(`❌ No session peer connection found for ${fromUserId}`);
      }
    } catch (error) {
      console.error(
        `❌ Failed to add session ICE candidate from ${fromUserId}:`,
        error
      );
    }
  }

  private notifyStateChange(): void {
    const state: SessionCallState = {
      isInCall: this.isInCall,
      isConnecting: false,
      participants: Array.from(this.participants.values()),
      localStream: this.localStream,
      remoteStreams: this.remoteStreams,
      isVideoEnabled: this.currentUser?.isVideoEnabled || false,
      isAudioEnabled: this.currentUser?.isAudioEnabled || false,
      isScreenSharing: this.currentUser?.isScreenSharing || false,
      sharedFiles: [],
      sessionId: this.sessionId,
    };

    console.log("🔄 Session state change notification:", state);
    this.onStateChangeListeners.forEach((listener) => listener(state));
  }

  // Event listeners
  onStateChange(listener: (state: SessionCallState) => void): () => void {
    this.onStateChangeListeners.push(listener);
    return () => {
      const index = this.onStateChangeListeners.indexOf(listener);
      if (index > -1) {
        this.onStateChangeListeners.splice(index, 1);
      }
    };
  }

  onParticipantJoined(
    listener: (participant: SessionParticipant) => void
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

  onFileShared(listener: (file: SessionFileItem) => void): () => void {
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
}

export const sessionWebRTCService = new SessionWebRTCService();
