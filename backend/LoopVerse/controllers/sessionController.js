const Session = require('../Models/session');
const Mentor = require('../Models/mentor');
const Learner = require('../Models/learner');
const { validationResult } = require('express-validator');
const moment = require('moment-timezone');

/**
 * Session Controller
 * Handles all operations related to mentoring sessions
 */
const sessionController = {
  /**
   * Book a new session with a mentor
   * @route POST /api/sessions
   */
  bookSession: async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { mentorId, title, description, startTime, duration, meetingType } = req.body;
      const learnerId = req.user.id;

      // Find the mentor
      const mentor = await Mentor.findById(mentorId);
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' });
      }

      // Check if mentor is verified and active
      if (!mentor.isVerified || !mentor.isActive) {
        return res.status(400).json({ message: 'This mentor is not available for bookings' });
      }

      // Convert start time to Date object
      const sessionStartTime = new Date(startTime);
      
      // Calculate end time
      const sessionEndTime = new Date(sessionStartTime.getTime() + duration * 60000);
      
      // Check if start time is in the future
      if (sessionStartTime <= new Date()) {
        return res.status(400).json({ message: 'Session start time must be in the future' });
      }
      
      // Check if the mentor is available at this time
      const dayOfWeek = sessionStartTime.getDay();
      const sessionStartHour = sessionStartTime.getHours();
      const sessionStartMinute = sessionStartTime.getMinutes();
      const formattedStartTime = `${String(sessionStartHour).padStart(2, '0')}:${String(sessionStartMinute).padStart(2, '0')}`;
      
      const sessionEndHour = sessionEndTime.getHours();
      const sessionEndMinute = sessionEndTime.getMinutes();
      const formattedEndTime = `${String(sessionEndHour).padStart(2, '0')}:${String(sessionEndMinute).padStart(2, '0')}`;
      
      // Convert mentor's UTC availability to their local timezone
      let isAvailable = false;
      
      // Check availability slots
      for (const slot of mentor.availability) {
        if (slot.dayOfWeek === dayOfWeek) {
          // Check if the session time falls within this availability slot
          if (slot.startTime <= formattedStartTime && slot.endTime >= formattedEndTime) {
            isAvailable = true;
            break;
          }
        }
      }
      
      if (!isAvailable) {
        return res.status(400).json({ message: 'Mentor is not available at this time' });
      }
      
      // Check for conflicting sessions
      const conflictingSessions = await Session.find({
        mentorId,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
          // Session starts during another session
          {
            startTime: { $lte: sessionStartTime },
            endTime: { $gt: sessionStartTime }
          },
          // Session ends during another session
          {
            startTime: { $lt: sessionEndTime },
            endTime: { $gte: sessionEndTime }
          },
          // Session completely contains another session
          {
            startTime: { $gte: sessionStartTime },
            endTime: { $lte: sessionEndTime }
          }
        ]
      });
      
      if (conflictingSessions.length > 0) {
        return res.status(400).json({ message: 'This time slot conflicts with an existing session' });
      }
      
      // Get learner for timezone
      const learner = await Learner.findById(learnerId);
      if (!learner) {
        return res.status(404).json({ message: 'Learner not found' });
      }
      
      // Create the session
      const session = new Session({
        title,
        description,
        mentorId,
        learnerId,
        startTime: sessionStartTime,
        endTime: sessionEndTime,
        duration,
        meetingType: meetingType || 'video',
        price: mentor.hourlyRate * (duration / 60), // Calculate price based on hourly rate
        mentorTimeZone: mentor.timezone,
        learnerTimeZone: learner.timezone
      });
      
      await session.save();
      
      // Add session to mentor's active sessions
      mentor.activeSessions.push(session._id);
      await mentor.save();
      
      res.status(201).json({
        message: 'Session booked successfully',
        session
      });
    } catch (error) {
      console.error('Error booking session:', error);
      res.status(500).json({ message: 'Server error during session booking' });
    }
  },
  
  /**
   * Get all sessions for the current user (learner or mentor)
   * @route GET /api/sessions
   */
  getSessions: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, timeframe, page = 1, limit = 10 } = req.query;
      
      // Build query based on user role
      let query = {};
      
      if (req.user.role === 'Mentor') {
        query.mentorId = userId;
      } else if (req.user.role === 'Learner') {
        query.learnerId = userId;
      }
      
      // Filter by status if provided
      if (status) {
        query.status = status;
      }
      
      // Filter by timeframe
      if (timeframe === 'upcoming') {
        query.startTime = { $gt: new Date() };
        query.status = { $in: ['pending', 'confirmed'] };
      } else if (timeframe === 'past') {
        query.startTime = { $lt: new Date() };
      } else if (timeframe === 'today') {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        today.setHours(0, 0, 0, 0);
        
        query.startTime = { $gte: today, $lt: tomorrow };
      }
      
      // Execute query with pagination
      const sessions = await Session.find(query)
        .sort({ startTime: timeframe === 'past' ? -1 : 1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('mentorId', 'firstName lastName profilePicture')
        .populate('learnerId', 'firstName lastName profilePicture');
      
      // Get total count for pagination
      const totalSessions = await Session.countDocuments(query);
      
      res.json({
        sessions,
        totalPages: Math.ceil(totalSessions / limit),
        currentPage: page,
        totalSessions
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ message: 'Server error while fetching sessions' });
    }
  },
  
  /**
   * Get session by ID
   * @route GET /api/sessions/:sessionId
   */
  getSessionById: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      
      const session = await Session.findById(sessionId)
        .populate('mentorId', 'firstName lastName profilePicture email')
        .populate('learnerId', 'firstName lastName profilePicture email');
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check authorization - only mentor, learner, or admin can view session
      if (
        session.mentorId._id.toString() !== userId && 
        session.learnerId._id.toString() !== userId &&
        !['Admin', 'SuperAdmin'].includes(req.user.role)
      ) {
        return res.status(403).json({ message: 'Not authorized to view this session' });
      }
      
      res.json({ session });
    } catch (error) {
      console.error('Error fetching session:', error);
      res.status(500).json({ message: 'Server error while fetching session' });
    }
  },
  
  /**
   * Update session status
   * @route PUT /api/sessions/:sessionId/status
   */
  updateSessionStatus: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { status, reason } = req.body;
      const userId = req.user.id;
      
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check authorization based on the requested status change
      if (status === 'confirmed') {
        // Only mentors can confirm sessions
        if (req.user.role !== 'Mentor' || session.mentorId.toString() !== userId) {
          return res.status(403).json({ message: 'Not authorized to confirm this session' });
        }
      } else if (status === 'cancelled') {
        // Both mentor and learner can cancel
        if (
          (session.mentorId.toString() !== userId) && 
          (session.learnerId.toString() !== userId)
        ) {
          return res.status(403).json({ message: 'Not authorized to cancel this session' });
        }
        
        // Check if cancellation is allowed (24 hours before)
        const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        if (session.startTime <= twentyFourHoursFromNow) {
          return res.status(400).json({ message: 'Sessions can only be cancelled at least 24 hours in advance' });
        }
        
        // Set who cancelled
        session.cancelledBy = session.mentorId.toString() === userId ? 'mentor' : 'learner';
        session.cancellationReason = reason || 'No reason provided';
      } else if (status === 'completed') {
        // Only mentors can mark as completed
        if (req.user.role !== 'Mentor' || session.mentorId.toString() !== userId) {
          return res.status(403).json({ message: 'Not authorized to complete this session' });
        }
        
        // Check if session end time has passed
        if (session.endTime > new Date()) {
          return res.status(400).json({ message: 'Cannot mark a session as completed before its end time' });
        }
        
        // Update mentor's completed sessions count
        const mentor = await Mentor.findById(session.mentorId);
        mentor.sessionsCompleted += 1;
        
        // Remove from active sessions
        const sessionIndex = mentor.activeSessions.indexOf(sessionId);
        if (sessionIndex !== -1) {
          mentor.activeSessions.splice(sessionIndex, 1);
        }
        
        await mentor.save();
      }
      
      // Update session status
      session.status = status;
      await session.save();
      
      res.json({
        message: `Session ${status} successfully`,
        session
      });
    } catch (error) {
      console.error('Error updating session status:', error);
      res.status(500).json({ message: 'Server error while updating session status' });
    }
  },
  
  /**
   * Submit feedback for a session
   * @route POST /api/sessions/:sessionId/feedback
   */
  submitFeedback: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { content, rating } = req.body;
      const userId = req.user.id;
      
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check if session is completed
      if (session.status !== 'completed') {
        return res.status(400).json({ message: 'Can only submit feedback for completed sessions' });
      }
      
      const feedback = {
        content,
        rating,
        submittedAt: new Date()
      };
      
      // Determine if feedback is from learner or mentor
      if (session.learnerId.toString() === userId) {
        // Learner feedback - also update mentor's ratings
        session.learnerFeedback = feedback;
        
        // Update mentor's ratings
        const mentor = await Mentor.findById(session.mentorId);
        
        // Calculate new average rating
        const totalRatings = mentor.ratings.totalRatings + 1;
        const currentTotalPoints = mentor.ratings.averageRating * mentor.ratings.totalRatings;
        const newAverageRating = (currentTotalPoints + rating) / totalRatings;
        
        mentor.ratings.averageRating = newAverageRating;
        mentor.ratings.totalRatings = totalRatings;
        
        // Add review to mentor
        mentor.reviews.push({
          reviewerId: userId,
          rating,
          comment: content,
          date: new Date()
        });
        
        await mentor.save();
      } else if (session.mentorId.toString() === userId) {
        // Mentor feedback
        session.mentorFeedback = feedback;
      } else {
        return res.status(403).json({ message: 'Not authorized to submit feedback for this session' });
      }
      
      await session.save();
      
      res.json({
        message: 'Feedback submitted successfully',
        session
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ message: 'Server error while submitting feedback' });
    }
  },
  
  /**
   * Generate a meeting link for a session
   * @route POST /api/sessions/:sessionId/meeting-link
   */
  generateMeetingLink: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Check authorization - only mentor can generate link
      if (session.mentorId.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized to generate meeting link' });
      }
      
      // Check if session is confirmed
      if (session.status !== 'confirmed') {
        return res.status(400).json({ message: 'Can only generate links for confirmed sessions' });
      }
      
      // Generate a meeting link - in a real app, this would integrate with Zoom, Google Meet, etc.
      // Here we'll just generate a placeholder link
      const meetingLink = `https://meet.loopverse.com/${session._id}`;
      
      // Update the session
      session.meetingLink = meetingLink;
      await session.save();
      
      res.json({
        message: 'Meeting link generated successfully',
        meetingLink
      });
    } catch (error) {
      console.error('Error generating meeting link:', error);
      res.status(500).json({ message: 'Server error while generating meeting link' });
    }
  }
};

module.exports = sessionController;