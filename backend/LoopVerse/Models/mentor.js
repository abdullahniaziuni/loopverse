const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

// Login history schema for tracking login activities
const loginHistorySchema = new Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
  },
  device: {
    type: String,
  },
  location: {
    type: String,
  },
});

// Portfolio item schema for mentor's work samples
const portfolioItemSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  link: {
    type: String,
  },
  fileUrls: [
    {
      type: String,
    },
  ],
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

// Availability schema for mentoring sessions
const availabilitySlotSchema = new Schema({
  dayOfWeek: {
    type: Number, // 0-6 (Sunday-Saturday)
    required: true,
  },
  startTime: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true,
  },
  endTime: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true,
  },
  isRecurring: {
    type: Boolean,
    default: true,
  },
});

const mentorSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: "default-mentor.jpg",
    },
    role: {
      type: String,
      default: "Mentor",
      enum: ["Learner", "Mentor", "Admin"],
    },
    biography: {
      type: String,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
    },
    skills: [
      {
        name: String,
        level: {
          type: String,
          enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
        },
        yearsOfExperience: Number,
      },
    ],
    expertise: [
      {
        type: String,
        trim: true,
      },
    ],
    portfolio: [portfolioItemSchema],
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        startYear: Number,
        endYear: Number,
      },
    ],
    certifications: [
      {
        title: String,
        issuingOrganization: String,
        issueDate: Date,
        expiryDate: Date,
        credentialURL: String,
      },
    ],
    availability: [availabilitySlotSchema],
    hourlyRate: {
      type: Number,
      default: 0,
    },
    languages: [
      {
        language: String,
        proficiencyLevel: {
          type: String,
          enum: ["Basic", "Conversational", "Fluent", "Native"],
        },
      },
    ],
    ratings: {
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
    },
    reviews: [
      {
        reviewerId: {
          type: Schema.Types.ObjectId,
          ref: "Learner",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    activeSessions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Session",
      },
    ],
    sessionsCompleted: {
      type: Number,
      default: 0,
    },
    loginHistory: [loginHistorySchema],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Add text indexes for search optimization
mentorSchema.index({ firstName: "text", lastName: "text", biography: "text" });

// Add regular indexes for common query fields
mentorSchema.index({ expertise: 1 });
mentorSchema.index({ "skills.name": 1 });
mentorSchema.index({ "ratings.averageRating": -1 });
mentorSchema.index({ "availability.dayOfWeek": 1 });
mentorSchema.index({ isVerified: 1, isActive: 1 });
mentorSchema.index({ hourlyRate: 1 });

// Hash password before saving
mentorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
mentorSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Virtual for full name
mentorSchema.virtual("fullName").get(function () {
  return `${this.firstName}${this.lastName ? " " + this.lastName : ""}`.trim();
});

// Virtual for total earnings calculation
mentorSchema.virtual("totalEarnings").get(function () {
  return this.sessionsCompleted * this.hourlyRate;
});

module.exports = mongoose.model("Mentor", mentorSchema);
