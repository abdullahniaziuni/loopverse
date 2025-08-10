const mongoose = require("mongoose");
const Mentor = require("../Models/mentor");
require("dotenv").config();

async function fixAllMentors() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse"
    );
    console.log("Connected to MongoDB");

    // Define mentor data to fix
    const mentorUpdates = [
      {
        email: "michael.chen@example.com",
        firstName: "Michael",
        lastName: "Chen",
        biography: "Data Scientist and ML Engineer with expertise in Python, TensorFlow, and cloud platforms.",
        skills: [
          { name: "Python", level: "Expert", yearsOfExperience: 7 },
          { name: "Machine Learning", level: "Expert", yearsOfExperience: 6 },
          { name: "TensorFlow", level: "Advanced", yearsOfExperience: 5 },
          { name: "AWS", level: "Advanced", yearsOfExperience: 4 }
        ],
        expertise: ["Data Science", "Machine Learning", "AI Development"],
        hourlyRate: 85,
        yearsOfExperience: 7
      },
      {
        email: "emily.rodriguez@example.com",
        firstName: "Emily",
        lastName: "Rodriguez",
        biography: "UX/UI Designer and Frontend Developer. Helping designers transition into development.",
        skills: [
          { name: "UI/UX Design", level: "Expert", yearsOfExperience: 5 },
          { name: "Figma", level: "Expert", yearsOfExperience: 4 },
          { name: "React", level: "Advanced", yearsOfExperience: 3 },
          { name: "CSS", level: "Expert", yearsOfExperience: 5 }
        ],
        expertise: ["UI/UX Design", "Frontend Development", "Design Systems"],
        hourlyRate: 65,
        yearsOfExperience: 5
      },
      {
        email: "david.kim@example.com",
        firstName: "David",
        lastName: "Kim",
        biography: "DevOps Engineer and Cloud Architect. Specializing in AWS, Docker, Kubernetes.",
        skills: [
          { name: "AWS", level: "Expert", yearsOfExperience: 6 },
          { name: "Docker", level: "Expert", yearsOfExperience: 5 },
          { name: "Kubernetes", level: "Advanced", yearsOfExperience: 4 },
          { name: "Terraform", level: "Advanced", yearsOfExperience: 3 }
        ],
        expertise: ["DevOps", "Cloud Architecture", "Infrastructure"],
        hourlyRate: 95,
        yearsOfExperience: 6
      },
      {
        email: "lisa.thompson@example.com",
        firstName: "Lisa",
        lastName: "Thompson",
        biography: "Product Manager with technical background. Helping engineers transition to product roles.",
        skills: [
          { name: "Product Management", level: "Expert", yearsOfExperience: 6 },
          { name: "Agile", level: "Expert", yearsOfExperience: 5 },
          { name: "Data Analysis", level: "Advanced", yearsOfExperience: 4 },
          { name: "User Research", level: "Advanced", yearsOfExperience: 4 }
        ],
        expertise: ["Product Management", "Career Transition", "Strategy"],
        hourlyRate: 80,
        yearsOfExperience: 6
      }
    ];

    console.log("Updating mentors...");
    
    for (const update of mentorUpdates) {
      const mentor = await Mentor.findOne({ email: update.email });
      if (mentor) {
        mentor.firstName = update.firstName;
        mentor.lastName = update.lastName;
        mentor.biography = update.biography;
        mentor.skills = update.skills;
        mentor.expertise = update.expertise;
        mentor.hourlyRate = update.hourlyRate;
        mentor.yearsOfExperience = update.yearsOfExperience;
        mentor.isVerified = true;
        mentor.isActive = true;
        mentor.ratings = mentor.ratings || { averageRating: 4.7, totalRatings: 50 };
        mentor.sessionsCompleted = mentor.sessionsCompleted || 50;
        
        await mentor.save();
        console.log(`✅ Updated: ${update.firstName} ${update.lastName}`);
      } else {
        console.log(`❌ Not found: ${update.email}`);
      }
    }

    console.log("\nChecking all mentors after update:");
    const allMentors = await Mentor.find({}).select("firstName lastName email isVerified isActive");
    
    allMentors.forEach((mentor, index) => {
      console.log(`${index + 1}. ${mentor.firstName} ${mentor.lastName} (${mentor.email})`);
    });

    mongoose.disconnect();
    console.log("\nDatabase connection closed");
    console.log("🎉 All mentors have been fixed!");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixAllMentors();
