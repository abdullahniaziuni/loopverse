const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Import models
const Learner = require("../Models/learner");
const Mentor = require("../Models/mentor");
const Admin = require("../Models/admin");
const Session = require("../Models/session");

/**
 * Database Seeding Script
 * Populates the database with realistic sample data
 */

// Sample data
const sampleLearners = [
  {
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice.johnson@example.com",
    password: "password123",
    interests: ["React", "JavaScript", "Web Development"],
    goals: [
      {
        description: "Master React Hooks and Context API",
        targetDate: new Date("2024-12-31"),
        completed: false,
      },
      {
        description: "Build a full-stack application",
        targetDate: new Date("2024-10-31"),
        completed: false,
      },
    ],
    timezone: "America/New_York",
  },
  {
    firstName: "Bob",
    lastName: "Smith",
    email: "bob.smith@example.com",
    password: "password123",
    interests: ["Python", "Data Science", "Machine Learning"],
    goals: [
      {
        description: "Learn advanced Python concepts",
        targetDate: new Date("2024-11-30"),
        completed: false,
      },
    ],
    timezone: "America/Los_Angeles",
  },
  {
    firstName: "Carol",
    lastName: "Davis",
    email: "carol.davis@example.com",
    password: "password123",
    interests: ["UI/UX Design", "Figma", "User Research"],
    goals: [
      {
        description: "Master design systems",
        targetDate: new Date("2024-09-30"),
        completed: false,
      },
    ],
    timezone: "Europe/London",
  },
  {
    firstName: "David",
    lastName: "Wilson",
    email: "david.wilson@example.com",
    password: "password123",
    interests: ["DevOps", "AWS", "Docker"],
    goals: [
      {
        description: "Get AWS certification",
        targetDate: new Date("2024-12-15"),
        completed: false,
      },
    ],
    timezone: "Asia/Tokyo",
  },
];

