const mongoose = require("mongoose");
const Mentor = require("../Models/mentor");
require("dotenv").config();

async function createSimpleMentor() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse"
    );
    console.log("Connected to MongoDB");

    // Delete existing mentor if exists
    await Mentor.deleteOne({ email: "mentor@test.com" });
    console.log("Deleted any existing mentor@test.com");

    // Create simple mentor
    const mentor = new Mentor({
      firstName: "Test",
      lastName: "Mentor",
      email: "mentor@test.com",
      password: "password123", // This will be hashed automatically
      biography: "Test mentor for login",
      skills: [
        { name: "JavaScript", level: "Expert", yearsOfExperience: 5 }
      ],
      expertise: ["Web Development"],
      hourlyRate: 50,
      yearsOfExperience: 5,
      ratings: {
        averageRating: 4.5,
        totalRatings: 10
      },
      sessionsCompleted: 10,
      isVerified: true,
      isActive: true,
      timezone: "UTC"
    });

    await mentor.save();
    console.log("✅ Simple mentor created successfully!");
    console.log("📧 Email: mentor@test.com");
    console.log("🔑 Password: password123");
    console.log("👤 Name: Test Mentor");
    console.log("🏷️ Role: Mentor");

    // Test the password immediately
    const testMentor = await Mentor.findOne({ email: "mentor@test.com" });
    const isPasswordCorrect = await testMentor.comparePassword("password123");
    console.log("🔐 Password test:", isPasswordCorrect ? "✅ WORKS" : "❌ FAILED");

    mongoose.disconnect();
    console.log("Database connection closed");
    
    console.log("\n🎉 LOGIN CREDENTIALS:");
    console.log("Email: mentor@test.com");
    console.log("Password: password123");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createSimpleMentor();
