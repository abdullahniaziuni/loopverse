const io = require("socket.io-client");

async function testGlobalVideoCall() {
  console.log("🎥 Testing Global Video Call System...");

  // Create two fake users with different session IDs
  const user1Token = "fake_token_user1";
  const user2Token = "fake_token_user2";

  // Connect User 1 (thinks they're in session_123)
  const socket1 = io("http://localhost:4001", {
    auth: { token: user1Token, userId: "user1" },
    transports: ["websocket"],
  });

  // Connect User 2 (thinks they're in session_456)
  const socket2 = io("http://localhost:4001", {
    auth: { token: user2Token, userId: "user2" },
    transports: ["websocket"],
  });

  // Wait for connections
  await new Promise((resolve) => {
    let connected = 0;
    
    socket1.on("connect", () => {
      console.log("✅ User 1 connected");
      connected++;
      if (connected === 2) resolve();
    });

    socket2.on("connect", () => {
      console.log("✅ User 2 connected");
      connected++;
      if (connected === 2) resolve();
    });

    socket1.on("connect_error", (err) => {
      console.log("❌ User 1 connection failed:", err.message);
    });

    socket2.on("connect_error", (err) => {
      console.log("❌ User 2 connection failed:", err.message);
    });
  });

  // Set up video call listeners
  socket1.on("user_joined_call", (data) => {
    console.log(`📹 User 1 sees: ${data.userData?.name || data.userId} joined call (session: ${data.sessionId})`);
  });

  socket2.on("user_joined_call", (data) => {
    console.log(`📹 User 2 sees: ${data.userData?.name || data.userId} joined call (session: ${data.sessionId})`);
  });

  socket1.on("current_call_participants", (participants) => {
    console.log(`👥 User 1 sees current participants:`, participants.length);
  });

  socket2.on("current_call_participants", (participants) => {
    console.log(`👥 User 2 sees current participants:`, participants.length);
  });

  // Test joining video calls with different session IDs
  setTimeout(() => {
    console.log("\n🚀 User 1 joining video call (thinks session_123)...");
    socket1.emit("join_video_call", {
      sessionId: "session_123",
      userData: {
        userId: "user1",
        name: "User One",
        role: "learner",
        isVideoEnabled: true,
        isAudioEnabled: true,
      }
    });
  }, 1000);

  setTimeout(() => {
    console.log("\n🚀 User 2 joining video call (thinks session_456)...");
    socket2.emit("join_video_call", {
      sessionId: "session_456", 
      userData: {
        userId: "user2",
        name: "User Two",
        role: "mentor",
        isVideoEnabled: true,
        isAudioEnabled: true,
      }
    });
  }, 2000);

  // Test WebRTC signaling
  setTimeout(() => {
    console.log("\n📞 User 1 sending WebRTC offer to User 2...");
    socket1.emit("webrtc_offer", {
      targetUserId: "user2",
      offer: { type: "offer", sdp: "fake_offer_sdp" }
    });
  }, 3000);

  // Clean up after 6 seconds
  setTimeout(() => {
    console.log("\n🧹 Cleaning up connections...");
    socket1.disconnect();
    socket2.disconnect();
    process.exit(0);
  }, 6000);
}

testGlobalVideoCall().catch(console.error);
