const mongoose = require("mongoose");
const Mentor = require("../Models/mentor");
require("dotenv").config();

async function createTestMentor() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse"
    );
    console.log("Connected to MongoDB");

    // Check if test mentor already exists
    const existingMentor = await Mentor.findOne({ email: "mentor@demo.com" });
    if (existingMentor) {
      console.log("Test mentor already exists!");
      console.log("Email: mentor@demo.com");
      console.log("Password: password");
      mongoose.disconnect();
      return;
    }

    // Create test mentor
    const testMentor = new Mentor({
      firstName: "John",
      lastName: "Mentor",
      email: "mentor@demo.com",
      password: "password", // This will be hashed by the pre-save middleware
      biography: "Experienced software engineer with 10+ years in full-stack development. Passionate about mentoring and helping others grow in their tech careers.",
      skills: [
        { name: "JavaScript", level: "Expert", yearsOfExperience: 8 },
        { name: "React", level: "Expert", yearsOfExperience: 6 },
        { name: "Node.js", level: "Advanced", yearsOfExperience: 7 },
        { name: "Python", level: "Advanced", yearsOfExperience: 5 },
        { name: "AWS", level: "Intermediate", yearsOfExperience: 4 }
      ],
      expertise: ["Web Development", "Full Stack Development", "Career Guidance", "Technical Leadership"],
      hourlyRate: 75,
      yearsOfExperience: 10,
      languages: [
        { language: "English", proficiencyLevel: "Native" },
        { language: "Spanish", proficiencyLevel: "Conversational" }
      ],
      education: [
        {
          institution: "University of Technology",
          degree: "Bachelor of Science",
          fieldOfStudy: "Computer Science",
          startYear: 2010,
          endYear: 2014
        }
      ],
      certifications: [
        {
          title: "AWS Certified Solutions Architect",
          issuingOrganization: "Amazon Web Services",
          issueDate: new Date("2022-01-15"),
          credentialURL: "https://aws.amazon.com/certification/"
        }
      ],
      availability: [
        {
          dayOfWeek: "Monday",
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: true
        },
        {
          dayOfWeek: "Tuesday",
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: true
        },
        {
          dayOfWeek: "Wednesday",
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: true
        },
        {
          dayOfWeek: "Thursday",
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: true
        },
        {
          dayOfWeek: "Friday",
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: true
        }
      ],
      ratings: {
        averageRating: 4.8,
        totalRatings: 25
      },
      sessionsCompleted: 25,
      isVerified: true,
      isActive: true,
      timezone: "UTC"
    });

    await testMentor.save();
    console.log("✅ Test mentor created successfully!");
    console.log("Email: mentor@demo.com");
    console.log("Password: password");
    console.log("Name: John Mentor");
    console.log("Role: Mentor");

    mongoose.disconnect();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error creating test mentor:", error);
    process.exit(1);
  }
}

// Run the script
createTestMentor();
