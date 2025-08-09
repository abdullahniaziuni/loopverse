const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

// Login history schema for tracking admin login activities
const loginHistorySchema = new Schema({
  timestamp: { 
    type: Date,
    default: Date.now 
  },
  ipAddress: { 
    type: String 
  },
  device: { 
    type: String 
  },
  location: { 
    type: String 
  }
});

// Admin action log schema for accountability
const adminActionSchema = new Schema({
  actionType: {
    type: String,
    enum: ['Create', 'Update', 'Delete', 'Approve', 'Reject', 'Ban', 'Unban', 'Other'],
    required: true
  },
  targetModel: {
    type: String,
    enum: ['User', 'Course', 'Mentor', 'Learner', 'Content', 'Session', 'Payment', 'System'],
    required: true
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const adminSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: 'default-admin.jpg'
  },
  role: {
    type: String,
    default: 'Admin',
    enum: ['Learner', 'Mentor', 'Admin', 'SuperAdmin']
  },
  department: {
    type: String,
    enum: ['General', 'Content', 'User Management', 'Finance', 'Technical', 'Support'],
    default: 'General'
  },
  permissions: {
    userManagement: {
      type: Boolean,
      default: true
    },
    contentModeration: {
      type: Boolean,
      default: true
    },
    financialOperations: {
      type: Boolean,
      default: false
    },
    systemConfiguration: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: true
    },
    supportAccess: {
      type: Boolean,
      default: true
    }
  },
  moderationFlags: {
    canApproveContent: {
      type: Boolean,
      default: true
    },
    canApproveMentors: {
      type: Boolean,
      default: true
    },
    canManageUsers: {
      type: Boolean,
      default: true
    },
    canDeleteContent: {
      type: Boolean,
      default: true
    },
    canProcessRefunds: {
      type: Boolean,
      default: false
    },
    canAccessSystemLogs: {
      type: Boolean,
      default: false
    }
  },
  adminLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  phoneNumber: {
    type: String
  },
  emergencyContact: {
    name: String,
    relation: String,
    phoneNumber: String
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  actionLogs: [adminActionSchema],
  loginHistory: [loginHistorySchema],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  twoFactorEnabled: {
    type: Boolean,
    default: true
  },
  resetPasswordRequired: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12); // Higher salt rounds for admin accounts
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to log admin actions
adminSchema.methods.logAction = function(actionType, targetModel, targetId, details) {
  this.actionLogs.push({
    actionType,
    targetModel,
    targetId,
    details,
    timestamp: Date.now()
  });
  return this.save();
};

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for determining if admin is super admin
adminSchema.virtual('isSuperAdmin').get(function() {
  return this.role === 'SuperAdmin' || this.adminLevel === 5;
});

module.exports = mongoose.model('Admin', adminSchema);