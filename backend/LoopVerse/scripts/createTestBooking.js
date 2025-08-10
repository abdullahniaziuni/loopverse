const mongoose = require("mongoose");
const Session = require("../Models/session");
require("dotenv").config();

async function createTestBooking() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse"
    );
    console.log("Connected to MongoDB");

    // Create a booking for the demo learner
    const learnerDemoId = "6898beaac1bb07f11260f440"; // Jane Learner ID
    const testMentorId = "6898c03bc9ff637b489f15dc"; // Test Mentor ID
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow
    
    const endTime = new Date(tomorrow);
    endTime.setHours(15, 0, 0, 0); // 3 PM tomorrow

    const session = new Session({
      title: "React Development Session",
      description: "Learn React fundamentals and best practices",
      mentorId: testMentorId,
      learnerId: learnerDemoId,
      startTime: tomorrow,
      endTime: endTime,
      duration: 60,
      status: "pending",
      price: 50,
      mentorTimeZone: "UTC",
      learnerTimeZone: "UTC",
    });

    await session.save();
    
    console.log("✅ Test booking created successfully!");
    console.log("Booking details:");
    console.log(`- ID: ${session._id}`);
    console.log(`- Title: ${session.title}`);
    console.log(`- Learner ID: ${session.learnerId}`);
    console.log(`- Mentor ID: ${session.mentorId}`);
    console.log(`- Start Time: ${session.startTime}`);
    console.log(`- Status: ${session.status}`);
    console.log(`- Price: $${session.price}`);

    mongoose.disconnect();
    console.log("Database connection closed");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createTestBooking();
