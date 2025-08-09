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

    // Handle session status updates
    socket.on("session_status_update", (data) => {
      const { sessionId, status } = data;
      io.to(`session_${sessionId}`).emit("session_status_changed", {
        sessionId,
        status,
        timestamp: new Date(),
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`);
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
