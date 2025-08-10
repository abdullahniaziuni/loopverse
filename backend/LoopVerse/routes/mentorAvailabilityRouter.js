const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth'); // Adjust path if needed
const mentorAvailabilityController = require('../controllers/mentorAvailabilityController');

// Get mentor availability
router.get('/mentor/:mentorId', mentorAvailabilityController.getMentorAvailability);

// Set mentor availability (protected)
router.post(
  '/mentor/:mentorId',
  auth,
  [
    check('availabilityDates', 'Availability dates are required').isArray(),
  ],
  mentorAvailabilityController.setMentorAvailability
);

// Add availability date with time slots (protected)
router.post(
  '/mentor/:mentorId/date',
  [
    auth,
    check('date', 'Date is required').notEmpty(),
    check('timeSlots', 'Time slots are required').isArray(),
  ],
  mentorAvailabilityController.addAvailabilityDate
);

// Remove availability date (protected)
router.delete(
  '/mentor/:mentorId/date/:dateId',
  auth,
  mentorAvailabilityController.removeAvailabilityDate
);

// Update time slot booking status (protected)
router.patch(
  '/mentor/:mentorId/date/:dateId/slot/:slotId',
  auth,
  mentorAvailabilityController.updateTimeSlotStatus
);

// Find available mentors
router.get('/available', mentorAvailabilityController.findAvailableMentors);

module.exports = router;