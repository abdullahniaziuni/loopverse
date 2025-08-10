const mongoose = require("mongoose");
const Mentor = require("../Models/mentor");
require("dotenv").config();

async function fixSarahJohnson() {
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
      mongoose.disconnect();
      return;
    }

    console.log("Found Sarah Johnson, updating fields...");

    // Update the mentor with proper schema fields
    mentor.firstName = "Sarah";
    mentor.lastName = "Johnson";
    
    // Ensure other required fields are set
    if (!mentor.biography) {
      mentor.biography = "Senior Software Engineer with 8+ years of experience in full-stack development. Passionate about mentoring and helping others grow in their tech careers.";
    }
    
    if (!mentor.skills || mentor.skills.length === 0) {
      mentor.skills = [
        { name: "React", level: "Expert", yearsOfExperience: 6 },
        { name: "Node.js", level: "Expert", yearsOfExperience: 7 },
        { name: "TypeScript", level: "Advanced", yearsOfExperience: 5 },
        { name: "Python", level: "Advanced", yearsOfExperience: 4 },
        { name: "AWS", level: "Intermediate", yearsOfExperience: 3 }
      ];
    }
    
    if (!mentor.expertise || mentor.expertise.length === 0) {
      mentor.expertise = ["Web Development", "Career Guidance", "Technical Leadership"];
    }
    
    if (!mentor.hourlyRate) {
      mentor.hourlyRate = 75;
    }
    
    if (!mentor.yearsOfExperience) {
      mentor.yearsOfExperience = 8;
    }
    
    if (!mentor.ratings) {
      mentor.ratings = {
        averageRating: 4.9,
        totalRatings: 156
      };
    }
    
    if (!mentor.sessionsCompleted) {
      mentor.sessionsCompleted = 156;
    }
    
    // Ensure boolean fields are set
    mentor.isVerified = true;
    mentor.isActive = true;
    
    // Set timezone if not set
    if (!mentor.timezone) {
      mentor.timezone = "America/New_York";
    }

    await mentor.save();
    
    console.log("✅ Sarah Johnson mentor updated successfully!");
    console.log(`- Name: ${mentor.firstName} ${mentor.lastName}`);
    console.log(`- Email: ${mentor.email}`);
    console.log(`- Role: ${mentor.role}`);
    console.log(`- Biography: ${mentor.biography.substring(0, 50)}...`);
    console.log(`- Skills: ${mentor.skills.map(s => s.name).join(", ")}`);
    console.log(`- Hourly Rate: $${mentor.hourlyRate}`);
    console.log(`- Is Verified: ${mentor.isVerified}`);
    console.log(`- Is Active: ${mentor.isActive}`);

    mongoose.disconnect();
    console.log("Database connection closed");
    
    console.log("\n🎉 You can now login with:");
    console.log("Email: sarah.johnson@example.com");
    console.log("Password: password123");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the fix
fixSarahJohnson();