const sampleMentors = [
  {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@mentor.com",
    password: "password123",
    biography:
      "Full-stack developer with 8+ years experience in React, Node.js, and cloud technologies. Passionate about teaching and helping others grow in their tech careers.",
    yearsOfExperience: 8,
    skills: [
      { name: "React", level: "Expert", yearsOfExperience: 6 },
      { name: "Node.js", level: "Expert", yearsOfExperience: 7 },
      { name: "TypeScript", level: "Advanced", yearsOfExperience: 5 },
      { name: "AWS", level: "Advanced", yearsOfExperience: 4 },
    ],
    expertise: [
      "Frontend Development",
      "Backend Development",
      "Cloud Architecture",
    ],
    hourlyRate: 75,
    languages: [
      { language: "English", proficiencyLevel: "Native" },
      { language: "Spanish", proficiencyLevel: "Conversational" },
    ],
    ratings: {
      averageRating: 4.8,
      totalRatings: 156,
    },
    isVerified: true,
    timezone: "America/New_York",
    availability: [
      {
        dayOfWeek: 1, // Monday
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 2, // Tuesday
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 3, // Wednesday
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 4, // Thursday
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 5, // Friday
        startTime: "09:00",
        endTime: "15:00",
        isAvailable: true,
      },
    ],
  },
  {
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@mentor.com",
    password: "password123",
    biography:
      "Senior Python developer and data scientist with expertise in machine learning and AI. Love helping students understand complex algorithms and data structures.",
    yearsOfExperience: 10,
    skills: [
      { name: "Python", level: "Expert", yearsOfExperience: 10 },
      { name: "Machine Learning", level: "Expert", yearsOfExperience: 6 },
      { name: "Data Science", level: "Expert", yearsOfExperience: 8 },
      { name: "TensorFlow", level: "Advanced", yearsOfExperience: 5 },
    ],
    expertise: ["Data Science", "Machine Learning", "Python Development"],
    hourlyRate: 85,
    languages: [
      { language: "English", proficiencyLevel: "Fluent" },
      { language: "Mandarin", proficiencyLevel: "Native" },
    ],
    ratings: {
      averageRating: 4.9,
      totalRatings: 203,
    },
    isVerified: true,
    timezone: "America/Los_Angeles",
    availability: [
      {
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "18:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 3,
        startTime: "10:00",
        endTime: "18:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 5,
        startTime: "10:00",
        endTime: "16:00",
        isAvailable: true,
      },
    ],
  },
  {
    firstName: "Emily",
    lastName: "Rodriguez",
    email: "emily.rodriguez@mentor.com",
    password: "password123",
    biography:
      "UX/UI designer with expertise in Figma, user research, and design systems. Specialized in creating intuitive and accessible user experiences.",
    yearsOfExperience: 6,
    skills: [
      { name: "UI/UX Design", level: "Expert", yearsOfExperience: 6 },
      { name: "Figma", level: "Expert", yearsOfExperience: 5 },
      { name: "User Research", level: "Advanced", yearsOfExperience: 4 },
      { name: "Design Systems", level: "Advanced", yearsOfExperience: 3 },
    ],
    expertise: ["UI/UX Design", "User Research", "Design Systems"],
    hourlyRate: 65,
    languages: [
      { language: "English", proficiencyLevel: "Native" },
      { language: "Spanish", proficiencyLevel: "Native" },
    ],
    ratings: {
      averageRating: 4.7,
      totalRatings: 89,
    },
    isVerified: true,
    timezone: "America/Chicago",
    availability: [
      {
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 4,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 6,
        startTime: "10:00",
        endTime: "14:00",
        isAvailable: true,
      },
    ],
  },
  {
    firstName: "James",
    lastName: "Wilson",
    email: "james.wilson@mentor.com",
    password: "password123",
    biography:
      "DevOps engineer and cloud architect with extensive experience in AWS, Docker, and Kubernetes. Helping teams scale their applications efficiently.",
    yearsOfExperience: 12,
    skills: [
      { name: "AWS", level: "Expert", yearsOfExperience: 8 },
      { name: "Docker", level: "Expert", yearsOfExperience: 6 },
      { name: "Kubernetes", level: "Advanced", yearsOfExperience: 5 },
      { name: "DevOps", level: "Expert", yearsOfExperience: 10 },
    ],
    expertise: ["DevOps", "Cloud Architecture", "Infrastructure"],
    hourlyRate: 95,
    languages: [{ language: "English", proficiencyLevel: "Native" }],
    ratings: {
      averageRating: 4.9,
      totalRatings: 134,
    },
    isVerified: true,
    timezone: "Europe/London",
    availability: [
      {
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "16:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 3,
        startTime: "08:00",
        endTime: "16:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 5,
        startTime: "08:00",
        endTime: "14:00",
        isAvailable: true,
      },
    ],
  },
  {
    firstName: "Lisa",
    lastName: "Chen",
    email: "lisa.chen@mentor.com",
    password: "password123",
    biography:
      "Mobile app developer specializing in React Native and Flutter. Built 20+ mobile apps with millions of downloads. Love teaching mobile development best practices.",
    yearsOfExperience: 7,
    skills: [
      { name: "React Native", level: "Expert", yearsOfExperience: 5 },
      { name: "Flutter", level: "Advanced", yearsOfExperience: 3 },
      { name: "iOS Development", level: "Advanced", yearsOfExperience: 4 },
      { name: "Android Development", level: "Advanced", yearsOfExperience: 4 },
    ],
    expertise: [
      "Mobile Development",
      "Cross-platform Development",
      "App Store Optimization",
    ],
    hourlyRate: 70,
    languages: [
      { language: "English", proficiencyLevel: "Fluent" },
      { language: "Mandarin", proficiencyLevel: "Native" },
    ],
    ratings: {
      averageRating: 4.6,
      totalRatings: 78,
    },
    isVerified: false, // Pending approval
    timezone: "Asia/Shanghai",
    availability: [
      {
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "18:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 4,
        startTime: "10:00",
        endTime: "18:00",
        isAvailable: true,
      },
      {
        dayOfWeek: 6,
        startTime: "09:00",
        endTime: "15:00",
        isAvailable: true,
      },
    ],
  },
];

const sampleAdmins = [
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@skillsphere.com",
    password: "admin123",
    department: "General",
    adminLevel: 5,
    permissions: {
      userManagement: true,
      contentModeration: true,
      financialOperations: true,
      systemConfiguration: true,
      analytics: true,
      supportAccess: true,
    },
  },
];

/**
 * Seed the database with sample data
 */
