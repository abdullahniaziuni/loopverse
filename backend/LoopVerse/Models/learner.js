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

// Progress tracking schema to monitor learner's progress
const progressStatsSchema = new Schema({
  coursesCompleted: {
    type: Number,
    default: 0,
  },
  modulesCompleted: {
    type: Number,
    default: 0,
  },
  quizzesCompleted: {
    type: Number,
    default: 0,
  },
  averageScore: {
    type: Number,
    default: 0,
  },
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0,
  },
  badges: [
    {
      type: String,
    },
  ],
  certifications: [
    {
      title: String,
      earnedDate: Date,
      expiryDate: Date,
    },
  ],
});

const learnerSchema = new Schema(
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
      default: "default-profile.jpg",
    },
    role: {
      type: String,
      default: "Learner",
      enum: ["Learner", "Mentor", "Admin"],
    },
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    goals: [
      {
        description: String,
        targetDate: Date,
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    timezone: {
      type: String,
      default: "UTC",
    },
    progressStats: progressStatsSchema,
    enrolledCourses: [
      {
        courseId: {
          type: Schema.Types.ObjectId,
          ref: "Course",
        },
        enrollmentDate: {
          type: Date,
          default: Date.now,
        },
        completionDate: Date,
        progress: {
          type: Number,
          default: 0,
        },
      },
    ],
    loginHistory: [loginHistorySchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
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

// Hash password before saving
learnerSchema.pre("save", async function (next) {
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
learnerSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Virtual for full name
learnerSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("Learner", learnerSchema);
