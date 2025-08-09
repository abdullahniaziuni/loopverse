const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  mentorId: {
    type: Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true
  },
  learnerId: {
    type: Schema.Types.ObjectId,
    ref: 'Learner',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  meetingLink: {
    type: String
  },
  meetingType: {
    type: String,
    enum: ['video', 'audio', 'in-person', 'chat'],
    default: 'video'
  },
  price: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paymentId: {
    type: String
  },
  mentorTimeZone: {
    type: String,
    default: 'UTC'
  },
  learnerTimeZone: {
    type: String,
    default: 'UTC'
  },
  mentorFeedback: {
    content: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    submittedAt: Date
  },
  learnerFeedback: {
    content: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    submittedAt: Date
  },
  cancelledBy: {
    type: String,
    enum: ['mentor', 'learner', 'system', null],
    default: null
  },
  cancellationReason: {
    type: String
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
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

// Add indexes for common query patterns
sessionSchema.index({ mentorId: 1, startTime: 1 });
sessionSchema.index({ learnerId: 1, startTime: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ startTime: 1 }); // For finding upcoming sessions

// Virtual for checking if session is upcoming
sessionSchema.virtual('isUpcoming').get(function() {
  return this.startTime > new Date() && ['pending', 'confirmed'].includes(this.status);
});

// Virtual for checking if session can be cancelled (24 hours before)
sessionSchema.virtual('canCancel').get(function() {
  const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return this.startTime > twentyFourHoursFromNow && ['pending', 'confirmed'].includes(this.status);
});

module.exports = mongoose.model('Session', sessionSchema);