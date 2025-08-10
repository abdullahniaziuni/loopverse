const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  }
});

const availabilityDateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  timeSlots: [timeSlotSchema]
});

const mentorAvailabilitySchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  availabilityDates: [availabilityDateSchema],
  recurrenceRule: {
    type: String,
    default: null  // Optional RRULE format for recurring availability
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create index for efficient queries
mentorAvailabilitySchema.index({ mentor: 1, 'availabilityDates.date': 1 });

module.exports = mongoose.model('MentorAvailability', mentorAvailabilitySchema);