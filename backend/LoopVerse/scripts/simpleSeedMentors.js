const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

async function seedMentors() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/skillsphere"
    );
    console.log("Connected to MongoDB");

    // Clear existing mentors
    console.log("Clearing existing mentors...");
    await mongoose.connection.db.collection("mentors").deleteMany({});
    console.log("Existing mentors cleared");

    // Create new mentors
    const mentors = [
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        password: await bcrypt.hash("password123", 10),
        profilePicture:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
        bio: "Senior Software Engineer with 8+ years of experience in full-stack development. Passionate about mentoring and helping others grow in their tech careers.",
        skills: ["React", "Node.js", "TypeScript", "Python", "AWS"],
        hourlyRate: 75,
        experience: "5-10 years",
        education: "Computer Science, MIT",
        certifications: [
          "AWS Certified Solutions Architect",
          "React Certified Developer",
        ],
        specializations: [
          "Web Development",
          "Career Guidance",
          "Technical Leadership",
        ],
        languages: ["English", "Spanish"],
        timezone: "America/New_York",
        ratings: {
          averageRating: 4.9,
          totalReviews: 156,
        },
        totalSessions: 156,
        isVerified: true,
        isActive: true,
        isApproved: true,
        isOnline: true,
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Michael Chen",
        email: "michael.chen@example.com",
        password: await bcrypt.hash("password123", 10),
        profilePicture:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        bio: "Data Scientist and ML Engineer with expertise in Python, TensorFlow, and cloud platforms. Love teaching complex concepts in simple ways.",
        skills: [
          "Python",
          "Machine Learning",
          "TensorFlow",
          "AWS",
          "Data Analysis",
        ],
        hourlyRate: 85,
        experience: "5-10 years",
        education: "PhD in Computer Science, Stanford",
        certifications: ["Google Cloud ML Engineer", "AWS ML Specialty"],
        specializations: ["Data Science", "Machine Learning", "AI Development"],
        languages: ["English", "Chinese"],
        timezone: "America/Los_Angeles",
        ratings: {
          averageRating: 4.8,
          totalReviews: 203,
        },
        totalSessions: 203,
        isVerified: true,
        isActive: true,
        isApproved: true,
        isOnline: true,
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Emily Rodriguez",
        email: "emily.rodriguez@example.com",
        password: await bcrypt.hash("password123", 10),
        profilePicture:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        bio: "UX/UI Designer and Frontend Developer. Helping designers transition into development and developers improve their design skills.",
        skills: ["UI/UX Design", "Figma", "React", "CSS", "JavaScript"],
        hourlyRate: 65,
        experience: "3-5 years",
        education: "Design, Art Institute of Chicago",
        certifications: [
          "Adobe Certified Expert",
          "Google UX Design Certificate",
        ],
        specializations: [
          "UI/UX Design",
          "Frontend Development",
          "Design Systems",
        ],
        languages: ["English", "Spanish"],
        timezone: "America/Chicago",
        ratings: {
          averageRating: 4.9,
          totalReviews: 89,
        },
        totalSessions: 89,
        isVerified: true,
        isActive: true,
        isApproved: true,
        isOnline: false,
        lastActive: new Date(Date.now() - 30 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "David Kim",
        email: "david.kim@example.com",
        password: await bcrypt.hash("password123", 10),
        profilePicture:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        bio: "DevOps Engineer and Cloud Architect. Specializing in AWS, Docker, Kubernetes, and helping teams scale their infrastructure.",
        skills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
        hourlyRate: 95,
        experience: "5-10 years",
        education: "Computer Engineering, Carnegie Mellon",
        certifications: [
          "AWS Solutions Architect Professional",
          "Kubernetes Certified Administrator",
        ],
        specializations: ["DevOps", "Cloud Architecture", "Infrastructure"],
        languages: ["English", "Korean"],
        timezone: "America/New_York",
        ratings: {
          averageRating: 4.7,
          totalReviews: 134,
        },
        totalSessions: 134,
        isVerified: true,
        isActive: true,
        isApproved: true,
        isOnline: true,
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Lisa Thompson",
        email: "lisa.thompson@example.com",
        password: await bcrypt.hash("password123", 10),
        profilePicture:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
        bio: "Product Manager with technical background. Helping engineers transition to product roles and improve their product thinking.",
        skills: [
          "Product Management",
          "Agile",
          "Data Analysis",
          "User Research",
          "Strategy",
        ],
        hourlyRate: 80,
        experience: "5-10 years",
        education: "MBA, Wharton School",
        certifications: [
          "Certified Scrum Master",
          "Google Analytics Certified",
        ],
        specializations: [
          "Product Management",
          "Career Transition",
          "Strategy",
        ],
        languages: ["English", "French"],
        timezone: "America/Los_Angeles",
        ratings: {
          averageRating: 4.8,
          totalReviews: 167,
        },
        totalSessions: 167,
        isVerified: true,
        isActive: true,
        isApproved: true,
        isOnline: true,
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    console.log("Inserting new mentors...");
    const result = await mongoose.connection.db
      .collection("mentors")
      .insertMany(mentors);
    console.log(`✅ Successfully created ${result.insertedCount} mentors!`);

    // Display summary
    console.log("\n📊 Summary:");
    console.log(`- Created ${mentors.length} mentors`);
    console.log("- All passwords set to: password123");
    console.log("- All mentors have real profile pictures from Unsplash");
    console.log("- All mentors are approved and ready for booking");

    console.log("\n👥 Created Mentors:");
    mentors.forEach((mentor, index) => {
      console.log(
        `${index + 1}. ${mentor.name} - ${mentor.skills.join(", ")} - $${
          mentor.hourlyRate
        }/hr`
      );
    });

    mongoose.disconnect();
    console.log("\nDatabase connection closed");
  } catch (error) {
    console.error("Error seeding mentors:", error);
    process.exit(1);
  }
}

// Run the seeding
seedMentors();
