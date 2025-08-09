const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory notification store (in production, use Redis or database)
const notifications = new Map();

/**
 * Notification Routes
 * Handles in-app notifications
 */

/**
 * @route GET /api/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userNotifications = notifications.get(userId) || [];
    
    // Sort by timestamp (newest first)
    const sortedNotifications = userNotifications.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json({
      success: true,
      data: sortedNotifications,
      message: 'Notifications retrieved successfully'
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notifications'
    });
  }
});

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const userNotifications = notifications.get(userId) || [];
    const notificationIndex = userNotifications.findIndex(n => n.id === id);
    
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    userNotifications[notificationIndex].read = true;
    notifications.set(userId, userNotifications);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userNotifications = notifications.get(userId) || [];
    
    userNotifications.forEach(notification => {
      notification.read = true;
    });
    
    notifications.set(userId, userNotifications);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

/**
 * Helper function to create a notification
 * @param {string} userId - User ID to send notification to
 * @param {object} notificationData - Notification data
 */
function createNotification(userId, notificationData) {
  const userNotifications = notifications.get(userId) || [];
  
  const notification = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    ...notificationData,
    timestamp: new Date(),
    read: false
  };
  
  userNotifications.unshift(notification);
  
  // Keep only last 50 notifications per user
  if (userNotifications.length > 50) {
    userNotifications.splice(50);
  }
  
  notifications.set(userId, userNotifications);
  
  return notification;
}

/**
 * Helper function to send booking request notification
 */
function notifyBookingRequest(mentorId, sessionData) {
  return createNotification(mentorId, {
    type: 'booking_request',
    title: 'New Booking Request',
    message: `You have a new booking request for "${sessionData.title}"`,
    data: {
      sessionId: sessionData.id,
      learnerName: sessionData.learner.name,
      startTime: sessionData.startTime
    }
  });
}

/**
 * Helper function to send booking response notification
 */
function notifyBookingResponse(learnerId, sessionData, response) {
  const title = response === 'accepted' ? 'Booking Confirmed' : 'Booking Declined';
  const message = response === 'accepted' 
    ? `Your booking for "${sessionData.title}" has been confirmed`
    : `Your booking for "${sessionData.title}" has been declined`;

  return createNotification(learnerId, {
    type: 'booking_response',
    title,
    message,
    data: {
      sessionId: sessionData.id,
      mentorName: sessionData.mentor.name,
      response,
      startTime: sessionData.startTime
    }
  });
}

/**
 * Helper function to send session reminder
 */
function notifySessionReminder(userId, sessionData) {
  return createNotification(userId, {
    type: 'session_reminder',
    title: 'Session Starting Soon',
    message: `Your session "${sessionData.title}" starts in 15 minutes`,
    data: {
      sessionId: sessionData.id,
      startTime: sessionData.startTime,
      meetingLink: sessionData.meetingLink
    }
  });
}

/**
 * Helper function to send feedback request
 */
function notifyFeedbackRequest(userId, sessionData) {
  return createNotification(userId, {
    type: 'feedback_request',
    title: 'Session Feedback',
    message: `Please provide feedback for your completed session "${sessionData.title}"`,
    data: {
      sessionId: sessionData.id
    }
  });
}

// Export helper functions for use in other controllers
module.exports = router;
module.exports.createNotification = createNotification;
module.exports.notifyBookingRequest = notifyBookingRequest;
module.exports.notifyBookingResponse = notifyBookingResponse;
module.exports.notifySessionReminder = notifySessionReminder;
module.exports.notifyFeedbackRequest = notifyFeedbackRequest;
