const mongoose = require("mongoose");
const Learner = require("../Models/learner");
require("dotenv").config();

async function createTestLearner() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse"
    );
    console.log("Connected to MongoDB");

    // Check if test learner already exists
    const existingLearner = await Learner.findOne({ email: "learner@demo.com" });
    if (existingLearner) {
      console.log("Test learner already exists!");
      console.log("Email: learner@demo.com");
      console.log("Password: password");
      mongoose.disconnect();
      return;
    }

    // Create test learner
    const testLearner = new Learner({
      firstName: "Jane",
      lastName: "Learner",
      email: "learner@demo.com",
      password: "password", // This will be hashed by the pre-save middleware
      interests: ["Web Development", "JavaScript", "React", "Career Growth"],
      goals: [
        {
          description: "Learn React and build a portfolio project",
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          completed: false
        },
        {
          description: "Get a job as a frontend developer",
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
          completed: false
        }
      ],
      timezone: "UTC",
      progressStats: {
        totalSessionsAttended: 5,
        totalHoursLearned: 15,
        skillsLearned: ["HTML", "CSS", "JavaScript Basics"],
        coursesCompleted: 1,
        certificatesEarned: 0,
        currentStreak: 3,
        longestStreak: 7
      },
      isActive: true
    });

    await testLearner.save();
    console.log("✅ Test learner created successfully!");
    console.log("Email: learner@demo.com");
    console.log("Password: password");
    console.log("Name: Jane Learner");
    console.log("Role: Learner");

    mongoose.disconnect();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error creating test learner:", error);
    process.exit(1);
  }
}

// Run the script
createTestLearner();
