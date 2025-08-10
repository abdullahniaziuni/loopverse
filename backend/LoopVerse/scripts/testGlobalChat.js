const io = require("socket.io-client");

async function testGlobalChat() {
  console.log("🌍 Testing Global Chat System...");

  // Create two fake users with different IDs
  const user1Token = "fake_token_user1";
  const user2Token = "fake_token_user2";

  // Connect User 1 (ID: 1223)
  const socket1 = io("http://localhost:4001", {
    auth: { token: user1Token, userId: "1223" },
    transports: ["websocket"],
  });

  // Connect User 2 (ID: 2343)  
  const socket2 = io("http://localhost:4001", {
    auth: { token: user2Token, userId: "2343" },
    transports: ["websocket"],
  });

  // Wait for connections
  await new Promise((resolve) => {
    let connected = 0;
    
    socket1.on("connect", () => {
      console.log("✅ User 1223 connected");
      connected++;
      if (connected === 2) resolve();
    });

    socket2.on("connect", () => {
      console.log("✅ User 2343 connected");
      connected++;
      if (connected === 2) resolve();
    });

    socket1.on("connect_error", (err) => {
      console.log("❌ User 1223 connection failed:", err.message);
    });

    socket2.on("connect_error", (err) => {
      console.log("❌ User 2343 connection failed:", err.message);
    });
  });

  // Set up message listeners
  socket1.on("global_chat_message", (data) => {
    console.log(`📨 User 1223 received: "${data.content}" from ${data.senderName}`);
  });

  socket2.on("global_chat_message", (data) => {
    console.log(`📨 User 2343 received: "${data.content}" from ${data.senderName}`);
  });

  // Test sending messages
  setTimeout(() => {
    console.log("\n🚀 User 1223 sending message...");
    socket1.emit("send_global_message", {
      messageId: "msg_1",
      senderId: "1223",
      senderName: "User 1223",
      content: "Hello from User 1223!",
      timestamp: new Date(),
      type: "text",
    });
  }, 1000);

  setTimeout(() => {
    console.log("\n🚀 User 2343 sending message...");
    socket2.emit("send_global_message", {
      messageId: "msg_2", 
      senderId: "2343",
      senderName: "User 2343",
      content: "Hello from User 2343!",
      timestamp: new Date(),
      type: "text",
    });
  }, 2000);

  // Clean up after 5 seconds
  setTimeout(() => {
    console.log("\n🧹 Cleaning up connections...");
    socket1.disconnect();
    socket2.disconnect();
    process.exit(0);
  }, 5000);
}

testGlobalChat().catch(console.error);
