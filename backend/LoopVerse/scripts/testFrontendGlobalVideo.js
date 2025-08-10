const io = require("socket.io-client");

async function testFrontendGlobalVideo() {
  console.log("🎥 Testing Frontend Global Video Call Integration...");

  // Simulate two users with valid tokens
  const user1Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OThiZWFhYzFiYjA3ZjExMjYwZjQ0MCIsInJvbGUiOiJsZWFybmVyIiwidXNlclR5cGUiOiJsZWFybmVyIiwiaWF0IjoxNzU0ODQwOTEwfQ.fake";
  const user2Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OThjMDNiYzlmZjYzN2I0ODlmMTVkYyIsInJvbGUiOiJtZW50b3IiLCJ1c2VyVHlwZSI6Im1lbnRvciIsImlhdCI6MTc1NDg0MDkxMH0.fake";

  // Connect User 1 (Learner - thinks they're in session_abc)
  const socket1 = io("http://localhost:4001", {
    auth: { token: user1Token, userId: "6898beaac1bb07f11260f440" },
    transports: ["websocket"],
  });

  // Connect User 2 (Mentor - thinks they're in session_xyz)
  const socket2 = io("http://localhost:4001", {
    auth: { token: user2Token, userId: "6898c03bc9ff637b489f15dc" },
    transports: ["websocket"],
  });

  // Wait for connections
  await new Promise((resolve) => {
    let connected = 0;
    
    socket1.on("connect", () => {
      console.log("✅ Learner connected");
      connected++;
      if (connected === 2) resolve();
    });

    socket2.on("connect", () => {
      console.log("✅ Mentor connected");
      connected++;
      if (connected === 2) resolve();
    });

    socket1.on("connect_error", (err) => {
      console.log("❌ Learner connection failed:", err.message);
    });

    socket2.on("connect_error", (err) => {
      console.log("❌ Mentor connection failed:", err.message);
    });
  });

  // Set up video call listeners (simulating frontend)
  socket1.on("user_joined_call", (data) => {
    console.log(`📹 Learner sees: ${data.userData?.name || data.userId} joined call (session: ${data.sessionId})`);
  });

  socket2.on("user_joined_call", (data) => {
    console.log(`📹 Mentor sees: ${data.userData?.name || data.userId} joined call (session: ${data.sessionId})`);
  });

  socket1.on("current_call_participants", (participants) => {
    console.log(`👥 Learner sees current participants:`, participants.length);
    participants.forEach(p => {
      console.log(`   - ${p.userData?.name || p.userId} (session: ${p.sessionId})`);
    });
  });

  socket2.on("current_call_participants", (participants) => {
    console.log(`👥 Mentor sees current participants:`, participants.length);
    participants.forEach(p => {
      console.log(`   - ${p.userData?.name || p.userId} (session: ${p.sessionId})`);
    });
  });

  // Test WebRTC signaling
  socket1.on("webrtc_offer", (data) => {
    console.log(`📞 Learner received WebRTC offer from ${data.fromUserId}`);
  });

  socket2.on("webrtc_offer", (data) => {
    console.log(`📞 Mentor received WebRTC offer from ${data.fromUserId}`);
  });

  // Test joining video calls with different session IDs (frontend simulation)
  setTimeout(() => {
    console.log("\n🚀 Learner joining video call (thinks session_abc, actually goes to 1234)...");
    socket1.emit("join_video_call", {
      sessionId: "session_abc",
      userData: {
        userId: "6898beaac1bb07f11260f440",
        name: "Jane Learner",
        role: "learner",
        isVideoEnabled: true,
        isAudioEnabled: true,
      }
    });
  }, 1000);

  setTimeout(() => {
    console.log("\n🚀 Mentor joining video call (thinks session_xyz, actually goes to 1234)...");
    socket2.emit("join_video_call", {
      sessionId: "session_xyz", 
      userData: {
        userId: "6898c03bc9ff637b489f15dc",
        name: "Test Mentor",
        role: "mentor",
        isVideoEnabled: true,
        isAudioEnabled: true,
      }
    });
  }, 2000);

  // Test WebRTC signaling
  setTimeout(() => {
    console.log("\n📞 Learner sending WebRTC offer to Mentor...");
    socket1.emit("webrtc_offer", {
      targetUserId: "6898c03bc9ff637b489f15dc",
      offer: { type: "offer", sdp: "fake_offer_sdp_from_learner" }
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

testFrontendGlobalVideo().catch(console.error);