async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to MongoDB
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse";
    await mongoose.connect(mongoURI);
    console.log("📡 Connected to MongoDB");

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await Learner.deleteMany({});
    await Mentor.deleteMany({});
    await Admin.deleteMany({});
    await Session.deleteMany({});

    // Create learners
    console.log("👨‍🎓 Creating learners...");
    const createdLearners = [];
    for (const learnerData of sampleLearners) {
      const learner = new Learner(learnerData);
      await learner.save();
      createdLearners.push(learner);
      console.log(
        `✅ Created learner: ${learner.firstName} ${learner.lastName}`
      );
    }

    // Create mentors
    console.log("👨‍🏫 Creating mentors...");
    const createdMentors = [];
    for (const mentorData of sampleMentors) {
      const mentor = new Mentor(mentorData);
      await mentor.save();
      createdMentors.push(mentor);
      console.log(
        `✅ Created mentor: ${mentor.firstName} ${mentor.lastName} (Verified: ${mentor.isVerified})`
      );
    }

    // Create admins
    console.log("👨‍💼 Creating admins...");
    for (const adminData of sampleAdmins) {
      const admin = new Admin(adminData);
      await admin.save();
      console.log(`✅ Created admin: ${admin.firstName} ${admin.lastName}`);
    }

    // Create sample sessions
    console.log("📅 Creating sample sessions...");
    const sampleSessions = [
      {
        title: "React Hooks Deep Dive",
        description: "Learn advanced React hooks patterns and best practices",
        mentorId: createdMentors[0]._id,
        learnerId: createdLearners[0]._id,
        startTime: new Date("2024-08-20T14:00:00Z"),
        endTime: new Date("2024-08-20T15:00:00Z"),
        duration: 60,
        status: "confirmed",
        price: 75,
        meetingType: "video",
      },
      {
        title: "Python Data Analysis",
        description: "Introduction to pandas and data visualization",
        mentorId: createdMentors[1]._id,
        learnerId: createdLearners[1]._id,
        startTime: new Date("2024-08-18T16:00:00Z"),
        endTime: new Date("2024-08-18T17:30:00Z"),
        duration: 90,
        status: "completed",
        price: 127.5,
        meetingType: "video",
        learnerFeedback: {
          content: "Excellent session! Michael explained pandas very clearly.",
          rating: 5,
          submittedAt: new Date("2024-08-18T17:35:00Z"),
        },
      },
      {
        title: "UI/UX Design Principles",
        description:
          "Learn fundamental design principles and user research methods",
        mentorId: createdMentors[2]._id,
        learnerId: createdLearners[2]._id,
        startTime: new Date("2024-08-22T10:00:00Z"),
        endTime: new Date("2024-08-22T11:00:00Z"),
        duration: 60,
        status: "pending",
        price: 65,
        meetingType: "video",
      },
      {
        title: "AWS Fundamentals",
        description: "Getting started with AWS cloud services",
        mentorId: createdMentors[3]._id,
        learnerId: createdLearners[3]._id,
        startTime: new Date("2024-08-25T09:00:00Z"),
        endTime: new Date("2024-08-25T10:30:00Z"),
        duration: 90,
        status: "confirmed",
        price: 142.5,
        meetingType: "video",
      },
    ];

    for (const sessionData of sampleSessions) {
      const session = new Session(sessionData);
      await session.save();
      console.log(`✅ Created session: ${session.title}`);
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`👨‍🎓 Learners: ${createdLearners.length}`);
    console.log(
      `👨‍🏫 Mentors: ${createdMentors.length} (${
        createdMentors.filter((m) => m.isVerified).length
      } verified)`
    );
    console.log(`👨‍💼 Admins: ${sampleAdmins.length}`);
    console.log(`📅 Sessions: ${sampleSessions.length}`);

    console.log("\n🔑 Test Credentials:");
    console.log("Learner: alice.johnson@example.com / password123");
    console.log("Mentor: sarah.johnson@mentor.com / password123");
    console.log("Admin: admin@skillsphere.com / admin123");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
  }
}

/**
 * Clear all data from database
 */
async function clearDatabase() {
  try {
    console.log("🧹 Clearing database...");

    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse";
    await mongoose.connect(mongoURI);

    await Learner.deleteMany({});
    await Mentor.deleteMany({});
    await Admin.deleteMany({});
    await Session.deleteMany({});

    console.log("✅ Database cleared successfully");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run seeding if called directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === "clear") {
    clearDatabase();
  } else {
    seedDatabase();
  }
}

module.exports = {
  seedDatabase,
  clearDatabase,
  sampleLearners,
  sampleMentors,
  sampleAdmins,
};
