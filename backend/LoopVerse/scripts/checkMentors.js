const mongoose = require("mongoose");
const Mentor = require("../Models/mentor");
require("dotenv").config();

async function checkMentors() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse"
    );
    console.log("Connected to MongoDB");

    // Get all mentors
    const mentors = await Mentor.find({}).select("firstName lastName email isVerified isActive");
    
    console.log(`Found ${mentors.length} mentors:`);
    console.log("=====================================");
    
    mentors.forEach((mentor, index) => {
      console.log(`${index + 1}. ${mentor.firstName || 'NO_FIRST_NAME'} ${mentor.lastName || 'NO_LAST_NAME'}`);
      console.log(`   Email: ${mentor.email}`);
      console.log(`   Verified: ${mentor.isVerified}`);
      console.log(`   Active: ${mentor.isActive}`);
      console.log(`   Full Name: "${mentor.firstName}${mentor.lastName ? ' ' + mentor.lastName : ''}"`);
      console.log("   ---");
    });

    mongoose.disconnect();
    console.log("Database connection closed");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkMentors();
