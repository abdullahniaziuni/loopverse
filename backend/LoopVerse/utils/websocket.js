const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 */
function initializeWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        process.env.FRONTEND_URL,
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userType = decoded.userType;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  // Handle connections
  io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join role-based rooms
    socket.join(`role_${socket.userRole}`);

    // Handle dynamic user ID setting
    socket.on("set_user_id", (data) => {
      const { userId } = data;
      if (userId && userId !== socket.userId) {
        // Leave old room
        socket.leave(`user_${socket.userId}`);
        // Update user ID
        socket.userId = userId;
        // Join new room
        socket.join(`user_${socket.userId}`);
        console.log(`User ID updated to ${userId}`);
      }
    });

    // Handle session room joining
    socket.on("join_session", (sessionId) => {
      socket.join(`session_${sessionId}`);
      console.log(`User ${socket.userId} joined session ${sessionId}`);
    });

    // Handle leaving session room
    socket.on("leave_session", (sessionId) => {
      socket.leave(`session_${sessionId}`);
      console.log(`User ${socket.userId} left session ${sessionId}`);
    });

    // Handle global video call room joining
    socket.on("join_global_call", (userData) => {
      socket.join("global_video_call");
      socket.userData = userData;
      console.log(`User ${socket.userId} joined global video call`);

      // Notify others about new participant
      socket.to("global_video_call").emit("user_joined_call", {
        userId: socket.userId,
        userData: userData,
        timestamp: new Date(),
      });

      // Send current participants to new user
      const participants = [];
      const sockets = io.sockets.adapter.rooms.get("global_video_call");
      if (sockets) {
        sockets.forEach((socketId) => {
          const participantSocket = io.sockets.sockets.get(socketId);
          if (participantSocket && participantSocket.userId !== socket.userId) {
            participants.push({
              userId: participantSocket.userId,
              userData: participantSocket.userData,
            });
          }
        });
      }

      socket.emit("current_call_participants", participants);
    });

    // Handle leaving global video call
    socket.on("leave_global_call", () => {
      socket.leave("global_video_call");
      console.log(`User ${socket.userId} left global video call`);

      // Notify others about participant leaving
      socket.to("global_video_call").emit("user_left_call", {
        userId: socket.userId,
        timestamp: new Date(),
      });
    });

    // Handle WebRTC signaling for global call
    socket.on("webrtc_offer", (data) => {
      const { targetUserId, offer } = data;
      socket.to(`user_${targetUserId}`).emit("webrtc_offer", {
        fromUserId: socket.userId,
        offer: offer,
      });
    });

    socket.on("webrtc_answer", (data) => {
      const { targetUserId, answer } = data;
      socket.to(`user_${targetUserId}`).emit("webrtc_answer", {
        fromUserId: socket.userId,
        answer: answer,
      });
    });

    socket.on("webrtc_ice_candidate", (data) => {
      const { targetUserId, candidate } = data;
      socket.to(`user_${targetUserId}`).emit("webrtc_ice_candidate", {
        fromUserId: socket.userId,
        candidate: candidate,
      });
    });

    // Handle file sharing in global call
    socket.on("share_file_in_call", (fileData) => {
      socket.to("global_video_call").emit("file_shared_in_call", {
        fromUserId: socket.userId,
        fromUserName: socket.userData?.name || "Unknown",
        fileData: fileData,
        timestamp: new Date(),
      });
    });

    // Handle session video call room joining
    socket.on("join_session_call", (data) => {
      const { sessionId, userData } = data;
      socket.join(`session_call_${sessionId}`);
      socket.sessionCallData = userData;
      console.log(`User ${socket.userId} joined session call ${sessionId}`);

      // Notify others about new participant
      socket.to(`session_call_${sessionId}`).emit("user_joined_session_call", {
        userId: socket.userId,
        userData: userData,
        sessionId: sessionId,
        timestamp: new Date(),
      });

      // Send current participants to new user
      const participants = [];
      const sockets = io.sockets.adapter.rooms.get(`session_call_${sessionId}`);
      if (sockets) {
        sockets.forEach((socketId) => {
          const participantSocket = io.sockets.sockets.get(socketId);
          if (participantSocket && participantSocket.userId !== socket.userId) {
            participants.push({
              userId: participantSocket.userId,
              userData: participantSocket.sessionCallData,
            });
          }
        });
      }

      socket.emit("current_session_participants", {
        participants: participants,
        sessionId: sessionId,
      });
    });

    // Handle leaving session video call
    socket.on("leave_session_call", (data) => {
      const { sessionId } = data;
      socket.leave(`session_call_${sessionId}`);
      console.log(`User ${socket.userId} left session call ${sessionId}`);

      // Notify others about participant leaving
      socket.to(`session_call_${sessionId}`).emit("user_left_session_call", {
        userId: socket.userId,
        sessionId: sessionId,
        timestamp: new Date(),
      });
    });

    // Handle WebRTC signaling for session calls
    socket.on("session_webrtc_offer", (data) => {
      const { sessionId, targetUserId, offer } = data;
      socket.to(`user_${targetUserId}`).emit("session_webrtc_offer", {
        fromUserId: socket.userId,
        offer: offer,
        sessionId: sessionId,
      });
    });

    socket.on("session_webrtc_answer", (data) => {
      const { sessionId, targetUserId, answer } = data;
      socket.to(`user_${targetUserId}`).emit("session_webrtc_answer", {
        fromUserId: socket.userId,
        answer: answer,
        sessionId: sessionId,
      });
    });

    socket.on("session_webrtc_ice_candidate", (data) => {
      const { sessionId, targetUserId, candidate } = data;
      socket.to(`user_${targetUserId}`).emit("session_webrtc_ice_candidate", {
        fromUserId: socket.userId,
        candidate: candidate,
        sessionId: sessionId,
      });
    });

    // Handle file sharing in session calls
    socket.on("share_file_in_session", (data) => {
      const { sessionId, fileData } = data;
      socket.to(`session_call_${sessionId}`).emit("file_shared_in_session", {
        fromUserId: socket.userId,
        fromUserName: socket.sessionCallData?.name || "Unknown",
        fileData: fileData,
        sessionId: sessionId,
        timestamp: new Date(),
      });
    });

    // Handle session call initiation
    socket.on("initiate_session_call", (data) => {
      const { sessionId, targetUserId, callerName, callerRole, callerId } =
        data;
      console.log(
        `Session call initiated by ${callerId} for session ${sessionId} to ${targetUserId}`
      );

      // Check if target user is connected
      const targetRoom = `user_${targetUserId}`;
      const targetSockets = io.sockets.adapter.rooms.get(targetRoom);

      if (targetSockets && targetSockets.size > 0) {
        console.log(
          `Target user ${targetUserId} is online, sending call notification`
        );

        // Send call notification to target user
        socket.to(targetRoom).emit("incoming_session_call", {
          sessionId: sessionId,
          callerName: callerName,
          callerRole: callerRole,
          callerId: callerId,
          timestamp: new Date(),
        });
      } else {
        console.log(`Target user ${targetUserId} is offline`);

        // Send offline notification back to caller
        socket.emit("session_call_failed", {
          sessionId: sessionId,
          targetUserId: targetUserId,
          reason: "User is offline",
          timestamp: new Date(),
        });
      }
    });

    // Handle session call decline
    socket.on("decline_session_call", (data) => {
      const { sessionId, callerId, declinedBy } = data;
      console.log(
        `Session call declined by ${declinedBy} for session ${sessionId}`
      );

      // Notify caller that call was declined
      socket.to(`user_${callerId}`).emit("session_call_declined", {
        sessionId: sessionId,
        declinedBy: declinedBy,
        timestamp: new Date(),
      });
    });

    // Handle chat messages
    socket.on("send_message", (data) => {
      const { sessionId, message, type = "text" } = data;

      const messageData = {
        id: Date.now().toString(),
        sessionId,
        senderId: socket.userId,
        senderName: data.senderName,
        message,
        type,
        timestamp: new Date(),
      };

      // Broadcast to session room
      io.to(`session_${sessionId}`).emit("new_message", messageData);
    });

    // Handle typing indicators
    socket.on("typing_start", (data) => {
      socket.to(`session_${data.sessionId}`).emit("user_typing", {
        userId: socket.userId,
        userName: data.userName,
      });
    });

    socket.on("typing_stop", (data) => {
      socket.to(`session_${data.sessionId}`).emit("user_stopped_typing", {
        userId: socket.userId,
      });
    });

    // Handle joining session chat
    socket.on("join_session_chat", (data) => {
      const { sessionId } = data;
      const chatRoom = `session_chat_${sessionId}`;

      socket.join(chatRoom);
      console.log(`User ${socket.userId} joined session chat: ${sessionId}`);

      // Notify others in the chat room
      socket.to(chatRoom).emit("user_joined_chat", {
        sessionId: sessionId,
        userId: socket.userId,
        timestamp: new Date(),
      });
    });

    // Handle leaving session chat
    socket.on("leave_session_chat", (data) => {
      const { sessionId } = data;
      const chatRoom = `session_chat_${sessionId}`;

      socket.leave(chatRoom);
      console.log(`User ${socket.userId} left session chat: ${sessionId}`);

      // Notify others in the chat room
      socket.to(chatRoom).emit("user_left_chat", {
        sessionId: sessionId,
        userId: socket.userId,
        timestamp: new Date(),
      });
    });

    // Handle session chat messages
    socket.on("session_chat_message", (data) => {
      const { sessionId, messageId, message, timestamp, sender, senderName } =
        data;
      const chatRoom = `session_chat_${sessionId}`;

      console.log(
        `Session chat message in ${sessionId} from ${sender}: ${message}`
      );

      // Broadcast message to all users in the session chat room except sender
      socket.to(chatRoom).emit("session_chat_message", {
        sessionId: sessionId,
        messageId: messageId,
        message: message,
        timestamp: timestamp,
        sender: sender,
        senderName: senderName,
      });
    });

    // Handle session status updates
    socket.on("session_status_update", (data) => {
      const { sessionId, status } = data;
      io.to(`session_${sessionId}`).emit("session_status_changed", {
        sessionId,
        status,
        timestamp: new Date(),
      });
    });

    // Handle booking requests
    socket.on("send_booking_request", (data) => {
      const {
        id,
        learnerId,
        learnerName,
        mentorId,
        mentorName,
        sessionType,
        preferredDate,
        preferredTime,
        message,
        status,
        createdAt,
      } = data;

      console.log(
        `Booking request from ${learnerName} to ${mentorName}: ${sessionType}`
      );

      // Send notification to mentor
      io.to(`user_${mentorId}`).emit("booking_request", {
        id,
        learnerId,
        learnerName,
        mentorId,
        mentorName,
        sessionType,
        preferredDate,
        preferredTime,
        message,
        status: "pending",
        createdAt,
      });

      // Confirm to learner that request was sent
      socket.emit("booking_request_sent", {
        id,
        status: "sent",
        message: "Booking request sent successfully",
      });
    });

    // Handle booking responses
    socket.on("respond_to_booking", (data) => {
      const { bookingId, response, message, timestamp } = data;

      console.log(`Booking response: ${response} for booking ${bookingId}`);

      // In a real app, you would:
      // 1. Find the booking in database by bookingId
      // 2. Update the booking status
      // 3. Get the learner ID from the booking
      // 4. Send notification to specific learner

      // For demo purposes, we'll create a mock booking response
      const mockBookingData = {
        id: bookingId,
        learnerId: "current-user", // In real app, get from booking record
        mentorId: socket.userId || "mentor-1",
        mentorName: "Available Mentor", // In real app, get from user record
        sessionType: "mentoring",
        status: response,
        mentorResponse: message,
        timestamp,
      };

      if (response === "accepted") {
        // Send to all connected clients (in real app, send to specific learner)
        io.emit("booking_accepted", mockBookingData);
      } else {
        // Send to all connected clients (in real app, send to specific learner)
        io.emit("booking_rejected", mockBookingData);
      }
    });

    // Handle session notes sharing
    socket.on("session_notes_shared", (data) => {
      const {
        sessionId,
        notesId,
        generatedBy,
        generatedByName,
        notes,
        timestamp,
      } = data;

      console.log(
        `Session notes shared by ${generatedByName} for session ${sessionId}`
      );

      // Broadcast to all participants in the session
      const chatRoom = `session_chat_${sessionId}`;
      socket.to(chatRoom).emit("session_notes_shared", {
        sessionId,
        notesId,
        generatedBy,
        generatedByName,
        notes,
        timestamp,
      });
    });

    // Handle private chat
    socket.on("join_chat", (data) => {
      const { chatId, userId, participantId } = data;
      socket.join(chatId);
      console.log(`User ${userId} joined chat: ${chatId}`);
    });

    socket.on("leave_chat", (data) => {
      const { chatId, userId } = data;
      socket.leave(chatId);
      console.log(`User ${userId} left chat: ${chatId}`);
    });

    socket.on("send_chat_message", (data) => {
      const {
        chatId,
        messageId,
        senderId,
        senderName,
        recipientId,
        content,
        timestamp,
        type,
      } = data;

      console.log(`Chat message in ${chatId} from ${senderName}: ${content}`);

      // Broadcast to chat room (excluding sender)
      socket.to(chatId).emit("chat_message", {
        chatId,
        messageId,
        senderId,
        senderName,
        content,
        timestamp,
        type,
      });

      // Send notification to recipient if they're not in the chat
      io.to(`user_${recipientId}`).emit("new_message", {
        messageId,
        senderId,
        senderName,
        content: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
        timestamp,
        chatId,
        recipientId,
      });
    });

    socket.on("typing", (data) => {
      const { chatId, userId, isTyping } = data;
      socket.to(chatId).emit("user_typing", {
        chatId,
        userId,
        isTyping,
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`);

      // Notify global call participants if user was in call
      socket.to("global_video_call").emit("user_left_call", {
        userId: socket.userId,
        timestamp: new Date(),
      });
    });
  });

  return io;
}

/**
 * Get the WebSocket server instance
 */
function getIO() {
  if (!io) {
    throw new Error("WebSocket server not initialized");
  }
  return io;
}

/**
 * Send notification to a specific user
 * @param {string} userId - User ID
 * @param {object} notification - Notification data
 */
function sendNotificationToUser(userId, notification) {
  if (io) {
    io.to(`user_${userId}`).emit("notification", notification);
  }
}

/**
 * Send notification to all users with a specific role
 * @param {string} role - User role
 * @param {object} notification - Notification data
 */
function sendNotificationToRole(role, notification) {
  if (io) {
    io.to(`role_${role}`).emit("notification", notification);
  }
}

/**
 * Send session update to session participants
 * @param {string} sessionId - Session ID
 * @param {object} update - Update data
 */
function sendSessionUpdate(sessionId, update) {
  if (io) {
    io.to(`session_${sessionId}`).emit("session_update", {
      sessionId,
      ...update,
      timestamp: new Date(),
    });
  }
}

/**
 * Send booking request notification
 * @param {string} mentorId - Mentor ID
 * @param {object} bookingData - Booking data
 */
function sendBookingRequest(mentorId, bookingData) {
  if (io) {
    io.to(`user_${mentorId}`).emit("booking_request", {
      type: "booking_request",
      data: bookingData,
      timestamp: new Date(),
    });
  }
}

/**
 * Send booking response notification
 * @param {string} learnerId - Learner ID
 * @param {object} responseData - Response data
 */
function sendBookingResponse(learnerId, responseData) {
  if (io) {
    io.to(`user_${learnerId}`).emit("booking_response", {
      type: "booking_response",
      data: responseData,
      timestamp: new Date(),
    });
  }
}

module.exports = {
  initializeWebSocket,
  getIO,
  sendNotificationToUser,
  sendNotificationToRole,
  sendSessionUpdate,
  sendBookingRequest,
  sendBookingResponse,
};
