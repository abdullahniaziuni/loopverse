const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Import models
const Mentor = require("../Models/mentor");

const mentorData = [
  {
    // User data
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    password: "password123",
    role: "mentor",
    profilePicture:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",

    // Mentor-specific data
    bio: "Senior Software Engineer with 8+ years of experience in full-stack development. Passionate about mentoring and helping others grow in their tech careers.",
    skills: [
      { name: "React", level: "Expert" },
      { name: "Node.js", level: "Expert" },
      { name: "TypeScript", level: "Advanced" },
      { name: "Python", level: "Intermediate" },
      { name: "AWS", level: "Advanced" },
    ],
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
    availability: {
      monday: ["09:00", "17:00"],
      tuesday: ["09:00", "17:00"],
      wednesday: ["09:00", "17:00"],
      thursday: ["09:00", "17:00"],
      friday: ["09:00", "15:00"],
    },
  },
  {
    name: "Michael Chen",
    email: "michael.chen@example.com",
    password: "password123",
    role: "mentor",
    profilePicture:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",

    bio: "Data Scientist and ML Engineer with expertise in Python, TensorFlow, and cloud platforms. Love teaching complex concepts in simple ways.",
    skills: [
      { name: "Python", level: "Expert" },
      { name: "Machine Learning", level: "Expert" },
      { name: "TensorFlow", level: "Advanced" },
      { name: "AWS", level: "Advanced" },
      { name: "Data Analysis", level: "Expert" },
    ],
    hourlyRate: 85,
    experience: "5-10 years",
    education: "PhD in Computer Science, Stanford",
    certifications: ["Google Cloud ML Engineer", "AWS ML Specialty"],
    specializations: ["Data Science", "Machine Learning", "AI Development"],
    languages: ["English", "Chinese"],
    timezone: "America/Los_Angeles",
    availability: {
      monday: ["10:00", "18:00"],
      tuesday: ["10:00", "18:00"],
      wednesday: ["10:00", "18:00"],
      thursday: ["10:00", "18:00"],
      friday: ["10:00", "16:00"],
    },
  },
  {
    name: "Emily Rodriguez",
    email: "emily.rodriguez@example.com",
    password: "password123",
    role: "mentor",
    profilePicture:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",

    bio: "UX/UI Designer and Frontend Developer. Helping designers transition into development and developers improve their design skills.",
    skills: [
      { name: "UI/UX Design", level: "Expert" },
      { name: "Figma", level: "Expert" },
      { name: "React", level: "Advanced" },
      { name: "CSS", level: "Expert" },
      { name: "JavaScript", level: "Advanced" },
    ],
    hourlyRate: 65,
    experience: "3-5 years",
    education: "Design, Art Institute of Chicago",
    certifications: ["Adobe Certified Expert", "Google UX Design Certificate"],
    specializations: ["UI/UX Design", "Frontend Development", "Design Systems"],
    languages: ["English", "Spanish"],
    timezone: "America/Chicago",
    availability: {
      monday: ["08:00", "16:00"],
      tuesday: ["08:00", "16:00"],
      wednesday: ["08:00", "16:00"],
      thursday: ["08:00", "16:00"],
      friday: ["08:00", "14:00"],
    },
  },
  {
    name: "David Kim",
    email: "david.kim@example.com",
    password: "password123",
    role: "mentor",
    profilePicture:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",

    bio: "DevOps Engineer and Cloud Architect. Specializing in AWS, Docker, Kubernetes, and helping teams scale their infrastructure.",
    skills: [
      { name: "AWS", level: "Expert" },
      { name: "Docker", level: "Expert" },
      { name: "Kubernetes", level: "Advanced" },
      { name: "Terraform", level: "Advanced" },
      { name: "CI/CD", level: "Expert" },
    ],
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
    availability: {
      monday: ["09:00", "17:00"],
      tuesday: ["09:00", "17:00"],
      wednesday: ["09:00", "17:00"],
      thursday: ["09:00", "17:00"],
      friday: ["09:00", "15:00"],
    },
  },
  {
    name: "Lisa Thompson",
    email: "lisa.thompson@example.com",
    password: "password123",
    role: "mentor",
    profilePicture:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",

    bio: "Product Manager with technical background. Helping engineers transition to product roles and improve their product thinking.",
    skills: [
      { name: "Product Management", level: "Expert" },
      { name: "Agile", level: "Expert" },
      { name: "Data Analysis", level: "Advanced" },
      { name: "User Research", level: "Advanced" },
      { name: "Strategy", level: "Expert" },
    ],
    hourlyRate: 80,
    experience: "5-10 years",
    education: "MBA, Wharton School",
    certifications: ["Certified Scrum Master", "Google Analytics Certified"],
    specializations: ["Product Management", "Career Transition", "Strategy"],
    languages: ["English", "French"],
    timezone: "America/Los_Angeles",
    availability: {
      monday: ["10:00", "18:00"],
      tuesday: ["10:00", "18:00"],
      wednesday: ["10:00", "18:00"],
      thursday: ["10:00", "18:00"],
      friday: ["10:00", "16:00"],
    },
  },
];

async function seedMentors() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/skillsphere"
    );
    console.log("Connected to MongoDB");

    // Clear existing mentors and mentor users
    console.log("Clearing existing mentor data...");
    await User.deleteMany({ role: "mentor" });
    await Mentor.deleteMany({});
    console.log("Existing mentor data cleared");

    console.log("Creating new mentors...");

    for (const mentorInfo of mentorData) {
      // Hash password
      const hashedPassword = await bcrypt.hash(mentorInfo.password, 10);

      // Create user
      const user = new User({
        name: mentorInfo.name,
        email: mentorInfo.email,
        password: hashedPassword,
        role: mentorInfo.role,
        profilePicture: mentorInfo.profilePicture,
        isEmailVerified: true,
      });

      const savedUser = await user.save();
      console.log(`Created user: ${savedUser.name}`);

      // Create mentor profile
      const mentor = new Mentor({
        userId: savedUser._id,
        name: mentorInfo.name,
        email: mentorInfo.email,
        profilePicture: mentorInfo.profilePicture,
        bio: mentorInfo.bio,
        skills: mentorInfo.skills,
        hourlyRate: mentorInfo.hourlyRate,
        experience: mentorInfo.experience,
        education: mentorInfo.education,
        certifications: mentorInfo.certifications,
        specializations: mentorInfo.specializations,
        languages: mentorInfo.languages,
        timezone: mentorInfo.timezone,
        availability: mentorInfo.availability,
        rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
        totalSessions: Math.floor(Math.random() * 200) + 50, // Random sessions 50-250
        isApproved: true,
        isOnline: Math.random() > 0.3, // 70% chance of being online
        lastActive: new Date(),
      });

      const savedMentor = await mentor.save();
      console.log(`Created mentor: ${savedMentor.name}`);
    }

    console.log("✅ All mentors created successfully!");

    // Display summary
    const totalUsers = await User.countDocuments({ role: "mentor" });
    const totalMentors = await Mentor.countDocuments();
    console.log(`\n📊 Summary:`);
    console.log(`- Created ${totalUsers} mentor users`);
    console.log(`- Created ${totalMentors} mentor profiles`);
    console.log(`- All passwords set to: password123`);
    console.log(`- All mentors have real profile pictures from Unsplash`);

    mongoose.disconnect();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding mentors:", error);
    process.exit(1);
  }
}

// Run the seeding
seedMentors();
