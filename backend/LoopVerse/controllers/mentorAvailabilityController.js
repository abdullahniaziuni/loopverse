const MentorAvailability = require('../models/mentorAvailability');
const { validationResult } = require('express-validator');
const Mentor = require("../Models/mentor"); // lowercase "models"

// Get all availability slots for a specific mentor
exports.getMentorAvailability = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { startDate, endDate } = req.query;
    
    // First, make sure the mentor exists
    try {
      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({
          success: false,
          message: 'Mentor not found'
        });
      }
    } catch (mentorError) {
      console.error("Error validating mentor:", mentorError);
      // Continue even if this check fails - the mentor might exist but we have path issues
    }
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        'availabilityDates.date': {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    // Try retrieving without populate first to isolate issues
    const availability = await MentorAvailability.findOne({
      mentor: mentorId,
      isActive: true,
      ...dateFilter
    });
    
    // If we found availability, return it
    if (!availability) {
      return res.status(200).json({
        success: true,
        data: {
          mentor: mentorId,
          availabilityDates: []
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error("Full availability error:", error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving mentor availability',
      error: error.message
    });
  }
};

// Create or update mentor availability
exports.setMentorAvailability = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { mentorId } = req.params;
    const { availabilityDates, recurrenceRule } = req.body;
    
    // Changed from User to Mentor model
    // Ensure the mentor exists
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }
    
    // Check if availability already exists
    let mentorAvailability = await MentorAvailability.findOne({ mentor: mentorId });
    
    if (mentorAvailability) {
      // Update existing availability
      mentorAvailability.availabilityDates = availabilityDates;
      if (recurrenceRule) mentorAvailability.recurrenceRule = recurrenceRule;
      mentorAvailability.isActive = true;
      
      await mentorAvailability.save();
    } else {
      // Create new availability
      mentorAvailability = await MentorAvailability.create({
        mentor: mentorId,
        availabilityDates,
        recurrenceRule,
        isActive: true
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Mentor availability updated successfully',
      data: mentorAvailability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error setting mentor availability',
      error: error.message
    });
  }
};

// Add a new availability date with time slots
exports.addAvailabilityDate = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { date, timeSlots } = req.body;
    
    if (!date || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({
        success: false,
        message: 'Date and time slots array are required'
      });
    }
    
    let mentorAvailability = await MentorAvailability.findOne({ mentor: mentorId });
    
    if (!mentorAvailability) {
      mentorAvailability = await MentorAvailability.create({
        mentor: mentorId,
        availabilityDates: [{
          date: new Date(date),
          timeSlots
        }]
      });
    } else {
      // Check if date already exists
      const existingDateIndex = mentorAvailability.availabilityDates
        .findIndex(d => new Date(d.date).toDateString() === new Date(date).toDateString());
      
      if (existingDateIndex >= 0) {
        // Add new time slots to existing date
        mentorAvailability.availabilityDates[existingDateIndex].timeSlots.push(...timeSlots);
      } else {
        // Add new date with time slots
        mentorAvailability.availabilityDates.push({
          date: new Date(date),
          timeSlots
        });
      }
      
      await mentorAvailability.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Availability added successfully',
      data: mentorAvailability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding availability',
      error: error.message
    });
  }
};

// Remove an availability date
exports.removeAvailabilityDate = async (req, res) => {
  try {
    const { mentorId, dateId } = req.params;
    
    const mentorAvailability = await MentorAvailability.findOne({ mentor: mentorId });
    
    if (!mentorAvailability) {
      return res.status(404).json({
        success: false,
        message: 'Mentor availability not found'
      });
    }
    
    // Remove date with matching id
    mentorAvailability.availabilityDates = mentorAvailability.availabilityDates
      .filter(date => date._id.toString() !== dateId);
    
    await mentorAvailability.save();
    
    res.status(200).json({
      success: true,
      message: 'Availability date removed successfully',
      data: mentorAvailability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing availability date',
      error: error.message
    });
  }
};

// Update a time slot's booking status
exports.updateTimeSlotStatus = async (req, res) => {
  try {
    const { mentorId, dateId, slotId } = req.params;
    const { isBooked, sessionId } = req.body;
    
    const mentorAvailability = await MentorAvailability.findOne({ mentor: mentorId });
    
    if (!mentorAvailability) {
      return res.status(404).json({
        success: false,
        message: 'Mentor availability not found'
      });
    }
    
    // Find the date and slot
    const dateIndex = mentorAvailability.availabilityDates
      .findIndex(date => date._id.toString() === dateId);
      
    if (dateIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Availability date not found'
      });
    }
    
    const slotIndex = mentorAvailability.availabilityDates[dateIndex].timeSlots
      .findIndex(slot => slot._id.toString() === slotId);
      
    if (slotIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }
    
    // Update the slot
    mentorAvailability.availabilityDates[dateIndex].timeSlots[slotIndex].isBooked = isBooked;
    if (sessionId) {
      mentorAvailability.availabilityDates[dateIndex].timeSlots[slotIndex].sessionId = sessionId;
    }
    
    await mentorAvailability.save();
    
    res.status(200).json({
      success: true,
      message: 'Time slot updated successfully',
      data: mentorAvailability.availabilityDates[dateIndex].timeSlots[slotIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating time slot',
      error: error.message
    });
  }
};

// Find available mentors for a specific date/time
exports.findAvailableMentors = async (req, res) => {
  try {
    const { date, startTime, endTime, skills } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }
    
    const queryDate = new Date(date);
    
    // Build query to find available mentors
    let query = {
      isActive: true,
      'availabilityDates.date': {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999))
      }
    };
    
    // Add time filter if provided
    if (startTime && endTime) {
      query['availabilityDates.timeSlots'] = {
        $elemMatch: {
          startTime: { $lte: startTime },
          endTime: { $gte: endTime },
          isBooked: false
        }
      };
    }
    
    const availabilities = await MentorAvailability.find(query)
      .populate('mentor', 'firstName lastName email profilePicture skills');
    
    // Filter by skills if needed
    let filteredAvailabilities = availabilities;
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
      filteredAvailabilities = availabilities.filter(avail => {
        const mentorSkills = avail.mentor.skills.map(s => s.name || s);
        return skillsArray.some(skill => mentorSkills.includes(skill));
      });
    }
    
    res.status(200).json({
      success: true,
      count: filteredAvailabilities.length,
      data: filteredAvailabilities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error finding available mentors',
      error: error.message
    });
  }
};