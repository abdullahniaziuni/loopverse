const mongoose = require("mongoose");
const Session = require("../Models/session");
require("dotenv").config();

async function acceptBooking() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse"
    );
    console.log("Connected to MongoDB");

    // Accept the React Development Session
    const sessionId = "6898c65ea83e5322d801415b";
    
    const session = await Session.findById(sessionId);
    if (!session) {
      console.log("❌ Session not found");
      return;
    }
    
    console.log(`📅 Found session: ${session.title}`);
    console.log(`   Current status: ${session.status}`);
    
    // Update status to confirmed
    session.status = "confirmed";
    await session.save();
    
    console.log("✅ Session status updated to 'confirmed'");
    console.log(`   New status: ${session.status}`);

    mongoose.disconnect();
    console.log("Database connection closed");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

acceptBooking();
