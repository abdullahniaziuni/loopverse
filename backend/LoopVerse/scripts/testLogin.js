const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Mentor = require("../Models/mentor");
require("dotenv").config();

async function testLogin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse"
    );
    console.log("Connected to MongoDB");

    // Find Sarah Johnson
    const mentor = await Mentor.findOne({ email: "sarah.johnson@example.com" });
    
    if (!mentor) {
      console.log("❌ Sarah Johnson mentor not found!");
      
      // Let's see what mentors exist
      const allMentors = await Mentor.find({}).select("firstName lastName email");
      console.log("Available mentors:");
      allMentors.forEach(m => {
        console.log(`- ${m.firstName} ${m.lastName || ''} (${m.email})`);
      });
      
      mongoose.disconnect();
      return;
    }

    console.log("✅ Found Sarah Johnson mentor:");
    console.log(`- Name: ${mentor.firstName} ${mentor.lastName || ''}`);
    console.log(`- Email: ${mentor.email}`);
    console.log(`- Role: ${mentor.role}`);
    console.log(`- Is Active: ${mentor.isActive}`);
    console.log(`- Is Verified: ${mentor.isVerified}`);
    console.log(`- Password Hash: ${mentor.password ? 'EXISTS' : 'MISSING'}`);

    // Test password comparison
    const testPassword = "password123";
    console.log(`\nTesting password: "${testPassword}"`);
    
    try {
      const isMatch = await mentor.comparePassword(testPassword);
      console.log(`Password match: ${isMatch ? '✅ YES' : '❌ NO'}`);
      
      if (!isMatch) {
        console.log("Trying other common passwords...");
        const commonPasswords = ["password", "123456", "admin", "mentor"];
        
        for (const pwd of commonPasswords) {
          const match = await mentor.comparePassword(pwd);
          if (match) {
            console.log(`✅ Password found: "${pwd}"`);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error comparing password:", error.message);
    }

    mongoose.disconnect();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the test
testLogin();
