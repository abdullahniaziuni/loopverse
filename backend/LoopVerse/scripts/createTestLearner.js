const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

async function createTestLearner() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/skillsphere");
    console.log("Connected to MongoDB");

    // Create test learner
    const testLearner = {
      name: "Test Learner",
      email: "learner@test.com",
      password: await bcrypt.hash("password123", 10),
      profilePicture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face",
      bio: "I'm a test learner account for testing the platform functionality.",
      skills: ["JavaScript", "React", "Learning"],
      goals: ["Learn full-stack development", "Improve coding skills", "Build projects"],
      interests: ["Web Development", "Mobile Development", "Data Science"],
      experience: "Beginner",
      timezone: "America/New_York",
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if learner already exists
    const existingLearner = await mongoose.connection.db.collection("learners").findOne({ email: testLearner.email });
    
    if (existingLearner) {
      console.log("Test learner already exists. Updating...");
      await mongoose.connection.db.collection("learners").updateOne(
        { email: testLearner.email },
        { $set: testLearner }
      );
      console.log("✅ Test learner updated!");
    } else {
      console.log("Creating new test learner...");
      await mongoose.connection.db.collection("learners").insertOne(testLearner);
      console.log("✅ Test learner created!");
    }

    console.log("\n📊 Test Account Details:");
    console.log("Email: learner@test.com");
    console.log("Password: password123");
    console.log("Role: Learner");
    console.log("\n🚀 You can now log in and test the learner functionality!");

    mongoose.disconnect();
    console.log("\nDatabase connection closed");

  } catch (error) {
    console.error("Error creating test learner:", error);
    process.exit(1);
  }
}

// Run the script
createTestLearner();
