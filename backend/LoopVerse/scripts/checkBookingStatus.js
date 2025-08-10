const mongoose = require("mongoose");
const Session = require("../Models/session");
const Learner = require("../Models/learner");
const Mentor = require("../Models/mentor");
require("dotenv").config();

async function checkBookingStatus() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse"
    );
    console.log("Connected to MongoDB");

    // Get all sessions
    const sessions = await Session.find({})
      .populate('learnerId', 'firstName lastName email')
      .populate('mentorId', 'firstName lastName email');
    
    console.log(`\nFound ${sessions.length} sessions:`);
    console.log("=====================================");
    
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.title}`);
      console.log(`   ID: ${session._id}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Learner: ${session.learnerId?.firstName} ${session.learnerId?.lastName} (${session.learnerId?.email})`);
      console.log(`   Mentor: ${session.mentorId?.firstName} ${session.mentorId?.lastName} (${session.mentorId?.email})`);
      console.log(`   Start Time: ${session.startTime}`);
      console.log(`   Created: ${session.createdAt}`);
      console.log("   ---");
    });

    // Check specific learner's sessions
    const learnerEmail = "learner@demo.com";
    const learner = await Learner.findOne({ email: learnerEmail });
    if (learner) {
      const learnerSessions = await Session.find({ learnerId: learner._id })
        .populate('mentorId', 'firstName lastName email');
      
      console.log(`\nSessions for ${learnerEmail}:`);
      console.log("=====================================");
      learnerSessions.forEach((session, index) => {
        console.log(`${index + 1}. ${session.title} - Status: ${session.status}`);
        console.log(`   Mentor: ${session.mentorId?.firstName} ${session.mentorId?.lastName}`);
        console.log(`   Start: ${session.startTime}`);
      });
    }

    // Check specific mentor's sessions
    const mentorEmail = "mentor@test.com";
    const mentor = await Mentor.findOne({ email: mentorEmail });
    if (mentor) {
      const mentorSessions = await Session.find({ mentorId: mentor._id })
        .populate('learnerId', 'firstName lastName email');
      
      console.log(`\nSessions for ${mentorEmail}:`);
      console.log("=====================================");
      mentorSessions.forEach((session, index) => {
        console.log(`${index + 1}. ${session.title} - Status: ${session.status}`);
        console.log(`   Learner: ${session.learnerId?.firstName} ${session.learnerId?.lastName}`);
        console.log(`   Start: ${session.startTime}`);
      });
    }

    mongoose.disconnect();
    console.log("\nDatabase connection closed");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkBookingStatus();
